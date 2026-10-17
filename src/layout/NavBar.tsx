import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import type { Content, Locale } from "../content/types";
import { pick } from "../lib/pick";

export type View = "info" | "playground" | "contact";

type Props = {
  view: View;
  onView: (view: View) => void;
  locale: Locale;
  nav: Content["left"]["nav"];
};

export function NavBar({ view, onView, locale, nav }: Props) {
  const items: View[] = ["info", "playground", "contact"];
  const rowRef = useRef<HTMLDivElement | null>(null);
  const pillRef = useRef<HTMLSpanElement | null>(null);
  const placed = useRef(false);

  useLayoutEffect(() => {
    const row = rowRef.current;
    const pill = pillRef.current;
    if (!row || !pill) return;

    const place = (animate: boolean) => {
      const active = row.querySelector<HTMLElement>(`[data-view="${view}"]`);
      if (!active || active.offsetParent === null) return;
      const rowBox = row.getBoundingClientRect();
      const box = active.getBoundingClientRect();
      const to = { x: box.left - rowBox.left, y: box.top - rowBox.top, width: box.width, height: box.height };
      if (animate && placed.current) gsap.to(pill, { ...to, duration: 0.45, ease: "power3.out", overwrite: true });
      else gsap.set(pill, to);
      placed.current = true;
    };

    place(true);
    const ro = new ResizeObserver(() => place(false)); // смена языка, ширины, масштаба
    ro.observe(row);
    return () => ro.disconnect();
  }, [view, locale, nav]);

  return (
    <nav className="relative z-2 flex h-11 items-center justify-between rounded-full bg-light-1 py-1.5 pr-1.5 pl-4">
      <button
        type="button"
        aria-label="Home"
        className="grid size-7 place-items-center rounded-md bg-dark-1"
        onClick={() => onView("info")}
      >
        <span className="block size-2 rounded-full bg-accent" />
      </button>

      <div ref={rowRef} className="relative flex items-center">
        <span
          ref={pillRef}
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-0 rounded-full bg-accent"
          style={{ width: 0, height: 0 }}
        />
        {items.map((item) => (
          <button
            key={item}
            type="button"
            data-view={item}
            aria-current={view === item ? "page" : undefined}
            onClick={() => onView(item)}
            className={`relative z-1 items-center gap-1.5 rounded-full px-3 py-1.5 text-base leading-6 text-dark-1 ${
              item === "playground" ? "flex lg:hidden" : "flex"
            }`}
          >
            <span>{pick(nav[item], locale)}</span>
            <span className="hidden size-5 place-items-center rounded-full bg-white/70 text-[0.625rem] leading-none lg:grid">
              {item === "contact" ? "+" : "○"}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
