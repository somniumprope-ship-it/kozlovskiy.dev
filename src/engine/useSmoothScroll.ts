import { useEffect, useRef } from "react";
import { attachSmoothScroll } from "./smoothScroll";

export function useSmoothScroll<T extends HTMLElement>() {
  const wrapperRef = useRef<T | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;
    return attachSmoothScroll({ wrapper, content });
  }, []);

  return { wrapperRef, contentRef };
}
