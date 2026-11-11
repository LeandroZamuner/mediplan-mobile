import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, type ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { useCaregivers, usePlans } from "@/features/usePlans";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";

/** "Configuración de mi cuenta": checklist de plan de tratamiento y cuidadores. */
export default function Setup() {
  const { completeOnboarding } = useAuth();
  const plans = usePlans();
  const plan = plans.data?.find((p) => p.status === "active");
  const caregivers = useCaregivers(plan?.id);
  const hasCaregivers = (caregivers.data ?? []).some((c) => c.status !== "rejected");
  const [later, setLater] = useState(false);
  const done = !!plan;

  return (
    <SafeAreaView style={s.screen}>
      <Text style={s.title}>{"Configuración\nde mi cuenta"}</Text>
      <View style={s.cards}>
        <Card icon="clipboard" done={!!plan} title="Plan de tratamiento" text="Cree recordatorios personalizados para asegurarse de tomar sus medicamentos a tiempo." action={plan ? "Editar plan" : "Crear plan"} onPress={() => router.push("/plan/nuevo")} />
        <Card icon="heart" done={hasCaregivers} title="Familiares y cuidadores" text="Agregue familiares o cuidadores para que puedan estar pendientes del avance en su tratamiento." action={hasCaregivers ? "Editar lista" : "Agregar cuidadores"} disabled={!plan} onPress={() => router.push("/cuidadores/nuevo")} />
        {!plan ? <Text style={s.hint}>Para agregar cuidadores primero creá tu plan.</Text> : null}
      </View>
      <View style={s.actions}>
        <Button title="Guardar configuración" disabled={!done} onPress={() => void completeOnboarding()} />
        <Button title="Omitir, por ahora" variant="ghost" onPress={() => setLater(true)} />
      </View>
      <ConfirmModal visible={later} title="¿Quiere configurar su perfil después?" message="No se preocupe, puede hacer esta configuración en cualquier momento." confirmLabel="Si, salir" onCancel={() => setLater(false)} onConfirm={() => { setLater(false); void completeOnboarding(); }} />
    </SafeAreaView>
  );
}

function Card({ icon, done, title, text, action, disabled, onPress }: { icon: ComponentProps<typeof Feather>["name"]; done: boolean; title: string; text: string; action: string; disabled?: boolean; onPress: () => void }) {
  return (
    <View style={s.card}>
      <View style={s.row}>
        {done ? <View style={s.check}><Feather name="check" size={16} color={colors.text} /></View> : <Feather name={icon} size={18} color={colors.text} />}
        <Text style={s.cardTitle}>{title}</Text>
      </View>
      <Text style={s.cardText}>{text}</Text>
      <Button title={action} variant="soft" disabled={disabled} onPress={onPress} />
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { fontSize: 28, color: colors.text, marginTop: 32, lineHeight: 36 },
  cards: { gap: 12, marginTop: 24, flex: 1 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14, gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  check: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#BFEBDD", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  cardText: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  hint: { fontSize: 12, color: colors.textMuted },
  actions: { gap: 8 },
});
