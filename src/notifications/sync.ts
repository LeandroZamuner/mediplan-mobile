import * as Notifications from "expo-notifications";
import type { Plan } from "@/lib/types";
import { planDoseTriggers, type DoseTrigger } from "./schedule";

export const DOSE_CATEGORY = "dose";
export const DOSE_CHANNEL = "doses";
export const ACTION_TAKEN = "taken";
export const ACTION_SNOOZE = "snooze";

/** Cuántos días hacia adelante se programan las alarmas locales (se re-sincronizan al abrir la app y con `plan_sync`). */
export const HORIZON_DAYS = 7;

/** Reemplaza todas las alarmas locales por las tomas de los próximos días. Devuelve cuántas programó. */
export async function syncDoseAlarms(plans: Plan[], tz: string, now = new Date(), offsets: Record<string, number> = {}): Promise<number> {
  return replaceAlarms(planDoseTriggers(plans, tz, now, HORIZON_DAYS, offsets));
}

/** Firma de un conjunto de alarmas: si no cambió, no hace falta reprogramar. */
export const alarmSignature = (triggers: DoseTrigger[]): string => triggers.map((t) => `${t.key}@${t.at.getTime()}`).join(",");

/** Como `syncDoseAlarms`, pero no toca nada si las alarmas que corresponden son las mismas que la vez anterior. */
export async function syncDoseAlarmsIfChanged(
  plans: Plan[],
  tz: string,
  now: Date,
  offsets: Record<string, number>,
  previousSignature: string | null,
): Promise<{ changed: boolean; signature: string }> {
  const triggers = planDoseTriggers(plans, tz, now, HORIZON_DAYS, offsets);
  const signature = alarmSignature(triggers);
  if (previousSignature !== null && signature === previousSignature) return { changed: false, signature };
  await replaceAlarms(triggers);
  return { changed: true, signature };
}

async function replaceAlarms(triggers: DoseTrigger[]): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  // En tandas de 10 en paralelo: programarlas una por una tarda varios segundos con muchos medicamentos.
  for (let i = 0; i < triggers.length; i += 10) {
    await Promise.all(triggers.slice(i, i + 10).map((t) => schedule(t)));
  }
  return triggers.length;
}

async function schedule(t: DoseTrigger): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: t.title,
      body: t.body,
      categoryIdentifier: DOSE_CATEGORY,
      data: { planId: t.planId, medicationId: t.medicationId, scheduledAt: t.scheduledAt.toISOString() },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: DOSE_CHANNEL, delivery: "alarmClock" },
  });
}
