import { router } from "expo-router";
import { StyleSheet, View, type StyleProp, type TextStyle } from "react-native";
import { isPlanLimitMessage } from "@/lib/premium";
import { colors, radius } from "@/theme/tokens";
import { Button } from "./Button";
import { Text } from "./Text";

/** Mensaje de error. Si es por el tope del plan gratis, ofrece pasar a Premium. */
export function ErrorText({ message, style }: { message: string; style?: StyleProp<TextStyle> }) {
  if (!isPlanLimitMessage(message)) return <Text style={style}>{message}</Text>;
  return (
    <View style={s.box}>
      <Text style={s.text}>{message}</Text>
      <Button title="Ver Premium" variant="soft" onPress={() => router.push("/premium")} />
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: colors.primarySoft, borderRadius: radius.md, padding: 12, gap: 10 },
  text: { fontSize: 13, lineHeight: 18, color: colors.text },
});
