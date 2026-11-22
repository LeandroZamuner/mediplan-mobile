import type { ChatMessage } from "./types";

/** Cuántos mensajes se reenvían como contexto (la API no guarda la conversación). */
export const MAX_CONTEXT = 12;

export const EMERGENCY_NOTE = "El asistente no reemplaza a tu médico. En una emergencia llamá al 107 (emergencias médicas) o al 911.";

/** Traduce los errores de la API del asistente a un mensaje claro. */
export function assistantErrorMessage(err: unknown): string {
  const status = (err as { status?: number } | null)?.status;
  if (status === 429) return "Hiciste muchas preguntas seguidas. Esperá un momento y probá de nuevo.";
  if (status === 503) return "El asistente no está disponible en este momento. Probá de nuevo más tarde.";
  if (status === 402) return "El asistente es parte de Premium.";
  if (status === 403) return "Para usar el asistente primero tenés que aceptar el uso de inteligencia artificial.";
  return err instanceof Error ? err.message : "No pudimos responder. Probá de nuevo.";
}

/** Los mensajes que se mandan a la API: los últimos MAX_CONTEXT, empezando por uno de la persona. */
export function contextOf(history: ChatMessage[]): ChatMessage[] {
  const last = history.slice(-MAX_CONTEXT);
  const first = last.findIndex((m) => m.role === "user");
  return first < 0 ? [] : last.slice(first);
}
