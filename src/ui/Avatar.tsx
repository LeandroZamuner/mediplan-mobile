import { StyleSheet, View } from "react-native";
import { colors } from "@/theme/tokens";
import { Text } from "@/ui/Text";

/** Círculo (o cuadrado redondeado) con la inicial; sirve hasta que haya foto de perfil. */
export function Avatar({ label, size = 40, square }: { label: string; size?: number; square?: boolean }) {
  return (
    <View style={[s.box, { width: size, height: size, borderRadius: square ? size / 4 : size / 2 }]}>
      <Text style={[s.text, { fontSize: size * 0.42 }]}>{(label.trim()[0] ?? "?").toUpperCase()}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  text: { color: colors.primary, fontWeight: "600" },
});
