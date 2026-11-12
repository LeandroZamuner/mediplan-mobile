import { dtf } from "@/lib/intl";

const dayKey = (d: Date, tz: string) => dtf("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** "Hoy" · "Ayer" · "5/11", según el día local de la persona. */
export function dayLabel(iso: string, tz: string, now: Date): string {
  const day = dayKey(new Date(iso), tz);
  if (day === dayKey(now, tz)) return "Hoy";
  if (day === dayKey(new Date(now.getTime() - 24 * 3600 * 1000), tz)) return "Ayer";
  const [, m, d] = day.split("-");
  return `${Number(d)}/${Number(m)}`;
}
