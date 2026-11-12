import { colors } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { Text } from "@/ui/Text";

export function SectionTitle({ children, muted }: { children: string; muted?: boolean }) {
  return <Text style={[muted ? { ...type.label, fontWeight: "500" as const, color: colors.textMuted } : { ...type.h2, color: colors.text }, { marginTop: 12 }]}>{children}</Text>;
}
