import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { Text } from "@/ui/Text";

type Props = { title?: string; subtitle?: string; hero?: ReactNode; children: ReactNode };

/** Pantalla principal: franja violeta (el degradado del acceso) con el título y, debajo, el contenido en una hoja blanca. */
export function TabScreen({ title, subtitle, hero, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={s.screen}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={s.grow} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <LinearGradient colors={[colors.gradientTop, colors.gradientBottom]} style={[s.band, { paddingTop: insets.top + 16 }]}>
          {title ? <Text style={s.title}>{title}</Text> : null}
          {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
          {hero}
        </LinearGradient>
        <View style={s.sheet}>{children}</View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  grow: { flexGrow: 1 },
  band: { paddingHorizontal: 16, paddingBottom: 44, gap: 8 },
  title: { ...type.title, color: "#fff" },
  sub: { ...type.body, color: "#C9CDEB" },
  sheet: { flexGrow: 1, marginTop: -24, backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, gap: 12, paddingBottom: 32 },
});
