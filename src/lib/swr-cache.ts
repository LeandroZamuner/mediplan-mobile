import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "mediplan.swr-cache.v1";

/** Respuestas que se guardan en el celular para abrir la app al instante y sin internet. */
export const PERSIST_KEYS = ["/plans", "/plans/supervised", "/invitations", "/notifications"];

export function pickPersistable(entries: Iterable<[string, unknown]>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of entries) {
    const data = (value as { data?: unknown } | undefined)?.data;
    if (PERSIST_KEYS.includes(key) && data !== undefined) out[key] = data;
  }
  return out;
}

export function restoreEntries(json: string | null): [string, { data: unknown }][] {
  if (!json) return [];
  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    return Object.entries(obj).filter(([k]) => PERSIST_KEYS.includes(k)).map(([k, data]) => [k, { data }]);
  } catch {
    return [];
  }
}

export async function loadPersisted(): Promise<[string, { data: unknown }][]> {
  return restoreEntries(await AsyncStorage.getItem(STORAGE_KEY).catch(() => null));
}

export async function savePersisted(cache: Map<string, unknown>): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pickPersistable(cache.entries()))).catch(() => {});
}

/** Al cerrar sesión: nada de datos de salud de la persona anterior en el celular. */
export async function clearPersisted(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}
