/** Fechas y horas en la zona horaria del usuario (los horarios de los planes son hora local). */

export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;
export const WEEKDAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

function tzOffsetMs(date: Date, tz: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - date.getTime();
}

/** Desde las 00:00 hasta las 24:00 locales del día de `now` en `tz`, como instantes UTC (ISO). */
export function localDayRange(tz: string, now = new Date()): { from: string; to: string } {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now)
      .map((x) => [x.type, x.value]),
  );
  const midnight = (dayOffset: number) => {
    const guess = Date.UTC(+p.year, +p.month - 1, +p.day + dayOffset);
    return new Date(guess - tzOffsetMs(new Date(guess), tz));
  };
  return { from: midnight(0).toISOString(), to: midnight(1).toISOString() };
}

export function formatTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(iso));
}

export function formatDateTime(iso: string, tz: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: tz,
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(iso));
}

export function formatDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** "Lun, Jue · 08:00, 20:30" a partir de los horarios de un medicamento. */
export function summarizeSchedules(schedules: { dayOfWeek: number; timeOfDay: string }[]): string {
  if (schedules.length === 0) return "Sin horarios";
  const days = [...new Set(schedules.map((s) => s.dayOfWeek))].sort((a, b) => a - b);
  const times = [...new Set(schedules.map((s) => s.timeOfDay))].sort();
  const dayText = days.length === 7 ? "Todos los días" : days.map((d) => WEEKDAYS_SHORT[d]).join(", ");
  return `${dayText} · ${times.join(", ")}`;
}
