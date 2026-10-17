export type Locale = "ru" | "en";
export type Loc = Record<Locale, string>;

export type Media = {
  src: string;
  type: "image" | "video";
  w?: number;
  h?: number;
};

export type Work = {
  id: string;
  title: Loc;
  body: Loc;
  thumb: Media | null;
  url: string;
};

export type Social = { id: string; label: string; url: string };

export type Project = { title: Loc; body: Loc; gallery: Media[] };

export type Tile = {
  id: string;
  media: Media;
  caption: string;
  url: string;
  /** Если задан — карточка открывает страницу проекта */
  project?: Project;
};

export type Content = {
  site: {
    title: string;
    accent: string;
    /** Палитра: пустое значение = цвет по умолчанию */
    background: string; // фон страницы
    plate: string; // большие белые плашки
    chip: string; // подложки: «Инфо», «Работы», карточки, кнопки соцсетей
    text: string;
  };
  left: {
    nav: { info: Loc; playground: Loc; contact: Loc };
    avatar: Media | null;
    bio: Loc;
    timezone: string;
    showClock: boolean;
    marquee: string[];
    works: Work[];
    email: string;
    emailButton: { fill: string; border: string; text: string };
    video: { url: string };
    socials: Social[];
    contact: { text: Loc; placeholder: Loc; button: Loc; success: Loc };
  };
  right: {
    title: string;
    autoplaySeconds: number;
    tiles: Tile[];
  };
};

declare global {
  interface Window {
    __CONTENT__?: Content;
  }
}
