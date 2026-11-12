import { whenLabel } from "./when";

const TZ = "America/Argentina/Buenos_Aires"; // UTC-3
const now = new Date("2026-11-11T19:19:00Z"); // 16:19 del 11/11

describe("whenLabel", () => {
  it("una toma de hoy dice 'Hoy a las HH:MM'", () => expect(whenLabel("2026-11-11T20:00:00Z", TZ, now)).toBe("Hoy a las 17:00"));
  it("una toma de mañana dice 'Mañana a las HH:MM'", () => expect(whenLabel("2026-11-12T11:00:00Z", TZ, now)).toBe("Mañana a las 08:00"));
  it("la medianoche de mañana (03:00Z) cuenta como mañana", () => expect(whenLabel("2026-11-12T03:00:00Z", TZ, now)).toBe("Mañana a las 00:00"));
  it("una toma más lejana dice 'El DD/MM a las HH:MM'", () => expect(whenLabel("2026-11-14T11:00:00Z", TZ, now)).toBe("El 14/11 a las 08:00"));
});
