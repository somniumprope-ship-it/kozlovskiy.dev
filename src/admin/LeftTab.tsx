import { useEffect, useState } from "react";
import type { Content } from "../content/types";
import { api } from "../lib/api";
import { btn, Field, LocField, MediaField, move, RowTools, Section, Text, uid } from "./fields";

type Props = { draft: Content; edit: (fn: (d: Content) => void) => void };

function Subscribers() {
  const [rows, setRows] = useState<{ email: string; at: string }[] | null>(null);
  useEffect(() => {
    api.subscribers().then((r) => setRows(r.subscribers)).catch(() => setRows([]));
  }, []);

  const download = () => {
    const csv = "email,date\n" + (rows ?? []).map((r) => `${r.email},${r.at}`).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "subscribers.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-light-2 px-3 py-2 text-sm">
      <span>Подписчиков: {rows ? rows.length : "…"}</span>
      <button type="button" className={btn} disabled={!rows?.length} onClick={download}>
        Скачать CSV
      </button>
    </div>
  );
}

export function LeftTab({ draft, edit }: Props) {
  const l = draft.left;

  return (
    <div className="flex flex-col gap-4">
      <Section title="Профиль" hint="Карточка сверху: фото, язык, часы и текст о себе. Карточка растёт вместе с текстом, колонка скроллится внутри.">
        <MediaField label="Фото (можно видео или gif)" value={l.avatar} onChange={(m) => edit((d) => void (d.left.avatar = m))} />
        <LocField label="Текст о себе" multiline rows={5} value={l.bio} onChange={(v) => edit((d) => void (d.left.bio = v))} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Часовой пояс часов" hint="Например Europe/Moscow, Europe/Tallinn, America/New_York">
            <Text value={l.timezone} onChange={(v) => edit((d) => void (d.left.timezone = v))} />
          </Field>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input type="checkbox" checked={l.showClock} onChange={(e) => edit((d) => void (d.left.showClock = e.target.checked))} />
            Показывать часы
          </label>
        </div>
      </Section>

      <Section title="Бегущая строка" hint="Слова бегут по кругу. Любое количество — петля бесшовная.">
        {l.marquee.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <Text value={w} onChange={(v) => edit((d) => void (d.left.marquee[i] = v))} />
            <RowTools
              index={i}
              count={l.marquee.length}
              onMove={(to) => edit((d) => void (d.left.marquee = move(d.left.marquee, i, to)))}
              onRemove={() => edit((d) => void d.left.marquee.splice(i, 1))}
            />
          </div>
        ))}
        <button type="button" className={`${btn} self-start`} onClick={() => edit((d) => void d.left.marquee.push(""))}>
          + Добавить слово
        </button>
      </Section>

      <Section title="Работы" hint="Карточки с превью слева и текстом справа. Если указана ссылка — карточка кликабельна.">
        {l.works.map((w, i) => (
          <div key={w.id} className="flex flex-col gap-4 rounded-xl border border-light-3 p-4">
            <div className="flex items-start justify-between gap-3">
              <MediaField label="Превью" value={w.thumb} onChange={(m) => edit((d) => void (d.left.works[i].thumb = m))} />
              <RowTools
                index={i}
                count={l.works.length}
                onMove={(to) => edit((d) => void (d.left.works = move(d.left.works, i, to)))}
                onRemove={() => edit((d) => void d.left.works.splice(i, 1))}
              />
            </div>
            <LocField label="Название" value={w.title} onChange={(v) => edit((d) => void (d.left.works[i].title = v))} />
            <LocField label="Описание" multiline rows={3} value={w.body} onChange={(v) => edit((d) => void (d.left.works[i].body = v))} />
            <Field label="Ссылка (необязательно)">
              <Text value={w.url} placeholder="https://" onChange={(v) => edit((d) => void (d.left.works[i].url = v))} />
            </Field>
          </div>
        ))}
        <button
          type="button"
          className={`${btn} self-start`}
          onClick={() =>
            edit((d) =>
              void d.left.works.push({ id: uid(), title: { ru: "", en: "" }, body: { ru: "", en: "" }, thumb: null, url: "" }),
            )
          }
        >
          + Добавить работу
        </button>
      </Section>

      <Section title="Почта и соцсети">
        <Field label="Почта на кнопке внизу">
          <Text value={l.email} onChange={(v) => edit((d) => void (d.left.email = v))} />
        </Field>
        {l.socials.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className="w-24 shrink-0">
              <Text value={s.label} placeholder="Подпись" onChange={(v) => edit((d) => void (d.left.socials[i].label = v))} />
            </div>
            <Text value={s.url} placeholder="https://" onChange={(v) => edit((d) => void (d.left.socials[i].url = v))} />
            <RowTools
              index={i}
              count={l.socials.length}
              onMove={(to) => edit((d) => void (d.left.socials = move(d.left.socials, i, to)))}
              onRemove={() => edit((d) => void d.left.socials.splice(i, 1))}
            />
          </div>
        ))}
        <button
          type="button"
          className={`${btn} self-start`}
          onClick={() => edit((d) => void d.left.socials.push({ id: uid(), label: "", url: "" }))}
        >
          + Добавить соцсеть
        </button>
      </Section>

      <Section title="Меню и форма подписки">
        <LocField label="Меню: Инфо" value={l.nav.info} onChange={(v) => edit((d) => void (d.left.nav.info = v))} />
        <LocField label="Плашка справа «Работы» (и пункт меню на телефоне)" value={l.nav.playground} onChange={(v) => edit((d) => void (d.left.nav.playground = v))} />
        <LocField label="Текст над формой" multiline value={l.contact.text} onChange={(v) => edit((d) => void (d.left.contact.text = v))} />
        <LocField label="Подсказка в поле почты" value={l.contact.placeholder} onChange={(v) => edit((d) => void (d.left.contact.placeholder = v))} />
        <LocField label="Кнопка" value={l.contact.button} onChange={(v) => edit((d) => void (d.left.contact.button = v))} />
        <LocField label="Сообщение после отправки" value={l.contact.success} onChange={(v) => edit((d) => void (d.left.contact.success = v))} />
        <Subscribers />
      </Section>
    </div>
  );
}

