import { api, API_TIMEOUT_MS } from "./api";
import { firebaseAuth } from "@/lib/firebase";

jest.mock("@/lib/firebase", () => ({ firebaseAuth: jest.fn() }));

const fetchMock = jest.fn();
beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ ok: 1 }) });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe("api", () => {
  it("dada una sesión que todavía se está restaurando (app abierta desde una alarma), cuando se llama a la API, entonces espera a que esté lista y manda el token", async () => {
    let user: { getIdToken: () => Promise<string> } | null = null;
    (firebaseAuth as jest.Mock).mockReturnValue({
      authStateReady: async () => {
        user = { getIdToken: async () => "token-123" };
      },
      get currentUser() {
        return user;
      },
    });
    await api("/me");
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer token-123");
  });

  it("dada una sesión cerrada, cuando se llama a la API, entonces no manda token", async () => {
    (firebaseAuth as jest.Mock).mockReturnValue({ authStateReady: async () => {}, currentUser: null });
    await api("/me");
    expect((fetchMock.mock.calls[0][1].headers as Headers).has("Authorization")).toBe(false);
  });
});

describe("api con el servidor que no contesta", () => {
  it("dado un servidor que nunca responde, cuando pasa el tiempo máximo, entonces corta y falla como error de conexión (para que las tomas queden en cola y salga 'Reintentar')", async () => {
    jest.useFakeTimers();
    (firebaseAuth as jest.Mock).mockReturnValue({ authStateReady: async () => {}, currentUser: null });
    fetchMock.mockImplementation((_url: string, init: { signal: AbortSignal }) => new Promise((_, reject) => init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")))));
    const result = api("/me").catch((e) => e);
    await jest.advanceTimersByTimeAsync(API_TIMEOUT_MS + 100);
    const err = await result;
    expect(err).toBeInstanceOf(TypeError);
    expect((err as Error).message).toMatch(/tardó demasiado/);
    jest.useRealTimers();
  });
});
