import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

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

/** Notificación de prueba a los 5 segundos, para comprobar que suena. */
export async function scheduleTestNotification(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: { title: "Prueba de MediPlan", body: "Si ves esto, los recordatorios funcionan." },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: "doses" },
  });
}
