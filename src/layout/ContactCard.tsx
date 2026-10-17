import { useState, type FormEvent } from "react";
import { useContent } from "../content/ContentContext";
import type { Locale } from "../content/types";
import { api } from "../lib/api";
import { pick } from "../lib/pick";

type Props = { locale: Locale; visible: boolean };

type Status = "idle" | "sending" | "done" | "error";

/** Мобильный: экран целиком под навбаром. Десктоп: плавающая карточка справа внизу поверх сцены. */
export function ContactCard({ locale, visible }: Props) {
  const { contact } = useContent().left;
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      await api.subscribe(email);
      setStatus("done");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <form
      onSubmit={submit}
      className={`${visible ? "flex" : "hidden"} z-20 col-start-1 row-start-2 min-h-0 flex-col justify-between rounded-3xl bg-dark-1 p-4 lg:fixed lg:right-7 lg:bottom-7 lg:w-120 lg:max-w-[calc(100vw-2rem)] lg:gap-5`}
    >
      <p className="mt-5 text-[1.25rem] leading-[1.15] text-light-1">{pick(contact.text, locale)}</p>

      <div>
        <div className="relative rounded-full bg-light-1 py-3.25 pr-2 pl-4">
          <label className="sr-only" htmlFor="email">
            {pick(contact.placeholder, locale)}
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder={pick(contact.placeholder, locale)}
            className="w-[calc(100%-8.5rem)] bg-transparent text-base outline-none"
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="absolute top-1.5 right-1.5 rounded-full bg-accent px-4 py-2 text-base text-dark-1 disabled:opacity-60"
          >
            {pick(contact.button, locale)}
          </button>
        </div>
        <p className="mt-2 h-5 pl-4 text-sm text-light-1/70" role="status">
          {status === "done" ? pick(contact.success, locale) : status === "error" ? "Error" : ""}
        </p>
      </div>
    </form>
  );
}
