import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSWRConfig } from "swr";
import { useAuth } from "@/auth/AuthProvider";
import { emptyDraft, formatDateInput, step1Error, step2Error, summarize, toCreateBody, type MedicationDraft } from "@/features/plan/draft";
import { api } from "@/lib/api";
import { FREQUENCY_OPTIONS } from "@/lib/frequency";
import { todayIn } from "@/lib/plans";
import type { Plan } from "@/lib/types";
import { refreshAlarms, saveReminderOffsets } from "@/notifications/reminders";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";
import { Field } from "@/ui/Field";
import { Labeled } from "@/ui/Labeled";
import { Select } from "@/ui/Select";
import { WizardShell } from "@/ui/WizardShell";

const REMINDERS = [
  { label: "Sin recordatorio previo", value: 0 },
  { label: "5 min antes", value: 5 },
  { label: "10 min antes", value: 10 },
  { label: "15 min antes", value: 15 },
  { label: "30 min antes", value: 30 },
];

/** Asistente "Crear plan de tratamiento": 1) medicamento, 2) frecuencia, 3) revisar y guardar. */
export default function NewPlan() {
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const { mutate } = useSWRConfig();
  const { planId } = useLocalSearchParams<{ planId?: string }>(); // con planId: agrega medicamentos a un plan existente
  const [step, setStep] = useState(1);
  const [drafts, setDrafts] = useState<MedicationDraft[]>([]);
  const [d, setD] = useState<MedicationDraft>(() => emptyDraft(todayIn(tz)));
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<MedicationDraft>) => setD((x) => ({ ...x, ...patch }));

  const e1 = step1Error(d);
  const e2 = step2Error(d);
  const close = () => (drafts.length || d.name ? setLeaving(true) : router.back());

  async function save() {
    setBusy(true);
    setError("");
    try {
      let created: Plan["medications"] = [];
      if (planId) {
        for (const m of drafts) created.push(await api<Plan["medications"][number]>(`/plans/${planId}/medications`, { method: "POST", json: toCreateBody(m) }));
      } else {
        const plan = await api<Plan>("/plans", { method: "POST", json: { name: "Mi plan", medications: drafts.map(toCreateBody) } });
        created = plan.medications;
      }
      const offsets: Record<string, number> = {};
      created.forEach((m, i) => {
        const min = drafts[i]?.reminderMin;
        if (min) offsets[m.id] = min;
      });
      await saveReminderOffsets(offsets);
      const plans = await mutate<Plan[]>("/plans");
      if (plans) await refreshAlarms(plans, tz);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear el plan.");
      setBusy(false);
    }
  }

  return (
    <>
      {step === 1 && (
        <WizardShell progress={drafts.length ? 0.2 : 0.1} step="Paso 1" title="Agregar medicamento" subtitle="Complete todos los campos para añadir correctamente la medicación a su plan." onClose={close} footer={<View style={s.full}><Button title="Siguiente" disabled={!!e1} onPress={() => setStep(2)} /></View>}>
          <Labeled label="Medicamento"><Field placeholder="Ej: Paracetamol" value={d.name} onChangeText={(name) => set({ name })} /></Labeled>
          <Labeled label="Dosis"><Field placeholder="Ej: 500 mg" value={d.dose} onChangeText={(dose) => set({ dose })} /></Labeled>
          <Labeled label="Comprimidos disponibles" hint="Cuántos comprimidos tenés ahora. Te avisamos cuando queden pocos."><Field placeholder="Ej: 18" keyboardType="number-pad" value={d.stockUnits} onChangeText={(stockUnits) => set({ stockUnits })} /></Labeled>
        </WizardShell>
      )}

      {step === 2 && (
        <WizardShell
          progress={0.55}
          step="Paso 2"
          title={"Establezca una frecuencia\npara tomar su medicación"}
          onClose={close}
          footer={
            <>
              <View style={s.half}><Button title="Paso anterior" variant="ghost" onPress={() => setStep(1)} /></View>
              <View style={s.half}><Button title="Siguiente" disabled={!!e2} onPress={() => { setDrafts((x) => [...x, d]); setStep(3); }} /></View>
            </>
          }
        >
          <Select label="Frecuencia de toma" placeholder="Ej: Cada 12 horas" value={d.everyHours} options={FREQUENCY_OPTIONS.map((h) => ({ label: `Cada ${h} horas`, value: h }))} onChange={(everyHours) => set({ everyHours })} />
          <Labeled label="Hora de la primera toma" hint="Las demás tomas siguen a partir de esta hora."><Field placeholder="08:00" value={d.firstTime} onChangeText={(firstTime) => set({ firstTime })} keyboardType="numbers-and-punctuation" /></Labeled>
          <View style={s.dates}>
            <View style={{ flex: 1 }}><Labeled label="Desde"><Field value={formatDateInput(d.startDate)} editable={false} /></Labeled></View>
            <View style={{ flex: 1 }}><Labeled label="Hasta"><Field placeholder="Ej: 28/6/2026" value={d.endDate} onChangeText={(endDate) => set({ endDate })} keyboardType="numbers-and-punctuation" /></Labeled></View>
          </View>
          <Text style={s.hint}>Establezca un periodo de inicio y fin para su medicación. Si lo dejás vacío, no tiene fecha de fin.</Text>
          <Select label="Añadir recordatorio" placeholder="Seleccione una opción" value={d.reminderMin ?? null} options={REMINDERS} onChange={(reminderMin) => set({ reminderMin })} />
          {e2 && d.everyHours !== null ? <Text style={s.err}>{e2}</Text> : null}
        </WizardShell>
      )}

      {step === 3 && (
        <WizardShell
          progress={1}
          step="Paso 3"
          title="Revisar información del plan"
          subtitle="Puede ajustar el plan de los medicamentos añadidos o agregar otros antes de guardar."
          onClose={close}
          footer={<View style={s.full}><Button title={planId ? "Guardar medicamentos" : "Guardar plan de tratamiento"} loading={busy} disabled={drafts.length === 0} onPress={() => void save()} /></View>}
        >
          {drafts.map((m, i) => (
            <View key={`${m.name}-${i}`} style={s.card}>
              <View style={s.row}>
                <Text style={s.cardTitle}>{m.name} {m.dose}</Text>
                <Pressable accessibilityLabel={`Quitar ${m.name}`} onPress={() => setDrafts((x) => x.filter((_, j) => j !== i))}><Feather name="x" size={18} color={colors.text} /></Pressable>
              </View>
              <Text style={s.cardText}>{summarize(m)}</Text>
              <Text style={s.cardText}>Comprimidos disponibles: {m.stockUnits}</Text>
            </View>
          ))}
          <Pressable style={s.add} onPress={() => { setD(emptyDraft(todayIn(tz))); setStep(1); }}>
            <Feather name="plus" size={18} color={colors.primary} />
            <Text style={s.addText}>Agregar medicamento</Text>
          </Pressable>
          {error ? <Text style={s.err}>{error}</Text> : null}
        </WizardShell>
      )}

      <ConfirmModal visible={leaving} title="Aún no termina de crear su plan" message="Si sale ahora, perderá la configuración que haya hecho para su plan tratamiento." confirmLabel="Salir" onCancel={() => setLeaving(false)} onConfirm={() => { setLeaving(false); router.back(); }} />
    </>
  );
}

const s = StyleSheet.create({
  full: { flex: 1 },
  half: { flex: 1 },
  dates: { flexDirection: "row", gap: 8 },
  hint: { fontSize: 11, color: colors.textMuted },
  err: { fontSize: 12, color: colors.danger },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { fontSize: 14, fontWeight: "600", color: colors.text },
  cardText: { fontSize: 13, color: colors.text },
  add: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.primary, backgroundColor: colors.primarySoft, borderRadius: radius.lg, paddingVertical: 22, alignItems: "center", gap: 6 },
  addText: { color: colors.primary, fontSize: 13 },
});
