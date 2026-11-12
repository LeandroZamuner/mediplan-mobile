import type { DoseTrigger } from "./schedule";

export const REPEAT_EVERY_MIN = 5;
export const REPEAT_UNTIL_MIN = 30;
/** Android limita las alarmas por app (500): nunca programamos más que esto. */
export const MAX_SCHEDULED = 200;

export type AlarmLevel = "normal" | "fuerte";
export const DEFAULT_LEVEL: AlarmLevel = "normal";

/** Cómo suena cada nivel: Normal = notificación común; Fuerte = alarma (volumen de alarma, no se descarta deslizando). */
export function alarmProfile(level: AlarmLevel) {
  return level === "fuerte"
    ? { channelId: "doses_strong", sticky: true, autoDismiss: false, repeats: true }
    : { channelId: "doses", sticky: false, autoDismiss: true, repeats: true };
}

/** Alarma original + una repetición cada 5 min hasta 30 min después, mientras no se registre la toma. Solo lo que aún no pasó. */
export function expandRepeats(triggers: DoseTrigger[], now: Date, opts: { enabled?: boolean } = {}): DoseTrigger[] {
  const enabled = opts.enabled ?? true;
  const out: DoseTrigger[] = [];
  for (const t of triggers) {
    const steps = enabled ? REPEAT_UNTIL_MIN / REPEAT_EVERY_MIN : 0;
    for (let n = 0; n <= steps; n++) {
      const at = new Date(t.at.getTime() + n * REPEAT_EVERY_MIN * 60_000);
      if (at.getTime() <= now.getTime()) continue;
      out.push({ ...t, key: n === 0 ? t.key : `${t.key}#${n}`, at, repeat: n, body: n === 0 ? t.body : `${t.body} · Todavía no registraste esta toma` });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export function capTriggers(triggers: DoseTrigger[], max = MAX_SCHEDULED): DoseTrigger[] {
  return [...triggers].sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, max);
}

const takenKey = (medicationId: string, scheduledAt: string | Date) => `${medicationId}|${new Date(scheduledAt).getTime()}`;

/** Tomas ya registradas (de cualquier dispositivo o de la web), para no volver a avisar de ellas. */
export function takenSetFrom(doses: { medicationId: string; scheduledAt: string; status: string }[]): Set<string> {
  return new Set(doses.filter((d) => d.status === "taken").map((d) => takenKey(d.medicationId, d.scheduledAt)));
}

export function excludeTaken(triggers: DoseTrigger[], taken: Set<string>): DoseTrigger[] {
  return triggers.filter((t) => !taken.has(takenKey(t.medicationId, t.scheduledAt)));
}
