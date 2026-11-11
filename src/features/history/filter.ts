export type DoseFilter = "all" | "taken" | "notTaken";

const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function filterDoses<T extends { medicationName: string; status: string }>(doses: T[], filter: DoseFilter, query: string): T[] {
  const q = norm(query.trim());
  return doses.filter((d) => {
    if (filter === "taken" && d.status !== "taken") return false;
    if (filter === "notTaken" && d.status === "taken") return false;
    return !q || norm(d.medicationName).includes(q);
  });
}
