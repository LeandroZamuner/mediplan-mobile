import { firebaseAuth } from "@/lib/firebase";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

type Options = Omit<RequestInit, "body"> & { json?: unknown };

/** Llama a la API de MediPlan con el token de la sesión de Firebase. Las rutas empiezan con "/" (sin /api/v1). */
export async function api<T>(path: string, { json, ...init }: Options = {}): Promise<T> {
  const headers = new Headers(init.headers);
  // La sesión se restaura de forma asíncrona: si la app se abrió desde una alarma, hay que esperarla antes de pedir el token.
  const auth = firebaseAuth();
  await auth.authStateReady();
  const user = auth.currentUser;
  if (user) headers.set("Authorization", `Bearer ${await user.getIdToken()}`);
  let body: string | undefined;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(json);
  }
  const res = await fetch(`${API_URL}/api/v1${path}`, { ...init, headers, body });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data?.error ?? "Ocurrió un error inesperado");
  return data as T;
}
