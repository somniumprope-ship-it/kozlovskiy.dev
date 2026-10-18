import { useContent } from "../content/ContentContext";

export function FooterBar({ onContact }: { onContact: () => void }) {
  const { email, emailButton: btn, socials } = useContent().left;

  return (
    <div data-intro-left className="relative z-2 col-start-1 row-start-3 flex shrink-0 items-center justify-between gap-3 rounded-plate bg-light-1 p-4 max-lg:p-3">
      <button
        type="button"
        onClick={onContact}
        style={{
          backgroundColor: btn?.fill || "transparent",
          borderColor: btn?.border || "transparent",
          color: btn?.text || undefined,
        }}
        className="flex min-w-0 items-center rounded-plate border px-3 py-1.5 text-[0.8125rem] leading-6 transition-opacity lg:text-base duration-200 hover:opacity-70"
      >
        <span className="truncate">{email}</span>
      </button>
      <div className="flex shrink-0 gap-1.5">
        {socials.map((s) => (
          <a
            key={s.id}
            href={s.url || undefined}
            target="_blank"
            rel="noreferrer"
            aria-label={s.label}
            className="grid size-9 place-items-center rounded-plate bg-light-2 text-[0.6875rem] transition-colors duration-200 hover:bg-accent/20"
          >
            {s.label.slice(0, 2)}
          </a>
        ))}
      </div>
    </div>
  );
}
