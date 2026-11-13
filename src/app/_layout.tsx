import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@/auth/AuthProvider";
import { SwrProvider } from "@/lib/SwrProvider";
import { ConnectingScreen, useSlowAfter } from "@/ui/ConnectingScreen";
import { GradientScreen } from "@/ui/GradientScreen";
import { Button } from "@/ui/Button";
import { useEffect } from "react";
import { AppState } from "react-native";
import { Text } from "@/ui/Text";
import * as Notifications from "expo-notifications";
import { recordTaken } from "@/lib/doses";
import { handleDoseAction } from "@/notifications/respond";
import { setupNotifications } from "@/notifications/setup";
import { useAlarmEvents } from "@/notifications/use-alarm-events";
import { flushPendingTakes } from "@/lib/takes-queue";
import { useSWRConfig } from "swr";

// La pantalla de arranque (logo sobre azul) queda visible hasta que sepamos si hay sesión.
void SplashScreen.preventAutoHideAsync();

function Routes() {
  const { status, error, recheck, onboarded } = useAuth();
  const { mutate } = useSWRConfig();
  // Tomas marcadas sin internet: se envían al abrir la app, al volver a ella y al iniciar sesión.
  useEffect(() => {
    if (status !== "ready") return;
    const run = () =>
      void flushPendingTakes().then((n) => {
        if (n > 0) void mutate((k) => Array.isArray(k) && (k[0] === "doses-today" || k[0] === "doses-on"));
      });
    run();
    const sub = AppState.addEventListener("change", (s) => s === "active" && run());
    return () => sub.remove();
  }, [status, mutate]);
  // Alarma Fuerte: pantalla completa y botones con la app abierta (con la app cerrada los atiende background.ts).
  useAlarmEvents(status === "ready" && !!onboarded);
  const ready = status !== "loading" && !(status === "ready" && onboarded === null);
  // Si abrir la sesión tarda (servidor dormido), se saca la pantalla de arranque y se explica qué pasa.
  const slow = useSlowAfter(!ready, 4000);
  useEffect(() => {
    if (ready || slow) SplashScreen.hide();
  }, [ready, slow]);

  if (!ready) return slow ? <ConnectingScreen /> : null; // antes de 4 s sigue visible la pantalla de arranque
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
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={status === "ready" && !!onboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={status === "ready"}>
        <Stack.Screen name="plan/nuevo" options={{ presentation: "modal" }} />
        <Stack.Screen name="cuidadores/nuevo" options={{ presentation: "modal" }} />
        <Stack.Screen name="alarma" options={{ presentation: "fullScreenModal", animation: "fade", gestureEnabled: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  useEffect(() => {
    void setupNotifications();
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      const { data } = r.notification.request.content;
      const action = r.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER ? "default" : r.actionIdentifier;
      void handleDoseAction(action, data ?? {}, { recordTaken, openList: () => router.push("/recordatorios") });
    });
    return () => sub.remove();
  }, []);
  if (!fontsLoaded) return null; // sigue visible la pantalla de arranque
  return (
    <SwrProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Routes />
      </AuthProvider>
    </SwrProvider>
  );
}
