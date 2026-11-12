import { everyHoursToSchedules, FREQUENCY_OPTIONS } from "./frequency";

describe("everyHoursToSchedules", () => {
  it("dado 'cada 8 horas' desde las 08:00, entonces da 08:00, 16:00 y 00:00 todos los días", () => {
    const s = everyHoursToSchedules(8, "08:00");
    expect([...new Set(s.map((x) => x.timeOfDay))].sort()).toEqual(["00:00", "08:00", "16:00"]);
    expect(s).toHaveLength(21);
    expect([...new Set(s.map((x) => x.dayOfWeek))].sort()).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
  it("dado 'cada 24 horas' desde las 21:30, entonces una toma diaria a las 21:30", () => {
    const s = everyHoursToSchedules(24, "21:30");
    expect(s).toHaveLength(7);
    expect(s.every((x) => x.timeOfDay === "21:30")).toBe(true);
  });
  it("dado 'cada 12 horas' desde las 20:00, entonces 20:00 y 08:00", () => {
    expect([...new Set(everyHoursToSchedules(12, "20:00").map((x) => x.timeOfDay))].sort()).toEqual(["08:00", "20:00"]);
  });
  it("dado un intervalo que no divide el día (5 h), entonces falla: el patrón se correría cada día", () => {
    expect(() => everyHoursToSchedules(5, "08:00")).toThrow();
  });
  it("las opciones ofrecidas dividen 24", () => {
    expect(FREQUENCY_OPTIONS.every((h) => 24 % h === 0)).toBe(true);
  });
});
