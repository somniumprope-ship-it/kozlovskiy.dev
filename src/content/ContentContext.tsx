import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { api } from "../lib/api";
import type { Content } from "./types";

const Ctx = createContext<Content | null>(null);

const PALETTE: [keyof Content["site"], string][] = [
  ["accent", "--color-accent"],
  ["background", "--color-light-3"],
  ["plate", "--color-light-1"],
  ["chip", "--color-light-2"],
  ["text", "--color-dark-1"],
];

/** Палитра из админки ложится на CSS-переменные, поэтому цвета меняются на всём сайте сразу. */
export function applySiteTheme(c: Content, withPalette = true) {
  const root = document.documentElement.style;
  for (const [key, cssVar] of PALETTE) {
    const v = c.site[key];
    // сама админка остаётся в нейтральных цветах, чтобы не потерять читаемость
    if (v && (withPalette || key === "accent")) root.setProperty(cssVar, v);
    else root.removeProperty(cssVar);
  }
  document.title = c.site.title;
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content | null>(() => window.__CONTENT__ ?? null);
  const [failed, setFailed] = useState(false);

  // цвета из админки ставим до первой отрисовки, чтобы не мигала стандартная палитра
  useLayoutEffect(() => {
    if (content) applySiteTheme(content, !location.pathname.startsWith("/admin"));
  }, [content]);

  useEffect(() => {
    if (content) return;
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
