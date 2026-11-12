import type { ReactNode } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text } from "@/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
import { BackButton } from "./BackButton";

export function TextPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <BackButton onDark={false} />
        <Text style={s.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export const H = ({ children }: { children: ReactNode }) => <Text style={s.h}>{children}</Text>;
export const P = ({ children }: { children: ReactNode }) => <Text style={s.p}>{children}</Text>;

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 10, paddingBottom: 40 },
  title: { fontSize: 24, color: colors.text, marginTop: 8 },
  h: { fontSize: 16, fontWeight: "600", color: colors.text, marginTop: 10 },
  p: { fontSize: 14, color: colors.text, lineHeight: 21 },
});
