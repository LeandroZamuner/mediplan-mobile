import notifee, { AlarmType, AndroidCategory, AndroidImportance, AndroidVisibility, TriggerType, type Notification, type TimestampTrigger } from "react-native-notify-kit";
import { CHANNEL_STRONG } from "./channels";
import { doseMatches, type DoseRef } from "./dose-ref";
import type { DoseTrigger } from "./schedule";

/** Cuánto suena cada alarma si nadie la atiende: la siguiente repetición (cada 5 min, hasta 30) la vuelve a hacer sonar. */
export const ALARM_RING_MS = 60_000;

/** Ids de los botones y de la pantalla completa (los lee el manejador de eventos). */
export const ACTION_OPEN = "open";
export const ACTION_FULL_SCREEN = "alarm";
export const ACTION_TAKEN = "taken";
export const ACTION_SNOOZE = "snooze";
/** Plan falso de la alarma de prueba (Perfil → Configurar notificaciones): no hay nada que registrar en la API. */
export const TEST_PLAN_ID = "prueba";

/**
 * Alarma Fuerte: usa el canal de alarma (volumen de alarma, sonido largo) y suma lo que expo-notifications no puede:
 * el sonido en bucle hasta que se atiende y la pantalla completa sobre el bloqueo.
 */
export function buildAlarmNotification(t: DoseTrigger): Notification {
  return {
    id: t.key,
    title: t.title,
    body: t.body,
    data: { planId: t.planId, medicationId: t.medicationId, scheduledAt: t.scheduledAt.toISOString(), repeat: String(t.repeat) },
    android: {
      channelId: CHANNEL_STRONG,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      loopSound: true,
      ongoing: true,
      autoCancel: false,
      lightUpScreen: true,
      timeoutAfter: ALARM_RING_MS,
      color: "#3646AB",
      pressAction: { id: ACTION_OPEN, launchActivity: "default" },
      fullScreenAction: { id: ACTION_FULL_SCREEN, launchActivity: "default" },
      // Sin launchActivity: los botones se resuelven sin abrir la app.
      actions: [
        { title: "Tomé", pressAction: { id: ACTION_TAKEN } },
        { title: "Posponer", pressAction: { id: ACTION_SNOOZE } },
      ],
    },
  };
}

/** Alarma de reloj exacta (atraviesa el ahorro de energía y el modo reposo). */
export function buildAlarmTrigger(t: DoseTrigger): TimestampTrigger {
  return { type: TriggerType.TIMESTAMP, timestamp: t.at.getTime(), alarmManager: { type: AlarmType.SET_ALARM_CLOCK } };
}

/** Programa las alarmas en tandas de 10 en paralelo (una por una tarda varios segundos). */
export async function scheduleNativeAlarms(triggers: DoseTrigger[]): Promise<void> {
  for (let i = 0; i < triggers.length; i += 10) {
    await Promise.all(triggers.slice(i, i + 10).map((t) => notifee.createTriggerNotification(buildAlarmNotification(t), buildAlarmTrigger(t))));
  }
}

/** Borra las alarmas programadas (no la que está sonando ahora: si la persona abrió la app desde ella, tiene que seguir). */
export async function cancelAllNativeAlarms(): Promise<void> {
  try {
    await notifee.cancelTriggerNotifications();
  } catch (e) {
    console.warn("[mediplan] no se pudieron borrar las alarmas nativas:", e);
  }
}

/** Al registrar una toma: se borran sus alarmas pendientes y se apaga la que esté sonando. */
export async function cancelNativeDoseAlarms(dose: DoseRef): Promise<void> {
  try {
    const pending = await notifee.getTriggerNotifications();
    const pendingIds = pending.filter((p) => doseMatches(p.notification.data, dose)).map((p) => p.notification.id as string);
    if (pendingIds.length) await notifee.cancelTriggerNotifications(pendingIds);
    const shown = await notifee.getDisplayedNotifications();
    const shownIds = shown.filter((n) => doseMatches(n.notification.data, dose)).map((n) => n.id as string);
    if (shownIds.length) await notifee.cancelDisplayedNotifications(shownIds);
  } catch (e) {
    console.warn("[mediplan] no se pudieron cancelar las alarmas nativas de la toma:", e);
  }
}

/** Posponer: se apaga la alarma que está sonando de esa toma; las repeticiones ya programadas la vuelven a hacer sonar. */
export async function silenceNativeDose(dose: DoseRef): Promise<void> {
  try {
    const shown = await notifee.getDisplayedNotifications();
    const ids = shown.filter((n) => doseMatches(n.notification.data, dose)).map((n) => n.id as string);
    if (ids.length) await notifee.cancelDisplayedNotifications(ids);
  } catch (e) {
    console.warn("[mediplan] no se pudo apagar la alarma:", e);
  }
}
