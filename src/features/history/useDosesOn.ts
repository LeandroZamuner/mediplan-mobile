import useSWR from "swr";
import { api } from "@/lib/api";
import { localDayRange } from "@/lib/dates";
import type { TodayDose } from "@/lib/doses";
import type { Occurrence, Plan } from "@/lib/types";

/** Tomas de un día (AAAA-MM-DD, hora local) de los planes activos y finalizados del paciente. */
export function useDosesOn(plans: Plan[] | undefined, isoDate: string, tz: string) {
  const { from, to } = localDayRange(tz, new Date(`${isoDate}T12:00:00Z`));
  const usable = plans?.filter((p) => p.status !== "cancelled") ?? [];
  return useSWR<TodayDose[]>(plans ? ["doses-on", from, ...usable.map((p) => p.id)] : null, async () => {
    const lists = await Promise.all(
      usable.map(async (p) => {
        const occ = await api<Occurrence[]>(`/plans/${p.id}/doses?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
        return occ.map((o) => ({ ...o, planId: p.id, planName: p.name, dose: p.medications.find((m) => m.id === o.medicationId)?.dose ?? "" }));
      }),
    );
    return lists.flat().sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
  });
}
