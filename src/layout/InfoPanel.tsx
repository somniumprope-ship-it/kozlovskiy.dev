import { useContent } from "../content/ContentContext";
import { useClock, zoneLabel } from "../engine/useClock";
import type { Locale } from "../content/types";
import { pick } from "../lib/pick";
import { MediaView } from "./Media";

type Props = {
  locale: Locale;
  onLocale: (locale: Locale) => void;
};

export function InfoPanel({ locale, onLocale }: Props) {
  const { left } = useContent();
  const time = useClock(left.timezone);
  const zone = zoneLabel(left.timezone);

  return (
    <article className="flex w-full flex-col gap-y-11 rounded-3xl bg-light-1 p-4 lg:gap-y-22">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="size-30 shrink-0 overflow-hidden rounded-[0.6875rem] lg:size-38">
            {left.avatar ? (
              <MediaView media={left.avatar} eager className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center bg-dark-1">
                <div className="size-16 rounded-[1.75rem] bg-accent" />
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-0.5 text-base leading-6 text-dark-1">
            {(["en", "ru"] as const).map((l) => (
              <button
                key={l}
                type="button"
                aria-pressed={locale === l}
                className={locale === l ? "opacity-100" : "opacity-40 transition-opacity hover:opacity-70"}
                onClick={() => onLocale(l)}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        {left.showClock ? (
          <div className="flex flex-col items-end pt-0.5 text-dark-1">
            <time className="font-mono text-[0.8125rem] leading-6 tabular-nums">{time}</time>
            <span className="text-[0.6875rem] leading-4 opacity-40">{zone}</span>
          </div>
        ) : null}
      </div>
      <p className="text-[1.25rem] leading-[1.15] font-normal wrap-break-word whitespace-pre-line text-dark-1">
        {pick(left.bio, locale)}
      </p>
    </article>
  );
}
