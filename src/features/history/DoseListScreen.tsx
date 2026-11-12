import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSWR from "swr";
import { api } from "@/lib/api";
import type { Plan } from "@/lib/types";
import { useAuth } from "@/auth/AuthProvider";
import { usePlans } from "@/features/usePlans";
import { formatTime } from "@/lib/dates";
import { recordTaken, type TodayDose } from "@/lib/doses";
import { todayIn } from "@/lib/plans";
import { colors, radius } from "@/theme/tokens";
import { BackButton } from "@/ui/BackButton";
import { ConfirmModal } from "@/ui/ConfirmModal";
import { DatePickerModal } from "@/ui/DatePickerModal";
import { Field } from "@/ui/Field";
import { formatLongDate } from "./calendar";
import { filterDoses, type DoseFilter } from "./filter";
import { useDosesOn } from "./useDosesOn";

const FILTERS: { key: DoseFilter; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "taken", label: "Tomados" },
  { key: "notTaken", label: "No tomados" },
];

/** Lista de tomas de un día con calendario y filtros. `editable` permite marcar tomas (Recordatorios); sin eso es solo lectura (Historial). */
export function DoseListScreen({ title, editable, search, supervisedPlanId }: { title: string; editable?: boolean; search?: boolean; supervisedPlanId?: string }) {
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const own = usePlans();
  const supervised = useSWR<Plan[]>(supervisedPlanId ? "/plans/supervised" : null, (p: string) => api<Plan[]>(p));
  // Con `supervisedPlanId` se ve el plan de otra persona (solo ese plan); si no, los planes propios.
  const plans = supervisedPlanId ? { ...supervised, data: supervised.data?.filter((p) => p.id === supervisedPlanId) } : own;
  const [date, setDate] = useState(() => todayIn(tz));
  const [picker, setPicker] = useState(false);
  const [filter, setFilter] = useState<DoseFilter>("all");
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState<TodayDose | null>(null);
  const [error, setError] = useState("");
  const doses = useDosesOn(plans.data, date, tz);
  const list = filterDoses(doses.data ?? [], filter, query);
  const isToday = date === todayIn(tz);

  async function confirm() {
    if (!asking) return;
    const d = asking;
    setAsking(null);
    try {
      await recordTaken(d.planId, d.medicationId, d.scheduledAt);
      await doses.mutate();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos registrar la toma.");
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.pad}><BackButton onDark={false} /></View>
      <Text style={s.title}>{title}</Text>
      {search ? (
        <View style={s.pad}><Field placeholder="Buscar" value={query} onChangeText={setQuery} style={s.search} /></View>
      ) : null}
      <Pressable onPress={() => setPicker(true)} style={[s.date, s.pad]}>
        <Text style={s.dateText}>{isToday ? "Hoy: " : ""}{formatLongDate(date)}</Text>
        <Feather name="chevron-down" size={18} color={colors.text} />
      </Pressable>
      <View style={[s.chips, s.pad]}>
        {FILTERS.map((f) => (
          <Pressable key={f.key} onPress={() => setFilter(f.key)} style={[s.chip, filter === f.key && s.chipOn]}>
            <Text style={[s.chipText, filter === f.key && { color: colors.primary }]}>{f.label}</Text>
          </Pressable>
        ))}
      </View>
      {error ? <Text style={[s.err, s.pad]}>{error}</Text> : null}
      <FlatList
        data={list}
        keyExtractor={(d) => d.scheduledAt + d.medicationId}
        contentContainerStyle={s.pad}
        ListEmptyComponent={<Text style={s.empty}>{doses.isLoading ? "Cargando…" : "No hay tomas para este día."}</Text>}
        renderItem={({ item }) => {
          const taken = item.status === "taken";
          return (
            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.medicationName} {item.dose}</Text>
                <Text style={s.when}>{formatTime(item.scheduledAt, tz)} · {taken ? (item.takenAt ? `Tomado a las ${formatTime(item.takenAt, tz)}` : "Tomado") : item.status === "missed" ? "No tomado" : "Pendiente"}</Text>
              </View>
              <Pressable accessibilityRole="checkbox" accessibilityLabel={`Marcar ${item.medicationName} como tomado`} accessibilityState={{ checked: taken }} hitSlop={14} disabled={taken || !editable} onPress={() => setAsking(item)} style={[s.box, taken && s.boxOn]}>
                {taken ? <Feather name="check" size={14} color="#fff" /> : null}
              </Pressable>
            </View>
          );
        }}
      />
      <DatePickerModal key={date} visible={picker} value={date} onClose={() => setPicker(false)} onPick={setDate} />
      <ConfirmModal visible={!!asking} title="¿Tomaste este medicamento?" message={asking ? `Si ya tomó ${asking.medicationName} ${asking.dose} a las ${formatTime(asking.scheduledAt, tz)} pulse el botón Sí.` : ""} cancelLabel="No, cancelar" confirmLabel="Sí" onCancel={() => setAsking(null)} onConfirm={() => void confirm()} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16 },
  title: { fontSize: 28, color: colors.text, paddingHorizontal: 16, marginVertical: 12 },
  search: { backgroundColor: colors.surface, borderWidth: 0 },
  date: { flexDirection: "row", alignItems: "center", gap: 6, marginVertical: 12 },
  dateText: { fontSize: 18, color: colors.text, fontWeight: "600" },
  chips: { flexDirection: "row", gap: 8, marginBottom: 8 },
  chip: { flex: 1, height: 36, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  chipOn: { backgroundColor: colors.primarySoft },
  chipText: { fontSize: 13, color: colors.text, fontWeight: "600" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  when: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: "#5A606D", alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  empty: { color: colors.textMuted, paddingVertical: 24, textAlign: "center" },
  err: { color: colors.danger, fontSize: 12 },
});
