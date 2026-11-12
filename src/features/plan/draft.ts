import { everyHoursToSchedules, type FREQUENCY_OPTIONS } from "@/lib/frequency";

export type Frequency = (typeof FREQUENCY_OPTIONS)[number];

/** Medicamento en el asistente de 3 pasos. Las fechas se escriben como DD/MM/AAAA. */
export type MedicationDraft = {
  name: string;
  dose: string;
  stockUnits: string;
  everyHours: Frequency | null;
  firstTime: string; // HH:MM de la primera toma del día
  startDate: string; // AAAA-MM-DD
  endDate: string; // DD/MM/AAAA o vacío
  reminderMin: number | null; // minutos de anticipación; null = sin recordatorio previo
};

export const emptyDraft = (today: string): MedicationDraft => ({
  name: "",
  dose: "",
  stockUnits: "",
  everyHours: null,
  firstTime: "08:00",
  startDate: today,
  endDate: "",
  reminderMin: null,
});

export function parseDateInput(text: string): string | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text.trim());
  if (!m) return null;
  const [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function formatDateInput(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function step1Error(d: MedicationDraft): string | null {
  if (!d.name.trim()) return "Indicá el nombre del medicamento.";
  if (!d.dose.trim()) return "Indicá la dosis (por ejemplo, 500 mg).";
  const n = Number(d.stockUnits);
  if (d.stockUnits.trim() === "" || !Number.isInteger(n) || n < 0) return "Indicá cuántos comprimidos tenés (un número entero).";
  return null;
}

export function step2Error(d: MedicationDraft): string | null {
  if (d.everyHours === null) return "Elegí la frecuencia de toma.";
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.firstTime)) return "La hora de la primera toma debe ser HH:MM.";
  if (d.endDate.trim()) {
    const end = parseDateInput(d.endDate);
    if (!end) return "La fecha de fin no es válida (usá DD/MM/AAAA).";
    if (end < d.startDate) return "La fecha de fin no puede ser anterior al inicio.";
  }
  return null;
}

export function toCreateBody(d: MedicationDraft) {
  const stockUnits = Number(d.stockUnits);
  const end = d.endDate.trim() ? parseDateInput(d.endDate) : null;
  return {
    name: d.name.trim(),
    dose: d.dose.trim(),
    startDate: d.startDate,
    ...(end ? { endDate: end } : {}),
    schedules: everyHoursToSchedules(d.everyHours ?? 24, d.firstTime),
    stockUnits,
    stockAlertAt: Math.max(1, Math.ceil(stockUnits * 0.2)),
  };
}

export function summarize(d: MedicationDraft): string {
  const until = d.endDate.trim() ? ` hasta el ${d.endDate.trim()}` : "";
  return `Tomar cada ${d.everyHours} horas todos los días${until}.`;
}
