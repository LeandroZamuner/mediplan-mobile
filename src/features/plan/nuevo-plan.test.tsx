import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import NewPlan from "@/app/plan/nuevo";
import { api } from "@/lib/api";
import { refreshAlarms, saveReminderOffsets } from "@/notifications/reminders";

let mockParams: { planId?: string } = {};
jest.mock("expo-router", () => ({ router: { back: jest.fn() }, useLocalSearchParams: () => mockParams }));
jest.mock("swr", () => ({ useSWRConfig: () => ({ mutate: jest.fn().mockResolvedValue([]) }) }));
jest.mock("@/auth/AuthProvider", () => ({ useAuth: () => ({ me: { timezone: "America/Argentina/Buenos_Aires" } }) }));
jest.mock("@/lib/api", () => ({ api: jest.fn() }));
jest.mock("@/notifications/permissions", () => ({ askExactAlarmsOnce: jest.fn() }));
jest.mock("@/notifications/reminders", () => ({ refreshAlarms: jest.fn(), saveReminderOffsets: jest.fn() }));

beforeEach(() => {
  mockParams = {};
  jest.clearAllMocks();
});

async function fillWizardWith5MinReminder() {
  await render(<NewPlan />);
  await fireEvent.changeText(screen.getByPlaceholderText("Ej: Paracetamol"), "Ibuprofeno");
  await fireEvent.changeText(screen.getByPlaceholderText("Ej: 500 mg"), "400 mg");
  await fireEvent.changeText(screen.getByPlaceholderText("Ej: 18"), "10");
  await fireEvent.press(screen.getByText("Siguiente"));
  await fireEvent.press(screen.getByText("Ej: Cada 12 horas"));
  await fireEvent.press(screen.getByText("Cada 8 horas"));
  await fireEvent.press(screen.getByText("Seleccione una opción"));
  await fireEvent.press(screen.getByText("5 min antes"));
  await fireEvent.press(screen.getByText("Siguiente"));
}

it("dado un medicamento con 'Recordatorio: 5 min antes', cuando se guarda el plan, entonces se guarda la anticipación con el id que devolvió la API", async () => {
  (api as jest.Mock).mockResolvedValue({ id: "p1", medications: [{ id: "med-1" }] });
  await render(<NewPlan />);
  await fireEvent.changeText(screen.getByPlaceholderText("Ej: Paracetamol"), "Ibuprofeno");
  await fireEvent.changeText(screen.getByPlaceholderText("Ej: 500 mg"), "400 mg");
  await fireEvent.changeText(screen.getByPlaceholderText("Ej: 18"), "10");
  await fireEvent.press(screen.getByText("Siguiente"));
  await fireEvent.press(screen.getByText("Ej: Cada 12 horas"));
  await fireEvent.press(screen.getByText("Cada 8 horas"));
  await fireEvent.press(screen.getByText("Seleccione una opción"));
  await fireEvent.press(screen.getByText("5 min antes"));
  await fireEvent.press(screen.getByText("Siguiente"));
  await fireEvent.press(screen.getByText("Guardar plan de tratamiento"));
  await waitFor(() => expect(saveReminderOffsets).toHaveBeenCalled());
  expect(saveReminderOffsets).toHaveBeenCalledWith({ "med-1": 5 });
  expect(refreshAlarms).toHaveBeenCalled();
});

it("dado un medicamento agregado a un plan que ya existe, cuando se guarda, entonces la anticipación queda con el id del medicamento nuevo y no con el del plan (la API devuelve el plan completo)", async () => {
  mockParams = { planId: "plan-1" };
  (api as jest.Mock).mockResolvedValue({ id: "plan-1", medications: [{ id: "med-viejo" }, { id: "med-nuevo" }] });
  await fillWizardWith5MinReminder();
  await fireEvent.press(screen.getByText("Guardar medicamentos"));
  await waitFor(() => expect(saveReminderOffsets).toHaveBeenCalled());
  expect(saveReminderOffsets).toHaveBeenCalledWith({ "med-nuevo": 5 });
});
