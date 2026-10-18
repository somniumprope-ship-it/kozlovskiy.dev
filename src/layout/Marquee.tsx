import { useEffect, useRef, useState } from "react";
import { useContent } from "../content/ContentContext";
import { logos, type LogoItem } from "../content/logos";

/**
 * Скорость строки в пикселях в секунду при корневом шрифте 16px (экран 1440×900).
 * На других экранах масштабируется вместе с интерфейсом (rem), чтобы ощущение не менялось.
 */
const SPEED_PX_PER_SEC = 100;

/**
 * Строка движется не плавно, а шагами: стоит STEP_SECONDS, затем сдвигается на SPEED × STEP_SECONDS.
 * Так движение выглядит «прерывисто», как на референсе. 0 — вернуть плавное движение.
 */
const STEP_SECONDS = 0;

/**
 * Размер логотипов. Логотипы разной формы (длинная надпись и квадратный значок) выглядят
 * одинаково крупными, когда равна их площадь, а не высота. Поэтому у каждого площадь одна
 * и та же (LOGO_AREA, в rem²), а форма берётся из его пропорций. Крайности обрезаются:
 * слишком высокие и слишком широкие логотипы ограничены LOGO_MAX_H и LOGO_MAX_W.
 * Больше LOGO_AREA — крупнее все логотипы сразу.
 */
const LOGO_SCALE = 1 / 1.5; // логотипы в 1,5 раза меньше прежнего размера
const LOGO_AREA = 10 * LOGO_SCALE ** 2;
const LOGO_MAX_H = 2.4 * LOGO_SCALE;
const LOGO_MAX_W = 10 * LOGO_SCALE;

/** Расстояние между логотипами, rem. На стыке двух половин строки такой же промежуток. */
const LOGO_GAP = 1.5;

function logoSize({ w, h }: LogoItem) {
  const ratio = w / h;
  let height = Math.sqrt(LOGO_AREA / ratio);
  let width = height * ratio;
  if (height > LOGO_MAX_H) {
    height = LOGO_MAX_H;
    width = height * ratio;
  }
  if (width > LOGO_MAX_W) {
    width = LOGO_MAX_W;
    height = width / ratio;
  }
  return { width: `${width.toFixed(3)}rem`, height: `${height.toFixed(3)}rem` };
}

export function Marquee() {
  const { marquee } = useContent().left;
  const trackRef = useRef<HTMLDivElement>(null);

  // Файл логотипа удалён или не открылся — выкидываем его из ленты вместе с промежутком,
  // чтобы в строке не оставалось пустого места. Ширина и скорость пересчитываются сами.
  const [broken, setBroken] = useState<ReadonlySet<string>>(() => new Set());
  const shownLogos = logos.filter((logo) => !broken.has(logo.src));
  const markBroken = (src: string) =>
    setBroken((prev) => (prev.has(src) ? prev : new Set(prev).add(src)));

  const useLogos = shownLogos.length > 0;
  const itemCount = useLogos ? shownLogos.length : marquee.length;

  // Длительность цикла = ширина одной половины трека / скорость.
  // Так скорость остаётся одной и той же при любом количестве и размере элементов.
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
  }, [itemCount, useLogos]);

  if (itemCount === 0) return null;

  // Две одинаковые половины, сдвиг на -50% даёт бесшовную петлю.
  // Логотипов много, одной копии набора хватает с запасом; у текста копий больше, чтобы закрыть ширину.
  const repeat = useLogos ? 1 : Math.max(3, Math.ceil(14 / marquee.length));
  const textHalf = Array.from({ length: repeat }, () => marquee).flat();

  return (
    <div data-intro-left data-leave className="relative z-2 flex h-14 shrink-0 items-center overflow-hidden rounded-plate bg-light-1" aria-hidden>
      <div ref={trackRef} className="marquee-track flex">
        {[0, 1].map((n) => (
          <div
            key={n}
            className={`flex shrink-0 items-center ${useLogos ? "" : "gap-8 pr-8 pl-6"}`}
            style={useLogos ? { gap: `${LOGO_GAP}rem`, paddingRight: `${LOGO_GAP}rem` } : undefined}
          >
            {useLogos
              ? shownLogos.map((logo) => (
                  <img
                    key={logo.src}
                    src={logo.src}
                    alt=""
                    draggable={false}
                    decoding="async"
                    onError={() => markBroken(logo.src)}
                    className="block shrink-0 object-contain select-none"
                    style={logoSize(logo)}
                  />
                ))
              : textHalf.map((item, i) => (
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
