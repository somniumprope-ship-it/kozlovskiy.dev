import { useContent } from "../content/ContentContext";
import type { Locale } from "../content/types";

/** Принимает код вставки <iframe>, ссылку-приглашение или embed-ссылку Kinescope и отдаёт адрес для плеера. */
export function kinescopeEmbed(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;
  const src = text.match(/<iframe[^>]+src=["']([^"']+)["']/i)?.[1] ?? text;
  try {
    const u = new URL(src.startsWith("//") ? `https:${src}` : src);
    if (!/(^|\.)kinescope\.io$/.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const id = parts[0] === "embed" ? parts[1] : parts[0];
    return id ? `https://kinescope.io/embed/${id}${u.search}` : null;
  } catch {
    return null;
  }
}

/** Плашка слева под видео-приветствие (Kinescope). Заполняет остаток высоты колонки. */
export function VideoPlate({ locale }: { locale: Locale }) {
  const embed = kinescopeEmbed(useContent().left.video.url);

  return (
    <div className="relative z-2 flex aspect-video min-h-0 flex-1 rounded-plate bg-light-1 p-1.5 lg:aspect-auto lg:min-h-40">
      <div className="relative min-w-0 flex-1 overflow-hidden rounded-plate bg-dark-1">
        {embed ? (
          <iframe
            src={embed}
            title="Video"
            className="absolute inset-0 size-full border-0"
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write"
            allowFullScreen
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-light-1/50">{locale === "ru" ? "Видео" : "Video"}</div>
        )}
      </div>
    </div>
  );
}
