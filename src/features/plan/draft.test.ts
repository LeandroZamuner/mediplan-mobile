import { parseDateInput, formatDateInput, step1Error, step2Error, toCreateBody, summarize, emptyDraft } from "./draft";

const ok = { ...emptyDraft("2026-11-10"), name: "Paracetamol", dose: "500 mg", stockUnits: "5", everyHours: 8 as const, endDate: "24/11/2026", reminderMin: 15 };

describe("fechas del asistente (DD/MM/AAAA)", () => {
  it("dado '18/10/2026', entonces 2026-10-18", () => expect(parseDateInput("18/10/2026")).toBe("2026-10-18"));
  it("dado '8/1/2026' (sin ceros), entonces 2026-01-08", () => expect(parseDateInput("8/1/2026")).toBe("2026-01-08"));
  it("dado una fecha inexistente (31/02), entonces null", () => expect(parseDateInput("31/02/2026")).toBeNull());
  it("dado texto raro, entonces null", () => expect(parseDateInput("mañana")).toBeNull());
  it("formatea 2026-10-18 como 18/10/2026", () => expect(formatDateInput("2026-10-18")).toBe("18/10/2026"));
});

describe("validación por paso", () => {
  it("paso 1 vacío pide nombre", () => expect(step1Error(emptyDraft("2026-11-10"))).toMatch(/medicamento/i));
  it("paso 1 con stock inválido lo marca", () => expect(step1Error({ ...ok, stockUnits: "-2" })).toMatch(/comprimidos/i));
  it("paso 1 completo no tiene error", () => expect(step1Error(ok)).toBeNull());
  it("paso 2 sin frecuencia pide frecuencia", () => expect(step2Error({ ...ok, everyHours: null })).toMatch(/frecuencia/i));
  it("paso 2 con 'hasta' anterior a 'desde' lo marca", () => expect(step2Error({ ...ok, endDate: "01/11/2026" })).toMatch(/fin/i));
  it("paso 2 con 'hasta' vacío es válido (sin fecha de fin)", () => expect(step2Error({ ...ok, endDate: "" })).toBeNull());
  it("paso 2 completo no tiene error", () => expect(step2Error(ok)).toBeNull());
});

describe("toCreateBody", () => {
  it("arma el cuerpo de la API con horarios expandidos y fechas ISO", () => {
    const b = toCreateBody(ok);
    expect(b).toMatchObject({ name: "Paracetamol", dose: "500 mg", startDate: "2026-11-10", endDate: "2026-11-24", stockUnits: 5 });
    expect(b.schedules).toHaveLength(21);
    expect(b.stockAlertAt).toBeGreaterThanOrEqual(1);
  });
  it("sin fecha de fin no manda endDate", () => expect(toCreateBody({ ...ok, endDate: "" })).not.toHaveProperty("endDate"));
});

describe("summarize", () => {
  it("describe la toma en español", () => expect(summarize(ok)).toBe("Tomar cada 8 horas todos los días hasta el 24/11/2026."));
  it("sin fecha de fin no dice 'hasta'", () => expect(summarize({ ...ok, endDate: "" })).toBe("Tomar cada 8 horas todos los días."));
});
