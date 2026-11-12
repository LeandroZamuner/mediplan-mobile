import type { Plan } from "@/lib/types";
import { dtf } from "@/lib/intl";

export type DoseTrigger = {
  key: string;
  planId: string;
  medicationId: string;
  title: string;
  body: string;
  /** Cuándo suena la alarma (la toma menos la anticipación del recordatorio). */
  at: Date;
  /** Hora real de la toma. */
  scheduledAt: Date;
  /** 0 = alarma original; 1, 2, … = repeticiones mientras no se registre la toma. */
  repeat: number;
};

function parts(date: Date, tz: string) {
  const p = Object.fromEntries(
    dtf("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(date)
      .map((x) => [x.type, x.value]),
  );
  return { y: +p.year, m: +p.month, d: +p.day };
}

function tzOffsetMs(date: Date, tz: string): number {
  const p = Object.fromEntries(
    dtf("en-US", {
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
      .map((x) => [x.type, x.value]),
  );
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - date.getTime();
}

/** Instante UTC de "AAAA-MM-DD HH:MM" hora local de `tz`. */
function zonedInstant(y: number, m: number, d: number, hh: number, mm: number, tz: string): Date {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const first = guess - tzOffsetMs(new Date(guess), tz);
  return new Date(guess - tzOffsetMs(new Date(first), tz));
}

const iso = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

/**
 * Disparos de alarma de los planes activos para los próximos `days` días (incluido hoy),
 * en la zona horaria del usuario. Solo futuros, ordenados por fecha.
 */
export function planDoseTriggers(
  plans: Plan[],
  tz: string,
  now: Date,
  days: number,
  /** Minutos de anticipación del recordatorio por medicamento (id → minutos). */
  offsets: Record<string, number> = {},
): DoseTrigger[] {
  const today = parts(now, tz);
  const out: DoseTrigger[] = [];
  for (let i = 0; i < days; i++) {
    const base = new Date(Date.UTC(today.y, today.m - 1, today.d + i));
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth() + 1;
    const d = base.getUTCDate();
    const dow = base.getUTCDay();
    const date = iso(y, m, d);
    for (const plan of plans) {
      if (plan.status !== "active") continue;
      for (const med of plan.medications) {
        if (date < med.startDate || (med.endDate && date > med.endDate)) continue;
        for (const s of med.schedules) {
          if (s.dayOfWeek !== dow) continue;
          const [hh, mm] = s.timeOfDay.split(":").map(Number);
          const scheduledAt = zonedInstant(y, m, d, hh, mm, tz);
          const at = new Date(scheduledAt.getTime() - (offsets[med.id] ?? 0) * 60_000);
          if (at.getTime() <= now.getTime()) continue;
          out.push({
            key: `${plan.id}|${med.id}|${scheduledAt.toISOString()}`,
            planId: plan.id,
            medicationId: med.id,
            title: med.name,
            body: med.dose,
            at,
            scheduledAt,
            repeat: 0,
          });
        }
      }
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}
