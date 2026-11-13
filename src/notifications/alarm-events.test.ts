import { EventType, type Event } from "react-native-notify-kit";
import { handleAlarmEvent, takeFromAlarm, type AlarmDeps } from "./alarm-events";
import { TEST_PLAN_ID } from "./native-alarm";

const data = { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-13T23:15:00.000Z", repeat: "0" };
const notification = { id: "n1", title: "Paracetamol 500", body: "1 comprimido", data };

const event = (type: EventType, pressActionId?: string, n: unknown = notification): Event =>
  ({ type, detail: { notification: n, pressAction: pressActionId ? { id: pressActionId } : undefined } }) as unknown as Event;

function deps(over: Partial<AlarmDeps> = {}): AlarmDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    recordTaken: jest.fn(async () => {
      calls.push("recordTaken");
      return "sent";
    }),
    dismiss: jest.fn(async () => {
      calls.push("dismiss");
    }),
    openAlarm: jest.fn(() => {
      calls.push("openAlarm");
    }),
    ...over,
  };
}

describe("handleAlarmEvent", () => {
  beforeEach(() => jest.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("dado el botón Tomé, cuando se toca, entonces se registra la toma y se apaga la alarma que suena", async () => {
    const d = deps();
    await handleAlarmEvent(event(EventType.ACTION_PRESS, "taken"), d);
    expect(d.recordTaken).toHaveBeenCalledWith("p1", "m1", "2026-11-13T23:15:00.000Z");
    expect(d.dismiss).toHaveBeenCalledWith("n1");
    expect(d.calls).toEqual(["recordTaken", "dismiss"]);
  });

  it("dado el botón Posponer, cuando se toca, entonces se apaga el sonido sin registrar la toma (la próxima repetición la vuelve a sonar)", async () => {
    const d = deps();
    await handleAlarmEvent(event(EventType.ACTION_PRESS, "snooze"), d);
    expect(d.dismiss).toHaveBeenCalledWith("n1");
    expect(d.recordTaken).not.toHaveBeenCalled();
  });

  it("dado un toque en la alarma o la pantalla completa, cuando se abre la app, entonces se muestra la pantalla de alarma con los datos de la toma", async () => {
    for (const id of ["open", "alarm"]) {
      const d = deps();
      await handleAlarmEvent(event(EventType.PRESS, id), d);
      expect(d.openAlarm).toHaveBeenCalledWith({ planId: "p1", medicationId: "m1", scheduledAt: "2026-11-13T23:15:00.000Z", title: "Paracetamol 500", body: "1 comprimido" });
    }
  });

  it("dada una alarma que suena con la app abierta, cuando llega, entonces se abre la pantalla de alarma", async () => {
    const d = deps({ openOnDelivered: true });
    await handleAlarmEvent(event(EventType.DELIVERED), d);
    expect(d.openAlarm).toHaveBeenCalledTimes(1);
  });

  it("dada una alarma que suena con la app cerrada, cuando llega, entonces no se hace nada (la abre la pantalla completa de Android)", async () => {
    const d = deps();
    await handleAlarmEvent(event(EventType.DELIVERED), d);
    expect(d.openAlarm).not.toHaveBeenCalled();
  });

  it("dada una falla al registrar la toma, cuando se toca Tomé, entonces la alarma sigue sonando para que se pueda reintentar", async () => {
    const d = deps({ recordTaken: jest.fn().mockRejectedValue(new Error("401")) });
    await expect(handleAlarmEvent(event(EventType.ACTION_PRESS, "taken"), d)).resolves.toBeUndefined();
    expect(d.dismiss).not.toHaveBeenCalled();
  });

  it("dados eventos sin datos de toma o de otro tipo, cuando llegan, entonces se ignoran", async () => {
    const d = deps();
    await handleAlarmEvent(event(EventType.ACTION_PRESS, "taken", { id: "x", data: {} }), d);
    await handleAlarmEvent(event(EventType.DISMISSED), d);
    await handleAlarmEvent({ type: EventType.PRESS, detail: {} } as Event, d);
    expect(d.recordTaken).not.toHaveBeenCalled();
    expect(d.dismiss).not.toHaveBeenCalled();
    expect(d.openAlarm).not.toHaveBeenCalled();
  });
});

describe("alarma de prueba", () => {
  beforeEach(() => jest.spyOn(console, "warn").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("dada la alarma de prueba, cuando se toca Tomé, entonces solo se apaga: no se registra ninguna toma en la API", async () => {
    const d = deps();
    const prueba = { id: "n9", title: "Prueba de MediPlan", body: "x", data: { planId: TEST_PLAN_ID, medicationId: TEST_PLAN_ID, scheduledAt: "2026-11-13T23:15:00.000Z" } };
    await handleAlarmEvent(event(EventType.ACTION_PRESS, "taken", prueba), d);
    expect(d.recordTaken).not.toHaveBeenCalled();
    expect(d.dismiss).toHaveBeenCalledWith("n9");
  });
});

describe("takeFromAlarm", () => {
  const info = { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-13T23:15:00.000Z", title: "t", body: "b" };
  it("registra la toma real", async () => {
    const recordTaken = jest.fn().mockResolvedValue("sent");
    await takeFromAlarm(info, recordTaken);
    expect(recordTaken).toHaveBeenCalledWith("p1", "m1", "2026-11-13T23:15:00.000Z");
  });
  it("no registra la de prueba", async () => {
    const recordTaken = jest.fn();
    await takeFromAlarm({ ...info, planId: TEST_PLAN_ID }, recordTaken);
    expect(recordTaken).not.toHaveBeenCalled();
  });
});
