import * as Notifications from "expo-notifications";
import { AndroidAudioContentType, AndroidAudioUsage, AndroidImportance, AndroidNotificationVisibility } from "expo-notifications";
import { Platform } from "react-native";
import { CHANNEL_NORMAL, CHANNEL_STRONG, LEGACY_CHANNELS, SOUND_NORMAL, SOUND_STRONG } from "./channels";
import { ACTION_TAKEN, DOSE_CATEGORY } from "./sync";

/** Cómo se muestran las notificaciones con la app abierta + canales Android (Normal y Fuerte) + botón "Tomé". */
export async function setupNotifications(): Promise<void> {
  try {
    await configure();
  } catch (e) {
    // Sin canal/categorías las alarmas igual suenan con la configuración por defecto: no frenamos la app.
    console.warn("[mediplan] no se pudo configurar las notificaciones:", e);
  }
}

async function configure(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  if (Platform.OS === "android") {
    // Los canales viejos no se pueden cambiar (ni el sonido ni la importancia): se borran y se usan los nuevos.
    await Promise.all(LEGACY_CHANNELS.map((id) => Notifications.deleteNotificationChannelAsync(id)));
    // Normal: campanita de ~8 s con el volumen de notificaciones y vibración.
    await Notifications.setNotificationChannelAsync(CHANNEL_NORMAL, {
      name: "Recordatorios de tomas (Normal)",
      importance: AndroidImportance.HIGH,
      sound: SOUND_NORMAL,
      audioAttributes: { usage: AndroidAudioUsage.NOTIFICATION, contentType: AndroidAudioContentType.SONIFICATION },
      vibrationPattern: [0, 400, 250, 400, 250, 400],
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    });
    // Fuerte: pitidos de ~28 s por el volumen de ALARMA (suena aunque el celular esté en vibrar o con No molestar), vibra fuerte
    // y se ve en la pantalla bloqueada.
    await Notifications.setNotificationChannelAsync(CHANNEL_STRONG, {
      name: "Recordatorios de tomas (Fuerte)",
      importance: AndroidImportance.MAX,
      sound: SOUND_STRONG,
      audioAttributes: { usage: AndroidAudioUsage.ALARM, contentType: AndroidAudioContentType.SONIFICATION },
      bypassDnd: true,
      vibrationPattern: [0, 800, 300, 800, 300, 1200],
      lockscreenVisibility: AndroidNotificationVisibility.PUBLIC,
    });
  }
  await Notifications.setNotificationCategoryAsync(DOSE_CATEGORY, [
    { identifier: ACTION_TAKEN, buttonTitle: "Tomé", options: { opensAppToForeground: false } },
  ]);
}

/** Pide permiso para notificar (Android 13+). Devuelve si quedó concedido. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  return (await Notifications.requestPermissionsAsync()).granted;
}
