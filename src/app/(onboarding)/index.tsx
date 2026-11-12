import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";
import { GradientScreen } from "@/ui/GradientScreen";

/** "¡Cuenta creada con éxito!": primera pantalla para quien todavía no tiene ningún plan. */
export default function AccountCreated() {
  const { completeOnboarding } = useAuth();
  const [skipping, setSkipping] = useState(false);
  const [pop] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6 }).start();
  }, [pop]);

  return (
    <GradientScreen>
      <View style={s.center}>
        <Animated.View style={[s.badge, { opacity: pop, transform: [{ scale: pop }] }]}>
          <Feather name="check" size={36} color="#fff" />
        </Animated.View>
      </View>
      <Text style={s.title}>{"¡Cuenta creada\ncon éxito!"}</Text>
      <Text style={s.text}>Complete la información de su perfil ahora para tener un mejor control de su salud y recibir recordatorios para tomar sus medicamentos a tiempo.</Text>
      <View style={s.actions}>
        <Button title="Crear plan de tratamiento" onPress={() => router.push("/funciones")} />
        <Button title="Omitir, por ahora" variant="ghost" onDark onPress={() => setSkipping(true)} />
      </View>
      <ConfirmModal visible={skipping} title="¿Quiere iniciar sin configurar su perfil?" message="Confirme esta acción pulsando Si. No se preocupe, puede hacerlo en cualquier momento." confirmLabel="Si" onCancel={() => setSkipping(false)} onConfirm={() => { setSkipping(false); void completeOnboarding(); }} />
    </GradientScreen>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#2B3585", alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 26, fontWeight: "600", lineHeight: 32 },
  text: { color: "#C9CDEB", fontSize: 12, lineHeight: 18, marginTop: 12 },
  actions: { gap: 8, marginTop: 24 },
});
