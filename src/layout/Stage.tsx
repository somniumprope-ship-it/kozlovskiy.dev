import gsap from "gsap";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Content, Locale, Media, Tile } from "../content/types";
import { pick } from "../lib/pick";
import { ProjectTags, SiteLink } from "./projectBits";
import { OUT_END, PAUSE } from "./timing";
import { useIsDesktop } from "../engine/useIsDesktop";
import { useSmoothScroll } from "../engine/useSmoothScroll";
import { MediaView } from "./Media";

type Right = Content["right"];


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
function Grid({ items, onOpen, columnCount }: { items: Item[]; onOpen: (id: string) => void; columnCount: number }) {
  const { wrapperRef, contentRef } = useSmoothScroll<HTMLDivElement>();

  const columns = useMemo(() => {
    const cols: Item[][] = Array.from({ length: columnCount }, () => []);
    const heights = Array(columnCount).fill(0);
    for (const item of items) {
      const r = item.tile ? ratioOf(item.tile.media, 4 / 3) : ratios[item.index % ratios.length];
      const shortest = heights.indexOf(Math.min(...heights));
      cols[shortest].push(item);
      heights[shortest] += 1 / r;
    }
    return cols;
  }, [items, columnCount]);

  return (
    <div ref={wrapperRef} data-scroll="right" className="h-full overflow-y-auto overscroll-contain">
      <div ref={contentRef} className="flex items-start gap-2">
        {columns.map((col, c) => (
          <div key={c} className="flex min-w-0 flex-1 flex-col gap-2">
            {col.map(({ tile, index }) => (
              <TileView key={tile?.id ?? `p${index}`} tile={tile} index={index} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function TileView({ tile, index, onOpen }: { tile: Tile | null; index: number; onOpen: (id: string) => void }) {
  const ratio = tile ? ratioOf(tile.media, 4 / 3) : ratios[index % ratios.length];
  const opens = !!tile?.project;
  const Tag = opens ? "button" : tile?.url ? "a" : "div";
  return (
    <Tag
      {...(opens
        ? { type: "button" as const, onClick: () => onOpen(tile!.id) }
        : tile?.url
          ? { href: tile.url, target: "_blank", rel: "noreferrer" }
          : {})}
      data-tile className={`group relative block w-full overflow-hidden rounded-plate bg-light-2 text-left ${opens ? "cursor-pointer" : ""}`}
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

type StageProps = {
  right: Right;
  title: string;
  locale: Locale;
  openId: string | null;
  onOpen: (id: string) => void;
  onClose: () => void;
};

/** Страница проекта: те же квадратики, что и на главной, пока без финальной сетки. */
function ProjectGallery({ tile }: { tile: Tile }) {
  const { wrapperRef, contentRef } = useSmoothScroll<HTMLDivElement>();
  const project = tile.project!;
  const gallery = project.gallery.length ? project.gallery : [tile.media];

  return (
    <div ref={wrapperRef} data-scroll="right" className="h-full overflow-y-auto overscroll-contain">
      <div ref={contentRef} className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          {gallery.map((m, n) => (
            <div key={n} data-tile className="aspect-square overflow-hidden rounded-plate bg-light-2">
              <MediaView media={m} className="size-full object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Правая часть. Зависит только от `right`, языка и открытого проекта (memo) — переключатели слева её не трогают.
 * Открытие проекта: сетка уезжает влево и гаснет, галерея проекта выезжает справа.
 */
export const Stage = memo(function Stage({ right, title, locale, openId, onOpen, onClose }: StageProps) {
  const isDesktop = useIsDesktop();
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const openTile = right.tiles.find((t) => t.id === openId && t.project) ?? null;
  const [shownId, setShownId] = useState<string | null>(openTile?.id ?? null);
  const shown = right.tiles.find((t) => t.id === shownId && t.project) ?? null;
  const first = useRef(true);

  const items = useMemo<Item[]>(() => {
    const real = right.tiles.map((tile, index) => ({ tile, index }));
    // пока карточек мало, добиваем сетку заглушками, чтобы был виден ритм
    const pad = Math.max(0, 9 - real.length);
    return [...real, ...Array.from({ length: pad }, (_, k) => ({ tile: null, index: real.length + k }))];
  }, [right.tiles]);

  // Порядок «слева направо, сверху вниз», чтобы плитки уходили и приходили волной по рядам
  const tilesOf = (root: HTMLElement | null) =>
    root
      ? Array.from(root.querySelectorAll<HTMLElement>("[data-tile]")).sort((x, y) => {
          const a = x.getBoundingClientRect(), b = y.getBoundingClientRect();
          return Math.round(a.top / 40) - Math.round(b.top / 40) || a.left - b.left;
        })
      : [];

  useEffect(() => {
    if ((openTile?.id ?? null) === shownId) return;
    const el = bodyRef.current;
    if (!el) return setShownId(openTile?.id ?? null);
    const done = () => setShownId(openTile?.id ?? null);
    const tiles = tilesOf(el);
    // подложка стоит на месте, плитки по очереди уезжают вправо
    const tween = tiles.length
      ? gsap.to(tiles, { x: "110%", duration: 0.7, stagger: { amount: OUT_END - 0.7 }, ease: "power2.in", onComplete: done })
      : gsap.to(el, { x: "110%", duration: 0.7, ease: "power2.in", onComplete: done });
    return () => void tween.kill();
  }, [openTile, shownId]);

  useLayoutEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const el = bodyRef.current;
    if (!el) return;
    gsap.set(el, { clearProps: "transform" });
    const tiles = tilesOf(el);
    // небольшая пауза, потом плитки по очереди выезжают справа
    if (tiles.length) gsap.fromTo(tiles, { x: "110%" }, { x: 0, duration: 0.9, delay: PAUSE, stagger: { amount: 0.5 }, ease: "power3.out", clearProps: "transform" });
    else gsap.fromTo(el, { x: "110%" }, { x: 0, duration: 0.8, delay: PAUSE, ease: "power3.out", clearProps: "transform" });
  }, [shownId]);

  const heading = title;

  // Телефон, открыт проект: две отдельные плашки — маленькая с текстом и кнопкой «Назад», под ней галерея со скроллом
  if (shown && !isDesktop) {
    return (
      <section data-intro-right className="flex h-full min-h-0 w-full min-w-0 flex-col gap-1">
        <div ref={bodyRef} className="flex size-full min-h-0 flex-col gap-1">
          <div className="flex max-h-[50%] shrink-0 flex-col gap-4 overflow-y-auto rounded-plate bg-light-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex shrink-0 items-center gap-2 rounded-plate bg-light-2 px-3 py-1 text-[0.8125rem] leading-6 text-dark-1"
              >
                <span aria-hidden>←</span>
                {locale === "ru" ? "Назад" : "Back"}
              </button>
              <ProjectTags project={shown.project!} locale={locale} className="justify-end pt-0.5" />
            </div>
            <h1 className="text-[1.0625rem] leading-[1.15] font-[600] text-dark-1">{pick(shown.project!.title, locale)}</h1>
            <p className="text-base leading-6 whitespace-pre-line text-dark-1">{pick(shown.project!.body, locale)}</p>
            <SiteLink project={shown.project!} locale={locale} />
          </div>
          <div className="min-h-0 flex-1 overflow-hidden rounded-plate bg-light-1 p-1.5">
            <ProjectGallery key={shown.id} tile={shown} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section data-intro-right className="flex h-full min-h-0 w-full min-w-0 flex-col rounded-plate bg-light-1 p-1.5">
      {shown ? (
        <button
          type="button"
          onClick={onClose}
          className="mb-5 flex w-fit shrink-0 items-center gap-2 rounded-plate bg-light-2 px-3 py-1 text-base leading-6 text-dark-1 transition-opacity hover:opacity-70 lg:mb-1.5"
        >
          <span aria-hidden>←</span>
          {locale === "ru" ? "Назад" : "Back"}
        </button>
      ) : (
        // на телефоне заголовок уже есть в шапке («Работы»), поэтому плашку там не дублируем
        <div className="mb-1.5 hidden w-fit shrink-0 rounded-plate bg-light-2 px-3 py-1 text-base leading-6 text-dark-1 lg:block">{heading}</div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-plate">
        <div ref={bodyRef} className="size-full">
          {shown ? (
            <ProjectGallery key={shown.id} tile={shown} />
          ) : (
            <Grid items={items} onOpen={onOpen} columnCount={isDesktop ? 3 : 2} />
          )}
        </div>
      </div>
    </section>
  );
});
