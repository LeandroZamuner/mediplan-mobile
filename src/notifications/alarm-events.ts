import { EventType, type DisplayedNotification, type Event } from "react-native-notify-kit";
import { ACTION_FULL_SCREEN, ACTION_OPEN, ACTION_SNOOZE, ACTION_TAKEN, TEST_PLAN_ID } from "./native-alarm";

export type AlarmInfo = { planId: string; medicationId: string; scheduledAt: string; title: string; body: string };

export type AlarmDeps = {
  /** Registra la toma (y, al hacerlo, se cancelan sus alarmas). */
  recordTaken: (planId: string, medicationId: string, scheduledAt: string) => Promise<unknown>;
  /** Apaga la notificación que está sonando. */
  dismiss: (notificationId: string) => Promise<void>;
  /** Muestra la pantalla de alarma. */
  openAlarm: (info: AlarmInfo) => void;
  /** Con la app abierta, la alarma que llega abre la pantalla de alarma sola (Android no lanza la pantalla completa en ese caso). */
  openOnDelivered?: boolean;
};

/** Registra la toma de una alarma (la alarma de prueba no registra nada). */
export async function takeFromAlarm(info: AlarmInfo, recordTaken: AlarmDeps["recordTaken"]): Promise<void> {
  if (info.planId === TEST_PLAN_ID) return;
  await recordTaken(info.planId, info.medicationId, info.scheduledAt);
}

function read(event: Event): { id?: string; info: AlarmInfo } | null {
  const n = event.detail?.notification;
  const d = n?.data as Record<string, unknown> | undefined;
  if (!n || typeof d?.planId !== "string" || typeof d.medicationId !== "string" || typeof d.scheduledAt !== "string") return null;
  return { id: n.id, info: { planId: d.planId, medicationId: d.medicationId, scheduledAt: d.scheduledAt, title: n.title ?? "", body: n.body ?? "" } };
}

/** Qué hacer cuando la persona toca la alarma Fuerte, sus botones, o cuando llega con la app abierta. */
export async function handleAlarmEvent(event: Event, deps: AlarmDeps): Promise<void> {
  const parsed = read(event);
  if (!parsed) return;
  const { id, info } = parsed;
  try {
    if (event.type === EventType.ACTION_PRESS) {
      const action = event.detail.pressAction?.id;
      if (action === ACTION_TAKEN) {
        await takeFromAlarm(info, deps.recordTaken);
        if (id) await deps.dismiss(id);
      } else if (action === ACTION_SNOOZE && id) {
        await deps.dismiss(id); // la próxima repetición (cada 5 min, hasta 30) la vuelve a hacer sonar
      }
    } else if (event.type === EventType.PRESS) {
      const action = event.detail.pressAction?.id;
      if (action === ACTION_OPEN || action === ACTION_FULL_SCREEN) deps.openAlarm(info);
    } else if (event.type === EventType.DELIVERED && deps.openOnDelivered) {
      deps.openAlarm(info);
    }
  } catch (e) {
    // Si falló registrar la toma, la alarma sigue sonando para que se pueda reintentar.
    console.warn("[mediplan] no se pudo atender la alarma:", e);
  }
}

/**
 * Alarma que está sonando ahora (la más reciente). Cuando Android abre la app desde la pantalla completa no llega ningún evento
 * en un arranque en caliente: al volver a primer plano se mira qué alarma hay en la barra y se muestra su pantalla.
 */
export function pickDisplayedAlarm(displayed: DisplayedNotification[]): AlarmInfo | null {
  const dated = displayed
    .map((n) => ({ info: read({ type: EventType.UNKNOWN, detail: { notification: n.notification } } as Event)?.info, date: n.date ?? 0 }))
    .filter((x): x is { info: AlarmInfo; date: number } => !!x.info);
  if (!dated.length) return null;
  return dated.reduce((a, b) => (b.date >= a.date ? b : a)).info;
}
