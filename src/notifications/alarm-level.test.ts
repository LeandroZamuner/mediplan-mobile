import { parseLevel } from "./alarm-level";

describe("parseLevel", () => {
  it("acepta 'normal' y 'fuerte'", () => {
    expect(parseLevel("normal")).toBe("normal");
    expect(parseLevel("fuerte")).toBe("fuerte");
  });
  it("cualquier otra cosa (vacío, basura, versión vieja) cae en Normal", () => {
    for (const v of [null, "", "suave", "FUERTE", "x"]) expect(parseLevel(v)).toBe("normal");
  });
});
