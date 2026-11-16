import { fireEvent, render, screen, waitFor, act } from "@testing-library/react-native";
import { AppState } from "react-native";
import Verify from "@/app/verify";
import { requestVerification } from "@/lib/account-mail";

const mockRecheck = jest.fn();
jest.mock("@/auth/AuthProvider", () => ({ useAuth: () => ({ firebaseUser: { email: "a@b.com" }, recheck: mockRecheck, signOut: jest.fn() }) }));
jest.mock("@/lib/account-mail", () => ({ requestVerification: jest.fn() }));
jest.mock("@/ui/GradientScreen", () => ({ GradientScreen: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

beforeEach(() => {
  jest.clearAllMocks();
  mockRecheck.mockResolvedValue(undefined);
  (requestVerification as jest.Mock).mockResolvedValue(true);
});

it("dado un correo todavía sin verificar, cuando se toca 'Ya lo verifiqué', entonces se avisa que todavía no se ve verificado", async () => {
  await render(<Verify />);
  await fireEvent.press(screen.getByText("Ya lo verifiqué"));
  await waitFor(() => expect(screen.getByText(/Todavía no vemos tu correo verificado/)).toBeTruthy());
});

it("dado que la persona vuelve a la app después de tocar el enlace del correo, entonces se vuelve a comprobar sola", async () => {
  let onChange: (s: string) => void = () => {};
  jest.spyOn(AppState, "addEventListener").mockImplementation(((_: string, cb: (s: string) => void) => {
    onChange = cb;
    return { remove: jest.fn() };
  }) as never);
  await render(<Verify />);
  await act(async () => onChange("active"));
  expect(mockRecheck).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/Todavía no vemos/)).toBeNull(); // la comprobación automática no regaña
});

it("dado que se pide reenviar, cuando se toca 'Reenviar correo', entonces se envía y se avisa", async () => {
  await render(<Verify />);
  await fireEvent.press(screen.getByText("Reenviar correo"));
  await waitFor(() => expect(screen.getByText("Listo, lo reenviamos.")).toBeTruthy());
  expect(requestVerification).toHaveBeenCalledTimes(1);
});

it("dado un correo que ya estaba verificado, cuando se toca 'Reenviar correo', entonces se vuelve a comprobar y se avisa", async () => {
  (requestVerification as jest.Mock).mockResolvedValue(false);
  await render(<Verify />);
  await fireEvent.press(screen.getByText("Reenviar correo"));
  await waitFor(() => expect(screen.getByText("Tu correo ya figura como verificado.")).toBeTruthy());
  expect(mockRecheck).toHaveBeenCalledTimes(1);
});

it("dado un pedido repetido enseguida, cuando se toca 'Reenviar correo', entonces se pide esperar un minuto", async () => {
  (requestVerification as jest.Mock).mockRejectedValue(Object.assign(new Error("x"), { status: 429 }));
  await render(<Verify />);
  await fireEvent.press(screen.getByText("Reenviar correo"));
  await waitFor(() => expect(screen.getByText(/Esperá un minuto/)).toBeTruthy());
});
