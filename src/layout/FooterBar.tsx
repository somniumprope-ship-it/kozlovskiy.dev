import { useContent } from "../content/ContentContext";

export function FooterBar({ onContact }: { onContact: () => void }) {
  const { email, socials } = useContent().left;

  return (
    <div className="relative z-2 flex shrink-0 items-center justify-between gap-3 rounded-plate bg-light-1 p-4">
      <button
        type="button"
        onClick={onContact}
        className="group flex min-w-0 items-center gap-x-2 rounded-plate border border-accent px-3 py-1.5 text-base leading-6 hover:bg-accent/10"
      >
        <span className="truncate">{email}</span>
        <span className="grid size-5 shrink-0 place-items-center rounded-full border border-accent text-[0.6875rem] transition-transform duration-200 group-hover:translate-x-0.5">
          →
        </span>
      </button>
      <div className="flex shrink-0 gap-1.5">
        {socials.map((s) => (
          <a
            key={s.id}
            href={s.url || undefined}
            target="_blank"
            rel="noreferrer"
            aria-label={s.label}
            className="grid size-9 place-items-center rounded-plate bg-light-2 text-[0.6875rem] font-medium transition-colors duration-200 hover:bg-accent/20"
          >
            {s.label}
          </a>
        ))}
      </div>
    </div>
  );
}
