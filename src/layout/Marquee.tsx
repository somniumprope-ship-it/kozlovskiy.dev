import { useEffect, useRef } from "react";
import { useContent } from "../content/ContentContext";

/**
 * Скорость строки в пикселях в секунду при корневом шрифте 16px (экран 1440×900).
 * На других экранах масштабируется вместе с интерфейсом (rem), чтобы ощущение не менялось.
 */
const SPEED_PX_PER_SEC = 75;

/**
 * Строка движется не плавно, а шагами: стоит STEP_SECONDS, затем сдвигается на SPEED × STEP_SECONDS.
 * Так движение выглядит «прерывисто», как на референсе. 0 — вернуть плавное движение.
 */
const STEP_SECONDS = 1 / 3;

export function Marquee() {
  const { marquee } = useContent().left;
  const trackRef = useRef<HTMLDivElement>(null);

  // Длительность цикла = ширина одной половины трека / скорость.
  // Так скорость остаётся одной и той же при любом количестве и длине слов.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const apply = () => {
      const half = track.getBoundingClientRect().width / 2;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const speed = (SPEED_PX_PER_SEC * rem) / 16;
      if (half <= 0) return;
      if (STEP_SECONDS > 0) {
        // целое число шагов, чтобы петля сходилась без дробного остатка
        const steps = Math.max(1, Math.round(half / (speed * STEP_SECONDS)));
        track.style.animationDuration = `${steps * STEP_SECONDS}s`;
        track.style.animationTimingFunction = `steps(${steps}, end)`;
      } else {
        track.style.animationDuration = `${half / speed}s`;
        track.style.animationTimingFunction = "linear";
      }
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(track);
    return () => observer.disconnect();
  }, [marquee.length]);

  if (marquee.length === 0) return null;

  // Две одинаковые половины, сдвиг на -50% даёт бесшовную петлю при любом количестве слов
  const repeat = Math.max(3, Math.ceil(14 / marquee.length));
  const half = Array.from({ length: repeat }, () => marquee).flat();

  return (
    <div className="relative z-2 flex h-14 shrink-0 items-center overflow-hidden rounded-3xl bg-light-1" aria-hidden>
      <div ref={trackRef} className="marquee-track flex">
        {[0, 1].map((n) => (
          <div key={n} className="flex shrink-0 items-center gap-8 pr-8 pl-6">
            {half.map((item, i) => (
              <span
                key={i}
                className="flex items-center gap-3 text-sm font-medium tracking-[0.18em] whitespace-nowrap uppercase"
              >
                <span className="size-1.5 rounded-full bg-dark-1" />
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
