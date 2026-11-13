import { api } from "./api";
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
