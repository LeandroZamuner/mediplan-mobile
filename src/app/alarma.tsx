import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { formatTime } from "@/lib/dates";
import { recordTaken } from "@/lib/doses";
import { takeFromAlarm } from "@/notifications/alarm-events";
import { silenceNativeDose } from "@/notifications/native-alarm";
import { type } from "@/theme/typography";
import { Button } from "@/ui/Button";
import { GradientScreen } from "@/ui/GradientScreen";
import { Text } from "@/ui/Text";

/** Pantalla completa de la alarma Fuerte: se abre sobre el bloqueo con el medicamento y los botones grandes. */
export default function Alarma() {
  const p = useLocalSearchParams<{ planId: string; medicationId: string; scheduledAt: string; title: string; body: string; dose?: string; repeat?: string }>();
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dose = { planId: p.planId, medicationId: p.medicationId, scheduledAt: p.scheduledAt };

  const goHome = () => router.replace("/");

  async function taken() {
    setBusy(true);
    setError("");
    try {
      await takeFromAlarm({ ...dose, title: p.title, body: p.body, dose: p.dose ?? p.body, repeat: Number(p.repeat ?? 0) }, recordTaken); // al registrarla se apaga la alarma y sus repeticiones
      await silenceNativeDose(dose);
      goHome();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : "No pudimos registrar la toma. Probá de nuevo.");
    }
  }

  async function postpone() {
    await silenceNativeDose(dose); // las repeticiones programadas la vuelven a hacer sonar
    goHome();
  }

  return (
    <GradientScreen style={s.body}>
      <View style={s.icon}>
        <Feather name="bell" size={44} color="#fff" />
      </View>
      <Text style={s.small}>Hora de tu medicación</Text>
      <Text style={s.title}>{p.title}</Text>
      {p.dose || p.body ? <Text style={s.dose}>{p.dose ?? p.body}</Text> : null}
      {p.scheduledAt ? <Text style={s.small}>Programada para las {formatTime(p.scheduledAt, tz)}</Text> : null}
      {Number(p.repeat ?? 0) > 0 ? <Text style={s.again}>Todavía no registraste esta toma.</Text> : null}
      {error ? <Text style={s.error}>{error}</Text> : null}
      <View style={s.actions}>
        <Button title="Tomé" variant="soft" loading={busy} onPress={() => void taken()} />
        <Pressable accessibilityRole="button" onPress={() => void postpone()} disabled={busy} style={s.later}>
          <Text style={s.laterText}>Posponer</Text>
        </Pressable>
        <Text style={s.hint}>Si no la registrás, vuelve a sonar en unos minutos.</Text>
      </View>
    </GradientScreen>
  );
}

const s = StyleSheet.create({
  body: { justifyContent: "center", alignItems: "center", gap: 10 },
  icon: { width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  title: { ...type.title, color: "#fff", textAlign: "center" },
  dose: { ...type.h2, color: "#fff", textAlign: "center" },
  small: { ...type.body, color: "#C9CDEB", textAlign: "center" },
  again: { ...type.body, color: "#FFD1D8", textAlign: "center", marginTop: 4 },
  error: { ...type.body, color: "#FFD1D8", textAlign: "center" },
  actions: { alignSelf: "stretch", gap: 12, marginTop: 28 },
  later: { height: 48, alignItems: "center", justifyContent: "center" },
  laterText: { ...type.body, color: "#fff", fontWeight: "600" },
  hint: { ...type.small, color: "#C9CDEB", textAlign: "center" },
});
