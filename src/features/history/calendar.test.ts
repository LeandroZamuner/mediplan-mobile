import { monthGrid, MONTHS_SHORT, shiftMonth, formatLongDate } from "./calendar";

describe("monthGrid (semana desde el lunes)", () => {
  it("dado octubre 2024, entonces empieza el lunes 30/9 y marca los días de otro mes", () => {
    const g = monthGrid(2024, 10);
    expect(g[0][0]).toEqual({ iso: "2024-09-30", day: 30, inMonth: false });
  });
  it("el 1 de octubre 2024 (martes) cae en la segunda columna", () => {
    const g = monthGrid(2024, 10);
    expect(g[0][1]).toEqual({ iso: "2024-10-01", day: 1, inMonth: true });
  });
  it("siempre devuelve semanas completas de 7 días", () => {
    for (const [y, m] of [[2024, 2], [2026, 11], [2025, 6]] as const) {
      const g = monthGrid(y, m);
      expect(g.every((w) => w.length === 7)).toBe(true);
      expect(g.length).toBeGreaterThanOrEqual(5);
    }
  });
  it("febrero bisiesto 2024 incluye el 29", () => {
    expect(monthGrid(2024, 2).flat().some((d) => d.iso === "2024-02-29" && d.inMonth)).toBe(true);
  });
});

describe("shiftMonth", () => {
  it("pasa de diciembre a enero del año siguiente", () => expect(shiftMonth(2024, 12, 1)).toEqual({ year: 2025, month: 1 }));
  it("retrocede de enero a diciembre del año anterior", () => expect(shiftMonth(2024, 1, -1)).toEqual({ year: 2023, month: 12 }));
});

describe("formatLongDate", () => {
  it("escribe '20 de Octubre (2024)'", () => expect(formatLongDate("2024-10-20")).toBe("20 de Octubre (2024)"));
  it("hay 12 meses abreviados", () => expect(MONTHS_SHORT).toHaveLength(12));
});
