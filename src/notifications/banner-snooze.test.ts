import { isSnoozed, SNOOZE_HOURS } from "./banner-snooze";

describe("isSnoozed (el cartel descartado no vuelve por 24 h)", () => {
  const now = new Date("2026-11-12T12:00:00Z").getTime();
  it("sin descarte previo, no está oculto", () => expect(isSnoozed(null, now)).toBe(false));
  it("descartado hace 1 hora, sigue oculto", () => expect(isSnoozed(String(now - 3600_000), now)).toBe(true));
  it("descartado hace más de 24 horas, vuelve a mostrarse", () => expect(isSnoozed(String(now - (SNOOZE_HOURS + 1) * 3600_000), now)).toBe(false));
  it("valor roto, no está oculto", () => expect(isSnoozed("abc", now)).toBe(false));
});
