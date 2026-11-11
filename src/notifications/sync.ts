import * as Notifications from "expo-notifications";
import type { Plan } from "@/lib/types";
import { planDoseTriggers } from "./schedule";

export const DOSE_CATEGORY = "dose";
export const DOSE_CHANNEL = "doses";
export const ACTION_TAKEN = "taken";
export const ACTION_SNOOZE = "snooze";

/** Cuántos días hacia adelante se programan las alarmas locales (se re-sincronizan al abrir la app y con `plan_sync`). */
export const HORIZON_DAYS = 7;

/** Reemplaza todas las alarmas locales por las tomas de los próximos días. Devuelve cuántas programó. */
export async function syncDoseAlarms(plans: Plan[], tz: string, now = new Date(), offsets: Record<string, number> = {}): Promise<number> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const triggers = planDoseTriggers(plans, tz, now, HORIZON_DAYS, offsets);
  for (const t of triggers) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.title,
        body: t.body,
        categoryIdentifier: DOSE_CATEGORY,
        data: { planId: t.planId, medicationId: t.medicationId, scheduledAt: t.scheduledAt.toISOString() },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: t.at, channelId: DOSE_CHANNEL },
    });
  }
  return triggers.length;
}
