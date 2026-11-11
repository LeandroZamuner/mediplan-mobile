import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/tokens";

export function Checkbox({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} disabled={disabled} onPress={() => onChange(!checked)} style={[s.row, disabled && { opacity: 0.5 }]}>
      <View style={[s.box, checked && s.on]}>{checked ? <Feather name="check" size={14} color="#fff" /> : null}</View>
      <Text style={s.label}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6 },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: "#5A606D", alignItems: "center", justifyContent: "center" },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontSize: 14, color: colors.text },
});
