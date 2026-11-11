import { dueDose } from "./due";

const d = (at: string, status: "pending" | "taken" | "missed" = "pending") => ({ scheduledAt: at, status });

describe("dueDose", () => {
  const now = new Date("2026-11-10T15:30:00Z");
  it("dado una toma pendiente dentro de la próxima hora, entonces la devuelve", () => {
    expect(dueDose([d("2026-11-10T16:00:00Z")], now)).toEqual(d("2026-11-10T16:00:00Z"));
  });
  it("dado una toma pendiente atrasada, entonces la devuelve (la más vieja primero)", () => {
    expect(dueDose([d("2026-11-10T14:00:00Z"), d("2026-11-10T15:00:00Z")], now)?.scheduledAt).toBe("2026-11-10T14:00:00Z");
  });
  it("dado una toma ya tomada, entonces la ignora", () => {
    expect(dueDose([d("2026-11-10T15:00:00Z", "taken")], now)).toBeUndefined();
  });
  it("dado una toma para más tarde (más de 1 h), entonces no hay toma para ahora", () => {
    expect(dueDose([d("2026-11-10T20:00:00Z")], now)).toBeUndefined();
  });
});
