import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSWRConfig } from "swr";
import { useInvitations, useSupervised } from "@/features/usePlans";
import { api } from "@/lib/api";
import { medicationsLabel } from "@/lib/plans";
import type { CaregiverLink } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { Avatar } from "@/ui/Avatar";
import { Button } from "@/ui/Button";
import { EmptyState } from "@/ui/EmptyState";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { SectionTitle } from "@/ui/SectionTitle";
import { Text } from "@/ui/Text";

/** Planes de otras personas que supervisás y las invitaciones que recibiste. */
export default function Cuidados({ withBack }: { withBack?: boolean }) {
  const { mutate } = useSWRConfig();
  const invitations = useInvitations();
  const supervised = useSupervised();
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
  const plans = supervised.data ?? [];
  const empty = !supervised.isLoading && pending.length === 0 && plans.length === 0;

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.pad}>
        <ScreenHeader back={!!withBack} title="Cuidados" subtitle="Seguí el tratamiento de las personas que te pidieron que las acompañes." />
        {error ? <Text style={s.error}>{error}</Text> : null}

        {pending.length > 0 ? <SectionTitle>Invitaciones</SectionTitle> : null}
        {pending.map((l) => (
          <View key={l.id} style={s.card}>
            <View style={s.row}>
              <Avatar label={l.patientEmail ?? "?"} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{l.patientEmail ?? "Alguien"}</Text>
                <Text style={s.muted}>te invitó a supervisar {l.planName ? `su plan “${l.planName}”` : "su plan"}</Text>
              </View>
            </View>
            <View style={s.row}>
              <View style={{ flex: 1 }}><Button title="Rechazar" variant="neutral" loading={busyId === l.id} onPress={() => void answer(l, "reject")} /></View>
              <View style={{ flex: 1 }}><Button title="Aceptar" loading={busyId === l.id} onPress={() => void answer(l, "accept")} /></View>
            </View>
          </View>
        ))}

        {plans.length > 0 ? <SectionTitle>Planes que supervisás</SectionTitle> : null}
        {plans.map((p) => (
          <Pressable key={p.id} accessibilityRole="button" style={s.card} onPress={() => router.push({ pathname: "/supervisado", params: { planId: p.id } })}>
            <View style={s.row}>
              <Avatar label={p.name} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{p.name}</Text>
                <Text style={s.muted}>{medicationsLabel(p) || "Sin medicamentos"}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textMuted} />
            </View>
            <Text style={s.link}>Ver qué tomó y qué se salteó</Text>
          </Pressable>
        ))}

        {empty ? (
          <EmptyState image={require("../../../../assets/images/onboarding-cuidadores.jpg")} title="Todavía no cuidás a nadie" text="Cuando alguien te invite a supervisar su tratamiento y aceptes, vas a poder ver qué tomó y qué se salteó." />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { ...type.h3, color: colors.text },
  muted: { ...type.small, color: colors.textMuted },
  link: { ...type.label, fontWeight: "500", color: colors.primary },
  error: { ...type.small, color: colors.danger },
});
