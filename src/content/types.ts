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

export type Tile = {
  id: string;
  media: Media;
  caption: string;
  url: string;
};

export type Content = {
  site: { title: string; accent: string };
  left: {
    nav: { info: Loc; playground: Loc; contact: Loc };
    avatar: Media | null;
    bio: Loc;
    timezone: string;
    showClock: boolean;
    marquee: string[];
    works: Work[];
    email: string;
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
