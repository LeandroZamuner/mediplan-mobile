import notifee from "react-native-notify-kit";
import { recordTaken } from "@/lib/doses";
import { handleAlarmEvent } from "./alarm-events";

/**
 * Botones "Tomé" y "Posponer" de la alarma Fuerte con la app cerrada: Android arranca JavaScript sin interfaz y entrega el evento.
 * Se registra al cargar el archivo de entrada (antes de que arranque la app), como pide la librería.
 */
try {
  notifee.onBackgroundEvent((event) =>
    handleAlarmEvent(event, {
      recordTaken,
      dismiss: (id) => notifee.cancelDisplayedNotification(id),
      openAlarm: () => undefined, // la pantalla completa la abre Android; sin interfaz no hay a dónde navegar
    }),
  );
} catch (e) {
  // Sin el módulo nativo (Expo Go) no hay alarmas nativas: no frenamos la app.
  console.warn("[mediplan] eventos de alarma en segundo plano no disponibles:", e);
}
