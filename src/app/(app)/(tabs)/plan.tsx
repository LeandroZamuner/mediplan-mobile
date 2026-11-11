import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSWRConfig } from "swr";
import { useCaregivers, usePlans } from "@/features/usePlans";
import { api } from "@/lib/api";
import { stockLevel } from "@/lib/doses";
import { formatDate, summarizeSchedules } from "@/lib/dates";
import type { Medication } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";

export default function Plan() {
  const { data, isLoading } = usePlans();
  const { mutate } = useSWRConfig();
  const plan = (data ?? []).find((p) => p.status === "active");
  const caregivers = useCaregivers(plan?.id);
  const accepted = (caregivers.data ?? []).filter((c) => c.status === "accepted");
  const [toDelete, setToDelete] = useState<Medication | null>(null);
  const [error, setError] = useState("");

  async function remove() {
    if (!plan || !toDelete) return;
    const med = toDelete;
    setToDelete(null);
    try {
      await api(`/plans/${plan.id}/medications/${med.id}`, { method: "DELETE" });
      await mutate("/plans");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos eliminar el medicamento.");
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <Text style={s.h1}>Plan de medicación</Text>
        <Text style={s.muted}>Configure y gestione su plan de medicación para asegurarse de seguir el tratamiento recetado.</Text>
        {isLoading ? <Text style={s.muted}>Cargando…</Text> : null}
        {error ? <Text style={s.err}>{error}</Text> : null}

        {plan?.medications.map((m) => {
          const level = stockLevel(m.stockUnits, m.stockAlertAt);
          return (
            <Pressable key={m.id} style={s.card} onPress={() => router.push({ pathname: "/medicamento", params: { planId: plan.id, medId: m.id } })}>
              <View style={s.row}>
                <Text style={s.name}>{m.name} {m.dose}</Text>
                <Pressable accessibilityLabel={`Eliminar ${m.name}`} hitSlop={10} onPress={() => setToDelete(m)}><Feather name="x" size={18} color={colors.text} /></Pressable>
              </View>
              <Text style={s.body}>{summarizeSchedules(m.schedules)}{m.endDate ? ` · hasta el ${formatDate(m.endDate)}` : ""}</Text>
              <View style={s.row}>
                <Text style={s.body}>Comprimidos disponibles: {m.stockUnits}</Text>
                {level !== "ok" ? <Text style={s.tag}>{level === "out" ? "Sin stock" : "Stock bajo"}</Text> : null}
              </View>
            </Pressable>
          );
        })}

        <Pressable style={s.add} onPress={() => router.push(plan ? { pathname: "/plan/nuevo", params: { planId: plan.id } } : "/plan/nuevo")}>
          <Feather name="plus" size={18} color={colors.primary} />
          <Text style={s.addText}>{plan ? "Agregar medicamento" : "Crear plan de tratamiento"}</Text>
        </Pressable>
        <Pressable style={s.history} onPress={() => router.push("/historial")}>
          <Feather name="clock" size={16} color={colors.text} />
          <Text style={s.historyText}>Ver historial completo</Text>
        </Pressable>

        <Pressable style={s.history} onPress={() => router.push("/stock")}>
          <Feather name="bar-chart-2" size={16} color={colors.text} />
          <Text style={s.historyText}>Stock y consumos</Text>
        </Pressable>
        <Pressable style={s.history} onPress={() => router.push("/planes")}>
          <Feather name="archive" size={16} color={colors.text} />
          <Text style={s.historyText}>Planes finalizados y cancelados</Text>
        </Pressable>

        <Text style={s.h2}>Familiares y cuidadores</Text>
        <Text style={s.muted}>
          {accepted.length ? "Enviaremos una notificación a las siguientes personas para que estén al pendiente de su medicación." : "Todavía no tenés cuidadores con la invitación aceptada."}
        </Text>
        {accepted.map((c) => <Text key={c.id} style={s.body}>{c.email}</Text>)}
        {plan ? <Button title="Gestionar cuidadores" variant="soft" onPress={() => router.push("/cuidadores/nuevo")} /> : null}
      </ScrollView>

      <ConfirmModal visible={!!toDelete} danger title={`¿Quiere eliminar el ${toDelete?.name ?? ""} ${toDelete?.dose ?? ""} de su tratamiento?`} message="Pulse el botón de “Eliminar” para confirmar la acción." confirmLabel="Sí, eliminar" onCancel={() => setToDelete(null)} onConfirm={() => void remove()} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 12, paddingBottom: 32 },
  h1: { fontSize: 28, color: colors.text, fontWeight: "600" },
  h2: { fontSize: 18, color: colors.text, marginTop: 12 },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  body: { fontSize: 13, color: colors.text },
  err: { fontSize: 12, color: colors.danger },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 8, elevation: 1 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "600", color: colors.text, flex: 1 },
  tag: { backgroundColor: colors.warning, borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, fontSize: 11, color: "#3a2f00", overflow: "hidden" },
  add: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.primary, backgroundColor: colors.primarySoft, borderRadius: radius.lg, paddingVertical: 22, alignItems: "center", gap: 6 },
  addText: { color: colors.primary, fontSize: 13 },
  history: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  historyText: { fontSize: 14, color: colors.text, fontWeight: "600" },
});
