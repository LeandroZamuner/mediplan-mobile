type Data = Record<string, unknown>;

export type Deps = {
  /** Registra la toma (y, al hacerlo, se cancelan sus alarmas repetidas). */
  recordTaken: (planId: string, medicationId: string, scheduledAt: string) => Promise<unknown>;
  openList: () => void;
};

/** Qué hacer cuando la persona toca la notificación de una toma o su botón "Tomé". */
export async function handleDoseAction(action: string, data: Data, deps: Deps): Promise<void> {
  if (action === "default") return deps.openList();
  if (action !== "taken") return;
  const { planId, medicationId, scheduledAt } = data as { planId?: string; medicationId?: string; scheduledAt?: string };
  if (!planId || !medicationId || !scheduledAt) return;
  await deps.recordTaken(planId, medicationId, scheduledAt);
}
