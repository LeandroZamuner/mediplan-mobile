import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSWRConfig } from "swr";
import { formatDateInput, parseDateInput } from "@/features/plan/draft";
import { usePlans } from "@/features/usePlans";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { frequencyLabel } from "@/lib/frequency-label";
import { colors, radius } from "@/theme/tokens";
import { BackButton } from "@/ui/BackButton";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";
import { Field } from "@/ui/Field";
import { Labeled } from "@/ui/Labeled";

/** Detalles de la medicación: datos, stock, frecuencia, ajustar (dosis, fin, reponer) y eliminar del plan. */
export default function MedicationDetail() {
  const { planId, medId } = useLocalSearchParams<{ planId: string; medId: string }>();
  const plans = usePlans();
  const { mutate } = useSWRConfig();
  const med = plans.data?.find((p) => p.id === planId)?.medications.find((m) => m.id === medId);
  const [editing, setEditing] = useState(false);
  const [dose, setDose] = useState("");
  const [end, setEnd] = useState("");
  const [refill, setRefill] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  if (!med) return <SafeAreaView style={s.screen}><View style={s.pad}><BackButton onDark={false} /><Text style={s.muted}>{plans.isLoading ? "Cargando…" : "No encontramos este medicamento."}</Text></View></SafeAreaView>;

  const startEdit = () => {
    setDose(med.dose);
    setEnd(med.endDate ? formatDateInput(med.endDate) : "");
    setRefill("");
    setError("");
    setEditing(true);
  };

  async function save() {
    if (!med) return;
    const endIso = end.trim() ? parseDateInput(end) : null;
    const units = refill.trim() ? Number(refill) : 0;
    if (end.trim() && !endIso) return setError("La fecha de fin no es válida (usá DD/MM/AAAA).");
    if (!dose.trim()) return setError("Indicá la dosis.");
    if (!Number.isInteger(units) || units < 0) return setError("Los comprimidos a reponer deben ser un número entero.");
    setBusy(true);
    setError("");
    try {
      await api(`/plans/${planId}/medications/${med.id}`, { method: "PATCH", json: { dose: dose.trim(), endDate: endIso } });
      if (units > 0) await api(`/plans/${planId}/medications/${med.id}/stock`, { method: "POST", json: { units } });
      await mutate("/plans");
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setDeleting(false);
    try {
      await api(`/plans/${planId}/medications/${med?.id}`, { method: "DELETE" });
      await mutate("/plans");
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos eliminar el medicamento.");
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={[s.pad, { gap: 12 }]} keyboardShouldPersistTaps="handled">
        <BackButton onDark={false} />
        <Text style={s.h1}>Detalles de la medicación</Text>

        {editing ? (
          <>
            <Labeled label="Medicamento"><Field value={med.name} editable={false} /></Labeled>
            <Labeled label="Dosis"><Field value={dose} onChangeText={setDose} /></Labeled>
            <Labeled label="Hasta (DD/MM/AAAA)" hint="Dejalo vacío si no tiene fecha de fin."><Field value={end} onChangeText={setEnd} placeholder="Ej: 28/6/2026" keyboardType="numbers-and-punctuation" /></Labeled>
            <Labeled label="Reponer comprimidos" hint={`Hoy tenés ${med.stockUnits}. Lo que escribas se suma.`}><Field value={refill} onChangeText={setRefill} placeholder="Ej: 30" keyboardType="number-pad" /></Labeled>
            {error ? <Text style={s.err}>{error}</Text> : null}
            <Button title="Guardar cambios" loading={busy} onPress={() => void save()} />
            <Button title="Cancelar" variant="ghost" onPress={() => setEditing(false)} />
          </>
        ) : (
          <>
            <View style={s.card}><Text style={s.cardTitle}>{med.name}</Text><Text style={s.body}>Dosis de: {med.dose}</Text></View>
            <View style={s.card}>
              <Text style={s.cardTitle}>Stock disponible</Text>
              <Text style={s.body}>Comprimidos: {med.stockUnits}</Text>
              <Text style={s.body}>Aviso cuando queden: {med.stockAlertAt}</Text>
            </View>
            <Text style={s.h2}>Frecuencia para tomar la medicación</Text>
            <View style={s.card}>
              <Text style={s.body}>Frecuencia: {frequencyLabel(med.schedules)}</Text>
              <Text style={s.body}>Horarios: {[...new Set(med.schedules.map((x) => x.timeOfDay))].sort().join(", ")}</Text>
              <Text style={s.body}>Desde: {formatDate(med.startDate)}</Text>
              <Text style={s.body}>{med.endDate ? `Finaliza: ${formatDate(med.endDate)}` : "Sin fecha de fin"}</Text>
            </View>
            {error ? <Text style={s.err}>{error}</Text> : null}
            <Button title="Ajustar medicación" variant="soft" onPress={startEdit} />
            <Button title="Eliminar del plan" variant="ghost" onPress={() => setDeleting(true)} />
          </>
        )}
      </ScrollView>
      <ConfirmModal visible={deleting} danger title="¿Quiere eliminar este medicamento?" message="Pulse el botón de “Eliminar” para confirmar la acción." confirmLabel="Sí, eliminar" onCancel={() => setDeleting(false)} onConfirm={() => void remove()} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16 },
  h1: { fontSize: 20, fontWeight: "600", color: colors.text, marginTop: 8 },
  h2: { fontSize: 18, fontWeight: "600", color: colors.text, marginTop: 8 },
  muted: { color: colors.textMuted, marginTop: 16 },
  err: { color: colors.danger, fontSize: 12 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  body: { fontSize: 13, color: colors.text },
});
