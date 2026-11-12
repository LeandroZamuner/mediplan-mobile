import { frequencyLabel } from "./frequency-label";
import type { Schedule } from "./types";

const every = (times: string[], days = [0, 1, 2, 3, 4, 5, 6]): Schedule[] => days.flatMap((d) => times.map((t) => ({ dayOfWeek: d, timeOfDay: t })));

describe("frequencyLabel", () => {
  it("tomas cada 8 horas todos los días → 'Cada 8 horas, todos los días'", () => expect(frequencyLabel(every(["00:00", "08:00", "16:00"]))).toBe("Cada 8 horas, todos los días"));
  it("cada 12 horas", () => expect(frequencyLabel(every(["08:00", "20:00"]))).toBe("Cada 12 horas, todos los días"));
  it("una vez al día → 'Una vez al día'", () => expect(frequencyLabel(every(["21:30"]))).toBe("Una vez al día, a las 21:30"));
  it("horarios irregulares → lista de horas", () => expect(frequencyLabel(every(["08:00", "10:00", "21:00"]))).toBe("Todos los días · 08:00, 10:00, 21:00"));
  it("solo algunos días → días y horas", () => expect(frequencyLabel(every(["08:00"], [1, 4]))).toBe("Lun, Jue · 08:00"));
  it("sin horarios → 'Sin horarios'", () => expect(frequencyLabel([])).toBe("Sin horarios"));
});
