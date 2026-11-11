import { router } from "expo-router";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { Logo } from "@/ui/Logo";

/** Bienvenida: la foto (con el degradado ya incluido) ocupa toda la pantalla y el texto va abajo. */
export default function Welcome() {
  return (
    <View style={s.fill}>
      <Image source={require("../../../assets/images/welcome.png")} style={s.photo} resizeMode="cover" />
      <SafeAreaView style={s.safe}>
        <View style={s.top} />
        <View style={s.body}>
          <View style={s.logo}><Logo width={100} /></View>
          <Text style={s.title}>Cuidando de vos, un recordatorio a la vez</Text>
          <Text style={s.sub}>Organiza tu tratamiento, mejora tu vida.</Text>
          <View style={s.actions}>
            <Button title="Crear cuenta" onPress={() => router.push("/register")} />
            <Button title="Iniciar sesión" variant="ghost" onDark onPress={() => router.push("/login")} />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.gradientBottom },
  safe: { flex: 1 },
  photo: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  top: { flex: 1 },
  body: { paddingHorizontal: 24, paddingBottom: 16 },
  logo: { marginBottom: 8 },
  title: { color: "#fff", fontSize: 24, fontWeight: "600", lineHeight: 30 },
  sub: { color: "#C9CDEB", fontSize: 12, marginTop: 8 },
  actions: { gap: 8, marginTop: 24 },
});
