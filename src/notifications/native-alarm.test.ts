import notifee, { AlarmType, AndroidCategory, TriggerType } from "react-native-notify-kit";
import type { DoseTrigger } from "./schedule";
import { ALARM_RING_MS, buildAlarmNotification, buildAlarmTrigger, cancelAllNativeAlarms, cancelNativeDoseAlarms, scheduleNativeAlarms, silenceNativeDose } from "./native-alarm";

const trigger = (over: Partial<DoseTrigger> = {}): DoseTrigger => ({
  key: "p1|m1|2026-11-13T23:15:00.000Z",
  planId: "p1",
  medicationId: "m1",
  title: "Paracetamol 500",
  body: "1 comprimido",
  at: new Date("2026-11-13T23:15:00Z"),
  scheduledAt: new Date("2026-11-13T23:15:00Z"),
  repeat: 0,
  ...over,
});

const mocked = (fn: unknown) => fn as jest.Mock;

describe("buildAlarmNotification", () => {
  it("dada una toma, cuando se arma la alarma, entonces suena en bucle por el canal de alarma, no se descarta y pide pantalla completa", () => {
    const n = buildAlarmNotification(trigger());
    expect(n).toMatchObject({ id: "p1|m1|2026-11-13T23:15:00.000Z", title: "Paracetamol 500", body: "1 comprimido" });
    expect(n.android).toMatchObject({
      channelId: "doses_strong_v2",
      category: AndroidCategory.ALARM,
      loopSound: true,
      ongoing: true,
      autoCancel: false,
      lightUpScreen: true,
      fullScreenAction: { id: "alarm", launchActivity: "default" },
      pressAction: { id: "open", launchActivity: "default" },
    });
  });

  it("dada una toma, cuando se arma la alarma, entonces cada sonada dura un minuto como máximo (las repeticiones la vuelven a hacer sonar)", () => {
    expect(ALARM_RING_MS).toBe(60_000);
    expect(buildAlarmNotification(trigger()).android?.timeoutAfter).toBe(ALARM_RING_MS);
  });

  it("dada una toma, cuando se arma la alarma, entonces ofrece los botones Tomé y Posponer que no abren la app", () => {
    const actions = buildAlarmNotification(trigger()).android?.actions ?? [];
    expect(actions.map((a) => [a.title, a.pressAction.id])).toEqual([
      ["Tomé", "taken"],
      ["Posponer", "snooze"],
    ]);
    expect(actions.every((a) => !("launchActivity" in a.pressAction))).toBe(true);
  });

  it("dada una toma, cuando se arma la alarma, entonces lleva los datos para registrarla (todos como texto)", () => {
    expect(buildAlarmNotification(trigger({ repeat: 2 })).data).toEqual({
      planId: "p1",
      medicationId: "m1",
      scheduledAt: "2026-11-13T23:15:00.000Z",
      repeat: "2",
    });
  });
});

describe("buildAlarmTrigger", () => {
  it("dada una toma, cuando se arma el disparador, entonces es una alarma de reloj exacta a esa hora (atraviesa el ahorro de energía)", () => {
    expect(buildAlarmTrigger(trigger())).toEqual({
      type: TriggerType.TIMESTAMP,
      timestamp: new Date("2026-11-13T23:15:00Z").getTime(),
      alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
    });
  });
});

describe("programar y cancelar", () => {
  beforeEach(() => jest.clearAllMocks());

  it("dadas varias alarmas, cuando se programan, entonces se crea un disparador por cada una con su hora", async () => {
    const list = [trigger(), trigger({ key: "k2", at: new Date("2026-11-13T23:20:00Z"), repeat: 1 })];
    await scheduleNativeAlarms(list);
    const calls = mocked(notifee.createTriggerNotification).mock.calls;
    expect(calls).toHaveLength(2);
    expect(calls[1][0].id).toBe("k2");
    expect(calls[1][1].timestamp).toBe(new Date("2026-11-13T23:20:00Z").getTime());
  });

  it("dadas alarmas programadas, cuando se cancelan todas, entonces se borran los disparadores pero no la alarma que está sonando ahora", async () => {
    await cancelAllNativeAlarms();
    expect(notifee.cancelTriggerNotifications).toHaveBeenCalledWith();
    expect(notifee.cancelDisplayedNotifications).not.toHaveBeenCalled();
  });

  it("dada una toma registrada, cuando se cancelan sus alarmas, entonces se borran sus disparadores y la que esté sonando, y no las de otras tomas", async () => {
    const mine = { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-13T23:15:00.000Z" };
    const other = { planId: "p1", medicationId: "m2", scheduledAt: "2026-11-13T23:15:00.000Z" };
    mocked(notifee.getTriggerNotifications).mockResolvedValueOnce([
      { notification: { id: "a", data: mine }, trigger: {} },
      { notification: { id: "b", data: other }, trigger: {} },
      { notification: { id: "c", data: { ...mine, repeat: "1" } }, trigger: {} },
    ]);
    mocked(notifee.getDisplayedNotifications).mockResolvedValueOnce([
      { id: "d", notification: { id: "d", data: mine } },
      { id: "e", notification: { id: "e", data: other } },
    ]);
    await cancelNativeDoseAlarms(mine);
    expect(notifee.cancelTriggerNotifications).toHaveBeenCalledWith(["a", "c"]);
    expect(notifee.cancelDisplayedNotifications).toHaveBeenCalledWith(["d"]);
  });

  it("dada una falla de la librería, cuando se cancelan las alarmas de una toma, entonces no se rompe el registro de la toma", async () => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    mocked(notifee.getTriggerNotifications).mockRejectedValueOnce(new Error("módulo no disponible"));
    await expect(cancelNativeDoseAlarms({ planId: "p", medicationId: "m", scheduledAt: "2026-11-13T23:15:00.000Z" })).resolves.toBeUndefined();
  });
});

describe("silenceNativeDose", () => {
  beforeEach(() => jest.clearAllMocks());

  it("dada una alarma sonando, cuando se pospone, entonces se apaga solo la que suena de esa toma y las repeticiones programadas siguen", async () => {
    const mine = { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-13T23:15:00.000Z" };
    mocked(notifee.getDisplayedNotifications).mockResolvedValueOnce([
      { id: "d", notification: { id: "d", data: mine } },
      { id: "e", notification: { id: "e", data: { ...mine, medicationId: "m2" } } },
    ]);
    await silenceNativeDose(mine);
    expect(notifee.cancelDisplayedNotifications).toHaveBeenCalledWith(["d"]);
    expect(notifee.cancelTriggerNotifications).not.toHaveBeenCalled();
  });
});
