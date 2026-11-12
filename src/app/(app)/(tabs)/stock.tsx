import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Modal, StyleSheet, View } from "react-native";
import useSWR, { useSWRConfig } from "swr";
import { useAuth } from "@/auth/AuthProvider";
import { usePlans } from "@/features/usePlans";
import { api } from "@/lib/api";
import { pastRange } from "@/lib/dates";
import { stockLevel } from "@/lib/doses";
import { daysOfStockLeft, stockRatio } from "@/lib/stock";
import type { Medication, Stats } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { Button } from "@/ui/Button";
import { Chip } from "@/ui/Chip";
import { EmptyState } from "@/ui/EmptyState";
import { Field } from "@/ui/Field";
import { TabScreen } from "@/ui/TabScreen";
import { SectionTitle } from "@/ui/SectionTitle";
import { Text } from "@/ui/Text";

const LEVEL = { ok: { label: "Stock al día", tone: "ok" }, low: { label: "Stock bajo", tone: "warning" }, out: { label: "Sin stock", tone: "danger" } } as const;
const BAR = { ok: colors.primary, low: colors.warning, out: colors.danger };

/** Stock de medicamentos y consumo. Pestaña "Stock". */
export default function Stock() {
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const plans = usePlans();
  const { mutate } = useSWRConfig();
  const plan = plans.data?.find((p) => p.status === "active");
  const { from, to } = pastRange(tz, 30);
  const stats = useSWR<Stats>(plan ? ["stats", plan.id, from] : null, () => api<Stats>(`/plans/${plan?.id}/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`));
  const st = stats.data;
  const [refilling, setRefilling] = useState<Medication | null>(null);
  const [units, setUnits] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refill() {
    const n = Number(units);
    if (!plan || !refilling || !Number.isInteger(n) || n < 1) return setError("Escribí cuántos comprimidos sumás (un número entero).");
    setBusy(true);
    setError("");
    try {
      await api(`/plans/${plan.id}/medications/${refilling.id}/stock`, { method: "POST", json: { units: n } });
      await mutate("/plans");
      setRefilling(null);
      setUnits("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos reponer el stock.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <TabScreen title="Stock" subtitle="Controlá cuántos comprimidos te quedan y cómo venís con tu tratamiento.">

        {!plan ? (
          <EmptyState image={require("../../../../assets/images/onboarding-stock.jpg")} title="Todavía no hay medicamentos" text="Cuando crees tu plan de tratamiento vas a ver acá cuánto stock tenés y te avisamos cuando quede poco.">
            <Button title="Crear plan de tratamiento" onPress={() => router.push("/plan/nuevo")} />
          </EmptyState>
        ) : (
          <>
            <SectionTitle>Últimos 30 días</SectionTitle>
            <View style={s.grid}>
              <Stat icon="target" label="Cumplimiento" value={st?.adherenceRate == null ? "—" : `${Math.round(st.adherenceRate * 100)}%`} />
              <Stat icon="check-circle" label="Tomadas" value={st ? String(st.taken) : "—"} />
              <Stat icon="x-circle" label="No tomadas" value={st ? String(st.missed) : "—"} />
            </View>

            <SectionTitle>Stock disponible</SectionTitle>
            {plan.medications.map((m) => {
              const level = stockLevel(m.stockUnits, m.stockAlertAt);
              const days = daysOfStockLeft(m);
              return (
                <View key={m.id} style={s.card}>
                  <View style={s.row}>
                    <View style={s.pill}><Feather name="paperclip" size={18} color={colors.textMuted} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.name}>{m.name} {m.dose}</Text>
                      <Text style={s.muted}>{level === "out" ? "Sin comprimidos" : days === null ? "Sin horarios para estimar" : `Alcanza para ${days} ${days === 1 ? "día" : "días"} aprox.`}</Text>
                    </View>
                    <Chip label={LEVEL[level].label} tone={LEVEL[level].tone} />
                  </View>
                  <View style={s.row}>
                    <Text style={s.big}>{m.stockUnits}</Text>
                    <Text style={[s.muted, { flex: 1 }]}>comprimidos disponibles · aviso al llegar a {m.stockAlertAt}</Text>
                  </View>
                  <View style={s.track}><View style={[s.bar, { width: `${Math.round(stockRatio(m) * 100)}%`, backgroundColor: BAR[level] }]} /></View>
                  <Button title="Reponer stock" variant="soft" onPress={() => { setRefilling(m); setUnits(""); setError(""); }} />
                </View>
              );
            })}
          </>
        )}
      </TabScreen>

      <Modal visible={!!refilling} transparent animationType="fade" onRequestClose={() => setRefilling(null)}>
        <View style={s.scrim}>
          <View style={s.dialog}>
            <Text style={s.dialogTitle}>Reponer {refilling?.name}</Text>
            <Text style={s.muted}>Hoy tenés {refilling?.stockUnits}. Lo que escribas se suma al stock.</Text>
            <Field placeholder="Ej: 30" keyboardType="number-pad" value={units} onChangeText={setUnits} />
            {error ? <Text style={s.error}>{error}</Text> : null}
            <View style={s.row}>
              <View style={{ flex: 1 }}><Button title="Cancelar" variant="ghost" onPress={() => setRefilling(null)} /></View>
              <View style={{ flex: 1 }}><Button title="Reponer" loading={busy} onPress={() => void refill()} /></View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Stat({ icon, label, value }: { icon: "target" | "check-circle" | "x-circle"; label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Feather name={icon} size={18} color={colors.primary} />
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12, paddingBottom: 32 },
  grid: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 4 },
  statValue: { fontSize: 24, fontWeight: "600", color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  name: { ...type.h3, color: colors.text },
  big: { fontSize: 28, fontWeight: "600", color: colors.text },
  muted: { ...type.small, color: colors.textMuted },
  track: { height: 8, borderRadius: 4, backgroundColor: "#DADCE0", overflow: "hidden" },
  bar: { height: 8, borderRadius: 4 },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  dialog: { width: "100%", maxWidth: 328, backgroundColor: "#fff", borderRadius: radius.lg, padding: 20, gap: 12 },
  dialogTitle: { ...type.h2, color: colors.text },
  error: { ...type.small, color: colors.danger },
});
