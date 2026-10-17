import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { Content } from "./types";

const Ctx = createContext<Content | null>(null);

export function applySiteTheme(c: Content) {
  document.documentElement.style.setProperty("--color-accent", c.site.accent);
  document.title = c.site.title;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content | null>(() => window.__CONTENT__ ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (content) {
      applySiteTheme(content);
      return;
    }
    api.content().then(setContent).catch(() => setFailed(true));
  }, [content]);

  if (failed) return <p className="p-6 text-sm">Не удалось загрузить контент. Запущен ли сервер (npm run dev)?</p>;
  if (!content) return null;
  return <Ctx.Provider value={content}>{children}</Ctx.Provider>;
}

export function useContent() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useContent outside provider");
  return c;
}
