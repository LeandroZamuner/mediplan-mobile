import { ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { Text } from "@/ui/Text";
import { colors, radius } from "@/theme/tokens";

type Props = {
  title: string;
  onPress?: () => void;
  variant?: "primary" | "soft" | "neutral" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  onDark?: boolean;
};

export function Button({ title, onPress, variant = "primary", disabled, loading, onDark }: Props) {
  const off = disabled || loading;
  const bg =
    variant === "primary" ? (off && onDark ? colors.onDarkDisabled : off ? "#B8BCC9" : colors.primary)
    : variant === "soft" ? (off ? "#EDEEF6" : colors.primarySoft)
    : variant === "neutral" ? colors.surface
    : variant === "danger" ? (off ? "#E6A3B0" : colors.danger)
    : "transparent";
  const fg = variant === "primary" || variant === "danger" ? (off && onDark ? "#8D95C9" : "#fff") : variant === "soft" ? (off ? "#A3A9D6" : colors.primary) : variant === "neutral" ? colors.text : onDark ? "#fff" : colors.text;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={off} style={[s.btn, { backgroundColor: bg }]}>
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[s.text, { color: fg }]}>{title}</Text>}
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { height: 48, borderRadius: radius.md, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  text: { fontSize: 15, fontWeight: "600" },
});
