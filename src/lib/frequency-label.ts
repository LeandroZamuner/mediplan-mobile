import { summarizeSchedules } from "./dates";
import type { Schedule } from "./types";

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

/** "Cada 8 horas, todos los días" cuando las tomas están igualmente espaciadas; si no, el detalle de días y horas. */
export function frequencyLabel(schedules: Schedule[]): string {
  if (schedules.length === 0) return "Sin horarios";
  const days = new Set(schedules.map((s) => s.dayOfWeek));
  const times = [...new Set(schedules.map((s) => s.timeOfDay))].sort();
  const daily = days.size === 7 && schedules.length === 7 * times.length;
  if (daily) {
    if (times.length === 1) return `Una vez al día, a las ${times[0]}`;
    const mins = times.map(toMin);
    const gaps = mins.map((m, i) => (mins[(i + 1) % mins.length] - m + 1440) % 1440);
    if (gaps.every((g) => g === gaps[0]) && gaps[0] % 60 === 0) return `Cada ${gaps[0] / 60} horas, todos los días`;
  }
  return summarizeSchedules(schedules);
}
