import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet } from "react-native";
import { Text } from "@/ui/Text";
import { alarmWarning, readAlarmStatus } from "@/notifications/permissions";
import { radius } from "@/theme/tokens";

/** Aviso en Inicio cuando los recordatorios pueden fallar (permisos apagados). Toca para arreglarlo. */
export function AlarmBanner() {
  const [msg, setMsg] = useState<string | null>(null);
  const check = useCallback(() => {
    void readAlarmStatus().then((s) => setMsg(alarmWarning(s)));
  }, []);
  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (s) => s === "active" && check());
    return () => sub.remove();
  }, [check]);
  if (!msg) return null;
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push("/ajustes-notificaciones")} style={s.box}>
      <Feather name="alert-triangle" size={18} color="#3a2f00" />
      <Text style={s.text}>{msg}</Text>
      <Feather name="chevron-right" size={18} color="#3a2f00" />
    </Pressable>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF3CD", borderRadius: radius.md, padding: 12 },
  text: { flex: 1, fontSize: 13, color: "#3a2f00" },
});
