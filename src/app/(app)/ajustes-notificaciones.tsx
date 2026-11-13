import { Feather } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import { useCallback, useEffect, useState } from "react";
import { AppState, Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { usePlans } from "@/features/usePlans";
import { useTodayDoses } from "@/lib/doses";
import { loadAlarmLevel, saveAlarmLevel } from "@/notifications/alarm-level";
import { alarmWarning, openFullScreenSettings, readAlarmStatus, requestExactAlarms, scheduleTestNotification, type AlarmStatus } from "@/notifications/permissions";
import { refreshAlarms } from "@/notifications/reminders";
import { REPEAT_EVERY_MIN, REPEAT_UNTIL_MIN, type AlarmLevel } from "@/notifications/repeats";
import { colors, radius } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { Button } from "@/ui/Button";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { SectionTitle } from "@/ui/SectionTitle";
import { Text } from "@/ui/Text";

const LEVELS: { key: AlarmLevel; title: string; text: string; icon: "bell" | "volume-2" }[] = [
  { key: "normal", title: "Normal", icon: "bell", text: `Notificación común. Si no marcás “Tomé”, se repite cada ${REPEAT_EVERY_MIN} minutos durante ${REPEAT_UNTIL_MIN} minutos.` },
  { key: "fuerte", title: "Fuerte", icon: "volume-2", text: `Suena como una alarma de verdad, también con el celular en vibrar, hasta que la atiendas. Se abre en pantalla completa aunque el celular esté bloqueado, con los botones “Tomé” y “Posponer”. Si no la registrás, vuelve a sonar cada ${REPEAT_EVERY_MIN} minutos durante ${REPEAT_UNTIL_MIN} minutos.` },
];

export default function AjustesNotificaciones() {
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const plans = usePlans();
  const doses = useTodayDoses(plans.data, tz);
  const [status, setStatus] = useState<AlarmStatus | null>(null);
  const [level, setLevel] = useState<AlarmLevel>("normal");
  const [sent, setSent] = useState(false);
  const refresh = useCallback(() => void readAlarmStatus().then(setStatus), []);

  useEffect(() => {
    refresh();
    void loadAlarmLevel().then(setLevel);
    const sub = AppState.addEventListener("change", (s) => s === "active" && refresh());
    return () => sub.remove();
  }, [refresh]);

  async function choose(next: AlarmLevel) {
    setLevel(next);
    setSent(false);
    await saveAlarmLevel(next);
    // El nivel cambia el canal y las repeticiones: se reprograman las alarmas ya con el nivel nuevo.
    if (plans.data) await refreshAlarms(plans.data, tz, doses.data ?? []);
  }

  async function enable() {
    const p = await Notifications.requestPermissionsAsync();
    if (!p.granted) await Linking.openSettings();
    refresh();
  }

  const warning = status ? alarmWarning(status, level) : null;
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <ScreenHeader title="Configurar notificaciones" subtitle="Los recordatorios de cada toma suenan en tu celular aunque no tengas internet." />

        <SectionTitle>Estado</SectionTitle>
        <Text style={s.body}>{status === null ? "Revisando…" : warning ?? "Todo en orden: los recordatorios van a sonar a la hora indicada."}</Text>
        {status && !status.notifications ? <Button title="Activar notificaciones" onPress={() => void enable()} /> : null}
        {status && status.notifications && status.exactAlarms === false ? <Button title="Permitir alarmas exactas" onPress={() => void requestExactAlarms().then(refresh)} /> : null}
        {status && status.notifications && status.exactAlarms !== false && level === "fuerte" && status.fullScreen === false ? (
          <Button title="Permitir pantalla completa" onPress={() => void openFullScreenSettings().then(refresh)} />
        ) : null}

        <SectionTitle>Tipo de alarma</SectionTitle>
        {LEVELS.map((l) => {
          const on = level === l.key;
          return (
            <Pressable key={l.key} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => void choose(l.key)} style={[s.option, on && s.optionOn]}>
              <View style={[s.iconBox, on && { backgroundColor: colors.primary }]}>
                <Feather name={l.icon} size={20} color={on ? "#fff" : colors.primary} />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.optionTitle}>{l.title}</Text>
                <Text style={s.small}>{l.text}</Text>
              </View>
              {on ? <Feather name="check-circle" size={20} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
        {level === "fuerte" ? <Text style={s.small}>Si tu celular está en “No molestar”, permití las alarmas en los ajustes del sistema para que suene igual.</Text> : null}

        <SectionTitle>Probar</SectionTitle>
        <Text style={s.small}>Mandamos una notificación en 5 segundos con el sonido del tipo elegido.</Text>
        <Button title="Probar notificación" variant="soft" onPress={() => void scheduleTestNotification(level).then(() => setSent(true))} />
        {sent ? <Text style={s.small}>Enviada: debería llegar en unos segundos. Si no la ves, revisá los ajustes del sistema.</Text> : null}

        <SectionTitle>Si los recordatorios no suenan</SectionTitle>
        <Text style={s.small}>En algunos celulares (Xiaomi, Samsung, Huawei) el ahorro de batería cierra las apps. Buscá MediPlan en los ajustes del sistema y elegí “Sin restricciones” en la batería.</Text>
        <Button title="Abrir ajustes del sistema" variant="neutral" onPress={() => void Linking.openSettings()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12, paddingBottom: 32 },
  body: { ...type.body, color: colors.text },
  small: { ...type.small, color: colors.textMuted, lineHeight: 18 },
  option: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, borderWidth: 2, borderColor: "transparent" },
  optionOn: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  optionTitle: { ...type.h3, color: colors.text },
});
