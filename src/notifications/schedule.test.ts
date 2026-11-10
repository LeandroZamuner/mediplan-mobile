import { planDoseTriggers } from "./schedule";
import type { Plan } from "@/lib/types";

const TZ = "America/Argentina/Buenos_Aires"; // UTC-3 todo el año

function plan(over: Partial<Plan["medications"][0]> = {}, status: Plan["status"] = "active"): Plan {
  return {
    id: "p1",
    patientId: "u1",
    name: "Plan",
    status,
    createdAt: "2026-11-01T00:00:00Z",
    medications: [
      {
        id: "m1",
        name: "Ibuprofeno",
        dose: "400 mg",
        startDate: "2026-11-01",
        schedules: [{ dayOfWeek: 2, timeOfDay: "08:00" }], // martes
        stockUnits: 10,
        stockAlertAt: 3,
        ...over,
      },
    ],
  };
}

describe("planDoseTriggers", () => {
  // 2026-11-10 es martes. Son las 10:00 locales (13:00Z).
  const now = new Date("2026-11-10T13:00:00Z");

  it("dado un horario del martes, cuando ya pasó la hora de hoy, entonces programa el martes siguiente en hora local", () => {
    const t = planDoseTriggers([plan()], TZ, now, 14);
    expect(t.map((x) => x.at.toISOString())).toEqual(["2026-11-17T11:00:00.000Z"]);
  });

  it("dado un horario que todavía no pasó hoy, entonces incluye hoy", () => {
    const t = planDoseTriggers([plan({ schedules: [{ dayOfWeek: 2, timeOfDay: "20:30" }] })], TZ, now, 1);
    expect(t.map((x) => x.at.toISOString())).toEqual(["2026-11-10T23:30:00.000Z"]);
  });

  it("dado un plan finalizado o cancelado, entonces no programa nada", () => {
    expect(planDoseTriggers([plan({}, "completed")], TZ, now, 14)).toEqual([]);
    expect(planDoseTriggers([plan({}, "cancelled")], TZ, now, 14)).toEqual([]);
  });

  it("dado un medicamento con fecha de fin, entonces no programa después de esa fecha", () => {
    const t = planDoseTriggers([plan({ endDate: "2026-11-12" })], TZ, now, 14);
    expect(t).toEqual([]);
  });

  it("dado un medicamento que empieza en el futuro, entonces no programa antes de la fecha de inicio", () => {
    const t = planDoseTriggers([plan({ startDate: "2026-11-20" })], TZ, now, 14);
    expect(t).toEqual([]);
  });

  it("dado un medicamento sin stock, entonces igual programa (el aviso de stock es aparte)", () => {
    expect(planDoseTriggers([plan({ stockUnits: 0 })], TZ, now, 14)).toHaveLength(1);
  });

  it("entonces cada disparo trae una clave estable, el nombre y la dosis", () => {
    const [t] = planDoseTriggers([plan()], TZ, now, 14);
    expect(t.key).toBe("p1|m1|2026-11-17T11:00:00.000Z");
    expect(t).toMatchObject({ planId: "p1", medicationId: "m1", title: "Ibuprofeno", body: "400 mg" });
  });

  it("entonces ordena por fecha", () => {
    const p = plan({ schedules: [{ dayOfWeek: 3, timeOfDay: "09:00" }, { dayOfWeek: 2, timeOfDay: "21:00" }] });
    const t = planDoseTriggers([p], TZ, now, 3);
    expect(t.map((x) => x.at.getTime())).toEqual([...t.map((x) => x.at.getTime())].sort((a, b) => a - b));
    expect(t).toHaveLength(2);
  });
});
