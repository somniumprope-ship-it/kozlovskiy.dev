import { useContent } from "../content/ContentContext";

export function Marquee() {
  const { marquee } = useContent().left;
  if (marquee.length === 0) return null;

  // Две одинаковые половины, сдвиг на -50% даёт бесшовную петлю при любом количестве слов
  const repeat = Math.max(3, Math.ceil(14 / marquee.length));
  const half = Array.from({ length: repeat }, () => marquee).flat();

  return (
    <div className="relative z-2 flex h-14 shrink-0 items-center overflow-hidden rounded-3xl bg-light-1" aria-hidden>
      <div className="marquee-track flex">
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
