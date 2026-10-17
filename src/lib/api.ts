import type { Content, Media } from "../content/types";

const TOKEN_KEY = "admin-token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init: RequestInit = {}, auth = false): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (auth) headers.set("Authorization", `Bearer ${getToken() ?? ""}`);
  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? res.statusText);
  return data as T;
}

export const api = {
  content: () => request<Content>("/api/content", { cache: "no-store" }),
  login: (password: string) =>
    request<{ token: string }>("/api/login", { method: "POST", body: JSON.stringify({ password }) }),
  session: () => request<{ ok: true }>("/api/session", {}, true),
  save: (content: Content) =>
    request<{ ok: true }>("/api/content", { method: "PUT", body: JSON.stringify(content) }, true),
  subscribe: (email: string) =>
    request<{ ok: true }>("/api/subscribe", { method: "POST", body: JSON.stringify({ email }) }),
  subscribers: () =>
    request<{ subscribers: { email: string; at: string }[] }>("/api/subscribers", {}, true),
  removeFile: (src: string) =>
    request<{ ok: true }>(`/api/upload/${encodeURIComponent(src.split("/").pop() ?? "")}`, { method: "DELETE" }, true),
};

/** Размер картинки/видео до загрузки — нужен, чтобы плитка сразу занимала своё место без прыжков вёрстки. */
function measure(file: File): Promise<{ w?: number; h?: number }> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve) => {
    const done = (v: { w?: number; h?: number }) => {
      URL.revokeObjectURL(url);
      resolve(v);
    };
    if (file.type.startsWith("video/")) {
      const v = document.createElement("video");
      v.preload = "metadata";
      v.onloadedmetadata = () => done({ w: v.videoWidth, h: v.videoHeight });
      v.onerror = () => done({});
      v.src = url;
    } else {
      const img = new Image();
      img.onload = () => done(img.naturalWidth ? { w: img.naturalWidth, h: img.naturalHeight } : {});
      img.onerror = () => done({});
      img.src = url;
    }
  });
}

/** Загружает файлы с прогрессом; возвращает готовые Media в том же порядке. */
export async function uploadFiles(files: File[], onProgress?: (ratio: number) => void): Promise<Media[]> {
  const sizes = await Promise.all(files.map(measure));
  const form = new FormData();
  files.forEach((f) => form.append("files", f));

  const result = await new Promise<{ files: { src: string; type: "image" | "video"; name: string }[] }>(
    (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.setRequestHeader("Authorization", `Bearer ${getToken() ?? ""}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
      xhr.onload = () => {
        let data: { files?: never; error?: string } = {};
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* ignore */
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data as never);
        else reject(new ApiError(xhr.status, data.error ?? "upload_failed"));
      };
      xhr.onerror = () => reject(new ApiError(0, "network"));
      xhr.send(form);
    },
  );

  // Сервер пропускает неподдерживаемые форматы молча — сопоставляем по имени
  const byName = new Map(result.files.map((f) => [f.name, f]));
  return files.flatMap((f, i) => {
    const saved = byName.get(f.name);
    return saved ? [{ src: saved.src, type: saved.type, ...sizes[i] } as Media] : [];
  });
}
