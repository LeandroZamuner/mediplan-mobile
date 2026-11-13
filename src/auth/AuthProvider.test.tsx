import { render, screen, waitFor, act } from "@testing-library/react-native";
import { Text } from "react-native";
import { AuthProvider, useAuth } from "./AuthProvider";
import { api } from "@/lib/api";

let emit: (u: unknown) => void = () => {};
jest.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, cb: (u: unknown) => void) => {
    emit = cb;
    return () => {};
  },
  signOut: jest.fn(),
}));
jest.mock("@/lib/firebase", () => ({ firebaseAuth: () => ({ currentUser: null }) }));
jest.mock("@/lib/api", () => ({ api: jest.fn(), ApiError: class extends Error {} }));
jest.mock("swr", () => ({ useSWRConfig: () => ({ mutate: jest.fn() }) }));
jest.mock("@/lib/swr-cache", () => ({ clearPersisted: jest.fn() }));

function Status() {
  return <Text testID="status">{useAuth().status}</Text>;
}

const verifiedUser = { uid: "u1", emailVerified: true, reload: async () => {}, getIdToken: async () => "t" };

it("dado que la carga de una sesión es lenta, cuando la persona sale de la cuenta antes de que termine, entonces la carga vieja no deja la app como si siguiera adentro", async () => {
  let finishMe: (v: unknown) => void = () => {};
  (api as jest.Mock).mockImplementation((path: string) => {
    if (path === "/me") return new Promise((resolve) => (finishMe = resolve));
    return Promise.resolve([]);
  });
  await render(<AuthProvider><Status /></AuthProvider>);
  await act(async () => emit(verifiedUser)); // empieza a cargar y queda esperando a la API
  await act(async () => emit(null)); // sale de la cuenta
  await waitFor(() => expect(screen.getByTestId("status").props.children).toBe("signedOut"));
  await act(async () => finishMe({ id: "u1", email: "a@b.com", role: "patient", timezone: "UTC" })); // llega tarde la respuesta vieja
  expect(screen.getByTestId("status").props.children).toBe("signedOut");
});
