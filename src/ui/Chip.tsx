import { StyleSheet, View } from "react-native";
import { colors } from "@/theme/tokens";
import { Text } from "@/ui/Text";

type Tone = "ok" | "warning" | "danger" | "neutral";
const TONES: Record<Tone, { bg: string; fg: string }> = {
  ok: { bg: "#D5F5EA", fg: "#0B6B4B" },
  warning: { bg: colors.warning, fg: "#3a2f00" },
  danger: { bg: "#F8D7DE", fg: colors.danger },
  neutral: { bg: "#DDE2E5", fg: colors.text },
};

export function Chip({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <View style={[s.chip, { backgroundColor: TONES[tone].bg }]}>
      <Text style={[s.text, { color: TONES[tone].fg }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip: { alignSelf: "flex-start", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: "600" },
});
