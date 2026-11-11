import useSWR from "swr";
import { api } from "@/lib/api";
import { localDayRange } from "@/lib/dates";
import type { Occurrence, Plan } from "@/lib/types";

export type TodayDose = Occurrence & { planId: string; planName: string; dose: string };

/** Tomas de HOY (hora local del usuario) de los planes indicados, ordenadas por hora. */
export function useTodayDoses(plans: Plan[] | undefined, tz: string) {
  const active = plans?.filter((p) => p.status === "active") ?? [];
  const { from, to } = localDayRange(tz);
  const key = plans ? ["doses-today", from, ...active.map((p) => p.id)] : null;
  return useSWR<TodayDose[]>(
    key,
    async () => {
      const lists = await Promise.all(
        active.map(async (p) => {
          const occurrences = await api<Occurrence[]>(`/plans/${p.id}/doses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
          return occurrences.map((o) => ({
            ...o,
            planId: p.id,
            planName: p.name,
            dose: p.medications.find((m) => m.id === o.medicationId)?.dose ?? "",
          }));
        }),
      );
      return lists.flat().sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
    },
    { refreshInterval: 60_000 },
  );
}

/** Registra que la toma se hizo. */
export function recordTaken(planId: string, medicationId: string, scheduledAt: string) {
  return api(`/plans/${planId}/medications/${medicationId}/doses`, { method: "POST", json: { scheduledAt } });
}

export type StockLevel = "ok" | "low" | "out";

export function stockLevel(units: number, alertAt: number): StockLevel {
  if (units <= 0) return "out";
  return units <= alertAt ? "low" : "ok";
}
