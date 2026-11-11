import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/theme/tokens";
import { whenLabel } from "@/lib/when";
import type { TodayDose } from "@/lib/doses";

export function DoseRow({ dose, tz, onToggle }: { dose: TodayDose; tz: string; onToggle?: () => void }) {
  const taken = dose.status === "taken";
  return (
    <View style={s.row}>
      <View style={s.icon}>
        <Feather name="paperclip" size={18} color={colors.textMuted} />
      </View>
      <View style={s.texts}>
        <Text style={s.name}>{dose.medicationName} {dose.dose}</Text>
        <Text style={s.when}>{whenLabel(dose.scheduledAt, tz, new Date())}</Text>
      </View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: taken }} disabled={taken} onPress={onToggle} style={[s.box, taken && s.boxOn]}>
        {taken ? <Feather name="check" size={14} color="#fff" /> : null}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  icon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  texts: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  when: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  box: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: "#5A606D", alignItems: "center", justifyContent: "center" },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});
