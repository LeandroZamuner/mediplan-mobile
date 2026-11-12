import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/ui/Text";
import { colors, radius } from "@/theme/tokens";

type Option<T> = { label: string; value: T };

/** Campo desplegable: muestra una lista de opciones en una hoja. */
export function Select<T extends string | number>({ label, placeholder, value, options, onChange }: { label?: string; placeholder: string; value: T | null; options: Option<T>[]; onChange: (v: T) => void }) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <Pressable accessibilityRole="button" onPress={() => setOpen(true)} style={s.field}>
        <Text style={[s.value, !current && { color: colors.textMuted }]}>{current?.label ?? placeholder}</Text>
        <Feather name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.scrim} onPress={() => setOpen(false)}>
          <View style={s.sheet}>
            {options.map((o) => (
              <Pressable
                key={String(o.value)}
                style={s.option}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
              >
                <Text style={[s.optionText, o.value === value && { color: colors.primary, fontWeight: "600" }]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  label: { fontSize: 12, color: colors.text },
  field: { height: 48, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  value: { fontSize: 15, color: colors.text },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 12, paddingBottom: 28 },
  option: { paddingVertical: 14, paddingHorizontal: 12 },
  optionText: { fontSize: 16, color: colors.text },
});
