import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { alarmProfile, type AlarmLevel } from "./repeats";

export type AlarmStatus = { notifications: boolean; exactAlarms: boolean | null };

/** Mensaje para mostrar si los recordatorios pueden fallar; null si está todo bien. */
export function alarmWarning(s: AlarmStatus): string | null {
  if (!s.notifications) return "Las notificaciones están apagadas: no vas a recibir los recordatorios de tus tomas.";
  if (s.exactAlarms === false) return "Falta el permiso de alarmas exactas: los recordatorios pueden demorarse varios minutos.";
  return null;
}

/** Estado real de los permisos. `exactAlarms` es null donde no aplica (iOS y Android viejo). */
export async function readAlarmStatus(): Promise<AlarmStatus> {
  const n = await Notifications.getPermissionsAsync().catch(() => null);
  let exact: boolean | null = null;
  if (Platform.OS === "android") exact = await Notifications.getExactAlarmPermissionsAsync().then((p) => p.granted, () => null);
  return { notifications: !!n?.granted, exactAlarms: exact };
}

export async function requestExactAlarms(): Promise<void> {
  await Notifications.requestExactAlarmPermissionsAsync().catch(() => undefined);
}

/** Notificación de prueba a los 5 segundos, con el sonido del nivel elegido, para comprobar que suena. */
export async function scheduleTestNotification(level: AlarmLevel): Promise<void> {
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
