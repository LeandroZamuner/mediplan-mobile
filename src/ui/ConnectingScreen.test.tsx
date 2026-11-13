import { act, renderHook, render, screen } from "@testing-library/react-native";
import { ConnectingScreen, useSlowAfter } from "./ConnectingScreen";

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

describe("useSlowAfter", () => {
  it("dado que algo sigue cargando, cuando pasan más de 4 s, entonces avisa que tarda", async () => {
    const { result } = await renderHook(() => useSlowAfter(true, 4000));
    expect(result.current).toBe(false);
    await act(async () => { jest.advanceTimersByTime(4100); });
    expect(result.current).toBe(true);
  });

  it("dado que termina de cargar antes de tiempo, entonces nunca avisa", async () => {
    const { result, rerender } = await renderHook((p: { on: boolean }) => useSlowAfter(p.on, 4000), { initialProps: { on: true } });
    await act(async () => { jest.advanceTimersByTime(2000); });
    await rerender({ on: false });
    await act(async () => { jest.advanceTimersByTime(5000); });
    expect(result.current).toBe(false);
  });
});

it("la pantalla de conexión explica que el servidor puede estar despertando", async () => {
  await render(<ConnectingScreen />);
  expect(screen.getByText(/despertando/i)).toBeTruthy();
});
