import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Plan } from "@/lib/types";
import { loadAlarmLevel } from "./alarm-level";
import { takenSetFrom } from "./repeats";
import { ensureNotificationPermission } from "./setup";
import { syncDoseAlarmsIfChanged } from "./sync";

const KEY = "mediplan.reminders";
const SIGNATURE_KEY = "mediplan.alarms.signature";

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

type Args = { plans: Plan[]; tz: string; doses: { medicationId: string; scheduledAt: string; status: string }[] };

async function reprogram({ plans, tz, doses }: Args): Promise<void> {
  if (!(await ensureNotificationPermission())) return;
  const previous = await AsyncStorage.getItem(SIGNATURE_KEY).catch(() => null);
  const { signature } = await syncDoseAlarmsIfChanged(plans, tz, new Date(), {
    offsets: await loadReminderOffsets(),
    level: await loadAlarmLevel(),
    taken: takenSetFrom(doses),
    previousSignature: previous,
  });
  await AsyncStorage.setItem(SIGNATURE_KEY, signature).catch(() => {});
}

let running = false;
let pending: Args | null = null;
let waiters: (() => void)[] = [];

/**
 * Reprograma las alarmas locales con los planes actuales, el nivel elegido (Normal o Fuerte) y las tomas ya registradas
 * (para no insistir con una toma que ya se tomó, aunque se haya marcado en otro dispositivo o en la web).
 * No hace nada si no hay permiso.
 *
 * De a una por vez: programar tarda, y dos reprogramaciones en paralelo hacían que las alarmas de la primera (por ejemplo, de una
 * toma ya registrada) se agregaran después de que la segunda limpiara todo. Si llegan pedidos mientras una corre, se hace solo el
 * último, que tiene los datos más nuevos.
 */
export async function refreshAlarms(plans: Plan[], tz: string, doses: Args["doses"] = []): Promise<void> {
  pending = { plans, tz, doses };
  if (running) return new Promise<void>((resolve) => waiters.push(resolve));
  running = true;
  try {
    while (pending) {
      const args = pending;
      pending = null;
      try {
        await reprogram(args);
      } catch (e) {
        console.warn("[mediplan] no se pudieron reprogramar las alarmas:", e);
      }
    }
  } finally {
    running = false;
    const done = waiters;
    waiters = [];
    done.forEach((resolve) => resolve());
  }
}
