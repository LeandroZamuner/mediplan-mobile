import { handleDoseAction, SNOOZE_MINUTES } from "./respond";

const data = { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T11:00:00.000Z" };
const content = { title: "Ibuprofeno", body: "400 mg" };

function deps() {
  return { recordTaken: jest.fn().mockResolvedValue(undefined), scheduleAt: jest.fn().mockResolvedValue(undefined), openList: jest.fn(), now: () => new Date("2026-11-11T11:01:00Z") };
}

describe("handleDoseAction", () => {
  it("dado el botón 'Tomé', entonces registra la toma con los datos de la notificación", async () => {
    const d = deps();
    await handleDoseAction("taken", data, content, d);
    expect(d.recordTaken).toHaveBeenCalledWith("p1", "m1", "2026-11-11T11:00:00.000Z");
    expect(d.scheduleAt).not.toHaveBeenCalled();
  });
  it("dado el botón 'Posponer', entonces reprograma la misma alarma unos minutos después", async () => {
    const d = deps();
    await handleDoseAction("snooze", data, content, d);
    expect(d.scheduleAt).toHaveBeenCalledWith(new Date(new Date("2026-11-11T11:01:00Z").getTime() + SNOOZE_MINUTES * 60_000), content, data);
    expect(d.recordTaken).not.toHaveBeenCalled();
  });
  it("dado un toque en el cuerpo de la notificación, entonces abre la lista de recordatorios", async () => {
    const d = deps();
    await handleDoseAction("default", data, content, d);
    expect(d.openList).toHaveBeenCalled();
    expect(d.recordTaken).not.toHaveBeenCalled();
  });
  it("dado datos incompletos, entonces no hace nada", async () => {
    const d = deps();
    await handleDoseAction("taken", {}, content, d);
    expect(d.recordTaken).not.toHaveBeenCalled();
  });
});
