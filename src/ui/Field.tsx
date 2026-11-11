import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { colors, radius } from "@/theme/tokens";

/** Campo de texto. `onDark` = el estilo translúcido que va sobre el degradado azul. */
export function Field({ onDark, style, ...rest }: TextInputProps & { onDark?: boolean }) {
  return (
    <TextInput
      placeholderTextColor={onDark ? "#9AA1CE" : colors.textMuted}
      style={[s.input, onDark ? s.dark : s.light, style]}
      {...rest}
    />
  );
}

const s = StyleSheet.create({
  input: { height: 48, borderRadius: radius.md, paddingHorizontal: 14, fontSize: 15 },
  dark: { backgroundColor: colors.onDarkField, color: "#fff" },
  light: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, color: colors.text },
});
