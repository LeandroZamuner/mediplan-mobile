import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { GradientScreen } from "@/ui/GradientScreen";
import { Button } from "@/ui/Button";
import { useEffect } from "react";
import { Text } from "react-native";
import * as Notifications from "expo-notifications";
import { recordTaken } from "@/lib/doses";
import { handleDoseAction } from "@/notifications/respond";
import { DOSE_CATEGORY, DOSE_CHANNEL } from "@/notifications/sync";
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
        <Stack.Screen name="historial" />
        <Stack.Screen name="recordatorios" />
        <Stack.Screen name="medicamento" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void setupNotifications();
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const { title, body, data } = r.notification.request.content;
      const action = r.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER ? "default" : r.actionIdentifier;
      void handleDoseAction(action, data ?? {}, { title, body }, {
        recordTaken,
        openList: () => router.push("/recordatorios"),
        now: () => new Date(),
        scheduleAt: (date, content, d) =>
          Notifications.scheduleNotificationAsync({
            content: { title: content.title ?? "", body: content.body ?? "", categoryIdentifier: DOSE_CATEGORY, data: d },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: DOSE_CHANNEL },
          }),
      });
    });
    return () => sub.remove();
  }, []);
  return (
    <AuthProvider>
      <StatusBar style="auto" />
      <Routes />
    </AuthProvider>
  );
}
