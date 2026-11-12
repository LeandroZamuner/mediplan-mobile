import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePlans } from "@/features/usePlans";
import { formatDate } from "@/lib/dates";
import { medicationsLabel, PLAN_STATUS } from "@/lib/plans";
import { colors, radius } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { Chip } from "@/ui/Chip";
import { EmptyState } from "@/ui/EmptyState";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { Text } from "@/ui/Text";

/** Planes que ya no están activos: finalizados y cancelados. */
export default function PlanesInactivos() {
  const { data, isLoading } = usePlans();
  const list = (data ?? []).filter((p) => p.status !== "active");
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <ScreenHeader title={"Planes finalizados\ny cancelados"} subtitle="Tus tratamientos anteriores, por si necesitás consultarlos." />
        {!isLoading && list.length === 0 ? <EmptyState icon="archive" title="No hay planes anteriores" text="Cuando termines o canceles un plan, lo vas a encontrar acá." /> : null}
        {list.map((p) => (
          <View key={p.id} style={s.card}>
            <View style={s.row}>
              <Text style={[s.name, { flex: 1 }]}>{p.name}</Text>
              <Chip label={PLAN_STATUS[p.status].label} tone={p.status === "cancelled" ? "danger" : "neutral"} />
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
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { ...type.h3, color: colors.text },
  muted: { ...type.small, color: colors.textMuted },
});
