import type { Schedule } from "@/lib/types";

/** Intervalos ofrecidos en el asistente. Solo los que dividen 24 h: así las tomas son las mismas todos los días. */
export const FREQUENCY_OPTIONS = [4, 6, 8, 12, 24] as const;

const pad = (n: number) => String(n).padStart(2, "0");

/** "Cada N horas" desde `firstTime` (HH:MM) → horarios de la API para los 7 días de la semana. */
export function everyHoursToSchedules(hours: number, firstTime: string): Schedule[] {
  if (!Number.isInteger(hours) || hours < 1 || hours > 24 || 24 % hours !== 0) {
    throw new Error(`Frecuencia no soportada: cada ${hours} horas`);
  }
  const [h0, m0] = firstTime.split(":").map(Number);
  const times = Array.from({ length: 24 / hours }, (_, i) => `${pad((h0 + i * hours) % 24)}:${pad(m0)}`);
  return Array.from({ length: 7 }, (_, day) => times.map((timeOfDay) => ({ dayOfWeek: day, timeOfDay }))).flat();
}
