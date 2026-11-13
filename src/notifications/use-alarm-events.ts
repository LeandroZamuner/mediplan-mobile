import { router } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import notifee, { EventType, type Event } from "react-native-notify-kit";
import { recordTaken } from "@/lib/doses";
import { handleAlarmEvent, type AlarmDeps } from "./alarm-events";
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
      return unsubscribe;
    } catch (e) {
      console.warn("[mediplan] eventos de alarma no disponibles (¿Expo Go?):", e);
    }
  }, [enabled]);
}
