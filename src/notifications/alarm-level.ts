import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_LEVEL, type AlarmLevel } from "./repeats";

const KEY = "mediplan.alarm-level";

export const parseLevel = (v: string | null): AlarmLevel => (v === "normal" || v === "fuerte" ? v : DEFAULT_LEVEL);

/** Nivel de las alarmas elegido en Configurar notificaciones (preferencia del celular). */
export async function loadAlarmLevel(): Promise<AlarmLevel> {
  return parseLevel(await AsyncStorage.getItem(KEY).catch(() => null));
}

export async function saveAlarmLevel(level: AlarmLevel): Promise<void> {
  await AsyncStorage.setItem(KEY, level).catch(() => {});
}
