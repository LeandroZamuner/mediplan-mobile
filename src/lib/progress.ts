import { dtf } from "./intl";

const dayKey = (d: Date, tz: string) => dtf("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

/** Cuántas de las tomas de HOY (hora local) ya se tomaron. */
export function todayProgress(doses: { scheduledAt: string; status: string }[], tz: string, now: Date): { taken: number; total: number } {
  const today = dayKey(now, tz);
  const mine = doses.filter((d) => dayKey(new Date(d.scheduledAt), tz) === today);
  return { taken: mine.filter((d) => d.status === "taken").length, total: mine.length };
}
