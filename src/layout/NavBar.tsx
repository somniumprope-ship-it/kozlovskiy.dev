import type { Content, Locale } from "../content/types";
import { pick } from "../lib/pick";

export type View = "info" | "playground" | "contact";

type Props = {
  view: View;
  onView: (view: View) => void;
  locale: Locale;
  nav: Content["left"]["nav"];
  /** На десктопе «Инфо» ни на что не нажимается — это просто плашка */
  desktop: boolean;
};

/**
 * Верхняя капсула левой колонки: марка слева, справа «Инфо» на светло-серой подложке (без иконки).
 * «Работы» видны только на телефоне — на десктопе правая часть всегда на экране.
 * Контакт в меню нет: форма открывается кнопкой с почтой внизу, вернуться — «Инфо» или марка.
 */
export function NavBar({ view, onView, locale, nav, desktop }: Props) {
  const items: View[] = ["info", "playground"];

  return (
    <nav data-intro-left className="relative z-2 flex h-11 items-center justify-between rounded-plate bg-light-1 py-1.5 pr-1.5 pl-4">
      <button type="button" aria-label="Home" className="text-base leading-6 text-dark-1" onClick={() => onView("info")}>
        kozlovskiy
      </button>

      <div className="flex items-center">
        {items.map((item) =>
          desktop && item === "info" ? (
            <span key={item} data-view={item} className="flex items-center rounded-plate bg-light-2 px-3 py-1 text-base leading-6 text-dark-1">
              {pick(nav[item], locale)}
            </span>
          ) : (
          <button
            key={item}
            type="button"
            data-view={item}
            aria-current={view === item ? "page" : undefined}
            onClick={() => onView(item)}
            className={`items-center rounded-plate px-3 py-1 text-base leading-6 text-dark-1 transition-colors duration-200 ${
              view === item ? "bg-light-2" : "hover:bg-light-2/60"
            } ${item === "playground" ? "flex lg:hidden" : "flex"}`}
          >
            {pick(nav[item], locale)}
          </button>
          ),
        )}
      </div>
    </nav>
  );
}
