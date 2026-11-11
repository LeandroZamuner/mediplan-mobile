import { Stack } from "expo-router";
import { useAuth } from "@/auth/AuthProvider";

/** Zona con sesión iniciada: primero el onboarding (una sola vez) o las pestañas, y encima los asistentes y listas. */
export default function AppLayout() {
  const { onboarded } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!!onboarded}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Screen name="plan/nuevo" options={{ presentation: "modal" }} />
      <Stack.Screen name="cuidadores/nuevo" options={{ presentation: "modal" }} />
      <Stack.Screen name="historial" />
      <Stack.Screen name="recordatorios" />
      <Stack.Screen name="medicamento" />
    </Stack>
  );
}
