import * as Notifications from "expo-notifications";
import { syncDoseAlarms, syncDoseAlarmsIfChanged } from "./sync";
import type { Plan } from "@/lib/types";

jest.mock("expo-notifications", () => ({
  SchedulableTriggerInputTypes: { DATE: "date" },
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("id"),
}));

const plans: Plan[] = [
  {
    id: "p1",
    patientId: "u1",
    name: "Plan",
    status: "active",
    createdAt: "2026-11-01T00:00:00Z",
    medications: [
      {
        id: "m1",
        name: "Ibuprofeno",
        dose: "400 mg",
        startDate: "2026-11-01",
        schedules: [{ dayOfWeek: 3, timeOfDay: "08:00" }],
        stockUnits: 5,
        stockAlertAt: 2,
      },
    ],
  },
];

describe("syncDoseAlarms", () => {
  beforeEach(() => jest.clearAllMocks());

  it("dado un plan activo, cuando se sincroniza, entonces cancela lo anterior y programa la alarma y sus 6 repeticiones (cada 5 min hasta 30)", async () => {
    const n = await syncDoseAlarms(plans, "America/Argentina/Buenos_Aires", new Date("2026-11-10T13:00:00Z"));
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(n).toBe(7);
    const calls = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map((c) => c[0]);
    expect(calls[0]).toEqual({
      content: {
        title: "Ibuprofeno",
        body: "400 mg",
        categoryIdentifier: "dose",
        sticky: false,
        autoDismiss: true,
        data: { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T11:00:00.000Z" },
      },
      trigger: { type: "date", date: new Date("2026-11-11T11:00:00.000Z"), channelId: "doses_v2", delivery: "alarmClock" },
    });
    expect(calls.map((c) => c.trigger.date.toISOString())).toEqual(["11:00", "11:05", "11:10", "11:15", "11:20", "11:25", "11:30"].map((h) => `2026-11-11T${h}:00.000Z`));
    expect(calls[1].content.body).toMatch(/todavía no registraste/i);
  });

  it("en nivel Fuerte usa el canal de alarma y la notificación no se descarta deslizando", async () => {
    await syncDoseAlarms(plans, "America/Argentina/Buenos_Aires", new Date("2026-11-10T13:00:00Z"), {}, "fuerte");
    const first = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(first.trigger.channelId).toBe("doses_strong_v2");
    expect(first.content.sticky).toBe(true);
    expect(first.content.autoDismiss).toBe(false);
  });

  it("una toma ya registrada no programa ni alarma ni repeticiones", async () => {
    const taken = new Set([`m1|${new Date("2026-11-11T11:00:00Z").getTime()}`]);
    expect(await syncDoseAlarms(plans, "America/Argentina/Buenos_Aires", new Date("2026-11-10T13:00:00Z"), {}, "normal", taken)).toBe(0);
  });

  it("dado que no hay planes, entonces solo limpia las alarmas viejas", async () => {
    expect(await syncDoseAlarms([], "America/Argentina/Buenos_Aires", new Date())).toBe(0);
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});

describe("syncDoseAlarmsIfChanged", () => {
  beforeEach(() => jest.clearAllMocks());
  const tz = "America/Argentina/Buenos_Aires";
  const now = new Date("2026-11-10T13:00:00Z");

  it("la primera vez (sin firma previa) programa y devuelve la firma", async () => {
    const r = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: null });
    expect(r.changed).toBe(true);
    expect(r.signature).toEqual(expect.any(String));
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(7);
  });
  it("si la firma es la misma, no toca las alarmas", async () => {
    const first = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: null });
    jest.clearAllMocks();
    const again = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: first.signature });
    expect(again.changed).toBe(false);
    expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it("si cambia el nivel (Normal a Fuerte), reprograma aunque las horas sean las mismas", async () => {
    const first = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: null });
    const changed = await syncDoseAlarmsIfChanged(plans, tz, now, { level: "fuerte", previousSignature: first.signature });
    expect(changed.changed).toBe(true);
  });
  it("si cambia la anticipación del recordatorio, reprograma", async () => {
    const first = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: null });
    const changed = await syncDoseAlarmsIfChanged(plans, tz, now, { offsets: { m1: 15 }, previousSignature: first.signature });
    expect(changed.changed).toBe(true);
  });
});
