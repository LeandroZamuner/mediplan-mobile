import { handleDoseAction } from "./respond";

const data = { planId: "p1", medicationId: "m1", scheduledAt: "2026-11-11T11:00:00.000Z" };

function deps() {
  return { recordTaken: jest.fn().mockResolvedValue("sent"), openList: jest.fn() };
}

describe("handleDoseAction", () => {
  it("dado el botón 'Tomé', entonces registra la toma con los datos de la notificación", async () => {
    const d = deps();
    await handleDoseAction("taken", data, d);
    expect(d.recordTaken).toHaveBeenCalledWith("p1", "m1", "2026-11-11T11:00:00.000Z");
  });
  it("dado un toque en el cuerpo de la notificación, entonces abre la lista de recordatorios", async () => {
    const d = deps();
    await handleDoseAction("default", data, d);
    expect(d.openList).toHaveBeenCalled();
    expect(d.recordTaken).not.toHaveBeenCalled();
  });
  it("dado datos incompletos, entonces no hace nada", async () => {
    const d = deps();
    await handleDoseAction("taken", {}, d);
    expect(d.recordTaken).not.toHaveBeenCalled();
  });
  it("dado un botón que ya no existe (por ejemplo 'snooze' de una versión anterior), entonces no hace nada", async () => {
    const d = deps();
    await handleDoseAction("snooze", data, d);
    expect(d.recordTaken).not.toHaveBeenCalled();
    expect(d.openList).not.toHaveBeenCalled();
  });
});
