import { needsOnboarding } from "./onboarding";

const none = { planCount: 0, supervisedCount: 0, invitationCount: 0 };

describe("needsOnboarding", () => {
  it("dado un usuario nuevo (sin marca, sin planes, sin cuidar a nadie), entonces sí", () => expect(needsOnboarding(false, none)).toBe(true));
  it("dado un usuario que ya terminó o salteó el onboarding, entonces no", () => expect(needsOnboarding(true, none)).toBe(false));
  it("dado un usuario que ya tiene planes (por ejemplo, desde la web), entonces no", () => expect(needsOnboarding(false, { ...none, planCount: 2 })).toBe(false));
  it("dado un usuario que ya cuida a alguien, entonces no", () => expect(needsOnboarding(false, { ...none, supervisedCount: 1 })).toBe(false));
  it("dado un usuario con invitaciones para cuidar pendientes, entonces no (viene a cuidar, no a crear un plan)", () => expect(needsOnboarding(false, { ...none, invitationCount: 1 })).toBe(false));
});
