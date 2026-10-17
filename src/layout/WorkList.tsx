import { useContent } from "../content/ContentContext";
import type { Locale } from "../content/types";
import { pick } from "../lib/pick";
import { MediaView } from "./Media";

const swatches = ["#1c1c1c", "#3d7aed", "#c8d4ea"];

export function WorkList({ locale }: { locale: Locale }) {
  const { works } = useContent().left;
  if (works.length === 0) return <div className="flex-1" />;

  return (
    <div className="relative z-2 flex flex-1 flex-col gap-y-1 rounded-3xl bg-light-1 p-1.5">
      {works.map((work, index) => {
        const Tag = work.url ? "a" : "article";
        return (
          <Tag
            key={work.id}
            {...(work.url ? { href: work.url, target: "_blank", rel: "noreferrer" } : {})}
            className="group flex gap-x-3 rounded-[1.125rem] border border-light-2 bg-light-2 p-2.5 text-dark-1 transition-colors duration-100 hover:border-accent/40 hover:bg-accent/10"
          >
            <div className="size-18 shrink-0 overflow-hidden rounded-lg">
              {work.thumb ? (
                <MediaView
                  media={work.thumb}
                  className="size-full origin-center object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
                />
              ) : (
                <div
                  className="size-full origin-center transition-transform duration-300 ease-in-out group-hover:scale-105"
                  style={{ background: swatches[index % swatches.length] }}
                />
              )}
            </div>
            <div className="min-w-0 pt-0.5">
              <h6 className="text-sm leading-[1.5] font-medium wrap-break-word">{pick(work.title, locale)}</h6>
              <p className="mt-2.5 text-sm leading-[1.2] wrap-break-word whitespace-pre-line">
                {pick(work.body, locale)}
              </p>
            </div>
          </Tag>
        );
      })}
    </div>
  );
}
