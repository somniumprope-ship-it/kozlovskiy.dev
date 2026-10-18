import type { Loc } from "./types";

/** Теги проекта: в админке отмечаются галочками, на сайте идут в том порядке, как здесь. */
export const PROJECT_TAGS: { id: string; label: Loc }[] = [
  { id: "design", label: { ru: "Дизайн", en: "Design" } },
  { id: "layout", label: { ru: "Верстка", en: "Front-end" } },
  { id: "full", label: { ru: "Полная разработка", en: "Full development" } },
];
