import * as Notifications from "expo-notifications";
import { doseMatches, type DoseRef } from "./dose-ref";
import { cancelNativeDoseAlarms } from "./native-alarm";

export { doseMatches, type DoseRef };

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
  // Aparte: si una librería falla, las alarmas de la otra igual se cancelan.
  await cancelNativeDoseAlarms(dose);
}
