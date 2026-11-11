import { passwordChecks, isPasswordValid } from "./password";

describe("passwordChecks (requisitos del diseño)", () => {
  it("dado una contraseña vacía, entonces ningún requisito se cumple", () => {
    expect(passwordChecks("").map((c) => c.ok)).toEqual([false, false, false, false]);
  });
  it("dado 'Abcdef1!', entonces cumple los cuatro", () => {
    expect(passwordChecks("Abcdef1!").every((c) => c.ok)).toBe(true);
    expect(isPasswordValid("Abcdef1!")).toBe(true);
  });
  it("dado una contraseña sin mayúscula, entonces falla solo ese requisito", () => {
    const failed = passwordChecks("abcdef1!").filter((c) => !c.ok).map((c) => c.label);
    expect(failed).toEqual(["Una letra mayúscula."]);
  });
  it("dado una contraseña corta, entonces no es válida", () => {
    expect(isPasswordValid("Ab1!")).toBe(false);
  });
  it("dado una sin carácter especial ni número, entonces no es válida", () => {
    expect(isPasswordValid("Abcdefgh")).toBe(false);
  });
});
