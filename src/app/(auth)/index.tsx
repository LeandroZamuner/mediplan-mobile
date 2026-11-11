import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/ui/Button";
import { GradientScreen } from "@/ui/GradientScreen";

/** Bienvenida. TODO: foto de la portada del Figma (pendiente del archivo de imagen). */
export default function Welcome() {
  return (
    <GradientScreen>
      <View style={s.top} />
      <Text style={s.brand}>MediPlan</Text>
      <Text style={s.title}>Cuidando de vos, un recordatorio a la vez</Text>
      <Text style={s.sub}>Organiza tu tratamiento, mejora tu vida.</Text>
      <View style={s.actions}>
        <Button title="Crear cuenta" onPress={() => router.push("/register")} />
        <Button title="Iniciar sesión" variant="ghost" onDark onPress={() => router.push("/login")} />
      </View>
    </GradientScreen>
  );
}

const s = StyleSheet.create({
  top: { flex: 1 },
  brand: { color: "#fff", fontSize: 16, marginBottom: 8 },
  title: { color: "#fff", fontSize: 24, fontWeight: "600", lineHeight: 30 },
  sub: { color: "#C9CDEB", fontSize: 12, marginTop: 8 },
  actions: { gap: 8, marginTop: 24 },
});
