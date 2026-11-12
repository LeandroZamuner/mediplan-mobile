import { StyleSheet, View } from "react-native";
import { colors } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { BackButton } from "@/ui/BackButton";
import { Text } from "@/ui/Text";

/** Encabezado de las pantallas secundarias: botón volver, título grande y subtítulo opcional. */
export function ScreenHeader({ title, subtitle, back = true }: { title: string; subtitle?: string; back?: boolean }) {
  return (
    <View style={s.box}>
      {back ? <BackButton onDark={false} /> : null}
      <Text style={s.title}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { gap: 8, marginBottom: 8 },
  title: { ...type.title, color: colors.text, marginTop: 8 },
  sub: { ...type.body, color: colors.textMuted },
});
