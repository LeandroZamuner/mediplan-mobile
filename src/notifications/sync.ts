import * as Notifications from "expo-notifications";
import type { Plan } from "@/lib/types";
import { alarmProfile, capTriggers, DEFAULT_LEVEL, excludeTaken, expandRepeats, MAX_SCHEDULED, type AlarmLevel } from "./repeats";
import { planDoseTriggers, type DoseTrigger } from "./schedule";

export const DOSE_CATEGORY = "dose";
export const ACTION_TAKEN = "taken";

/** Cuántos días hacia adelante se programan las alarmas locales (se re-sincronizan al abrir la app y con `plan_sync`). */
export const HORIZON_DAYS = 7;

/** Todo lo que suena: alarma original + repeticiones, sin las tomas ya registradas y con tope de cantidad. */
function buildTriggers(plans: Plan[], tz: string, now: Date, offsets: Record<string, number>, level: AlarmLevel, taken: Set<string>): DoseTrigger[] {
  const base = excludeTaken(planDoseTriggers(plans, tz, now, HORIZON_DAYS, offsets), taken);
  return capTriggers(expandRepeats(base, now, { enabled: alarmProfile(level).repeats }), MAX_SCHEDULED);
}

/** Reemplaza todas las alarmas locales. Devuelve cuántas programó (alarmas + repeticiones). */
export async function syncDoseAlarms(
  plans: Plan[],
  tz: string,
  now = new Date(),
  offsets: Record<string, number> = {},
  level: AlarmLevel = DEFAULT_LEVEL,
  taken: Set<string> = new Set(),
): Promise<number> {
  return replaceAlarms(buildTriggers(plans, tz, now, offsets, level, taken), level);
}

/** Firma de un conjunto de alarmas: si no cambió, no hace falta reprogramar. */
export const alarmSignature = (triggers: DoseTrigger[], level: AlarmLevel): string => `${level}|${triggers.map((t) => `${t.key}@${t.at.getTime()}`).join(",")}`;

export type SyncOptions = { offsets?: Record<string, number>; level?: AlarmLevel; taken?: Set<string>; previousSignature: string | null };

/** Como `syncDoseAlarms`, pero no toca nada si las alarmas que corresponden son las mismas que la vez anterior. */
export async function syncDoseAlarmsIfChanged(plans: Plan[], tz: string, now: Date, opts: SyncOptions): Promise<{ changed: boolean; signature: string }> {
  const level = opts.level ?? DEFAULT_LEVEL;
  const triggers = buildTriggers(plans, tz, now, opts.offsets ?? {}, level, opts.taken ?? new Set());
  const signature = alarmSignature(triggers, level);
  if (opts.previousSignature !== null && signature === opts.previousSignature) return { changed: false, signature };
  await replaceAlarms(triggers, level);
  return { changed: true, signature };
}

async function replaceAlarms(triggers: DoseTrigger[], level: AlarmLevel): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // En tandas de 10 en paralelo: programarlas una por una tarda varios segundos.
  for (let i = 0; i < triggers.length; i += 10) {
    await Promise.all(triggers.slice(i, i + 10).map((t) => schedule(t, level)));
  }
  return triggers.length;
}

async function schedule(t: DoseTrigger, level: AlarmLevel): Promise<void> {
  const p = alarmProfile(level);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.title,
      body: t.body,
      categoryIdentifier: DOSE_CATEGORY,
      sticky: p.sticky,
      autoDismiss: p.autoDismiss,
      data: { planId: t.planId, medicationId: t.medicationId, scheduledAt: t.scheduledAt.toISOString() },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: p.channelId, delivery: "alarmClock" },
  });
}
