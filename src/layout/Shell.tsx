import { useCallback, useState } from "react";
import { useContent } from "../content/ContentContext";
import type { Locale } from "../content/types";
import { useIsDesktop } from "../engine/useIsDesktop";
import { ContactCard } from "./ContactCard";
import { InfoPane } from "./InfoPane";
import { NavBar, type View } from "./NavBar";
import { Stage } from "./Stage";

function useLocale(): [Locale, (l: Locale) => void] {
  const [locale, set] = useState<Locale>(() =>
    localStorage.getItem("locale") === "en" ? "en" : "ru",
  );
  const update = useCallback((l: Locale) => {
    localStorage.setItem("locale", l);
    set(l);
  }, []);
  return [locale, update];
}

/**
 * Левая и правая части живут независимо:
 * - навигация и язык — состояние только левой части (Shell → NavBar / InfoPane / ContactCard);
 * - <Stage> получает только `right` из контента и обёрнут в memo, поэтому на клики слева не перерисовывается.
 * Раскладка одна на оба размера и управляется CSS (lg: = десктоп), поэтому ничего не пересоздаётся.
 */
export function Shell() {
  const { right, left } = useContent();
  const isDesktop = useIsDesktop();
  const [view, setView] = useState<View>("info");
  const [locale, setLocale] = useLocale();

  // «Площадка» есть только на мобильном; на десктопе она всегда на экране справа
  const navView: View = isDesktop && view === "playground" ? "info" : view;

  const go = (next: View) => setView(next === navView && next === "contact" ? "info" : next);

  return (
    <div className="grid h-svh w-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-1 overflow-hidden bg-light-3 p-1.5 antialiased lg:grid-cols-[30rem_minmax(0,1fr)] lg:gap-x-3 lg:p-4">
      <NavBar view={navView} onView={go} locale={locale} nav={left.nav} />

      <div
        className={`${navView === "info" ? "flex" : "hidden lg:flex"} col-start-1 row-start-2 min-h-0 min-w-0`}
      >
        <InfoPane locale={locale} onLocale={setLocale} onContact={() => go("contact")} />
      </div>

      <div
        className={`${navView === "playground" ? "flex" : "hidden lg:flex"} col-start-1 row-start-2 min-h-0 min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1`}
      >
        <Stage right={right} />
      </div>

      <ContactCard locale={locale} visible={navView === "contact"} />
    </div>
  );
}
