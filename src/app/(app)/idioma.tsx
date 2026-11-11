import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius } from "@/theme/tokens";
import { BackButton } from "@/ui/BackButton";

export default function Idioma() {
  return (
    <SafeAreaView style={s.screen}>
      <View style={s.pad}>
        <BackButton onDark={false} />
        <Text style={s.title}>Preferencias de idioma</Text>
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
