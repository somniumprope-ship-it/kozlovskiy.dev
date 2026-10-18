import { PROJECT_TAGS } from "../content/tags";
import type { Locale, Project } from "../content/types";
import { pick } from "../lib/pick";

/** Теги: без заливки, пунктирная обводка цвета подложек (как у кнопки «Назад»). */
export function ProjectTags({ project, locale, className = "" }: { project: Project; locale: Locale; className?: string }) {
  const tags = PROJECT_TAGS.filter((t) => project.tags?.includes(t.id));
  if (!tags.length) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`}>
      {tags.map((t) => (
        <li key={t.id} className="rounded-plate border-2 border-dashed border-light-2 px-2.5 py-0.5 text-[0.8125rem] leading-5 text-dark-1 lg:text-sm">
          {pick(t.label, locale)}
        </li>
      ))}
    </ul>
  );
}

/** «На сайт →» без подложки. Показывается, если в админке указана ссылка. */
export function SiteLink({ project, locale }: { project: Project; locale: Locale }) {
  if (!project.site) return null;
  return (
    <a
      href={project.site}
      target="_blank"
      rel="noreferrer"
      className="group flex w-fit items-center gap-2 text-base leading-6 text-dark-1"
    >
      {locale === "ru" ? "На сайт" : "Visit site"}
      <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1">→</span>
    </a>
  );
}
