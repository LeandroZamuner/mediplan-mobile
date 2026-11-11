import { router } from "expo-router";
import { useState } from "react";
import { Share, StyleSheet, Text, View } from "react-native";
import { useSWRConfig } from "swr";
import { useCaregivers, usePlans } from "@/features/usePlans";
import { api } from "@/lib/api";
import { invitationUrl } from "@/lib/invitation";
import type { CaregiverLink } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { Checkbox } from "@/ui/Checkbox";
import { ConfirmModal } from "@/ui/ConfirmModal";
import { Field } from "@/ui/Field";
import { Labeled } from "@/ui/Labeled";
import { WizardShell } from "@/ui/WizardShell";

const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

/** Asistente "Agregar cuidador": 1) correo, 2) revisar lista y enviar invitaciones (se comparten por enlace). */
export default function NewCaregivers() {
  const plans = usePlans();
  const plan = plans.data?.find((p) => p.status === "active");
  const existing = useCaregivers(plan?.id);
  const { mutate } = useSWRConfig();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [supervise, setSupervise] = useState(true);
  const [list, setList] = useState<string[]>([]);
  const [sent, setSent] = useState<CaregiverLink[] | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const dup = list.includes(email.trim().toLowerCase()) || !!existing.data?.some((c) => c.status !== "rejected" && c.email.toLowerCase() === email.trim().toLowerCase());
  const close = () => (list.length || email ? setLeaving(true) : router.back());

  async function save() {
    if (!plan) return;
    setBusy(true);
    setError("");
    const done: CaregiverLink[] = [];
    try {
      for (const e of list) done.push(await api<CaregiverLink>(`/plans/${plan.id}/caregivers`, { method: "POST", json: { email: e } }));
      await mutate(`/plans/${plan.id}/caregivers`);
      setSent(done);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos enviar las invitaciones.");
      if (done.length) setSent(done);
    } finally {
      setBusy(false);
    }
  }

  if (!plan && !plans.isLoading)
    return (
      <WizardShell progress={0} step="Paso 1" title="Primero creá un plan" subtitle="Los cuidadores supervisan un plan de tratamiento. Creá el plan y después volvé acá." onClose={() => router.back()} footer={<View style={s.full}><Button title="Volver" onPress={() => router.back()} /></View>}>
        <View />
      </WizardShell>
    );

  if (sent)
    return (
      <WizardShell progress={1} step="Listo" title="Invitaciones creadas" subtitle="Compartí el enlace con cada persona. Lo tiene que abrir con la cuenta de ese mismo correo." onClose={() => router.back()} footer={<View style={s.full}><Button title="Terminar" onPress={() => router.back()} /></View>}>
        {sent.map((l) => (
          <View key={l.id} style={s.card}>
            <Text style={s.name}>{l.email}</Text>
            <Button title="Compartir enlace" variant="soft" onPress={() => void Share.share({ message: `Te invité a supervisar mi tratamiento en MediPlan: ${invitationUrl(l.token ?? "")}` })} />
          </View>
        ))}
        {error ? <Text style={s.err}>{error}</Text> : null}
      </WizardShell>
    );

  return (
    <>
      {step === 1 ? (
        <WizardShell progress={0.3} step="Paso 1" title="Agregar cuidador" subtitle="Las personas que agregues pueden recibir notificaciones sobre avance en tus tratamientos." onClose={close} footer={<View style={s.full}><Button title="Agregar cuidador" disabled={!validEmail(email) || !supervise || dup} onPress={() => { setList((x) => [...x, email.trim().toLowerCase()]); setEmail(""); setStep(2); }} /></View>}>
          <Labeled label="Correo electrónico" hint="Escriba el correo electrónico de la persona que quieres agregar." error={email && !validEmail(email) ? "Revisá el correo: no parece válido." : dup ? "Esa persona ya está en la lista." : null}>
            <Field placeholder="Ej: pablo@gmail.com" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          </Labeled>
          <Text style={s.label}>Quiero agregar a esta persona para:</Text>
          <Checkbox label="Que supervise mi tratamiento" checked={supervise} onChange={setSupervise} />
        </WizardShell>
      ) : (
        <WizardShell
          progress={1}
          step="Paso 2"
          title="Revisar lista de personas"
          subtitle="Asegúrese de que la información de las personas en la lista es correcta antes de guardar."
          onClose={close}
          footer={<View style={s.full}><Button title="Guardar lista de cuidadores" loading={busy} disabled={list.length === 0} onPress={() => void save()} /></View>}
        >
          {list.map((e) => (
            <View key={e} style={s.person}>
              <View style={s.avatar}><Text style={s.avatarText}>{e[0].toUpperCase()}</Text></View>
              <Text style={[s.name, { flex: 1 }]}>{e}</Text>
              <Button title="Quitar" variant="soft" onPress={() => setList((x) => x.filter((y) => y !== e))} />
            </View>
          ))}
          <Text style={s.label}>Enviaremos una invitación a estas personas al finalizar.</Text>
          <Button title="Agregar otra persona" variant="soft" onPress={() => setStep(1)} />
          {error ? <Text style={s.err}>{error}</Text> : null}
        </WizardShell>
      )}
      <ConfirmModal visible={leaving} title="¿No quiere agregar cuidadores ahora?" message="No se preocupe, puede agregar cuidadores en cualquier momento desde su perfil." confirmLabel="No, salir" onCancel={() => setLeaving(false)} onConfirm={() => { setLeaving(false); router.back(); }} />
    </>
  );
}

const s = StyleSheet.create({
  full: { flex: 1 },
  label: { fontSize: 13, color: colors.text },
  err: { fontSize: 12, color: colors.danger },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 10 },
  person: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { color: colors.primary, fontWeight: "700" },
  name: { fontSize: 14, color: colors.text },
});
