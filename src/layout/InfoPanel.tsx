import { useContent } from "../content/ContentContext";
import { useClock, zoneLabel } from "../engine/useClock";
import type { Locale } from "../content/types";
import { pick } from "../lib/pick";
import { MediaView } from "./Media";

type Props = {
  locale: Locale;
  onLocale: (locale: Locale) => void;
  /** Страница проекта: фото вдвое меньше, язык справа сверху, часы внизу справа, текст о себе скрыт */
  compact?: boolean;
};

export function InfoPanel({ locale, onLocale, compact = false }: Props) {
  const { left } = useContent();
  const time = useClock(left.timezone);
  const zone = zoneLabel(left.timezone);
  const ease = "duration-500 ease-in-out";

  return (
    <article
      data-intro-left
      className={`flex w-full flex-col rounded-plate bg-light-1 p-4 ${compact ? "" : "flex-1"} [--av-full:7.5rem] lg:[--av-full:9.5rem] ${
        compact ? "[--av:calc(var(--av-full)/2)]" : "[--av:var(--av-full)]"
      }`}
    >
      <div className={`relative transition-[height] ${ease}`} style={{ height: "var(--av)" }}>
        <div
          className={`overflow-hidden rounded-plate transition-[width,height] ${ease}`}
          style={{ width: "var(--av)", height: "var(--av)" }}
        >
          {left.avatar ? (
            <MediaView media={left.avatar} eager className="size-full object-cover" />
          ) : (
            <div className="grid size-full place-items-center bg-dark-1">
              <div className={`rounded-[1.75rem] bg-accent transition-[width,height] ${ease}`} style={{ width: "calc(var(--av) * 0.42)", height: "calc(var(--av) * 0.42)" }} />
            </div>
          )}
        </div>

        <div
          className={`absolute top-0.5 flex gap-2 text-base leading-6 text-dark-1 transition-[left,transform] ${ease}`}
          style={{ left: compact ? "100%" : "calc(var(--av) + 0.75rem)", transform: compact ? "translateX(-100%)" : "none" }}
        >
          {(["ru", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={locale === l}
              className={
                locale === l
                  ? "underline decoration-1 underline-offset-4 opacity-100"
                  : "opacity-40 transition-opacity hover:opacity-70"
              }
              onClick={() => onLocale(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>

        {left.showClock ? (
          <div
            className={`absolute right-0 flex flex-col items-end text-dark-1 transition-[top] ${ease}`}
            style={{ top: compact ? "calc(var(--av) - 2.5rem)" : "0.125rem" }}
          >
            <time className="font-mono text-[0.8125rem] leading-6 tabular-nums">{time}</time>
            <span className="text-[0.6875rem] leading-4 opacity-40">{zone}</span>
          </div>
        ) : null}
      </div>

      <div className={`mt-auto grid transition-[grid-template-rows] ${ease} ${compact ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}`}>
        <div className="min-h-0 overflow-hidden">
          <p className="pt-11 text-[1.25rem] leading-[1.15] font-normal wrap-break-word whitespace-pre-line text-dark-1 lg:pt-22">
            {pick(left.bio, locale)}
          </p>
        </div>
      </div>
    </article>
  );
}
