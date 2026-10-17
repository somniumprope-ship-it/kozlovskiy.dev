import { useEffect, useState } from "react";

function format(timeZone: string) {
  const make = (tz?: string) =>
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: tz,
    }).format(new Date());
  try {
    return make(timeZone);
  } catch {
    return make(); // неверное имя пояса в админке — показываем локальное время
  }
}

/** Подпись пояса под часами: «Moscow · GMT+3». Неверное имя пояса — берём пояс самого устройства. */
export function zoneLabel(timeZone: string) {
  const build = (tz?: string) => {
    const zone = tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
    const offset =
      new Intl.DateTimeFormat("en-GB", { timeZone: tz, timeZoneName: "shortOffset" })
        .formatToParts(new Date())
        .find((p) => p.type === "timeZoneName")?.value ?? "";
    const city = zone.split("/").pop()?.replace(/_/g, " ") ?? zone;
    return offset ? `${city} · ${offset}` : city;
  };
  try {
    return build(timeZone);
  } catch {
    return build();
  }
}

export function useClock(timeZone: string) {
  const [time, setTime] = useState(() => format(timeZone));

  useEffect(() => {
    setTime(format(timeZone));
    const id = window.setInterval(() => setTime(format(timeZone)), 1000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return time;
}
