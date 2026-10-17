import type { Loc, Locale } from "../content/types";

/** Текст на выбранном языке; если он пустой — берём другой, чтобы в интерфейсе не было дыр. */
export const pick = (l: Loc, locale: Locale) => l[locale] || l.ru || l.en || "";
