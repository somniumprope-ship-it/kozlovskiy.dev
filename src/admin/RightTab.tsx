import { useRef, useState, type DragEvent } from "react";
import type { Content, Media } from "../content/types";
import { uploadFiles } from "../lib/api";
import { btn, errorText, Field, LocField, move, Preview, RowTools, Section, Text, uid } from "./fields";

type Props = { draft: Content; edit: (fn: (d: Content) => void) => void };

/** Галерея проекта: загрузка нескольких файлов и список миниатюр с удалением. */
function Gallery({ items, onAdd, onRemove }: { items: Media[]; onAdd: (m: Media[]) => void; onRemove: (n: number) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setErr("");
    try {
      onAdd(await uploadFiles(Array.from(files)));
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <span className="font-medium">Галерея проекта</span>
      <div className="grid grid-cols-4 gap-2">
        {items.map((m, n) => (
          <div key={n} className="relative aspect-square overflow-hidden rounded-lg bg-white">
            <Preview media={m} className="size-full object-cover" />
            <button type="button" aria-label="Удалить" className="absolute top-1 right-1 rounded-full bg-white/90 px-1.5 text-xs" onClick={() => onRemove(n)}>
              ✕
            </button>
          </div>
        ))}
      </div>
      <button type="button" className={`${btn} self-start`} disabled={busy} onClick={() => ref.current?.click()}>
        {busy ? "Загрузка…" : "+ Добавить в галерею"}
      </button>
      <input ref={ref} type="file" multiple hidden accept="image/*,video/mp4,video/webm" onChange={(e) => pick(e.target.files)} />
      {err ? <span className="text-xs text-red-600">{err}</span> : null}
    </div>
  );
}

export function RightTab({ draft, edit }: Props) {
  const r = draft.right;
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [msg, setMsg] = useState("");
  const [over, setOver] = useState(false);

  const add = async (list: FileList | File[]) => {
    const files = Array.from(list);
    if (!files.length) return;
    setMsg("");
    setProgress(0);
    try {
      const media = await uploadFiles(files, setProgress);
      edit((d) => void d.right.tiles.push(...media.map((m) => ({ id: uid(), media: m, caption: "", url: "" }))));
      if (media.length < files.length) setMsg(`Пропущено файлов неподдерживаемого формата: ${files.length - media.length}.`);
    } catch (e) {
      setMsg(errorText(e));
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    add(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-4">
      <Section title="Настройки правой части">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Смена слайдов на телефоне, секунд" hint="На телефоне правая часть — один экран без скролла. 0 — не менять автоматически.">
            <Text
              type="number"
              value={String(r.autoplaySeconds)}
              onChange={(v) => edit((d) => void (d.right.autoplaySeconds = Math.max(0, Number(v) || 0)))}
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Фото и анимации"
        hint="JPG, PNG, WebP, AVIF, GIF, SVG, а также MP4 и WebM (видео играет без звука по кругу — так удобнее всего делать анимации). На компьютере плитки идут в три колонки по своим пропорциям, на телефоне показываются по одной на весь экран."
      >
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={onDrop}
          className={`grid place-items-center rounded-2xl border border-dashed px-4 py-8 text-center text-sm transition-colors ${
            over ? "border-accent bg-accent/5" : "border-light-3 bg-light-2"
          }`}
        >
          {progress !== null ? (
            <div className="w-full max-w-xs">
              <div className="h-1.5 overflow-hidden rounded-full bg-light-3">
                <div className="h-full bg-accent transition-[width]" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="mt-2 text-dark-1/60">Загрузка… {Math.round(progress * 100)}%</p>
            </div>
          ) : (
            <>
              <p>Перетащите файлы сюда</p>
              <button type="button" className={`${btn} mt-3`} onClick={() => fileRef.current?.click()}>
                или выберите на компьютере
              </button>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            accept="image/*,video/mp4,video/webm"
            onChange={(e) => e.target.files && add(e.target.files)}
          />
        </div>
        {msg ? <p className="text-sm text-red-600">{msg}</p> : null}

        {r.tiles.length === 0 ? (
          <p className="text-sm text-dark-1/55">Пока пусто — на сайте показаны градиентные заглушки.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {r.tiles.map((t, i) => (
              <div key={t.id} className="flex flex-col gap-2 rounded-xl border border-light-3 p-2.5">
                <div
                  className="overflow-hidden rounded-lg bg-light-2"
                  style={{ aspectRatio: t.media.w && t.media.h ? t.media.w / t.media.h : 4 / 3, maxHeight: 260 }}
                >
                  <Preview media={t.media} className="size-full object-cover" />
                </div>
                <Text value={t.caption} placeholder="Подпись (необязательно)" onChange={(v) => edit((d) => void (d.right.tiles[i].caption = v))} />
                <Text value={t.url} placeholder="Ссылка (необязательно)" onChange={(v) => edit((d) => void (d.right.tiles[i].url = v))} />
                <details className="rounded-lg bg-light-2 p-2.5 text-sm" open={!!t.project}>
                  <summary className="cursor-pointer select-none">Страница проекта {t.project ? "(включена)" : "(выключена)"}</summary>
                  <div className="mt-3 flex flex-col gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!t.project}
                        onChange={(e) =>
                          edit((d) => {
                            d.right.tiles[i].project = e.target.checked
                              ? { title: { ru: d.right.tiles[i].caption, en: d.right.tiles[i].caption }, body: { ru: "", en: "" }, gallery: [] }
                              : undefined;
                          })
                        }
                      />
                      Открывать страницу проекта по клику
                    </label>
                    {t.project ? (
                      <>
                        <LocField label="Название" value={t.project.title} onChange={(v) => edit((d) => void (d.right.tiles[i].project!.title = v))} />
                        <LocField label="Текст о проекте" multiline rows={5} value={t.project.body} onChange={(v) => edit((d) => void (d.right.tiles[i].project!.body = v))} />
                        <Gallery
                          items={t.project.gallery}
                          onAdd={(m) => edit((d) => void d.right.tiles[i].project!.gallery.push(...m))}
                          onRemove={(n) => edit((d) => void d.right.tiles[i].project!.gallery.splice(n, 1))}
                        />
                      </>
                    ) : null}
                  </div>
                </details>
                <RowTools
                  index={i}
                  count={r.tiles.length}
                  onMove={(to) => edit((d) => void (d.right.tiles = move(d.right.tiles, i, to)))}
                  onRemove={() => edit((d) => void d.right.tiles.splice(i, 1))}
                />
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
