import { LinearGradient } from "expo-linear-gradient";
import { KeyboardAvoidingView, StyleSheet, View, type ViewProps } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";

/** Fondo azul degradado de las pantallas de acceso. */
export function GradientScreen({ children, style }: ViewProps) {
  return (
    <LinearGradient colors={[colors.gradientTop, colors.gradientBottom]} style={s.fill}>
      <SafeAreaView style={s.fill}>
        <KeyboardAvoidingView style={s.fill} behavior="padding">
          <View style={[s.body, style]}>{children}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({ fill: { flex: 1 }, body: { flex: 1, paddingHorizontal: 24, paddingBottom: 16 } });
