import { formatTime } from "./dates";
import { dtf } from "./intl";

const dayKey = (d: Date, tz: string) => dtf("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** "Hoy a las 16:00" · "Mañana a las 08:00" · "El 22/10 a las 00:00", según la hora local de `tz`. */
export function whenLabel(iso: string, tz: string, now: Date): string {
  const at = new Date(iso);
  const time = formatTime(iso, tz);
  const day = dayKey(at, tz);
  if (day === dayKey(now, tz)) return `Hoy a las ${time}`;
  if (day === dayKey(new Date(now.getTime() + 24 * 3600 * 1000), tz)) return `Mañana a las ${time}`;
  const [, m, d] = day.split("-");
  return `El ${d}/${m} a las ${time}`;
}
