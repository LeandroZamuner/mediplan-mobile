import { Feather } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { dueDose } from "@/lib/due";
import { formatTime } from "@/lib/dates";
import { recordTaken, stockLevel, useTodayDoses, type TodayDose } from "@/lib/doses";
import { DoseRow } from "@/features/DoseRow";
import { useCaregivers, usePlans } from "@/features/usePlans";
import { refreshAlarms } from "@/notifications/reminders";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";

/** Home del paciente: toma pendiente, próximas tomas, alerta de stock y cuidadores. */
export default function Home() {
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const plans = usePlans();
  const doses = useTodayDoses(plans.data, tz);
  const [asking, setAsking] = useState<TodayDose | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [toast, setToast] = useState("");

  // Al abrir la app (y cuando cambian los planes) se reprograman las alarmas locales.
  useEffect(() => {
    if (plans.data) void refreshAlarms(plans.data, tz);
  }, [plans.data, tz]);

  const planId = plans.data?.find((p) => p.status === "active")?.id;
  const caregivers = useCaregivers(planId);
  const accepted = caregivers.data?.filter((c) => c.status === "accepted") ?? [];

  const list = doses.data ?? [];
  const [now] = useState(() => new Date());
  const due = dueDose(list, now);
  const low = (plans.data ?? [])
    .filter((p) => p.status === "active")
    .flatMap((p) => p.medications.filter((m) => stockLevel(m.stockUnits, m.stockAlertAt) !== "ok"));

  async function confirm() {
    if (!asking) return;
    const d = asking;
    setAsking(null);
    try {
      await recordTaken(d.planId, d.medicationId, d.scheduledAt);
      await doses.mutate();
      if (accepted.length) {
        setToast("Ya enviamos una notificación a tus cuidadores.");
        setTimeout(() => setToast(""), 4000);
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : "No pudimos registrar la toma.");
      setTimeout(() => setToast(""), 4000);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        {!dismissed && low.length > 0 && (
          <View style={s.alert}>
            <View style={s.alertHead}>
              <Text style={s.alertTitle}>¡Atención!</Text>
              <Pressable accessibilityLabel="Cerrar" onPress={() => setDismissed(true)}>
                <Feather name="x" size={18} color="#fff" />
              </Pressable>
            </View>
            <Text style={s.alertText}>
              {low.length === 1
                ? `Quedan pocos comprimidos (${low[0].stockUnits}) de ${low[0].name} ${low[0].dose}`
                : `Hay ${low.length} medicamentos con stock bajo`}
            </Text>
          </View>
        )}

        {due && (
          <View style={s.hero}>
            <Text style={s.heroSmall}>Programado para hoy a las {formatTime(due.scheduledAt, tz)}</Text>
            <Text style={s.heroTitle}>Tomar ahora:{"\n"}{due.medicationName} {due.dose}</Text>
            <Text style={s.heroSmall}>¿Tomó su medicación?</Text>
            <View style={s.heroActions}>
              <View style={{ flex: 1 }}><Button title="No" variant="soft" onPress={() => undefined} /></View>
              <View style={{ flex: 1 }}><Button title="Sí" variant="soft" onPress={() => setAsking(due)} /></View>
            </View>
          </View>
        )}

        <Text style={s.h2}>Próxima toma de medicamentos</Text>
        {plans.isLoading || doses.isLoading ? (
          <Text style={s.muted}>Cargando…</Text>
        ) : list.length === 0 ? (
          <Text style={s.muted}>No tenés tomas programadas para hoy.</Text>
        ) : (
          <View style={s.list}>
            {list.map((d) => (
              <DoseRow key={d.scheduledAt + d.medicationId} dose={d} tz={tz} onToggle={() => setAsking(d)} />
            ))}
          </View>
        )}

        <Text style={s.h2}>Familiar y cuidadores</Text>
        <Text style={s.muted}>
          {accepted.length ? "Enviaremos una notificación a estas personas para que estén pendientes de su medicación." : "Todavía no agregaste cuidadores. Podés hacerlo desde tu perfil."}
        </Text>
        <View style={s.people}>
          {accepted.map((c) => (
            <View key={c.id} style={s.person}>
              <Text style={s.personText}>{c.email}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {toast ? (
        <View style={s.toast}>
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={s.toastText}>{toast}</Text>
        </View>
      ) : null}

      <ConfirmModal
        visible={!!asking}
        title="¿Tomaste este medicamento?"
        message={asking ? `Si ya tomó el medicamento ${asking.medicationName} ${asking.dose} a las ${formatTime(asking.scheduledAt, tz)} pulse el botón Sí.\n\nSe notificará a sus cuidadores sobre el avance en su tratamiento.` : ""}
        cancelLabel="No, cancelar"
        confirmLabel="Sí"
        onCancel={() => setAsking(null)}
        onConfirm={() => void confirm()}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  h2: { fontSize: 18, color: colors.text, marginTop: 8 },
  muted: { fontSize: 12, color: colors.textMuted },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 12 },
  hero: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16, gap: 8 },
  heroSmall: { color: "#E0E3F5", fontSize: 12 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  heroActions: { flexDirection: "row", gap: 8 },
  alert: { backgroundColor: colors.danger, borderRadius: radius.lg, padding: 14, gap: 6 },
  alertHead: { flexDirection: "row", justifyContent: "space-between" },
  alertTitle: { color: "#fff", fontWeight: "700" },
  alertText: { color: "#fff", fontSize: 13 },
  people: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  person: { backgroundColor: colors.surface, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  personText: { fontSize: 12, color: colors.text },
  toast: { position: "absolute", left: 16, right: 16, bottom: 16, backgroundColor: colors.success, borderRadius: radius.md, padding: 14, flexDirection: "row", gap: 10, alignItems: "center" },
  toastText: { color: "#fff", flex: 1, fontSize: 13 },
});
