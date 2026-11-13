import notifee from "react-native-notify-kit";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { syncDoseAlarms, syncDoseAlarmsIfChanged } from "./sync";
import type { Plan } from "@/lib/types";

jest.mock("expo-notifications", () => ({
  SchedulableTriggerInputTypes: { DATE: "date" },
  cancelAllScheduledNotificationsAsync: jest.fn().mockResolvedValue(undefined),
  scheduleNotificationAsync: jest.fn().mockResolvedValue("id"),
  getAllScheduledNotificationsAsync: jest.fn().mockResolvedValue([]),
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

  it("en nivel Fuerte, donde no hay alarma nativa (iPhone), usa el canal de alarma y la notificación no se descarta deslizando", async () => {
    await syncDoseAlarms(plans, "America/Argentina/Buenos_Aires", new Date("2026-11-10T13:00:00Z"), {}, "fuerte");
    const first = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls[0][0];
    expect(first.trigger.channelId).toBe("doses_strong_v2");
    expect(first.content.sticky).toBe(true);
    expect(first.content.autoDismiss).toBe(false);
  });

  it("dada una toma cuya alarma original pasó hace 7 minutos, cuando se sincroniza, entonces siguen programadas las repeticiones que faltan (no se pierden al abrir la app)", async () => {
    const n = await syncDoseAlarms(plans, "America/Argentina/Buenos_Aires", new Date("2026-11-11T11:07:00Z"));
    expect(n).toBe(5);
    const horas = (Notifications.scheduleNotificationAsync as jest.Mock).mock.calls.map((c) => c[0].trigger.date.toISOString().slice(11, 16));
    expect(horas).toEqual(["11:10", "11:15", "11:20", "11:25", "11:30"]);
  });

  it("dada una toma que pasó hace más de 30 minutos, cuando se sincroniza, entonces ya no hay nada que repetir", async () => {
    expect(await syncDoseAlarms(plans, "America/Argentina/Buenos_Aires", new Date("2026-11-11T11:31:00Z"))).toBe(0);
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
  it("si la firma es la misma y el sistema sigue teniendo todas las alarmas, no toca nada", async () => {
    const first = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: null });
    jest.clearAllMocks();
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce(Array(7).fill({}));
    const again = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: first.signature });
    expect(again.changed).toBe(false);
    expect(Notifications.cancelAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });
  it("si la firma es la misma pero Android borró las alarmas (forzar detención, limpieza de memoria), reprograma", async () => {
    const first = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: null });
    jest.clearAllMocks();
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockResolvedValueOnce([]);
    const again = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: first.signature });
    expect(again.changed).toBe(true);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(7);
  });
  it("si no se puede saber cuántas alarmas hay programadas, reprograma por las dudas", async () => {
    const first = await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: null });
    jest.clearAllMocks();
    (Notifications.getAllScheduledNotificationsAsync as jest.Mock).mockRejectedValueOnce(new Error("boom"));
    expect((await syncDoseAlarmsIfChanged(plans, tz, now, { previousSignature: first.signature })).changed).toBe(true);
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

describe("syncDoseAlarms en Android", () => {
  const tz = "America/Argentina/Buenos_Aires";
  const now = new Date("2026-11-10T13:00:00Z");
  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, "OS", "android");
  });
  afterEach(() => jest.restoreAllMocks());

  it("dado el nivel Fuerte, cuando se sincroniza, entonces las alarmas son nativas (7: la original y 6 repeticiones) y no notificaciones comunes", async () => {
    const n = await syncDoseAlarms(plans, tz, now, {}, "fuerte");
    expect(n).toBe(7);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(7);
    expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("dado el nivel Normal, cuando se sincroniza, entonces siguen siendo notificaciones comunes", async () => {
    await syncDoseAlarms(plans, tz, now, {}, "normal");
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(7);
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it("dado el nivel Fuerte con la misma firma, cuando el sistema perdió las alarmas nativas, entonces se reprograman", async () => {
    const first = await syncDoseAlarmsIfChanged(plans, tz, now, { level: "fuerte", previousSignature: null });
    jest.clearAllMocks();
    (notifee.getTriggerNotificationIds as jest.Mock).mockResolvedValueOnce([]);
    const again = await syncDoseAlarmsIfChanged(plans, tz, now, { level: "fuerte", previousSignature: first.signature });
    expect(again.changed).toBe(true);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(7);
  });

  it("dado un cambio de nivel, cuando se sincroniza, entonces se borran las alarmas de los dos tipos antes de programar las nuevas", async () => {
    await syncDoseAlarms(plans, tz, now, {}, "normal");
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(notifee.cancelTriggerNotifications).toHaveBeenCalledWith();
  });

  it("dada una falla de la librería nativa, cuando se sincroniza en nivel Fuerte, entonces igual quedan programadas como notificaciones comunes", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    (notifee.createTriggerNotification as jest.Mock).mockRejectedValueOnce(new Error("módulo nativo no disponible"));
    const n = await syncDoseAlarms(plans, tz, now, {}, "fuerte");
    expect(n).toBe(7);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(7);
  });
});
