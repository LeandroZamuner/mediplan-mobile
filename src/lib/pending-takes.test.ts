import { createPendingTakes, isNetworkError, type PendingTake } from "./pending-takes";

class ApiErr extends Error {
  constructor(public status: number, m: string) {
    super(m);
  }
}
const take = (n: number): PendingTake => ({ planId: "p1", medicationId: "m1", scheduledAt: `2026-11-11T0${n}:00:00Z` });

function memoryStorage() {
  let v: string | null = null;
  return { get: async () => v, set: async (s: string) => void (v = s) };
}

describe("isNetworkError", () => {
  it("un fallo de red (TypeError de fetch) sí", () => expect(isNetworkError(new TypeError("Network request failed"))).toBe(true));
  it("un error de la API (400, 403…) no: llegó al servidor", () => expect(isNetworkError(new ApiErr(403, "x"), ApiErr)).toBe(false));
});

describe("cola de tomas pendientes", () => {
  it("dado que se guardan 2 tomas, cuando se pide la lista, entonces están en orden", async () => {
    const q = createPendingTakes(memoryStorage());
    await q.enqueue(take(1));
    await q.enqueue(take(2));
    expect((await q.list()).map((t) => t.scheduledAt)).toEqual([take(1).scheduledAt, take(2).scheduledAt]);
  });
  it("dado que se guarda dos veces la misma toma, entonces queda una sola", async () => {
    const q = createPendingTakes(memoryStorage());
    await q.enqueue(take(1));
    await q.enqueue(take(1));
    expect(await q.list()).toHaveLength(1);
  });
  it("dado que hay internet, cuando se envía la cola, entonces se manda todo y queda vacía", async () => {
    const q = createPendingTakes(memoryStorage());
    await q.enqueue(take(1));
    await q.enqueue(take(2));
    const send = jest.fn().mockResolvedValue(undefined);
    const r = await q.flush(send, () => false);
    expect(send).toHaveBeenCalledTimes(2);
    expect(r).toEqual({ sent: 2, remaining: 0 });
    expect(await q.list()).toEqual([]);
  });
  it("dado que se cae la red a la mitad, entonces se conserva lo que no se pudo enviar", async () => {
    const q = createPendingTakes(memoryStorage());
    await q.enqueue(take(1));
    await q.enqueue(take(2));
    const send = jest.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new TypeError("Network request failed"));
    const r = await q.flush(send, (e) => e instanceof TypeError);
    expect(r).toEqual({ sent: 1, remaining: 1 });
    expect((await q.list())[0].scheduledAt).toBe(take(2).scheduledAt);
  });
  it("dado que el servidor rechaza una toma (error que no es de red), entonces se descarta y sigue con las demás", async () => {
    const q = createPendingTakes(memoryStorage());
    await q.enqueue(take(1));
    await q.enqueue(take(2));
    const send = jest.fn().mockRejectedValueOnce(new ApiErr(400, "toma inválida")).mockResolvedValueOnce(undefined);
    const r = await q.flush(send, (e) => e instanceof TypeError);
    expect(r).toEqual({ sent: 1, remaining: 0 });
  });
  it("tolera un almacenamiento con basura", async () => {
    const q = createPendingTakes({ get: async () => "{roto", set: async () => undefined });
    expect(await q.list()).toEqual([]);
  });
});
