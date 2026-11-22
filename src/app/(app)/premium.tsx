import { useEffect, useState } from "react";
import { AppState, Linking, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSWR from "swr";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { longDate, premiumView, priceLabel } from "@/lib/premium";
import type { Subscription } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";
import { Field } from "@/ui/Field";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { Text } from "@/ui/Text";

const FREE = ["1 plan de tratamiento activo", "Hasta 3 medicamentos", "1 cuidador por plan", "Recordatorios y registro de tomas"];
const PREMIUM = [
  "Planes, medicamentos y cuidadores sin límite",
  "Resumen semanal por correo, redactado con inteligencia artificial",
  "Asistente de IA para consultar tu tratamiento",
  "Todo lo del plan gratis",
];

/** Planes y Premium: comparación, pago con Mercado Pago (se abre en el navegador), estado y baja. */
export default function Premium() {
  const { me } = useAuth();
  const { data: sub, error, mutate } = useSWR<Subscription>("/me/subscription", (p: string) => api<Subscription>(p));
  const [busy, setBusy] = useState<"pay" | "sync" | "cancel" | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [payerEmail, setPayerEmail] = useState(me?.email ?? "");
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Al volver de Mercado Pago (la app vuelve a primer plano) se consulta el estado del pago.
  useEffect(() => {
    const check = () => api<Subscription>("/me/subscription/sync", { method: "POST" }).then((s) => mutate(s, { revalidate: false })).catch(() => undefined);
    void check();
    const l = AppState.addEventListener("change", (st) => { if (st === "active") void check(); });
    return () => l.remove();
  }, [mutate]);

  async function pay() {
    setBusy("pay");
    setMsg(null);
    try {
      const { checkoutUrl } = await api<{ checkoutUrl: string }>("/me/subscription/checkout", { method: "POST", json: { payerEmail: payerEmail.trim() } });
      await Linking.openURL(checkoutUrl);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No pudimos iniciar el pago." });
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    setBusy("sync");
    setMsg(null);
    try {
      const s = await api<Subscription>("/me/subscription/sync", { method: "POST" });
      await mutate(s, { revalidate: false });
      setMsg(s.tier === "premium" ? { ok: true, text: "¡Listo! Tu pago se confirmó y ya sos Premium." } : { ok: false, text: "Todavía no vemos el pago confirmado. Puede demorar unos minutos; probá de nuevo en un rato." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No pudimos actualizar el estado." });
    } finally {
      setBusy(null);
    }
  }

  async function cancel() {
    setConfirmCancel(false);
    setBusy("cancel");
    try {
      const s = await api<Subscription>("/me/subscription", { method: "DELETE" });
      await mutate(s, { revalidate: false });
      setMsg({ ok: true, text: "Cancelamos tu suscripción. No se te va a cobrar de nuevo." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "No pudimos cancelar la suscripción." });
    } finally {
      setBusy(null);
    }
  }

  const view = sub ? premiumView(sub) : null;
  const until = sub?.currentPeriodEnd ? longDate(sub.currentPeriodEnd) : null;

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <ScreenHeader title="Premium" subtitle="Sacale todo el provecho a MediPlan, sin límites." />
        {error ? <Text style={s.err}>No pudimos cargar tu suscripción. Probá de nuevo en un momento.</Text> : null}
        {!sub && !error ? <Text style={s.muted}>Cargando…</Text> : null}
        {msg ? <Text style={msg.ok ? s.ok : s.err}>{msg.text}</Text> : null}

        {sub && view ? (
          <>
            {(view === "premium" || view === "premium-ending") && (
              <View style={s.highlight}>
                <Text style={s.h2}>Sos Premium</Text>
                <Text style={s.body}>
                  {view === "premium"
                    ? until ? `Tu suscripción se renueva el ${until}.` : "Tu suscripción está activa."
                    : `Cancelaste la suscripción: seguís siendo Premium hasta el ${until ?? "fin del período pagado"} y no se te cobra de nuevo.`}
                </Text>
                {view === "premium" ? <Button title="Cancelar suscripción" variant="soft" loading={busy === "cancel"} onPress={() => setConfirmCancel(true)} /> : null}
              </View>
            )}

            {view === "pending" && (
              <View style={s.highlight}>
                <Text style={s.h2}>Estamos esperando tu pago</Text>
                <Text style={s.body}>Si ya pagaste en Mercado Pago, puede demorar unos minutos en confirmarse. Si no terminaste, podés retomarlo.</Text>
                <Button title="Ya pagué, actualizar" loading={busy === "sync"} onPress={() => void refresh()} />
                <Button title="Retomar el pago" variant="soft" loading={busy === "pay"} onPress={() => void pay()} />
              </View>
            )}

            {view === "unavailable" && <Text style={s.body}>Los pagos todavía no están habilitados. Mientras tanto podés usar MediPlan con el plan gratis.</Text>}

            <View style={s.card}>
              <Text style={s.h2}>Gratis</Text>
              {FREE.map((f) => <Text key={f} style={s.body}>• {f}</Text>)}
              <Text style={s.muted}>Estás usando {sub.usage.activePlans} {sub.usage.activePlans === 1 ? "plan" : "planes"} y {sub.usage.medications} {sub.usage.medications === 1 ? "medicamento" : "medicamentos"}.</Text>
            </View>
            <View style={[s.card, s.cardPremium]}>
              <Text style={s.h2}>Premium</Text>
              {sub.payments.enabled ? <Text style={s.price}>{priceLabel(sub)}</Text> : null}
              {PREMIUM.map((f) => <Text key={f} style={s.body}>• {f}</Text>)}
            </View>

            {view === "free" && (
              <View style={s.card}>
                <Text style={s.h2}>Pasar a Premium</Text>
                <Text style={s.body}>Vas a pagar en Mercado Pago, con la cuenta o la tarjeta que elijas. Se cobra todos los meses y podés cancelar cuando quieras desde esta pantalla. Premium se activa en cuanto se confirma el pago.</Text>
                <Text style={s.label}>Correo de tu cuenta de Mercado Pago</Text>
                <Field value={payerEmail} onChangeText={setPayerEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                <Button title="Pagar con Mercado Pago" loading={busy === "pay"} disabled={!payerEmail.includes("@")} onPress={() => void pay()} />
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
      <ConfirmModal
        visible={confirmCancel}
        title="¿Cancelar tu suscripción?"
        message={`No se te va a cobrar de nuevo. Seguís siendo Premium hasta el ${until ?? "fin del período pagado"}; después volvés al plan gratis y tus datos se conservan.`}
        cancelLabel="No"
        confirmLabel="Sí, cancelar"
        danger
        onCancel={() => setConfirmCancel(false)}
        onConfirm={() => void cancel()}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12, paddingBottom: 32 },
  h2: { fontSize: 18, fontWeight: "600", color: colors.text },
  body: { fontSize: 14, lineHeight: 20, color: colors.text },
  muted: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  label: { fontSize: 13, fontWeight: "500", color: colors.text },
  price: { fontSize: 24, fontWeight: "600", color: colors.primary },
  err: { fontSize: 13, color: colors.danger },
  ok: { fontSize: 13, color: colors.success },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 8 },
  cardPremium: { backgroundColor: colors.primarySoft },
  highlight: { backgroundColor: colors.primarySoft, borderRadius: radius.lg, padding: 16, gap: 10 },
});
