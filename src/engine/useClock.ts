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

export function useClock(timeZone: string) {
  const [time, setTime] = useState(() => format(timeZone));

  useEffect(() => {
    setTime(format(timeZone));
    const id = window.setInterval(() => setTime(format(timeZone)), 1000);
    return () => window.clearInterval(id);
  }, [timeZone]);

  return time;
}
