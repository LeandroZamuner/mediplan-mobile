import { filterDoses } from "./filter";

const d = (name: string, status: "pending" | "taken" | "missed") => ({ medicationName: name, status });
const all = [d("Paracetamol", "taken"), d("Ibuprofeno", "pending"), d("Amoxicilina", "missed")];

describe("filterDoses", () => {
  it("'todos' sin búsqueda devuelve todo", () => expect(filterDoses(all, "all", "")).toHaveLength(3));
  it("'tomados' deja solo los tomados", () => expect(filterDoses(all, "taken", "").map((x) => x.medicationName)).toEqual(["Paracetamol"]));
  it("'no tomados' deja pendientes y omitidos", () => expect(filterDoses(all, "notTaken", "").map((x) => x.medicationName)).toEqual(["Ibuprofeno", "Amoxicilina"]));
  it("la búsqueda ignora mayúsculas y tildes", () => expect(filterDoses(all, "all", "AMOXI").map((x) => x.medicationName)).toEqual(["Amoxicilina"]));
});
