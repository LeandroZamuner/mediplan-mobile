import * as Notifications from "expo-notifications";
import { cancelDoseAlarms, doseMatches } from "./dose-alarms";

jest.mock("expo-notifications", () => ({
  getAllScheduledNotificationsAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn().mockResolvedValue(undefined),
  getPresentedNotificationsAsync: jest.fn(),
  dismissNotificationAsync: jest.fn().mockResolvedValue(undefined),
}));

const dose = { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T08:00:00-03:00" }; // = 11:00Z
const sched = (id: string, data: Record<string, unknown>) => ({ identifier: id, content: { data } });

describe("doseMatches", () => {
  it("coincide aunque la hora venga en otro formato (con offset o en UTC)", () => {
    expect(doseMatches({ planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T11:00:00.000Z" }, dose)).toBe(true);
  });
  it("no coincide si cambia el medicamento o la hora", () => {
    expect(doseMatches({ planId: "p1", medicationId: "m2", scheduledAt: "2026-11-11T11:00:00.000Z" }, dose)).toBe(false);
    expect(doseMatches({ planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T19:00:00.000Z" }, dose)).toBe(false);
  });
  it("tolera datos incompletos", () => expect(doseMatches(undefined, dose)).toBe(false));
});

describe("cancelDoseAlarms", () => {
  beforeEach(() => jest.clearAllMocks());

  it("dada una toma con alarma y 6 repeticiones, cuando se marca 'Tomé', entonces se cancelan todas las de esa toma y solo esas", async () => {
    const mine = Array.from({ length: 7 }, (_, i) => sched(`a${i}`, { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T11:00:00.000Z" }));
    const other = sched("otra", { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T19:00:00.000Z" });
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([...mine, other]);
    (Notifications.getPresentedNotificationsAsync as jest.Mock).mockResolvedValue([]);
    await cancelDoseAlarms(dose);
    expect((Notifications.cancelScheduledNotificationAsync as jest.Mock).mock.calls.map((c) => c[0]).sort()).toEqual(mine.map((m) => m.identifier).sort());
  });

  it("también saca de la barra la notificación que ya está sonando de esa toma", async () => {
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValue([]);
    (Notifications.getPresentedNotificationsAsync as jest.Mock).mockResolvedValue([
      { request: { identifier: "visible", content: { data: { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T11:00:00.000Z" } } } },
      { request: { identifier: "ajena", content: { data: { planId: "p1", medicationId: "m2", scheduledAt: "2026-11-11T11:00:00.000Z" } } } },
    ]);
    await cancelDoseAlarms(dose);
    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.dismissNotificationAsync).toHaveBeenCalledWith("visible");
  });

  it("si la librería falla, no rompe el registro de la toma", async () => {
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockRejectedValue(new Error("boom"));
    await expect(cancelDoseAlarms(dose)).resolves.toBeUndefined();
  });
});
