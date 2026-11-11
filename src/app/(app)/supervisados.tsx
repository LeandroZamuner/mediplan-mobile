import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSWR, { useSWRConfig } from "swr";
import { api } from "@/lib/api";
import { medicationsLabel } from "@/lib/plans";
import type { CaregiverLink, Plan } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";
import { BackButton } from "@/ui/BackButton";
import { Button } from "@/ui/Button";

/** Planes que cuido y las invitaciones que me hicieron para cuidar. */
export default function Supervisados() {
  const { mutate } = useSWRConfig();
  const invitations = useSWR<CaregiverLink[]>("/invitations", (p: string) => api<CaregiverLink[]>(p));
  const supervised = useSWR<Plan[]>("/plans/supervised", (p: string) => api<Plan[]>(p));
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  async function answer(l: CaregiverLink, action: "accept" | "reject") {
    setBusyId(l.id);
    setError("");
    try {
      await api(`/invitations/${l.id}/${action}`, { method: "POST" });
      await Promise.all([invitations.mutate(), supervised.mutate(), mutate("/plans/supervised")]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos responder la invitación.");
    } finally {
      setBusyId("");
    }
  }

  const pending = (invitations.data ?? []).filter((l) => l.status === "pending");

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <BackButton onDark={false} />
        <Text style={s.title}>Personas que cuido</Text>
        {error ? <Text style={s.err}>{error}</Text> : null}

        {pending.length > 0 ? <Text style={s.h2}>Invitaciones</Text> : null}
        {pending.map((l) => (
          <View key={l.id} style={s.card}>
            <Text style={s.name}>Te invitaron a supervisar un plan</Text>
            <View style={s.actions}>
              <View style={{ flex: 1 }}><Button title="Rechazar" variant="neutral" loading={busyId === l.id} onPress={() => void answer(l, "reject")} /></View>
              <View style={{ flex: 1 }}><Button title="Aceptar" loading={busyId === l.id} onPress={() => void answer(l, "accept")} /></View>
            </View>
          </View>
        ))}

        <Text style={s.h2}>Planes que supervisás</Text>
        {supervised.isLoading ? <Text style={s.muted}>Cargando…</Text> : (supervised.data ?? []).length === 0 ? <Text style={s.muted}>Todavía no supervisás ningún plan. Cuando alguien te invite y aceptes, aparece acá.</Text> : null}
        {(supervised.data ?? []).map((p) => (
          <Pressable key={p.id} style={s.card} onPress={() => router.push({ pathname: "/supervisado", params: { planId: p.id } })}>
            <Text style={s.name}>{p.name}</Text>
            <Text style={s.muted}>{medicationsLabel(p) || "Sin medicamentos"}</Text>
            <Text style={s.link}>Ver qué tomó y qué se salteó</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12 },
  title: { fontSize: 28, color: colors.text, marginTop: 8 },
  h2: { fontSize: 18, color: colors.text, marginTop: 8 },
  muted: { fontSize: 12, color: colors.textMuted },
  err: { fontSize: 12, color: colors.danger },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 10 },
  name: { fontSize: 15, fontWeight: "600", color: colors.text },
  link: { fontSize: 13, color: colors.primary, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 8 },
});
