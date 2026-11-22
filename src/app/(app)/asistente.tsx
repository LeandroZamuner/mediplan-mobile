import { router } from "expo-router";
import { useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import useSWR from "swr";
import { api } from "@/lib/api";
import { assistantErrorMessage, contextOf, EMERGENCY_NOTE } from "@/lib/assistant";
import type { ChatMessage, Preferences, Subscription } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { Text } from "@/ui/Text";

const SUGGESTIONS = ["¿Qué me toca tomar hoy?", "¿Cómo vengo con mis tomas esta semana?", "¿A qué medicamento le queda poco stock?"];

/** Chat con el asistente de IA (Premium, con consentimiento). La conversación vive solo en esta pantalla. */
export default function Asistente() {
  const { data: sub } = useSWR<Subscription>("/me/subscription", (p: string) => api<Subscription>(p));
  const { data: prefs, mutate: mutatePrefs } = useSWR<Preferences>("/me/preferences", (p: string) => api<Preferences>(p));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const scroll = useRef<React.ComponentRef<typeof ScrollView>>(null);

  async function accept() {
    if (!prefs) return;
    setBusy(true);
    setError("");
    try {
      const next = await api<Preferences>("/me/preferences", { method: "PUT", json: { weeklyReport: prefs.weeklyReport, aiConsent: true } });
      await mutatePrefs(next, { revalidate: false });
    } catch (e) {
      setError(assistantErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function send(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", text: q }];
    setMessages(next);
    setText("");
    setBusy(true);
    setError("");
    try {
      const { reply } = await api<{ reply: string }>("/assistant/chat", { method: "POST", json: { messages: contextOf(next) } });
      setMessages([...next, { role: "assistant", text: reply }]);
    } catch (e) {
      setError(assistantErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  let body: React.ReactNode;
  if (!sub || !prefs) {
    body = <Text style={s.muted}>Cargando…</Text>;
  } else if (sub.tier !== "premium") {
    body = (
      <View style={s.card}>
        <Text style={s.h2}>El asistente es parte de Premium</Text>
        <Text style={s.body}>Con Premium podés conversar con un asistente de inteligencia artificial que conoce tu plan de tratamiento, además de planes y medicamentos sin límite.</Text>
        <Button title="Ver Premium" onPress={() => router.push("/premium")} />
      </View>
    );
  } else if (!prefs.assistantAvailable) {
    body = <Text style={s.body}>El asistente todavía no está habilitado. Vamos a avisarte cuando esté listo.</Text>;
  } else if (!prefs.aiConsent) {
    body = (
      <View style={s.card}>
        <Text style={s.h2}>Antes de empezar</Text>
        <Text style={s.body}>
          El asistente usa un modelo de inteligencia artificial de Google (Gemini). Para responderte recibe lo que escribís y los datos de tu tratamiento que necesita consultar (por ejemplo, tus medicamentos y horarios). No guardamos tus conversaciones. Podés retirar el permiso cuando quieras desde Premium.
        </Text>
        {error ? <Text style={s.err}>{error}</Text> : null}
        <Button title="Acepto y quiero usar el asistente" loading={busy} onPress={() => void accept()} />
      </View>
    );
  } else {
    body = (
      <>
        <Text style={s.note}>{EMERGENCY_NOTE}</Text>
        {messages.length === 0 ? (
          <View style={s.chips}>
            {SUGGESTIONS.map((q) => (
              <Pressable key={q} accessibilityRole="button" style={s.chip} onPress={() => void send(q)}>
                <Text style={s.chipText}>{q}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {messages.map((m, i) => (
          <View key={i} style={[s.bubble, m.role === "user" ? s.mine : s.theirs]}>
            <Text style={m.role === "user" ? s.mineText : s.theirsText}>{m.text}</Text>
          </View>
        ))}
        {busy ? <View style={[s.bubble, s.theirs]}><Text style={s.theirsText}>Pensando…</Text></View> : null}
        {error ? <Text style={s.err}>{error}</Text> : null}
      </>
    );
  }

  const chatting = !!(sub && prefs && sub.tier === "premium" && prefs.assistantAvailable && prefs.aiConsent);
  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView ref={scroll} contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled" onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}>
          <ScreenHeader title="Asistente" subtitle="Preguntale sobre tu tratamiento: tomas, horarios, stock y cumplimiento." />
          {body}
        </ScrollView>
        {chatting ? (
          <View style={s.composer}>
            <View style={{ flex: 1 }}>
              <Field value={text} onChangeText={setText} placeholder="Escribí tu pregunta" maxLength={1000} editable={!busy} onSubmitEditing={() => void send(text)} returnKeyType="send" />
            </View>
            <Button title="Enviar" disabled={busy || !text.trim()} onPress={() => void send(text)} />
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12, paddingBottom: 24 },
  h2: { fontSize: 18, fontWeight: "600", color: colors.text },
  body: { fontSize: 14, lineHeight: 20, color: colors.text },
  muted: { fontSize: 13, color: colors.textMuted },
  note: { fontSize: 12, lineHeight: 17, color: colors.textMuted, backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 10 },
  err: { fontSize: 13, color: colors.danger },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 10 },
  chips: { gap: 8 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10 },
  chipText: { fontSize: 14, color: colors.primary },
  bubble: { maxWidth: "88%", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  mine: { alignSelf: "flex-end", backgroundColor: colors.primary },
  theirs: { alignSelf: "flex-start", backgroundColor: colors.surface },
  mineText: { color: "#fff", fontSize: 14, lineHeight: 20 },
  theirsText: { color: colors.text, fontSize: 14, lineHeight: 20 },
  composer: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
});
