import { useRef, useState, type ReactNode } from "react";
import type { Loc, Media } from "../content/types";
import { ApiError, uploadFiles } from "../lib/api";

export const uid = () => Math.random().toString(36).slice(2, 10);

export const input =
  "w-full rounded-xl border border-light-3 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-accent";
export const btn =
  "rounded-full border border-light-3 bg-white px-3 py-1.5 text-sm transition-colors hover:border-dark-1 disabled:opacity-40 disabled:hover:border-light-3";
export const btnPrimary =
  "rounded-full bg-dark-1 px-4 py-2 text-sm text-white transition-opacity hover:opacity-85 disabled:opacity-40";

export function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-[0_0_0_1px_rgba(0,0,0,0.04)]">
      <h2 className="text-base font-medium">{title}</h2>
      {hint ? <p className="mt-1 max-w-prose text-sm text-dark-1/60">{hint}</p> : null}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="text-xs text-dark-1/55">{hint}</span> : null}
    </label>
  );
}

export function Text({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input className={input} type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  );
}

export function Area({ value, onChange, rows = 4 }: { value: string; onChange: (v: string) => void; rows?: number }) {
  return <textarea className={`${input} resize-y leading-snug`} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />;
}

/** Поле сразу на двух языках: RU и EN рядом. */
export function LocField({
  label,
  value,
  onChange,
  multiline,
  rows,
}: {
  label: string;
  value: Loc;
  onChange: (v: Loc) => void;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="grid gap-2 md:grid-cols-2">
        {(["ru", "en"] as const).map((l) => (
          <div key={l} className="flex items-start gap-2">
            <span className="mt-2 w-5 shrink-0 text-xs text-dark-1/50">{l.toUpperCase()}</span>
            {multiline ? (
              <Area rows={rows} value={value[l]} onChange={(v) => onChange({ ...value, [l]: v })} />
            ) : (
              <Text value={value[l]} onChange={(v) => onChange({ ...value, [l]: v })} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function errorText(e: unknown) {
  if (e instanceof ApiError) {
    if (e.status === 413) return "Файл слишком большой для сервера (лимит MAX_UPLOAD_MB).";
    if (e.status === 401) return "Сессия истекла — войдите заново.";
  }
  return "Не удалось загрузить файл. Проверьте формат и соединение.";
}

export function Preview({ media, className = "" }: { media: Media; className?: string }) {
  return media.type === "video" ? (
    <video src={media.src} className={className} muted loop autoPlay playsInline />
  ) : (
    <img src={media.src} className={className} alt="" />
  );
}

/** Один файл: превью + заменить/убрать. */
export function MediaField({
  label,
  value,
  onChange,
  accept = "image/*,video/mp4,video/webm",
}: {
  label: string;
  value: Media | null;
  onChange: (m: Media | null) => void;
  accept?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr("");
    try {
      const [m] = await uploadFiles([files[0]]);
      if (m) onChange(m);
      else setErr("Этот формат не поддерживается.");
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-light-2 text-xs text-dark-1/40">
          {value ? <Preview media={value} className="size-full object-cover" /> : "нет"}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} disabled={busy} onClick={() => ref.current?.click()}>
            {busy ? "Загрузка…" : value ? "Заменить" : "Загрузить"}
          </button>
          {value ? (
            <button type="button" className={btn} onClick={() => onChange(null)}>
              Убрать
            </button>
          ) : null}
        </div>
        <input ref={ref} type="file" accept={accept} hidden onChange={(e) => pick(e.target.files)} />
      </div>
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  );
}

/** Кнопки порядка и удаления для элемента списка. */
export function RowTools({
  index,
  count,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" aria-label="Выше" className={btn} disabled={index === 0} onClick={() => onMove(index - 1)}>
        ↑
      </button>
      <button type="button" aria-label="Ниже" className={btn} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
        ↓
      </button>
      <button type="button" aria-label="Удалить" className={btn} onClick={onRemove}>
        ✕
      </button>
    </div>
  );
}

export function move<T>(arr: T[], from: number, to: number) {
  const next = arr.slice();
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}
