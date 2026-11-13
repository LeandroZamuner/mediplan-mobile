import type { AlarmInfo } from "./alarm-events";

/**
 * Abre la pantalla de alarma. Cuando la app arranca desde la pantalla completa llegan dos avisos casi juntos (el evento de la
 * notificación y la notificación inicial): se abre una sola vez por alarma dentro de la ventana.
 */
export function createAlarmOpener(push: (info: AlarmInfo) => void, now: () => number = Date.now, windowMs = 5000) {
  let last: { key: string; at: number } | null = null;
  return (info: AlarmInfo) => {
    const key = `${info.planId}|${info.medicationId}|${info.scheduledAt}`;
    const t = now();
    if (last && last.key === key && t - last.at < windowMs) return;
    last = { key, at: t };
    push(info);
  };
}
