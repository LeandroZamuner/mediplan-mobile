import { sendEmailVerification, sendPasswordResetEmail, type User } from "firebase/auth";
import { api, ApiError } from "@/lib/api";
import { requestPasswordReset, requestVerification } from "./account-mail";

jest.mock("firebase/auth", () => ({ sendEmailVerification: jest.fn(), sendPasswordResetEmail: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ firebaseAuth: () => ({ name: "auth" }) }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), api: jest.fn() }));

const user = { email: "ana@correo.com" } as User;
beforeEach(() => jest.clearAllMocks());

describe("requestPasswordReset", () => {
  it("dada la API disponible, cuando se pide recuperar, entonces se usa la API con el correo limpio y no Firebase", async () => {
    (api as jest.Mock).mockResolvedValue({ ok: true });
    await requestPasswordReset("  ana@correo.com ");
    expect(api).toHaveBeenCalledWith("/auth/password-reset", { method: "POST", json: { email: "ana@correo.com" } });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it.each([
    ["sin conexión", new TypeError("Network request failed")],
    ["servicio caído", new ApiError(503, "no pudimos enviar el correo ahora")],
    ["no configurada", new ApiError(404, "no encontrado")],
  ])("dada la API %s, cuando se pide recuperar, entonces se usa el correo de Firebase", async (_n, failure) => {
    (api as jest.Mock).mockRejectedValue(failure);
    await requestPasswordReset("ana@correo.com");
    expect(sendPasswordResetEmail).toHaveBeenCalledWith({ name: "auth" }, "ana@correo.com");
  });

  it.each([422, 429])("dado un error %s de la API, cuando se pide recuperar, entonces falla sin usar Firebase", async (status) => {
    (api as jest.Mock).mockRejectedValue(new ApiError(status, "x"));
    await expect(requestPasswordReset("ana@correo.com")).rejects.toMatchObject({ status });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

describe("requestVerification", () => {
  it("dada la API disponible, cuando se pide verificar, entonces se envía por la API y devuelve true", async () => {
    (api as jest.Mock).mockResolvedValue({ sent: true });
    await expect(requestVerification(user)).resolves.toBe(true);
    expect(api).toHaveBeenCalledWith("/auth/email-verification", { method: "POST" });
    expect(sendEmailVerification).not.toHaveBeenCalled();
  });

  it("dado un correo ya verificado, cuando se pide verificar, entonces devuelve false y no envía nada", async () => {
    (api as jest.Mock).mockResolvedValue({ sent: false, alreadyVerified: true });
    await expect(requestVerification(user)).resolves.toBe(false);
    expect(sendEmailVerification).not.toHaveBeenCalled();
  });

  it("dada la API caída, cuando se pide verificar, entonces se usa el correo de Firebase", async () => {
    (api as jest.Mock).mockRejectedValue(new TypeError("Network request failed"));
    await expect(requestVerification(user)).resolves.toBe(true);
    expect(sendEmailVerification).toHaveBeenCalledWith(user);
  });

  it("dado un pedido repetido enseguida (429), cuando se pide verificar, entonces falla sin usar Firebase", async () => {
    (api as jest.Mock).mockRejectedValue(new ApiError(429, "x"));
    await expect(requestVerification(user)).rejects.toMatchObject({ status: 429 });
    expect(sendEmailVerification).not.toHaveBeenCalled();
  });
});
