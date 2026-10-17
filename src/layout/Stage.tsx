import { memo, useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import type { Content, Media, Tile } from "../content/types";
import { useIsDesktop } from "../engine/useIsDesktop";
import { useSmoothScroll } from "../engine/useSmoothScroll";
import { MediaView } from "./Media";

type Right = Content["right"];

const COLUMNS = 3;

// Пока в админке нет файлов — показываем градиентные заглушки, чтобы был виден ритм сетки
const palettes = [
  ["#0f1728", "#3d7aed"], ["#111111", "#e8e8e8"], ["#dbe7ff", "#3d7aed"],
  ["#1a1a1a", "#6f7f99"], ["#f4f4f4", "#0d0d0d"], ["#2a3f73", "#9db7ff"],
  ["#0d0d0d", "#3d7aed"], ["#ececec", "#7a7a7a"], ["#152238", "#ffffff"],
];
const ratios = [4 / 3, 2 / 3, 4 / 3, 4 / 3, 2 / 3, 4 / 3, 2 / 3, 4 / 3, 4 / 3];

type Item = { tile: Tile | null; index: number };

const ratioOf = (m: Media | undefined, fallback: number) => (m?.w && m?.h ? m.w / m.h : fallback);

function Placeholder({ index }: { index: number }) {
  const [from, to] = palettes[index % palettes.length];
  return (
    <div className="absolute inset-0" style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}>
      <span className="absolute top-1/4 left-1/4 size-28 rounded-full bg-white/30 blur-2xl" />
      <span className="absolute right-8 bottom-10 size-16 rounded-[40%] bg-white/20" />
    </div>
  );
}

/** Десктоп: 3 колонки, плитка уходит в самую короткую — так колонки выравниваются, а порядок остаётся читаемым. */
function Grid({ items }: { items: Item[] }) {
  const { wrapperRef, contentRef } = useSmoothScroll<HTMLDivElement>();

  const columns = useMemo(() => {
    const cols: Item[][] = Array.from({ length: COLUMNS }, () => []);
    const heights = Array(COLUMNS).fill(0);
    for (const item of items) {
      const r = item.tile ? ratioOf(item.tile.media, 4 / 3) : ratios[item.index % ratios.length];
      const shortest = heights.indexOf(Math.min(...heights));
      cols[shortest].push(item);
      heights[shortest] += 1 / r;
    }
    return cols;
  }, [items]);

  return (
    <div ref={wrapperRef} data-scroll="right" className="h-full overflow-y-auto overscroll-contain">
      <div ref={contentRef} className="flex items-start gap-2">
        {columns.map((col, c) => (
          <div key={c} className="flex min-w-0 flex-1 flex-col gap-2">
            {col.map(({ tile, index }) => (
              <TileView key={tile?.id ?? `p${index}`} tile={tile} index={index} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TileView({ tile, index }: { tile: Tile | null; index: number }) {
  const ratio = tile ? ratioOf(tile.media, 4 / 3) : ratios[index % ratios.length];
  const Tag = tile?.url ? "a" : "div";
  return (
    <Tag
      {...(tile?.url ? { href: tile.url, target: "_blank", rel: "noreferrer" } : {})}
      className="group relative block w-full overflow-hidden rounded-plate bg-light-2"
      style={{ aspectRatio: ratio }}
    >
      {tile ? (
        <MediaView
          media={tile.media}
          className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <Placeholder index={index} />
      )}
      {tile?.caption ? (
        <h2 className="absolute bottom-4 left-4 text-[1.25rem] leading-[1.15] text-white mix-blend-difference">
          {tile.caption}
        </h2>
      ) : null}
    </Tag>
  );
}

/** Мобильный: один слот на весь экран. Тап/свайп — следующий, плюс автосмена. Скролла нет. */
function Slideshow({ items, seconds }: { items: Item[]; seconds: number }) {
  const [i, setI] = useState(0);
  const [visible, setVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const down = useRef<{ x: number; y: number } | null>(null);
  const count = items.length;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!seconds || count < 2 || !visible || reduced) return;
    const id = window.setTimeout(() => setI((n) => (n + 1) % count), seconds * 1000);
    return () => window.clearTimeout(id);
  }, [i, seconds, count, visible]);

  const step = (d: number) => setI((n) => (n + d + count) % count);

  const onDown = (e: PointerEvent) => (down.current = { x: e.clientX, y: e.clientY });
  const onUp = (e: PointerEvent) => {
    const s = down.current;
    down.current = null;
    if (!s || count < 2) return;
    const dx = e.clientX - s.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) step(dx < 0 ? 1 : -1);
    else if (Math.abs(dx) < 10) step(1);
  };

  return (
    <div
      ref={rootRef}
      className="relative size-full touch-pan-y select-none"
      onPointerDown={onDown}
      onPointerUp={onUp}
    >
      {items.map(({ tile, index }, n) => (
        <div
          key={tile?.id ?? `p${index}`}
          className={`absolute inset-0 transition-opacity duration-500 ${n === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {tile ? (
            <MediaView media={tile.media} active={n === i} eager={n === 0} className="size-full object-cover" />
          ) : (
            <Placeholder index={index} />
          )}
          {tile?.caption ? (
            <h2 className="absolute bottom-10 left-4 text-[1.25rem] leading-[1.15] text-white mix-blend-difference">
              {tile.caption}
            </h2>
          ) : null}
        </div>
      ))}

      {count > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
          {items.map((_, n) => (
            <span
              key={n}
              className={`h-1 rounded-full bg-white mix-blend-difference transition-all duration-300 ${n === i ? "w-5" : "w-1.5 opacity-50"}`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Правая часть. Зависит ТОЛЬКО от `right` из контента (memo) — переключатели слева её не трогают:
 * ни ремонта, ни повторных анимаций, ни перезапуска видео и скролла.
 */
export const Stage = memo(function Stage({ right, title }: { right: Right; title: string }) {
  const isDesktop = useIsDesktop();

  const items = useMemo<Item[]>(
    () =>
      right.tiles.length > 0
        ? right.tiles.map((tile, index) => ({ tile, index }))
        : Array.from({ length: 9 }, (_, index) => ({ tile: null, index })),
    [right.tiles],
  );

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col rounded-plate bg-light-1 p-1.5">
      <div className="mb-1.5 w-fit shrink-0 rounded-plate bg-light-2 px-3 py-1 text-base leading-6 text-dark-1">
        {title}
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-plate">
        {isDesktop ? <Grid items={items} /> : <Slideshow items={items} seconds={right.autoplaySeconds} />}
      </div>
    </section>
  );
});
