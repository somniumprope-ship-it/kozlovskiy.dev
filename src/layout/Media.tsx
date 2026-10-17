import { useEffect, useRef } from "react";
import type { Media as MediaT } from "../content/types";

type Props = {
  media: MediaT;
  className?: string;
  /** false — видео ставится на паузу (например, слайд не показан) */
  active?: boolean;
  eager?: boolean;
};

/** Картинка или зацикленное видео-анимация. Видео играет, только пока оно видно на экране. */
export function MediaView({ media, className = "", active = true, eager = false }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    let visible = false;
    const sync = () => {
      if (visible && active) el.play().catch(() => {});
      else el.pause();
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        sync();
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    sync();
    return () => io.disconnect();
  }, [active, media.src]);

  if (media.type === "video") {
    return (
      <video
        ref={videoRef}
        src={media.src}
        className={className}
        muted
        loop
        playsInline
        preload={eager ? "auto" : "metadata"}
        aria-hidden
      />
    );
  }
  return (
    <img
      src={media.src}
      width={media.w}
      height={media.h}
      className={className}
      alt=""
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      draggable={false}
    />
  );
}
