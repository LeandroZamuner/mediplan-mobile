import { useEffect, useState, type ReactNode } from "react";
import { AppState } from "react-native";
import { SWRConfig } from "swr";
import { loadPersisted, savePersisted } from "./swr-cache";

/** Caché global de SWR: persistida en el celular, y que se refresca al volver a la app (no con la app en segundo plano). */
export const swrCache = new Map<string, unknown>();

export function SwrProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void loadPersisted().then((entries) => {
      for (const [k, v] of entries) if (!swrCache.has(k)) swrCache.set(k, v);
      setReady(true);
    });
    const sub = AppState.addEventListener("change", (s) => {
      if (s !== "active") void savePersisted(swrCache);
    });
    return () => sub.remove();
  }, []);

  if (!ready) return null; // sigue visible la pantalla de arranque
  return (
    <SWRConfig
      value={{
        provider: () => swrCache as Map<string, never>,
        isVisible: () => AppState.currentState === "active",
        initFocus(callback) {
          const sub = AppState.addEventListener("change", (s) => s === "active" && callback());
          return () => sub.remove();
        },
        dedupingInterval: 5000,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
