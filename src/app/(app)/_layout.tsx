import { Stack } from "expo-router";

/** Zona principal (ya con onboarding resuelto): las pestañas y, encima, historial, recordatorios y detalle. */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="historial" />
      <Stack.Screen name="recordatorios" />
      <Stack.Screen name="medicamento" />
    </Stack>
  );
}
