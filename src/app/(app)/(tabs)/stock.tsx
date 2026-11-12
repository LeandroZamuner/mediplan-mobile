import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSWR from "swr";
import { useAuth } from "@/auth/AuthProvider";
import { usePlans } from "@/features/usePlans";
import { api } from "@/lib/api";
import { pastRange } from "@/lib/dates";
import { stockLevel } from "@/lib/doses";
import { daysOfStockLeft, stockRatio } from "@/lib/stock";
import type { Stats } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";

/** Stock de medicamentos y consumos (cumplimiento de los últimos 30 días). */
export default function Stock() {
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const plans = usePlans();
  const plan = plans.data?.find((p) => p.status === "active");
  const { from, to } = pastRange(tz, 30);
  const stats = useSWR<Stats>(plan ? ["stats", plan.id, from] : null, () => api<Stats>(`/plans/${plan?.id}/stats?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`));
  const st = stats.data;

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <Text style={s.title}>Stock y consumos</Text>

        <Text style={s.h2}>Últimos 30 días</Text>
        <View style={s.grid}>
          <Stat label="Cumplimiento" value={st?.adherenceRate == null ? "—" : `${Math.round(st.adherenceRate * 100)}%`} />
          <Stat label="Tomadas" value={st ? String(st.taken) : "—"} />
          <Stat label="No tomadas" value={st ? String(st.missed) : "—"} />
        </View>

        <Text style={s.h2}>Stock disponible</Text>
        {!plan ? <Text style={s.muted}>Todavía no tenés un plan activo.</Text> : null}
        {plan?.medications.map((m) => {
          const level = stockLevel(m.stockUnits, m.stockAlertAt);
          const days = daysOfStockLeft(m);
          return (
            <View key={m.id} style={s.card}>
              <View style={s.row}>
                <Text style={s.name}>{m.name} {m.dose}</Text>
                <Text style={s.units}>{m.stockUnits}</Text>
              </View>
              <View style={s.track}><View style={[s.bar, { width: `${Math.round(stockRatio(m) * 100)}%`, backgroundColor: level === "ok" ? colors.primary : level === "low" ? colors.warning : colors.danger }]} /></View>
              <Text style={s.muted}>{level === "out" ? "Sin stock." : days === null ? "Sin horarios para estimar." : `Alcanza para ${days} ${days === 1 ? "día" : "días"} aprox.`}{level === "low" ? " Stock bajo." : ""}</Text>
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.muted}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12 },
  title: { fontSize: 28, color: colors.text, marginTop: 8 },
  h2: { fontSize: 18, color: colors.text, marginTop: 8 },
  muted: { fontSize: 12, color: colors.textMuted },
  grid: { flexDirection: "row", gap: 8 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 4 },
  statValue: { fontSize: 22, fontWeight: "600", color: colors.text },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  name: { fontSize: 14, fontWeight: "600", color: colors.text, flex: 1 },
  units: { fontSize: 14, fontWeight: "600", color: colors.text },
  track: { height: 8, borderRadius: 4, backgroundColor: "#DADCE0", overflow: "hidden" },
  bar: { height: 8, borderRadius: 4 },
});
