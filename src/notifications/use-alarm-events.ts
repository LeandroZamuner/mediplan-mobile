import { router } from "expo-router";
import { useEffect } from "react";
import { AppState, Platform } from "react-native";
import notifee, { EventType, type Event } from "react-native-notify-kit";
import { recordTaken } from "@/lib/doses";
import { handleAlarmEvent, pickDisplayedAlarm, type AlarmDeps } from "./alarm-events";
import { createAlarmOpener } from "./alarm-opener";
import { ACTION_OPEN } from "./native-alarm";

/**
 * Con la app abierta (o abriéndose desde la pantalla completa de la alarma): muestra la pantalla de alarma y atiende los botones.
 * Con la app cerrada, los botones los atiende `background.ts`.
 */
export function useAlarmEvents(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS !== "android") return;
    const openAlarm = createAlarmOpener((info) => router.push({ pathname: "/alarma", params: info }));
    const deps: AlarmDeps = { recordTaken, dismiss: (id) => notifee.cancelDisplayedNotification(id), openAlarm, openOnDelivered: true };
    try {
      const unsubscribe = notifee.onForegroundEvent((event) => void handleAlarmEvent(event, deps));
      // La app se abrió desde la alarma (pantalla completa o toque): Android entrega esa notificación acá.
      void notifee
        .getInitialNotification()
        .then((initial) => {
          if (initial) void handleAlarmEvent({ type: EventType.PRESS, detail: { notification: initial.notification, pressAction: { id: ACTION_OPEN } } } as Event, deps);
        })
        .catch(() => undefined);
      // Arranque en caliente desde la pantalla completa: no llega ningún evento, así que al volver a primer plano se mira si hay una alarma sonando.
      const showRinging = () =>
        void notifee
          .getDisplayedNotifications()
          .then((shown) => {
            const ringing = pickDisplayedAlarm(shown);
            if (ringing) openAlarm(ringing);
          })
          .catch(() => undefined);
      showRinging();
      const appState = AppState.addEventListener("change", (s) => s === "active" && showRinging());
      return () => {
        unsubscribe();
        appState.remove();
      };
    } catch (e) {
      console.warn("[mediplan] eventos de alarma no disponibles (¿Expo Go?):", e);
    }
  }, [enabled]);
}
