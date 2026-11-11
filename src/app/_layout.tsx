import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { GradientScreen } from "@/ui/GradientScreen";
import { Button } from "@/ui/Button";
import { Text } from "react-native";

function Routes() {
  const { status, error, recheck } = useAuth();
  if (status === "loading") return null;
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
      <Stack.Protected guard={status === "ready"}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Routes />
    </AuthProvider>
  );
}
