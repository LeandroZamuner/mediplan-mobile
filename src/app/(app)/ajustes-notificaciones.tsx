import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, ScrollView, StyleSheet } from "react-native";
import { Text } from "@/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { alarmWarning, readAlarmStatus, requestExactAlarms, scheduleTestNotification, type AlarmStatus } from "@/notifications/permissions";
import { colors } from "@/theme/tokens";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { Button } from "@/ui/Button";

export default function AjustesNotificaciones() {
  const [status, setStatus] = useState<AlarmStatus | null>(null);
  const [sent, setSent] = useState(false);
  const refresh = useCallback(() => void readAlarmStatus().then(setStatus), []);
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener("change", (s) => s === "active" && refresh());
    return () => sub.remove();
  }, [refresh]);

  async function enable() {
    const p = await Notifications.requestPermissionsAsync();
    if (!p.granted) await Linking.openSettings();
    refresh();
  }

  const warning = status ? alarmWarning(status) : null;
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <ScreenHeader title="Configurar notificaciones" />
        <Text style={s.muted}>Los recordatorios de cada toma suenan en tu celular aunque no tengas internet.</Text>

        <Text style={s.h2}>Estado</Text>
        <Text style={s.status}>{status === null ? "Revisando…" : warning ?? "Todo en orden: los recordatorios van a sonar a la hora indicada."}</Text>

        {status && !status.notifications ? <Button title="Activar notificaciones" onPress={() => void enable()} /> : null}
        {status && status.notifications && status.exactAlarms === false ? <Button title="Permitir alarmas exactas" onPress={() => void requestExactAlarms().then(refresh)} /> : null}

        <Text style={s.h2}>Probar</Text>
        <Text style={s.muted}>Mandamos una notificación en 5 segundos para que compruebes que suena.</Text>
        <Button title="Probar notificación" variant="soft" onPress={() => void scheduleTestNotification().then(() => setSent(true))} />
        {sent ? <Text style={s.muted}>Enviada: debería llegar en unos segundos. Si no la ves, revisá los ajustes del sistema.</Text> : null}

        <Text style={s.h2}>Si los recordatorios no suenan</Text>
        <Text style={s.muted}>En algunos celulares (Xiaomi, Samsung, Huawei) el ahorro de batería cierra las apps. Buscá MediPlan en los ajustes del sistema y elegí “Sin restricciones” en la batería.</Text>
        <Button title="Abrir ajustes del sistema" variant="neutral" onPress={() => void Linking.openSettings()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12 },
  title: { fontSize: 24, color: colors.text, marginTop: 8 },
  h2: { fontSize: 17, color: colors.text, marginTop: 12 },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  status: { fontSize: 14, color: colors.text },
});
