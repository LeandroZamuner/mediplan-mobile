import AsyncStorage from "@react-native-async-storage/async-storage";
import { ApiError, api } from "./api";
import { createPendingTakes, isNetworkError } from "./pending-takes";

const KEY = "mediplan.pending-takes";
export const takesQueue = createPendingTakes({
  get: () => AsyncStorage.getItem(KEY).catch(() => null),
  set: (v) => AsyncStorage.setItem(KEY, v).catch(() => undefined),
});

const postTake = (planId: string, medicationId: string, scheduledAt: string) =>
  api(`/plans/${planId}/medications/${medicationId}/doses`, { method: "POST", json: { scheduledAt } });

/** Envía las tomas guardadas sin internet. Devuelve cuántas se enviaron. */
export async function flushPendingTakes(): Promise<number> {
  const { sent } = await takesQueue.flush((t) => postTake(t.planId, t.medicationId, t.scheduledAt), (e) => isNetworkError(e, ApiError));
  return sent;
}

/** Registra una toma; si no hay internet, la guarda para enviarla después. */
export async function recordTakenOrQueue(planId: string, medicationId: string, scheduledAt: string): Promise<"sent" | "queued"> {
  try {
    await postTake(planId, medicationId, scheduledAt);
    return "sent";
  } catch (e) {
    if (!isNetworkError(e, ApiError)) throw e;
    await takesQueue.enqueue({ planId, medicationId, scheduledAt });
    return "queued";
  }
}
