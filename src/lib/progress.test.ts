import { todayProgress } from "./progress";

const TZ = "America/Argentina/Buenos_Aires";
const now = new Date("2026-11-11T19:00:00Z"); // 16:00 del 11/11
const d = (iso: string, status: string) => ({ scheduledAt: iso, status });

describe("todayProgress", () => {
  it("cuenta tomadas sobre el total de tomas del día de hoy (hora local)", () => {
    const doses = [d("2026-11-11T03:00:00Z", "taken"), d("2026-11-11T11:00:00Z", "taken"), d("2026-11-11T19:00:00Z", "pending"), d("2026-11-12T02:59:00Z", "pending")];
    expect(todayProgress(doses, TZ, now)).toEqual({ taken: 2, total: 4 });
  });
  it("ignora las tomas de otros días", () => {
    expect(todayProgress([d("2026-11-12T11:00:00Z", "pending"), d("2026-11-10T11:00:00Z", "taken")], TZ, now)).toEqual({ taken: 0, total: 0 });
  });
  it("sin tomas, 0 de 0", () => expect(todayProgress([], TZ, now)).toEqual({ taken: 0, total: 0 }));
});
