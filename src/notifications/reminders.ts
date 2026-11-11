import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Plan } from "@/lib/types";
import { ensureNotificationPermission } from "./setup";
import { syncDoseAlarms } from "./sync";

const KEY = "mediplan.reminders";

/** Anticipación del recordatorio (minutos) por medicamento: es una preferencia del celular, no va a la API. */
export async function loadReminderOffsets(): Promise<Record<string, number>> {
  try {
    return JSON.parse((await AsyncStorage.getItem(KEY)) ?? "{}");
  } catch {
    return {};
  }
}

export async function saveReminderOffsets(patch: Record<string, number>): Promise<void> {
  const all = { ...(await loadReminderOffsets()), ...patch };
  await AsyncStorage.setItem(KEY, JSON.stringify(all)).catch(() => {});
}

/** Reprograma las alarmas locales con los planes actuales. No hace nada si no hay permiso. */
export async function refreshAlarms(plans: Plan[], tz: string): Promise<void> {
  if (!(await ensureNotificationPermission())) return;
  await syncDoseAlarms(plans, tz, new Date(), await loadReminderOffsets());
}
