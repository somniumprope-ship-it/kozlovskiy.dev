import gsap from "gsap";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useSmoothScroll } from "../engine/useSmoothScroll";
import type { Locale, Tile } from "../content/types";
import { FooterBar } from "./FooterBar";
import { InfoPanel } from "./InfoPanel";
import { Marquee } from "./Marquee";
import { ProjectInfo } from "./ProjectInfo";
import { VideoPlate } from "./VideoPlate";

type Props = {
  locale: Locale;
  onLocale: (l: Locale) => void;
  onContact: () => void;
  /** Открытый проект (только десктоп) */
  project: Tile | null;
  onCloseProject: () => void;
};

type Mode = "home" | "project";

/**
 * Левая колонка: свой скролл, высота ограничена экраном.
 * Открытие проекта: марки, видео и почта по очереди уезжают влево → карточка с фото сжимается →
 * выезжает одна плашка с описанием. Закрытие — то же самое в обратном порядке.
 */
export function InfoPane({ locale, onLocale, onContact, project, onCloseProject }: Props) {
  const { wrapperRef, contentRef } = useSmoothScroll<HTMLDivElement>();
  const [mode, setMode] = useState<Mode>(project ? "project" : "home");
  const [compact, setCompact] = useState(!!project);
  const [held, setHeld] = useState<Tile | null>(project);
  const modeRef = useRef<Mode>(mode);
  const entered = useRef(false);
  const busy = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const want: Mode = project ? "project" : "home";
    if (project) setHeld(project);
    if (want === modeRef.current) return;
    busy.current?.kill();
    const root = contentRef.current;
    if (!root) return;

    if (want === "project") {
      const els = root.querySelectorAll("[data-leave]");
      busy.current = gsap.to(els, {
        x: "-110%",
        duration: 0.4,
        stagger: 0.08,
        ease: "power2.in",
        onComplete: () => {
          modeRef.current = "project";
          setMode("project");
          setCompact(true);
        },
      });
    } else {
      setCompact(false);
      const plate = root.querySelector("[data-project-plate]");
      const finish = () => {
        modeRef.current = "home";
        setMode("home");
        setHeld(null);
      };
      if (plate) busy.current = gsap.to(plate, { x: "-110%", duration: 0.4, ease: "power2.in", onComplete: finish });
      else finish();
    }
  }, [project, contentRef]);

  // Вход после смены режима: плашка проекта выезжает, либо три секции возвращаются по очереди
  useLayoutEffect(() => {
    if (!entered.current) {
      entered.current = true;
      return;
    }
    const root = contentRef.current;
    if (!root) return;
    const els = mode === "project" ? root.querySelectorAll("[data-project-plate]") : root.querySelectorAll("[data-leave]");
    gsap.fromTo(els, { x: "-110%" }, { x: 0, duration: 0.5, stagger: 0.08, ease: "power3.out", clearProps: "transform" });
  }, [mode, contentRef]);

  return (
    <div ref={wrapperRef} data-scroll="left" className="h-full min-h-0 w-full overflow-y-auto overscroll-contain">
      <div ref={contentRef} className="flex min-h-full flex-col gap-y-1">
        <InfoPanel locale={locale} onLocale={onLocale} compact={compact} />
        {mode === "project" && held ? (
          <ProjectInfo tile={held} locale={locale} onClose={onCloseProject} />
        ) : (
          <>
            <Marquee />
            <VideoPlate locale={locale} />
            <FooterBar onContact={onContact} />
          </>
        )}
      </div>
    </div>
  );
}
