import gsap from "gsap";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useContent } from "../content/ContentContext";
import type { Locale } from "../content/types";
import { useIsDesktop } from "../engine/useIsDesktop";
import { pick } from "../lib/pick";
import { ContactCard } from "./ContactCard";
import { FooterBar } from "./FooterBar";
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
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function playIntro() {
  gsap.fromTo("[data-intro-left]", { x: "-110%" }, { x: 0, duration: 0.7, stagger: 0.09, ease: "power3.out", clearProps: "transform" });
  gsap.fromTo("[data-intro-right]", { x: "110%" }, { x: 0, duration: 0.8, delay: 0.1, ease: "power3.out", clearProps: "transform" });
}

export function Shell() {
  const { right, left } = useContent();
  const isDesktop = useIsDesktop();
  const [view, setView] = useState<View>("info");
  const [locale, setLocale] = useLocale();

  // «Площадка» есть только на мобильном; на десктопе она всегда на экране справа
  const navView: View = isDesktop && view === "playground" ? "info" : view;

  const [projectId, setProjectId] = useState<string | null>(null);
  const project = right.tiles.find((t) => t.id === projectId && t.project) ?? null;
  const openProject = useCallback((id: string) => setProjectId(id), []);
  const closeProject = useCallback(() => setProjectId(null), []);

  const go = (next: View) => {
    if (next === "info") setProjectId(null);
    setView(next === navView && next === "contact" ? "info" : next);
  };

  // Escape закрывает проект
  useEffect(() => {
    if (!projectId) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && setProjectId(null);
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [projectId]);

  // Загрузка: секции слева выезжают по очереди слева, правая плашка — справа
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from("[data-intro-left]", { x: "-110%", duration: 0.7, stagger: 0.09, ease: "power3.out", clearProps: "transform" });
      gsap.from("[data-intro-right]", { x: "110%", duration: 0.8, delay: 0.1, ease: "power3.out", clearProps: "transform" });
    });
    return () => ctx.revert();
  }, []);

  // Телефон: переключение «Инфо» ⇄ «Работы». Уходящая часть уезжает (секции слева по очереди / плашка вправо),
  // потом въезжает новая. `shown` — то, что реально на экране, `navView` — то, что выбрано в меню.
  const [shown, setShown] = useState<View>(navView);
  const prevShown = useRef<View>(navView);
  const swapTween = useRef<gsap.core.Tween | null>(null);
  const swapped = useRef(false);

  useEffect(() => {
    if (isDesktop) return;
    if (shown === navView) {
      // переключились туда-обратно посреди анимации — вернуть секции на место
      if (swapped.current && swapTween.current && swapTween.current.progress() < 1) gsap.set(["[data-pane=left] [data-intro-left]", "[data-intro-right]"], { clearProps: "transform" });
      swapped.current = false;
      return;
    }
    swapped.current = true;
    swapTween.current?.kill();
    const swap = () => setShown(navView);
    if (shown === "info" || shown === "playground") {
      const targets =
        shown === "info" ? gsap.utils.toArray<HTMLElement>("[data-pane=left] [data-intro-left]") : ["[data-intro-right]"];
      swapTween.current =
        shown === "info"
          ? gsap.to(targets, { x: "-110%", duration: 0.35, stagger: 0.08, ease: "power2.in", onComplete: swap })
          : gsap.to(targets, { x: "110%", duration: 0.4, ease: "power2.in", onComplete: swap });
    } else swap();
    return () => void swapTween.current?.kill();
  }, [navView, shown, isDesktop]);

  useLayoutEffect(() => {
    if (prevShown.current === shown) return;
    prevShown.current = shown;
    if (isDesktop) return;
    if (shown === "playground") {
      gsap.fromTo("[data-intro-right]", { x: "110%" }, { x: 0, duration: 0.5, ease: "power3.out", clearProps: "transform" });
    } else if (shown === "info") {
      gsap.fromTo("[data-pane=left] [data-intro-left]", { x: "-110%" }, { x: 0, duration: 0.5, stagger: 0.08, ease: "power3.out", clearProps: "transform" });
    }
  }, [shown, isDesktop]);

  const screen: View = isDesktop ? navView : shown;

  // «Бесшовная перезагрузка»: обе части разъезжаются и выезжают заново.
  // Так же работают клик по логотипу и Cmd/Ctrl+R / F5 (настоящая перезагрузка — после ухода секций).
  const [tick, setTick] = useState(0);
  const replaying = useRef(false);
  const replay = useCallback((after?: () => void) => {
    if (replaying.current) return;
    replaying.current = true;
    const finish = () => {
      if (after) return after();
      setProjectId(null);
      setView("info");
      setShown("info");
      prevShown.current = "info";
      swapped.current = false;
      setTick((t) => t + 1);
    };
    if (reducedMotion()) return finish();
    gsap
      .timeline({ onComplete: finish })
      .to("[data-intro-left]", { x: "-110%", duration: 0.35, stagger: 0.06, ease: "power2.in" }, 0)
      .to("[data-intro-right]", { x: "110%", duration: 0.4, ease: "power2.in" }, 0);
  }, []);

  useLayoutEffect(() => {
    if (!tick) return;
    replaying.current = false;
    playIntro();
  }, [tick]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const reload = e.key === "F5" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "r");
      if (!reload) return;
      e.preventDefault();
      replay(() => location.reload());
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [replay]);

  return (
    <div key={tick} className="grid h-svh w-full grid-cols-1 grid-rows-[auto_minmax(0,1fr)_auto] gap-1 overflow-hidden bg-light-3 p-1.5 antialiased lg:grid-cols-[30rem_minmax(0,1fr)] lg:gap-x-1 lg:p-1">
      <NavBar view={navView} onView={go} locale={locale} nav={left.nav} desktop={isDesktop} onHome={() => replay()} />

      <div
        className={`${screen === "info" ? "flex" : "hidden lg:flex"} col-start-1 row-start-2 min-h-0 min-w-0`}
        data-pane="left"
      >
        <InfoPane
          locale={locale}
          onLocale={setLocale}
          project={isDesktop ? project : null}
          onCloseProject={closeProject}
        />
      </div>

      <div
        className={`${screen === "playground" ? "flex" : "hidden lg:flex"} col-start-1 row-start-2 min-h-0 min-w-0 lg:col-start-2 lg:row-span-3 lg:row-start-1`}
      >
        <Stage right={right} title={pick(left.nav.playground, locale)} locale={locale} openId={project?.id ?? null} onOpen={openProject} onClose={closeProject} />
      </div>

      {/* Почта и соцсети остаются на месте при любом экране и в любом проекте */}
      <FooterBar onContact={() => go("contact")} />

      <ContactCard locale={locale} visible={screen === "contact"} />
    </div>
  );
}
