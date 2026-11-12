export type PendingTake = { planId: string; medicationId: string; scheduledAt: string };

type Storage = { get: () => Promise<string | null>; set: (value: string) => Promise<void> };

const keyOf = (t: PendingTake) => `${t.planId}|${t.medicationId}|${t.scheduledAt}`;

/** Un fallo de red de `fetch` (no llegó al servidor). Un error de la API (4xx/5xx) sí llegó. */
export function isNetworkError(e: unknown, apiErrorClass?: new (...args: never[]) => Error): boolean {
  if (apiErrorClass && e instanceof apiErrorClass) return false;
  return e instanceof TypeError;
}

/** Cola de tomas marcadas sin internet: se guardan en el celular y se envían cuando vuelve la conexión. */
export function createPendingTakes(storage: Storage) {
  async function list(): Promise<PendingTake[]> {
    try {
      const v = JSON.parse((await storage.get()) ?? "[]");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  async function save(items: PendingTake[]) {
    await storage.set(JSON.stringify(items));
  }
  return {
    list,
    async enqueue(t: PendingTake) {
      const items = await list();
      if (!items.some((x) => keyOf(x) === keyOf(t))) await save([...items, t]);
    },
    /** Envía en orden. Si falla la red, se frena y conserva el resto; si el servidor rechaza una toma, se descarta. */
    async flush(send: (t: PendingTake) => Promise<unknown>, networkError: (e: unknown) => boolean): Promise<{ sent: number; remaining: number }> {
      const items = await list();
      let sent = 0;
      let i = 0;
      for (; i < items.length; i++) {
        try {
          await send(items[i]);
          sent++;
        } catch (e) {
          if (networkError(e)) break;
          // rechazada por el servidor: no tiene sentido reintentarla
        }
      }
      const rest = items.slice(i);
      await save(rest);
      return { sent, remaining: rest.length };
    },
  };
}
