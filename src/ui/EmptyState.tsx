import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import type { ComponentProps, ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { colors, radius } from "@/theme/tokens";
import { Text } from "@/ui/Text";

type Props = { icon?: ComponentProps<typeof Feather>["name"]; image?: number; title: string; text?: string; children?: ReactNode };

/** Pantalla vacía: ilustración o ícono, título, explicación y, si corresponde, la acción para salir de ahí. */
export function EmptyState({ icon, image, title, text, children }: Props) {
  return (
    <View style={s.box}>
      {image ? <Image source={image} style={s.image} contentFit="cover" /> : null}
      {icon ? <View style={s.badge}><Feather name={icon} size={28} color={colors.primary} /></View> : null}
      <Text style={s.title}>{title}</Text>
      {text ? <Text style={s.text}>{text}</Text> : null}
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  box: { alignItems: "center", gap: 12, paddingVertical: 24, paddingHorizontal: 8 },
  image: { width: "100%", aspectRatio: 328 / 240, borderRadius: radius.lg },
  badge: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "600", color: colors.text, textAlign: "center" },
  text: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
});
