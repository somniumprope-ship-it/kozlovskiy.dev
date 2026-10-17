import { useCallback, useEffect, useState, type FormEvent } from "react";
import { applySiteTheme } from "../content/ContentContext";
import type { Content } from "../content/types";
import { api, ApiError, getToken, setToken } from "../lib/api";
import { btn, btnPrimary, Field, Section, Text } from "./fields";
import { LeftTab } from "./LeftTab";
import { RightTab } from "./RightTab";

type Tab = "left" | "right" | "site";
const TABS: { id: Tab; label: string }[] = [
  { id: "left", label: "Левая часть" },
  { id: "right", label: "Правая часть" },
  { id: "site", label: "Сайт" },
];

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      setToken((await api.login(password)).token);
      onDone();
    } catch (e) {
      setErr(e instanceof ApiError && e.status === 429 ? "Слишком много попыток. Подождите 15 минут." : "Неверный пароль.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-full place-items-center p-4">
      <form onSubmit={submit} className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-6">
        <h1 className="text-lg font-medium">Админка</h1>
        <Text type="password" value={password} onChange={setPassword} placeholder="Пароль" />
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button className={btnPrimary} disabled={busy || !password}>
          Войти
        </button>
      </form>
    </div>
  );
}

function Editor({ initial, onLogout }: { initial: Content; onLogout: () => void }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [tab, setTab] = useState<Tab>("left");
  const [status, setStatus] = useState<"" | "saving" | "ok" | "error">("");

  const dirty = JSON.stringify(draft) !== saved;

  const edit = useCallback((fn: (d: Content) => void) => {
    setDraft((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    setStatus("");
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = async () => {
    setStatus("saving");
    try {
      await api.save(draft);
      setSaved(JSON.stringify(draft));
      applySiteTheme(draft);
      setStatus("ok");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return onLogout();
      setStatus("error");
    }
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pb-24">
      <header className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center gap-3 bg-light-2/90 px-4 py-3 backdrop-blur">
        <nav className="flex gap-1 rounded-full bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${tab === t.id ? "bg-accent" : "hover:bg-light-2"}`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <span className="ml-auto text-sm text-dark-1/60" role="status">
          {status === "saving" ? "Сохраняю…" : status === "ok" && !dirty ? "Сохранено" : status === "error" ? "Не удалось сохранить" : dirty ? "Есть несохранённые изменения" : ""}
        </span>
        <a className={btn} href="/" target="_blank" rel="noreferrer">
          Открыть сайт
        </a>
        <button type="button" className={btnPrimary} disabled={!dirty || status === "saving"} onClick={save}>
          Сохранить
        </button>
        <button type="button" className={btn} onClick={onLogout}>
          Выйти
        </button>
      </header>

      {tab === "left" ? <LeftTab draft={draft} edit={edit} /> : null}
      {tab === "right" ? <RightTab draft={draft} edit={edit} /> : null}
      {tab === "site" ? (
        <Section title="Сайт">
          <Field label="Название вкладки браузера">
            <Text value={draft.site.title} onChange={(v) => edit((d) => void (d.site.title = v))} />
          </Field>
          <Field label="Акцентный цвет" hint="Активный пункт меню, кнопки, рамка почты.">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={draft.site.accent}
                onChange={(e) => edit((d) => void (d.site.accent = e.target.value))}
                className="size-10 cursor-pointer rounded-lg border border-light-3 bg-white p-1"
              />
              <span className="font-mono text-sm">{draft.site.accent}</span>
            </div>
          </Field>
        </Section>
      ) : null}
    </div>
  );
}

export default function Admin() {
  const [state, setState] = useState<"loading" | "login" | "ready">("loading");
  const [content, setContent] = useState<Content | null>(null);

  const load = useCallback(async () => {
    if (!getToken()) return setState("login");
    try {
      await api.session();
      setContent(await api.content());
      setState("ready");
    } catch {
      setToken(null);
      setState("login");
    }
  }, []);

  useEffect(() => {
    document.title = "Админка";
    load();
  }, [load]);

  const logout = () => {
    setToken(null);
    setState("login");
  };

  return (
    <div className="admin fixed inset-0 overflow-y-auto bg-light-2 text-dark-1">
      {state === "login" ? <Login onDone={load} /> : null}
      {state === "ready" && content ? <Editor initial={content} onLogout={logout} /> : null}
    </div>
  );
}
