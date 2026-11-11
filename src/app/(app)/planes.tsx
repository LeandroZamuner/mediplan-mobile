import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlans } from "@/features/usePlans";
import { formatDate } from "@/lib/dates";
import { medicationsLabel, PLAN_STATUS } from "@/lib/plans";
import { colors, radius } from "@/theme/tokens";
import { BackButton } from "@/ui/BackButton";

/** Planes que ya no están activos: finalizados y cancelados. */
export default function PlanesInactivos() {
  const { data, isLoading } = usePlans();
  const list = (data ?? []).filter((p) => p.status !== "active");
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <BackButton onDark={false} />
        <Text style={s.title}>{"Planes finalizados\ny cancelados"}</Text>
        {isLoading ? <Text style={s.muted}>Cargando…</Text> : list.length === 0 ? <Text style={s.muted}>Todavía no tenés planes finalizados ni cancelados.</Text> : null}
        {list.map((p) => (
          <View key={p.id} style={s.card}>
            <View style={s.row}>
              <Text style={s.name}>{p.name}</Text>
              <Text style={[s.tag, p.status === "cancelled" && { backgroundColor: "#F8D7DE", color: colors.danger }]}>{PLAN_STATUS[p.status].label}</Text>
            </View>
            <Text style={s.muted}>{medicationsLabel(p) || "Sin medicamentos"}</Text>
            <Text style={s.muted}>Creado el {formatDate(p.createdAt.slice(0, 10))}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12 },
  title: { fontSize: 28, color: colors.text, marginTop: 8, lineHeight: 36 },
  muted: { fontSize: 12, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  tag: { backgroundColor: "#DDE2E5", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 11, color: colors.text, overflow: "hidden" },
});
