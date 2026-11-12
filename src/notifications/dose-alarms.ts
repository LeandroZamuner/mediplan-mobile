import * as Notifications from "expo-notifications";

export type DoseRef = { planId: string; medicationId: string; scheduledAt: string };

/** ¿Esta notificación es de esa toma? Compara por instante (la hora puede venir con otro formato). */
export function doseMatches(data: Record<string, unknown> | undefined, dose: DoseRef): boolean {
  if (!data || typeof data.scheduledAt !== "string") return false;
  return data.planId === dose.planId && data.medicationId === dose.medicationId && new Date(data.scheduledAt).getTime() === new Date(dose.scheduledAt).getTime();
}

/** Al registrar una toma: se cancelan su alarma y sus repeticiones, y se saca de la barra la que esté sonando. */
export async function cancelDoseAlarms(dose: DoseRef): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(scheduled.filter((n) => doseMatches(n.content.data, dose)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
    const shown = await Notifications.getPresentedNotificationsAsync();
    await Promise.all(shown.filter((n) => doseMatches(n.request.content.data, dose)).map((n) => Notifications.dismissNotificationAsync(n.request.identifier)));
  } catch (e) {
    console.warn("[mediplan] no se pudieron cancelar las alarmas de la toma:", e);
  }
}
