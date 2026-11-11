import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { summarizeSchedules } from "@/lib/dates";
import { stockLevel } from "@/lib/doses";
import { usePlans } from "@/features/usePlans";
import { Button } from "@/ui/Button";
import { colors, radius } from "@/theme/tokens";

/** Plan de medicación (lectura). Pendiente: agregar/eliminar medicamentos y el asistente de 3 pasos. */
export default function Plan() {
  const { data, isLoading } = usePlans();
  const plans = (data ?? []).filter((p) => p.status === "active");
  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.h1}>Plan de medicación</Text>
        <Text style={s.muted}>Configura y gestiona tu plan de medicación para asegurarte de seguir el tratamiento recetado.</Text>
        <Button title={plans.length ? "Agregar plan" : "Crear plan"} variant="soft" onPress={() => router.push("/plan/nuevo")} />
        {isLoading ? <Text style={s.muted}>Cargando…</Text> : plans.length === 0 ? <Text style={s.muted}>Todavía no tenés un plan activo.</Text> : null}
        {plans.flatMap((p) =>
          p.medications.map((m) => {
            const level = stockLevel(m.stockUnits, m.stockAlertAt);
            return (
              <View key={m.id} style={s.card}>
                <View style={s.row}>
                  <Text style={s.name}>{m.name} {m.dose}</Text>
                  {level !== "ok" ? <Text style={s.tag}>{level === "out" ? "Sin stock" : "Stock bajo"}</Text> : null}
                </View>
                <Text style={s.muted}>{summarizeSchedules(m.schedules)}</Text>
                <Text style={s.muted}>Comprimidos disponibles: {m.stockUnits}</Text>
              </View>
            );
          }),
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 12 },
  h1: { fontSize: 26, color: colors.text },
  muted: { fontSize: 12, color: colors.textMuted },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  tag: { backgroundColor: colors.warning, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, color: "#3a2f00", overflow: "hidden" },
});
