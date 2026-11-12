export const SNOOZE_HOURS = 24;

/** `dismissedAt` es el instante (ms) en que se cerró el cartel, guardado como texto. */
export function isSnoozed(dismissedAt: string | null, now: number): boolean {
  const at = Number(dismissedAt);
  return Number.isFinite(at) && at > 0 && now - at < SNOOZE_HOURS * 3600_000;
}
