import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { ACTION_SNOOZE, ACTION_TAKEN, DOSE_CATEGORY, DOSE_CHANNEL } from "./sync";

/** Cómo se muestran las notificaciones con la app abierta + canal Android + botones "Tomé" / "Posponer". */
export async function setupNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(DOSE_CHANNEL, { name: "Recordatorios de tomas", importance: AndroidImportance.HIGH });
  }
  await Notifications.setNotificationCategoryAsync(DOSE_CATEGORY, [
    { identifier: ACTION_TAKEN, buttonTitle: "Tomé", options: { opensAppToForeground: false } },
    { identifier: ACTION_SNOOZE, buttonTitle: "Posponer", options: { opensAppToForeground: false } },
  ]);
}

/** Pide permiso para notificar (Android 13+). Devuelve si quedó concedido. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}
