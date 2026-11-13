import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { SWRConfig } from "swr";
import Home from "@/app/(app)/(tabs)/index";
import { api } from "@/lib/api";

jest.mock("expo-router", () => ({ router: { push: jest.fn() } }));
jest.mock("@/auth/AuthProvider", () => ({ useAuth: () => ({ me: { timezone: "UTC", email: "a@b.com" }, firebaseUser: { displayName: "Ana" } }) }));
jest.mock("@/lib/api", () => ({ api: jest.fn(), ApiError: class extends Error {} }));
jest.mock("@/notifications/reminders", () => ({ refreshAlarms: jest.fn() }));
jest.mock("@/notifications/dose-alarms", () => ({ cancelDoseAlarms: jest.fn().mockResolvedValue(undefined) }));
jest.mock("@/ui/TabScreen", () => ({ TabScreen: ({ hero, children }: { hero?: React.ReactNode; children: React.ReactNode }) => <>{hero}{children}</> }));
jest.mock("@/ui/AlarmBanner", () => ({ AlarmBanner: () => null }));

const soon = new Date(Date.now() - 2 * 60_000).toISOString();
const plan = { id: "p1", status: "active", name: "Plan", medications: [{ id: "m1", name: "Ibu", dose: "400 mg", stockUnits: 10, stockAlertAt: 2, schedules: [] }] };

it("dada una toma pendiente en 'Tomar ahora', cuando se confirma con Sí, entonces la pantalla deja de mostrarla como pendiente", async () => {
  let taken = false;
  (api as jest.Mock).mockImplementation(async (path: string, init?: { method?: string }) => {
    if (path === "/plans") return [plan];
    if (path.startsWith("/plans/p1/doses")) return [{ medicationId: "m1", medicationName: "Ibu", scheduledAt: soon, status: taken ? "taken" : "pending" }];
    if (path.includes("/doses") && init?.method === "POST") { taken = true; return {}; }
    if (path.includes("/caregivers")) return [];
    throw new Error("ruta inesperada " + path);
  });
  await render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><Home /></SWRConfig>);
  await screen.findByText(/Tomar ahora/);
  await fireEvent.press(screen.getByText("Sí"));
  await fireEvent.press(screen.getAllByText("Sí").at(-1)!);
  await waitFor(() => expect(screen.queryByText(/Tomar ahora/)).toBeNull());
});

describe("con la API lenta", () => {
  function setup(opts: { postFails?: boolean } = {}) {
    let finishPost: () => void = () => {};
    let taken = false;
    (api as jest.Mock).mockImplementation(async (path: string, init?: { method?: string }) => {
      if (path === "/plans") return [plan];
      if (path.startsWith("/plans/p1/doses")) return [{ medicationId: "m1", medicationName: "Ibu", scheduledAt: soon, status: taken ? "taken" : "pending" }];
      if (path.includes("/doses") && init?.method === "POST") {
        await new Promise<void>((resolve) => (finishPost = resolve));
        if (opts.postFails) throw new Error("No pudimos registrar la toma.");
        taken = true;
        return {};
      }
      if (path.includes("/caregivers")) return [];
      throw new Error("ruta inesperada " + path);
    });
    return { finishPost: () => finishPost() };
  }
  const renderHome = () => render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}><Home /></SWRConfig>);
  async function confirmYes() {
    await screen.findByText(/Tomar ahora/);
    await fireEvent.press(screen.getByText("Sí"));
    await fireEvent.press(screen.getAllByText("Sí").at(-1)!);
  }

  it("dado que la API tarda en responder, cuando se confirma con Sí, entonces la toma se muestra como tomada enseguida, sin esperar a la API", async () => {
    const { finishPost } = setup();
    await renderHome();
    await confirmYes();
    await waitFor(() => expect(screen.queryByText(/Tomar ahora/)).toBeNull());
    finishPost();
  });

  it("dado que la API rechaza el registro, cuando se confirma con Sí, entonces la toma vuelve a quedar pendiente y se avisa del error", async () => {
    const { finishPost } = setup({ postFails: true });
    await renderHome();
    await confirmYes();
    await waitFor(() => expect(screen.queryByText(/Tomar ahora/)).toBeNull());
    finishPost();
    await screen.findByText("No pudimos registrar la toma.");
    expect(screen.getByText(/Tomar ahora/)).toBeTruthy();
  });
});
