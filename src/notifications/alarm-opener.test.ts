import { createAlarmOpener } from "./alarm-opener";

const info = (over: Partial<{ scheduledAt: string }> = {}) => ({ planId: "p1", medicationId: "m1", scheduledAt: "2026-11-13T23:15:00.000Z", title: "Paracetamol", body: "1", dose: "1", repeat: 0, ...over });

describe("createAlarmOpener", () => {
  it("dada una alarma, cuando se pide abrir su pantalla, entonces se abre", () => {
    const push = jest.fn();
    createAlarmOpener(push, () => 0)(info());
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("dados dos eventos casi juntos de la misma alarma (toque y arranque), cuando se piden, entonces la pantalla se abre una sola vez", () => {
    const push = jest.fn();
    let t = 0;
    const open = createAlarmOpener(push, () => t);
    open(info());
    t = 2000;
    open(info());
    expect(push).toHaveBeenCalledTimes(1);
  });

  it("dada la misma alarma pedida de nuevo mucho después (una repetición), cuando se pide, entonces se vuelve a abrir", () => {
    const push = jest.fn();
    let t = 0;
    const open = createAlarmOpener(push, () => t);
    open(info());
    t = 6000;
    open(info());
    expect(push).toHaveBeenCalledTimes(2);
  });

  it("dada otra toma, cuando se pide abrir enseguida, entonces se abre igual", () => {
    const push = jest.fn();
    const open = createAlarmOpener(push, () => 0);
    open(info());
    open(info({ scheduledAt: "2026-11-14T03:15:00.000Z" }));
    expect(push).toHaveBeenCalledTimes(2);
  });
});
