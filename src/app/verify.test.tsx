import { fireEvent, render, screen, waitFor, act } from "@testing-library/react-native";
import { AppState } from "react-native";
import Verify from "./verify";

const mockRecheck = jest.fn();
jest.mock("@/auth/AuthProvider", () => ({ useAuth: () => ({ firebaseUser: { email: "a@b.com" }, recheck: mockRecheck, signOut: jest.fn() }) }));
jest.mock("@/ui/GradientScreen", () => ({ GradientScreen: ({ children }: { children: React.ReactNode }) => <>{children}</> }));

beforeEach(() => {
  jest.clearAllMocks();
  mockRecheck.mockResolvedValue(undefined);
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
