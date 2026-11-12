import { dosesPerDay, daysOfStockLeft, stockRatio } from "./stock";
import type { Medication } from "./types";

const med = (over: Partial<Medication> = {}): Medication => ({
  id: "m", name: "X", dose: "1", startDate: "2026-11-01", stockUnits: 12, stockAlertAt: 3,
  schedules: [0, 1, 2, 3, 4, 5, 6].flatMap((d) => ["00:00", "08:00", "16:00"].map((t) => ({ dayOfWeek: d, timeOfDay: t }))),
  ...over,
});

describe("dosesPerDay", () => {
  it("dado 3 tomas todos los días, entonces 3 por día", () => expect(dosesPerDay(med())).toBe(3));
  it("dado una toma solo lunes y jueves, entonces 2/7 por día", () => {
    const m = med({ schedules: [{ dayOfWeek: 1, timeOfDay: "08:00" }, { dayOfWeek: 4, timeOfDay: "08:00" }] });
    expect(dosesPerDay(m)).toBeCloseTo(2 / 7);
  });
  it("dado sin horarios, entonces 0", () => expect(dosesPerDay(med({ schedules: [] }))).toBe(0));
});

describe("daysOfStockLeft", () => {
  it("con 12 comprimidos y 3 por día, entonces 4 días", () => expect(daysOfStockLeft(med())).toBe(4));
  it("redondea hacia abajo", () => expect(daysOfStockLeft(med({ stockUnits: 11 }))).toBe(3));
  it("sin horarios no se puede estimar (null)", () => expect(daysOfStockLeft(med({ schedules: [] }))).toBeNull());
  it("sin stock, entonces 0", () => expect(daysOfStockLeft(med({ stockUnits: 0 }))).toBe(0));
});

describe("stockRatio", () => {
  it("con el stock en el umbral de aviso x3 llena la barra", () => expect(stockRatio(med({ stockUnits: 9, stockAlertAt: 3 }))).toBe(1));
  it("con la mitad, 0.5", () => expect(stockRatio(med({ stockUnits: 4.5, stockAlertAt: 3 }))).toBe(0.5));
  it("nunca pasa de 1 ni baja de 0", () => {
    expect(stockRatio(med({ stockUnits: 100 }))).toBe(1);
    expect(stockRatio(med({ stockUnits: 0 }))).toBe(0);
  });
});
