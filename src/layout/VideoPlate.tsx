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
  const embed = kinescopeEmbed(useContent().left.video?.url ?? "");

  return (
    <div data-intro-left data-leave className="relative z-2 aspect-video shrink-0 isolate transform-gpu overflow-hidden rounded-plate bg-light-2">
      {embed ? (
        <iframe
          src={embed}
          title="Video"
          className="absolute inset-0 size-full scale-[1.015] border-0"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write"
          allowFullScreen
        />
      ) : (
        <div className="grid size-full place-items-center text-sm text-dark-1/40">{locale === "ru" ? "Видео" : "Video"}</div>
      )}
    </div>
  );
}
