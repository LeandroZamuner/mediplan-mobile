import { Feather } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "@/theme/tokens";

/** Estructura de los asistentes: botón ✕, barra de progreso, "Paso N", título, contenido y botones al pie. */
export function WizardShell({ progress, step, title, subtitle, onClose, footer, children }: { progress: number; step: string; title: string; subtitle?: string; onClose: () => void; footer: ReactNode; children: ReactNode }) {
  return (
    <SafeAreaView style={s.screen}>
      <KeyboardAvoidingView style={s.fill} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.head}>
          <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" hitSlop={6} onPress={onClose} style={s.close}>
            <Feather name="x" size={18} color={colors.text} />
          </Pressable>
          <View style={s.track}>
            <View style={[s.bar, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={s.step}>{step}</Text>
          <Text style={s.title}>{title}</Text>
          {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
        </View>
        <ScrollView style={s.fill} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
        <View style={s.footer}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  head: { paddingHorizontal: 16, gap: 8 },
  close: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginTop: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: "#DADCE0", marginTop: 8, overflow: "hidden" },
  bar: { height: 6, backgroundColor: "#7C86D6", borderRadius: 3 },
  step: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
  title: { fontSize: 20, fontWeight: "600", color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  content: { padding: 16, gap: 14 },
  footer: { padding: 16, flexDirection: "row", gap: 8, borderRadius: radius.lg },
});
