import type { Locale, Tile } from "../content/types";
import { pick } from "../lib/pick";

/** Плашка с описанием проекта: занимает всё место под сжавшейся карточкой с фото. */
export function ProjectInfo({ tile, locale, onClose }: { tile: Tile; locale: Locale; onClose: () => void }) {
  const project = tile.project!;
  return (
    <div data-project-plate className="relative z-2 flex min-h-40 flex-1 flex-col gap-4 rounded-plate bg-light-1 p-4">
      <button
        type="button"
        onClick={onClose}
        className="flex w-fit items-center gap-2 rounded-plate bg-light-2 px-3 py-1 text-base leading-6 text-dark-1 transition-opacity hover:opacity-70"
      >
        <span aria-hidden>←</span>
        {locale === "ru" ? "Назад" : "Back"}
      </button>
      <h1 className="text-[1.25rem] leading-[1.15] text-dark-1">{pick(project.title, locale)}</h1>
      <p className="text-base leading-6 whitespace-pre-line text-dark-1">{pick(project.body, locale)}</p>
    </div>
  );
}
