import { needsOnboarding } from "./onboarding";

describe("needsOnboarding", () => {
  it("dado un usuario nuevo (sin marca y sin planes), entonces sí", () => expect(needsOnboarding(false, 0)).toBe(true));
  it("dado un usuario que ya terminó o salteó el onboarding, entonces no", () => expect(needsOnboarding(true, 0)).toBe(false));
  it("dado un usuario que ya tiene planes (por ejemplo, desde la web), entonces no", () => expect(needsOnboarding(false, 2)).toBe(false));
});
