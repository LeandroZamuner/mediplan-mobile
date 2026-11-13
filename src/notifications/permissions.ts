import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking, Platform } from "react-native";
import notifee, { AndroidNotificationSetting } from "react-native-notify-kit";
import { scheduleNativeAlarms, TEST_PLAN_ID } from "./native-alarm";
import { alarmProfile, type AlarmLevel } from "./repeats";

export type AlarmStatus = { notifications: boolean; exactAlarms: boolean | null; /** Abrir la alarma Fuerte sobre el bloqueo (Android 14+); null donde no aplica. */ fullScreen?: boolean | null };

/** Mensaje para mostrar si los recordatorios pueden fallar; null si está todo bien. */
export function alarmWarning(s: AlarmStatus, level: AlarmLevel = "normal"): string | null {
  if (!s.notifications) return "Las notificaciones están apagadas: no vas a recibir los recordatorios de tus tomas.";
  if (s.exactAlarms === false) return "Falta el permiso de alarmas exactas: los recordatorios pueden demorarse varios minutos.";
  if (level === "fuerte" && s.fullScreen === false) return "Para que la alarma Fuerte se abra sobre la pantalla bloqueada, activá “Notificaciones en pantalla completa” para MediPlan.";
  return null;
}

/** Traduce el ajuste de Android de pantalla completa: permitido, apagado, o null si no aplica (Android anterior al 14). */
export function fullScreenFrom(setting: AndroidNotificationSetting | undefined): boolean | null {
  if (setting === AndroidNotificationSetting.ENABLED) return true;
  if (setting === AndroidNotificationSetting.DISABLED) return false;
  return null;
}

/** Estado real de los permisos. `exactAlarms` es null donde no aplica (iOS y Android viejo). */
export async function readAlarmStatus(): Promise<AlarmStatus> {
  const n = await Notifications.getPermissionsAsync().catch(() => null);
  let exact: boolean | null = null;
  if (Platform.OS === "android") exact = await Notifications.getExactAlarmPermissionsAsync().then((p) => p.granted, () => null);
  let fullScreen: boolean | null = null;
  if (Platform.OS === "android") fullScreen = await notifee.getNotificationSettings().then((x) => fullScreenFrom(x.android?.fullScreenIntent), () => null);
  return { notifications: !!n?.granted, exactAlarms: exact, fullScreen };
}

/** Abre el ajuste del sistema para permitir la pantalla completa (si no, la pantalla de notificaciones de la app). */
export async function openFullScreenSettings(): Promise<void> {
  try {
    await Linking.sendIntent("android.settings.MANAGE_APP_USE_FULL_SCREEN_INTENT");
  } catch {
    await notifee.openNotificationSettings().catch(() => undefined);
  }
}

export async function requestExactAlarms(): Promise<void> {
  await Notifications.requestExactAlarmPermissionsAsync().catch(() => undefined);
}

/** Notificación de prueba a los 5 segundos, con el sonido del nivel elegido, para comprobar que suena. */
export async function scheduleTestNotification(level: AlarmLevel): Promise<void> {
  if (level === "fuerte" && Platform.OS === "android") {
    try {
      const at = new Date(Date.now() + 5000);
      await scheduleNativeAlarms([{ key: `prueba|${at.getTime()}`, planId: TEST_PLAN_ID, medicationId: TEST_PLAN_ID, title: "Prueba de MediPlan", body: "Así suena una alarma Fuerte.", at, scheduledAt: at, repeat: 0 }]);
      return;
    } catch {
      // sin la librería nativa (Expo Go): se usa la notificación común de abajo
    }
  }
  const p = alarmProfile(level);
  await Notifications.scheduleNotificationAsync({
    content: { title: "Prueba de MediPlan", body: level === "fuerte" ? "Así suena una alarma Fuerte." : "Así suena un recordatorio Normal.", sticky: p.sticky, autoDismiss: p.autoDismiss },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: p.channelId },
  });
}

const ASKED_KEY = "mediplan.exact-alarms-asked";

/** Una sola vez (al guardar el primer plan): pide el permiso de alarmas exactas si falta, en vez de dejarlo solo como cartel. */
export async function askExactAlarmsOnce(): Promise<void> {
  if (Platform.OS !== "android") return;
  if ((await AsyncStorage.getItem(ASKED_KEY).catch(() => null)) === "1") return;
  const status = await readAlarmStatus();
  if (status.exactAlarms === false) {
    await AsyncStorage.setItem(ASKED_KEY, "1").catch(() => {});
    await requestExactAlarms();
  }
}
