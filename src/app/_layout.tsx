import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { GradientScreen } from "@/ui/GradientScreen";
import { Button } from "@/ui/Button";
import { useEffect } from "react";
import { Text } from "react-native";
import { setupNotifications } from "@/notifications/setup";

function Routes() {
  const { status, error, recheck, onboarded } = useAuth();
  if (status === "loading" || onboarded === null) return null;
  if (status === "error")
    return (
      <GradientScreen style={{ justifyContent: "center", gap: 12 }}>
        <Text style={{ color: "#fff", fontSize: 18 }}>No pudimos conectar con MediPlan</Text>
        <Text style={{ color: "#C9CDEB" }}>{error}</Text>
        <Button title="Reintentar" onPress={() => void recheck()} />
      </GradientScreen>
    );
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={status === "signedOut"}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={status === "needsVerification"}>
        <Stack.Screen name="verify" />
      </Stack.Protected>
      <Stack.Protected guard={status === "ready" && !onboarded}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={status === "ready" && onboarded}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={status === "ready"}>
        <Stack.Screen name="plan/nuevo" options={{ presentation: "modal" }} />
        <Stack.Screen name="cuidadores/nuevo" options={{ presentation: "modal" }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void setupNotifications();
  }, []);
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Routes />
    </AuthProvider>
  );
}
