import { Feather } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import { Text } from "@/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "@/theme/tokens";
import { ScreenHeader } from "@/ui/ScreenHeader";

export default function Idioma() {
  return (
    <SafeAreaView style={s.screen}>
      <View style={s.pad}>
        <ScreenHeader title="Preferencias de idioma" />
        <View style={s.row}>
          <Text style={s.name}>Español</Text>
          <Feather name="check" size={18} color={colors.primary} />
        </View>
        <Text style={s.muted}>Por ahora MediPlan está disponible solo en español.</Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12 },
  title: { fontSize: 24, color: colors.text, marginTop: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16 },
  name: { fontSize: 15, color: colors.text },
  muted: { fontSize: 12, color: colors.textMuted },
});
