/**
 * Логотипы для бегущей строки. Файлы лежат в public/logos.
 * w и h — размеры viewBox каждого SVG: по ним строка считает итоговый размер,
 * чтобы разные по форме логотипы выглядели примерно одинаково крупными.
 * Чтобы добавить логотип: положите файл в public/logos и допишите строку сюда.
 */
export type LogoItem = { src: string; w: number; h: number };

export const logos: LogoItem[] = [
  { src: "/logos/5c-logo-white.svg", w: 145, h: 42 },
  { src: "/logos/ckr.svg", w: 214, h: 51 },
  { src: "/logos/core-it.svg", w: 89, h: 18 },
  { src: "/logos/dominion.svg", w: 200, h: 57 },
  { src: "/logos/frame-23281.svg", w: 232, h: 46 },
  { src: "/logos/g14.svg", w: 84, h: 15 },
  { src: "/logos/group-45.svg", w: 106, h: 24 },
  { src: "/logos/group-46.svg", w: 190, h: 43 },
  { src: "/logos/group-47.svg", w: 89, h: 20 },
  { src: "/logos/image-207.svg", w: 99, h: 28 },
  { src: "/logos/image-209.svg", w: 136, h: 31 },
  { src: "/logos/image-210.svg", w: 75, h: 13 },
  { src: "/logos/logo-ru-2.svg", w: 52, h: 80 },
  { src: "/logos/logo-ru.svg", w: 71, h: 43 },
  { src: "/logos/logo.svg", w: 122, h: 67 },
  { src: "/logos/osteo-logo-2.svg", w: 151, h: 19 },
  { src: "/logos/vector-4.svg", w: 30, h: 30 },
  { src: "/logos/windchange.svg", w: 240, h: 23 },
];
