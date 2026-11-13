import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/ui/Text";
import { useAuth } from "@/auth/AuthProvider";
import { dueDose } from "@/lib/due";
import { dtf } from "@/lib/intl";
import { whenLabel } from "@/lib/when";
import { TabScreen } from "@/ui/TabScreen";
import { formatTime } from "@/lib/dates";
import { recordTaken, stockLevel, useTodayDoses, type TodayDose } from "@/lib/doses";
import { DoseRow } from "@/features/DoseRow";
import { useCaregivers, usePlans } from "@/features/usePlans";
import * as Haptics from "expo-haptics";
import { todayProgress } from "@/lib/progress";
import { refreshAlarms } from "@/notifications/reminders";
import { AlarmBanner } from "@/ui/AlarmBanner";
import { colors, radius } from "@/theme/tokens";
import { Avatar } from "@/ui/Avatar";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";

/** Home del paciente: toma pendiente, próximas tomas, alerta de stock y cuidadores. */
export default function Home() {
  const { me, firebaseUser } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const plans = usePlans();
  const doses = useTodayDoses(plans.data, tz);
  const [asking, setAsking] = useState<TodayDose | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [toast, setToast] = useState("");

  // Al abrir la app (y cuando cambian los planes) se reprograman las alarmas locales, ya sabiendo qué tomas están registradas
  // (si no, se programarían alarmas de tomas ya tomadas). Sin internet las tomas salen de la copia guardada.
  const dosesKnown = doses.data !== undefined || !!doses.error;
  useEffect(() => {
    if (plans.data && dosesKnown) void refreshAlarms(plans.data, tz, doses.data ?? []);
  }, [plans.data, doses.data, dosesKnown, tz]);

  const planId = plans.data?.find((p) => p.status === "active")?.id;
  const caregivers = useCaregivers(planId);
  const accepted = caregivers.data?.filter((c) => c.status === "accepted") ?? [];

  const list = doses.data ?? [];
  const [now] = useState(() => new Date());
  const progress = todayProgress(list, tz, now);
  const due = dueDose(list, now);
  const next = list.find((d) => d.status === "pending" && new Date(d.scheduledAt).getTime() >= now.getTime());
  const first = (firebaseUser?.displayName || me?.email.split("@")[0] || "").split(" ")[0];
  const dateText = dtf("es-AR", { timeZone: tz, weekday: "long", day: "numeric", month: "long" }).format(now);
  const subtitle = `${dateText[0].toUpperCase()}${dateText.slice(1)}${progress.total > 0 ? ` · Hoy: ${progress.taken} de ${progress.total} ${progress.total === 1 ? "toma" : "tomas"}` : ""}`;
  const low = (plans.data ?? [])
    .filter((p) => p.status === "active")
    .flatMap((p) => p.medications.filter((m) => stockLevel(m.stockUnits, m.stockAlertAt) !== "ok"));

  async function confirm() {
    if (!asking) return;
    const d = asking;
    setAsking(null);
    const isThis = (x: TodayDose) => x.scheduledAt === d.scheduledAt && x.medicationId === d.medicationId;
    const before = doses.data;
    // Se marca como tomada al instante: la API (sobre todo si está despertando) puede tardar varios segundos y parecía que no pasaba nada.
    await doses.mutate((cur) => cur?.map((x) => (isThis(x) ? { ...x, status: "taken" as const } : x)), { revalidate: false });
    try {
      const result = await recordTaken(d.planId, d.medicationId, d.scheduledAt);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (result === "queued") {
        // Sin internet: queda como tomada y se envía sola cuando vuelva la conexión.
        setToast("Sin conexión: guardamos tu toma y la enviamos cuando vuelva internet.");
        setTimeout(() => setToast(""), 5000);
        return;
      }
      await doses.mutate();
      if (accepted.length) {
        setToast("Ya enviamos una notificación a tus cuidadores.");
        setTimeout(() => setToast(""), 4000);
      }
    } catch (e) {
      await doses.mutate(before, { revalidate: false }); // no se pudo registrar: vuelve a figurar pendiente
      setToast(e instanceof Error ? e.message : "No pudimos registrar la toma.");
      setTimeout(() => setToast(""), 4000);
    }
  }

  const hero = due ? (
    <View style={s.hero}>
      <Text style={s.heroSmall}>Programado para hoy a las {formatTime(due.scheduledAt, tz)}</Text>
      <Text style={s.heroTitle}>Tomar ahora:{"\n"}{due.medicationName} {due.dose}</Text>
      <Text style={s.heroSmall}>¿Tomó su medicación?</Text>
      <View style={s.heroActions}>
        <View style={{ flex: 1 }}><Button title="No" variant="soft" onPress={() => undefined} /></View>
        <View style={{ flex: 1 }}><Button title="Sí" variant="soft" onPress={() => setAsking(due)} /></View>
      </View>
    </View>
  ) : next ? (
    <View style={s.hero}>
      <Text style={s.heroSmall}>Próxima toma</Text>
      <Text style={s.heroTitle}>{next.medicationName} {next.dose}</Text>
      <Text style={s.heroSmall}>{whenLabel(next.scheduledAt, tz, now)}</Text>
    </View>
  ) : null;

  return (
    <>
      <TabScreen title={first ? `Hola, ${first}` : "Hola"} subtitle={subtitle} hero={hero}>
        <AlarmBanner />
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

        <Text style={s.h2}>Próxima toma de medicamentos</Text>
        {plans.isLoading || doses.isLoading ? (
          <Text style={s.muted}>Cargando…</Text>
        ) : list.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.muted}>{(plans.data ?? []).some((p) => p.status === "active") ? "No tenés tomas programadas para los próximos días." : "Todavía no tenés un plan de tratamiento."}</Text>
            {(plans.data ?? []).some((p) => p.status === "active") ? null : <Button title="Crear plan de tratamiento" onPress={() => router.push("/plan/nuevo")} />}
          </View>
        ) : (
          <View style={s.list}>
            {list.slice(0, 4).map((d) => (
              <DoseRow key={d.scheduledAt + d.medicationId} dose={d} tz={tz} onToggle={() => setAsking(d)} />
            ))}
          </View>
        )}

        <Button title="Ver lista completa" variant="soft" onPress={() => router.push("/recordatorios")} />

        <Text style={s.h2}>Familiar y cuidadores</Text>
        <Text style={s.muted}>
          {accepted.length ? "Enviaremos una notificación a estas personas para que estén pendientes de su medicación." : "Todavía no agregaste cuidadores. Podés hacerlo desde tu perfil."}
        </Text>
        <View style={s.people}>
          {accepted.map((c) => (
            <View key={c.id} style={s.person}>
              <Avatar label={c.email} size={36} />
              <View>
                <Text style={s.personText}>{c.email.split("@")[0]}</Text>
                <Text style={s.muted}>Cuidador</Text>
              </View>
            </View>
          ))}
        </View>
      </TabScreen>

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
    </>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  h2: { fontSize: 20, fontWeight: "500", color: colors.text, marginTop: 8 },
  progress: { fontSize: 13, color: colors.textMuted },
  empty: { gap: 12 },
  muted: { fontSize: 12, color: colors.textMuted },
  list: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: 12 },
  hero: { backgroundColor: "rgba(255,255,255,0.14)", borderRadius: radius.lg, padding: 16, gap: 6, marginTop: 8 },
  heroSmall: { color: "#E0E3F5", fontSize: 12 },
  heroTitle: { color: "#fff", fontSize: 20, fontWeight: "600" },
  heroActions: { flexDirection: "row", gap: 8 },
  alert: { backgroundColor: colors.danger, borderRadius: radius.lg, padding: 14, gap: 6 },
  alertHead: { flexDirection: "row", justifyContent: "space-between" },
  alertTitle: { color: "#fff", fontWeight: "700" },
  alertText: { color: "#fff", fontSize: 13 },
  people: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  person: { flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 8 },
  personText: { fontSize: 14, fontWeight: "500", color: colors.text },
  bell: { alignSelf: "flex-end", width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  toast: { position: "absolute", left: 16, right: 16, bottom: 16, backgroundColor: colors.success, borderRadius: radius.md, padding: 14, flexDirection: "row", gap: 10, alignItems: "center" },
  toastText: { color: "#fff", flex: 1, fontSize: 13 },
});
