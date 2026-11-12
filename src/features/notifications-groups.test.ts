import { dayLabel } from "./notifications-groups";

const TZ = "America/Argentina/Buenos_Aires";
const now = new Date("2026-11-11T19:00:00Z"); // 16:00 del 11/11

describe("dayLabel", () => {
  it("hoy", () => expect(dayLabel("2026-11-11T12:00:00Z", TZ, now)).toBe("Hoy"));
  it("ayer", () => expect(dayLabel("2026-11-10T20:00:00Z", TZ, now)).toBe("Ayer"));
  it("antes, la fecha corta", () => expect(dayLabel("2026-11-05T12:00:00Z", TZ, now)).toBe("5/11"));
  it("usa el día local, no el UTC (02:00Z del 12/11 todavía es 11/11 en Buenos Aires)", () => expect(dayLabel("2026-11-12T02:00:00Z", TZ, now)).toBe("Hoy"));
});
