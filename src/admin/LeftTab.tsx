import { useEffect, useState } from "react";
import type { Content } from "../content/types";
import { api } from "../lib/api";
import { kinescopeEmbed } from "../layout/VideoPlate";
import { Area, btn, ColorField, Field, LocField, MediaField, move, RowTools, Section, Text, uid } from "./fields";

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
  if (!l.video) l.video = { url: "" };
  if (!l.emailButton) l.emailButton = { fill: "", border: "#ff006e", text: "" };

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

      <Section
        title="Видео-приветствие"
        hint="Вставьте ссылку на видео из Kinescope (ссылка «Поделиться», embed-ссылка или весь код вставки <iframe>). Видео появится слева вместо списка проектов."
      >
        <Field label="Код вставки или ссылка Kinescope" hint="Вставьте код целиком (<div><iframe …></iframe></div>) — видео растянется на всю плашку.">
          <Area rows={4} value={l.video.url} onChange={(v) => edit((d) => void (d.left.video.url = v))} />
        </Field>
        {l.video.url && !kinescopeEmbed(l.video.url) ? (
          <span className="text-xs text-red-600">Не похоже на ссылку Kinescope — видео не будет показано.</span>
        ) : null}
      </Section>

      <Section title="Кнопка с почтой и соцсети">
        <Field label="Почта на кнопке внизу">
          <Text value={l.email} onChange={(v) => edit((d) => void (d.left.email = v))} />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <ColorField label="Заливка кнопки" value={l.emailButton.fill} fallback="#ffffff" emptyLabel="без заливки" onChange={(v) => edit((d) => void (d.left.emailButton.fill = v))} />
          <ColorField label="Цвет обводки" value={l.emailButton.border} fallback={draft.site.accent} emptyLabel="без обводки" onChange={(v) => edit((d) => void (d.left.emailButton.border = v))} />
          <ColorField label="Цвет текста" value={l.emailButton.text} fallback="#0d0d0d" emptyLabel="как на сайте" onChange={(v) => edit((d) => void (d.left.emailButton.text = v))} />
        </div>
        <p className="text-sm text-dark-1/60">Соцсети: две буквы на кнопке и ссылка. Новая строка — новая кнопка.</p>
        {l.socials.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className="w-20 shrink-0">
              <Text value={s.label} placeholder="2 буквы" onChange={(v) => edit((d) => void (d.left.socials[i].label = v.slice(0, 2)))} />
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

