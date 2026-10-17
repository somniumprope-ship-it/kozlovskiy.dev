import Lenis from "lenis";
import gsap from "gsap";

export type Scroller = {
  wrapper: HTMLElement;
  content: HTMLElement;
};

const instances = new Set<Lenis>();
let tickerBound = false;

function bindTicker() {
  if (tickerBound) return;
  tickerBound = true;
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((time) => {
    const ms = time * 1000;
    instances.forEach((lenis) => lenis.raf(ms));
  });
}

/** Каждая колонка получает свой независимый Lenis: колесо прокручивает только ту колонку, над которой курсор. */
export function attachSmoothScroll({ wrapper, content }: Scroller) {
  bindTicker();

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = new Lenis({
    wrapper,
    content,
    lerp: reduced ? 1 : 0.075,
    wheelMultiplier: 0.9,
    autoRaf: false,
    syncTouch: false, // на тачах — нативный скролл, он плавнее и привычнее
  });

  instances.add(lenis);

  return () => {
    instances.delete(lenis);
    lenis.destroy();
  };
}
