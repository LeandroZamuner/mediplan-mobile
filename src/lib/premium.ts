import type { Subscription } from "./types";

/** Cómo se presenta la cuenta en la pantalla de Premium. */
export type PremiumView = "unavailable" | "free" | "pending" | "premium" | "premium-ending";

export function premiumView(sub: Subscription): PremiumView {
  if (sub.tier === "premium") return sub.cancelled ? "premium-ending" : "premium";
  if (!sub.payments.enabled) return "unavailable";
  return sub.pending ? "pending" : "free";
}

/** Precio mensual para mostrar: "$2.999 por mes". */
export function priceLabel(sub: Subscription): string {
  const price = sub.payments.priceArs;
  if (price === undefined) return "";
  return `$${String(price).replace(/\B(?=(\d{3})+(?!\d))/g, ".")} por mes`;
}

/** Texto con el que la API avisa que se llegó al tope del plan gratis (ver PlanLimitError en mediplan-api). */
export const PLAN_LIMIT_TEXT = "Llegaste al límite del plan gratuito";

export const isPlanLimitMessage = (message: string) => message.startsWith(PLAN_LIMIT_TEXT);

/** "17 de diciembre de 2026" (a mano: Hermes no siempre trae todos los idiomas de Intl). */
export function longDate(iso: string): string {
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const d = new Date(iso);
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`;
}
