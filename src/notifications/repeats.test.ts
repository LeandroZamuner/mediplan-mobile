import { alarmProfile, capTriggers, excludeTaken, expandRepeats, takenSetFrom, REPEAT_EVERY_MIN, REPEAT_UNTIL_MIN } from "./repeats";
import type { DoseTrigger } from "./schedule";

const base = (at: string, med = "m1", scheduled = at): DoseTrigger => ({
  key: `p1|${med}|${scheduled}`, planId: "p1", medicationId: med, title: "Ibuprofeno", body: "400 mg", at: new Date(at), scheduledAt: new Date(scheduled), repeat: 0,
});
const now = new Date("2026-11-11T10:00:00Z");

describe("expandRepeats (cada 5 minutos hasta los 30)", () => {
  it("dada una alarma, entonces genera la original y 6 repeticiones: +5, +10, … +30 min", () => {
    const r = expandRepeats([base("2026-11-11T11:00:00Z")], now);
    expect(r).toHaveLength(7);
    expect(r.map((t) => (t.at.getTime() - new Date("2026-11-11T11:00:00Z").getTime()) / 60000)).toEqual([0, 5, 10, 15, 20, 25, 30]);
    expect(r.map((t) => t.repeat)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it("las constantes son las acordadas: 5 y 30", () => {
    expect([REPEAT_EVERY_MIN, REPEAT_UNTIL_MIN]).toEqual([5, 30]);
  });
  it("cada repetición tiene su propia clave, y comparten la toma", () => {
    const r = expandRepeats([base("2026-11-11T11:00:00Z")], now);
    expect(new Set(r.map((t) => t.key)).size).toBe(7);
    expect(r.every((t) => t.scheduledAt.getTime() === base("2026-11-11T11:00:00Z").scheduledAt.getTime())).toBe(true);
  });
  it("las repeticiones avisan que la toma sigue sin registrarse", () => {
    const r = expandRepeats([base("2026-11-11T11:00:00Z")], now);
    expect(r[0].body).toBe("400 mg");
    expect(r[1].body).toMatch(/todavía no registraste/i);
  });
  it("no programa lo que ya pasó (si la app se abre 12 min después, quedan +15 a +30)", () => {
    const r = expandRepeats([base("2026-11-11T10:48:00Z")], new Date("2026-11-11T11:00:00Z"));
    expect(r.map((t) => t.repeat)).toEqual([3, 4, 5, 6]);
  });
  it("sin repeticiones (Suave) devuelve solo la alarma original", () => {
    expect(expandRepeats([base("2026-11-11T11:00:00Z")], now, { enabled: false })).toHaveLength(1);
  });
});

describe("capTriggers", () => {
  it("se queda con las más próximas cuando hay demasiadas (Android limita las alarmas)", () => {
    const many = Array.from({ length: 10 }, (_, i) => base(`2026-11-1${i % 9 + 1}T11:00:00Z`, `m${i}`));
    const r = capTriggers(many, 4);
    expect(r).toHaveLength(4);
    expect(r.map((t) => t.at.getTime())).toEqual([...r.map((t) => t.at.getTime())].sort((a, b) => a - b));
    expect(Math.max(...r.map((t) => t.at.getTime()))).toBeLessThanOrEqual(Math.min(...many.filter((m) => !r.includes(m)).map((m) => m.at.getTime())));
  });
});

describe("tomas ya registradas", () => {
  it("excludeTaken saca la alarma y todas sus repeticiones de una toma ya tomada", () => {
    const list = expandRepeats([base("2026-11-11T11:00:00Z"), base("2026-11-11T12:00:00Z")], now);
    const taken = takenSetFrom([{ medicationId: "m1", scheduledAt: "2026-11-11T08:00:00-03:00", status: "taken" }]); // = 11:00Z
    const r = excludeTaken(list, taken);
    expect(r).toHaveLength(7);
    expect(r.every((t) => t.scheduledAt.toISOString() === "2026-11-11T12:00:00.000Z")).toBe(true);
  });
  it("takenSetFrom ignora las pendientes y las omitidas", () => {
    expect(takenSetFrom([{ medicationId: "m1", scheduledAt: "2026-11-11T11:00:00Z", status: "pending" }, { medicationId: "m1", scheduledAt: "2026-11-11T12:00:00Z", status: "missed" }]).size).toBe(0);
  });
});

describe("alarmProfile (niveles)", () => {
  it("Normal: canal estándar, se puede descartar y repite", () => {
    expect(alarmProfile("normal")).toEqual({ channelId: "doses", sticky: false, autoDismiss: true, repeats: true });
  });
  it("Fuerte: canal de alarma, no se descarta con un deslizamiento y repite", () => {
    expect(alarmProfile("fuerte")).toEqual({ channelId: "doses_strong", sticky: true, autoDismiss: false, repeats: true });
  });
});
