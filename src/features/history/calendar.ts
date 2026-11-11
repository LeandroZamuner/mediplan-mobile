export const MONTHS_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"] as const;
export const MONTHS_LONG = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"] as const;
export const WEEK_HEADER = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"] as const;

export type Cell = { iso: string; day: number; inMonth: boolean };

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Semanas (lunes a domingo) que cubren el mes `month` (1-12). */
export function monthGrid(year: number, month: number): Cell[][] {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const weeks = Math.ceil((offset + daysInMonth) / 7);
  return Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, i) => {
      const d = new Date(Date.UTC(year, month - 1, 1 - offset + w * 7 + i));
      return { iso: iso(d), day: d.getUTCDate(), inMonth: d.getUTCMonth() === month - 1 };
    }),
  );
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** "2024-10-20" → "20 de Octubre (2024)" */
export function formatLongDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return `${d} de ${MONTHS_LONG[m - 1]} (${y})`;
}
