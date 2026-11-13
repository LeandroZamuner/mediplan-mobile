import { refreshAlarms } from "./reminders";
import { syncDoseAlarmsIfChanged } from "./sync";
import type { Plan } from "@/lib/types";

jest.mock("./sync", () => ({ syncDoseAlarmsIfChanged: jest.fn() }));
jest.mock("./setup", () => ({ ensureNotificationPermission: jest.fn().mockResolvedValue(true) }));
jest.mock("./alarm-level", () => ({ loadAlarmLevel: jest.fn().mockResolvedValue("fuerte") }));

const plan = (id: string) => ({ id }) as unknown as Plan;
const tz = "UTC";

/** Un sync que se completa recién cuando se libera, para simular que programar tarda. */
function slowSync() {
  const releases: (() => void)[] = [];
  let running = 0;
  let maxRunning = 0;
  (syncDoseAlarmsIfChanged as jest.Mock).mockImplementation(async () => {
    running++;
    maxRunning = Math.max(maxRunning, running);
    await new Promise<void>((resolve) => releases.push(resolve));
    running--;
    return { changed: true, signature: "s" };
  });
  return { releases, max: () => maxRunning };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("refreshAlarms", () => {
  beforeEach(() => jest.clearAllMocks());

  it("dados dos pedidos casi juntos, cuando el primero todavía está programando, entonces no se programa en paralelo (si no, las alarmas del primero pisan las del segundo)", async () => {
    const s = slowSync();
    const a = refreshAlarms([plan("A")], tz, []);
    await tick();
    const b = refreshAlarms([plan("B")], tz, []);
    await tick();
    while (s.releases.length) s.releases.shift()!();
    await tick();
    while (s.releases.length) s.releases.shift()!();
    await Promise.all([a, b]);
    expect(s.max()).toBe(1);
    expect(syncDoseAlarmsIfChanged).toHaveBeenCalledTimes(2);
  });

  it("dados varios pedidos mientras uno programa, cuando termina, entonces solo se hace el último con los datos más nuevos", async () => {
    const s = slowSync();
    const first = refreshAlarms([plan("A")], tz, []);
    await tick();
    const second = refreshAlarms([plan("B")], tz, []);
    const third = refreshAlarms([plan("C")], tz, []);
    await tick();
    while (s.releases.length) s.releases.shift()!();
    await tick();
    while (s.releases.length) s.releases.shift()!();
    await Promise.all([first, second, third]);
    const planesProgramados = (syncDoseAlarmsIfChanged as jest.Mock).mock.calls.map((c) => c[0][0].id);
    expect(planesProgramados).toEqual(["A", "C"]);
  });

  it("dada una falla en un pedido, cuando llega otro, entonces el siguiente igual se hace", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    (syncDoseAlarmsIfChanged as jest.Mock).mockRejectedValueOnce(new Error("boom")).mockResolvedValue({ changed: true, signature: "s" });
    await refreshAlarms([plan("A")], tz, []);
    await refreshAlarms([plan("B")], tz, []);
    expect(syncDoseAlarmsIfChanged).toHaveBeenCalledTimes(2);
  });
});
