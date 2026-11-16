import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { sendPasswordResetEmail } from "firebase/auth";
import Login from "@/app/(auth)/login";
import Recuperar from "@/app/(auth)/recuperar";
import { api } from "@/lib/api";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn(), back: jest.fn(), canGoBack: () => true } }));
jest.mock("firebase/auth", () => ({ sendPasswordResetEmail: jest.fn(), signInWithEmailAndPassword: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ firebaseAuth: () => ({}) }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), api: jest.fn() }));
jest.mock("@/ui/GradientScreen", () => ({ GradientScreen: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

beforeEach(() => {
  jest.clearAllMocks();
  (api as jest.Mock).mockResolvedValue({ ok: true });
});

describe("Recuperar contraseña", () => {
  it("dado un correo, cuando se pide el enlace, entonces se pide a la API (correo con el diseño de MediPlan) y se avisa sin revelar si la cuenta existe", async () => {
    await render(<Recuperar />);
    await fireEvent.changeText(screen.getByPlaceholderText("Correo electrónico"), "  ana@correo.com ");
    await fireEvent.press(screen.getByText("Enviar enlace"));
    await waitFor(() => expect(screen.getByText(/Si hay una cuenta con ese correo/)).toBeTruthy());
    expect(api).toHaveBeenCalledWith("/auth/password-reset", { method: "POST", json: { email: "ana@correo.com" } });
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("dada la API sin responder, cuando se pide el enlace, entonces se usa el correo de Firebase de respaldo", async () => {
    (api as jest.Mock).mockRejectedValue(new TypeError("Network request failed"));
    (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);
    await render(<Recuperar />);
    await fireEvent.changeText(screen.getByPlaceholderText("Correo electrónico"), "ana@correo.com");
    await fireEvent.press(screen.getByText("Enviar enlace"));
    await waitFor(() => expect(screen.getByText(/Si hay una cuenta con ese correo/)).toBeTruthy());
    expect((sendPasswordResetEmail as jest.Mock).mock.calls[0][1]).toBe("ana@correo.com");
  });

  it("dados demasiados pedidos seguidos, cuando se pide el enlace, entonces se pide esperar un minuto", async () => {
    (api as jest.Mock).mockRejectedValue(Object.assign(new Error("x"), { status: 429 }));
    await render(<Recuperar />);
    await fireEvent.changeText(screen.getByPlaceholderText("Correo electrónico"), "ana@correo.com");
    await fireEvent.press(screen.getByText("Enviar enlace"));
    await waitFor(() => expect(screen.getByText(/Esperá un minuto/)).toBeTruthy());
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("dado un correo que no tiene cuenta, cuando se pide el enlace, entonces se muestra el mismo aviso (no se revela quién tiene cuenta)", async () => {
    (api as jest.Mock).mockRejectedValue(new TypeError("Network request failed"));
    (sendPasswordResetEmail as jest.Mock).mockRejectedValue({ code: "auth/user-not-found" });
    await render(<Recuperar />);
    await fireEvent.changeText(screen.getByPlaceholderText("Correo electrónico"), "nadie@correo.com");
    await fireEvent.press(screen.getByText("Enviar enlace"));
    await waitFor(() => expect(screen.getByText(/Si hay una cuenta con ese correo/)).toBeTruthy());
  });

  it("dada una falla de conexión, cuando se pide el enlace, entonces se muestra el error y se puede reintentar", async () => {
    (api as jest.Mock).mockRejectedValue(new TypeError("Network request failed"));
    (sendPasswordResetEmail as jest.Mock).mockRejectedValue({ code: "auth/network-request-failed" });
    await render(<Recuperar />);
    await fireEvent.changeText(screen.getByPlaceholderText("Correo electrónico"), "ana@correo.com");
    await fireEvent.press(screen.getByText("Enviar enlace"));
    await waitFor(() => expect(screen.getByText(/No hay conexión/)).toBeTruthy());
    expect(screen.getByText("Enviar enlace")).toBeTruthy();
  });

  it("dado un correo vacío o inválido, entonces no se puede enviar", async () => {
    await render(<Recuperar />);
    await fireEvent.press(screen.getByText("Enviar enlace"));
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });
});

it("dado el inicio de sesión, cuando se toca '¿Olvidaste tu contraseña?', entonces abre la pantalla de recuperar", async () => {
  await render(<Login />);
  await fireEvent.press(screen.getByText("¿Olvidaste tu contraseña?"));
  expect(mockPush).toHaveBeenCalledWith("/recuperar");
});
