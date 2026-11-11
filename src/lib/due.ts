/** Toma que hay que mostrar como "Tomar ahora": pendiente y a menos de 1 h (o ya atrasada). */
export function dueDose<T extends { scheduledAt: string; status: string }>(doses: T[], now: Date, windowMs = 60 * 60 * 1000): T | undefined {
  return doses
    .filter((d) => d.status === "pending" && new Date(d.scheduledAt).getTime() <= now.getTime() + windowMs)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];
}
