import { useSmoothScroll } from "../engine/useSmoothScroll";
import type { Locale } from "../content/types";
import { FooterBar } from "./FooterBar";
import { InfoPanel } from "./InfoPanel";
import { Marquee } from "./Marquee";
import { WorkList } from "./WorkList";

type Props = {
  locale: Locale;
  onLocale: (l: Locale) => void;
  onContact: () => void;
};

/** Левая колонка: свой скролл, высота ограничена экраном, контент растёт вместе с текстом. */
export function InfoPane({ locale, onLocale, onContact }: Props) {
  const { wrapperRef, contentRef } = useSmoothScroll<HTMLDivElement>();

  return (
    <div ref={wrapperRef} data-scroll="left" className="h-full min-h-0 w-full overflow-y-auto overscroll-contain">
      <div ref={contentRef} className="flex min-h-full flex-col gap-y-1">
        <InfoPanel locale={locale} onLocale={onLocale} />
        <Marquee />
        <WorkList locale={locale} />
        <FooterBar onContact={onContact} />
      </div>
    </div>
  );
}
