import type { Plan } from "@/lib/types";

export const PLAN_STATUS = {
  active: { label: "Activo", tone: "ok" },
  completed: { label: "Finalizado", tone: "neutral" },
  cancelled: { label: "Cancelado", tone: "danger" },
} as const;

/** Fecha de hoy (AAAA-MM-DD) en la zona horaria indicada. */
export function todayIn(tz: string, now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function medicationsLabel(plan: Plan): string {
  const names = plan.medications.map((m) => m.name);
  return names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} y ${names.length - 3} más`;
}
