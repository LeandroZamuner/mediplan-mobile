import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { AppState, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/ui/Text";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadAlarmLevel } from "@/notifications/alarm-level";
import { isSnoozed } from "@/notifications/banner-snooze";
import { alarmWarning, readAlarmStatus } from "@/notifications/permissions";
import { radius } from "@/theme/tokens";

const SNOOZE_KEY = "mediplan.alarm-banner-dismissed";

/** Aviso en Inicio cuando los recordatorios pueden fallar (permisos apagados). Toca para arreglarlo. */
export function AlarmBanner() {
  const [msg, setMsg] = useState<string | null>(null);
  const check = useCallback(() => {
    void Promise.all([readAlarmStatus(), AsyncStorage.getItem(SNOOZE_KEY).catch(() => null), loadAlarmLevel()]).then(([s, dismissed, level]) => setMsg(isSnoozed(dismissed, Date.now()) ? null : alarmWarning(s, level)));
  }, []);
  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (s) => s === "active" && check());
    return () => sub.remove();
  }, [check]);
  if (!msg) return null;
  return (
    <View style={s.box}>
      <Pressable accessibilityRole="button" onPress={() => router.push("/ajustes-notificaciones")} style={s.main}>
        <Feather name="alert-triangle" size={18} color="#3a2f00" />
        <Text style={s.text}>{msg}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Ocultar por hoy" hitSlop={12} onPress={() => { setMsg(null); void AsyncStorage.setItem(SNOOZE_KEY, String(Date.now())).catch(() => {}); }}>
        <Feather name="x" size={18} color="#3a2f00" />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  box: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF3CD", borderRadius: radius.md, padding: 12 },
  main: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  text: { flex: 1, fontSize: 13, color: "#3a2f00" },
});
