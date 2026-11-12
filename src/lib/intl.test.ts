import { dtf } from "./intl";

describe("dtf (Intl.DateTimeFormat memoizado)", () => {
  it("dadas las mismas opciones, devuelve la misma instancia", () => {
    const a = dtf("es-AR", { timeZone: "UTC", hour: "2-digit" });
    const b = dtf("es-AR", { timeZone: "UTC", hour: "2-digit" });
    expect(a).toBe(b);
  });
  it("dadas opciones distintas, devuelve instancias distintas", () => {
    expect(dtf("es-AR", { timeZone: "UTC" })).not.toBe(dtf("es-AR", { timeZone: "America/Montevideo" }));
  });
  it("formatea igual que Intl.DateTimeFormat", () => {
    const o = { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" } as const;
    expect(dtf("en-CA", o).format(new Date("2026-11-11T12:00:00Z"))).toBe(new Intl.DateTimeFormat("en-CA", o).format(new Date("2026-11-11T12:00:00Z")));
  });
});
