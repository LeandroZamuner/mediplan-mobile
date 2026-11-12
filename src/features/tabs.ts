export type Activity = { planCount: number; supervisedCount: number; invitationCount: number };
export type TabName = "index" | "plan" | "stock" | "cuidados" | "notificaciones" | "perfil";

/** Pestañas de la barra inferior (máximo 5). Quien solo cuida a otros ve Cuidados en lugar de Stock. */
export function visibleTabs(a: Activity): TabName[] {
  const onlyCaregiver = a.planCount === 0 && (a.supervisedCount > 0 || a.invitationCount > 0);
  return ["index", "plan", onlyCaregiver ? "cuidados" : "stock", "notificaciones", "perfil"];
}
