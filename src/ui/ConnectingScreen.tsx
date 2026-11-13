import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { GradientScreen } from "@/ui/GradientScreen";
import { Text } from "@/ui/Text";

/** Pasa a true cuando `active` lleva más de `ms` sin terminar. */
export function useSlowAfter(active: boolean, ms: number): boolean {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => setSlow(true), ms);
    return () => {
      clearTimeout(t);
      setSlow(false);
    };
  }, [active, ms]);
  return active && slow;
}

/** Se muestra si abrir la sesión tarda: el servidor gratuito se duerme y la primera vez demora cerca de un minuto. */
export function ConnectingScreen() {
  return (
    <GradientScreen style={s.center}>
      <ActivityIndicator color="#fff" size="large" />
      <Text style={s.title}>Conectando con MediPlan…</Text>
      <Text style={s.body}>El servidor se estaba despertando y puede tardar hasta un minuto la primera vez. No cierres la app.</Text>
    </GradientScreen>
  );
}

const s = StyleSheet.create({
  center: { justifyContent: "center", alignItems: "center", gap: 12 },
  title: { color: "#fff", fontSize: 20, fontWeight: "600", textAlign: "center" },
  body: { color: "#C9CDEB", fontSize: 13, lineHeight: 19, textAlign: "center" },
});
