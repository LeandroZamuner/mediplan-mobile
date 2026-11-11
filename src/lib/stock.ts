import type { Medication } from "./types";

/** Tomas por día en promedio (los horarios son por día de la semana). */
export function dosesPerDay(m: Medication): number {
  return m.schedules.length / 7;
}

/** Días que alcanza el stock al ritmo del plan; null si no hay horarios para estimar. */
export function daysOfStockLeft(m: Medication): number | null {
  const perDay = dosesPerDay(m);
  if (perDay === 0) return null;
  return Math.floor(m.stockUnits / perDay);
}

/** Llenado de la barra de stock (0 a 1): llena cuando hay 3 veces el umbral de aviso. */
export function stockRatio(m: Medication): number {
  const full = Math.max(1, m.stockAlertAt) * 3;
  return Math.min(1, Math.max(0, m.stockUnits / full));
}
