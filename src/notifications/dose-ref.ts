export type DoseRef = { planId: string; medicationId: string; scheduledAt: string };

/** ¿Esta notificación es de esa toma? Compara por instante (la hora puede venir con otro formato). */
export function doseMatches(data: Record<string, unknown> | undefined, dose: DoseRef): boolean {
  if (!data || typeof data.scheduledAt !== "string") return false;
  return data.planId === dose.planId && data.medicationId === dose.medicationId && new Date(data.scheduledAt).getTime() === new Date(dose.scheduledAt).getTime();
}
