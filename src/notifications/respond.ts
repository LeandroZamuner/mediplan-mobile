export const SNOOZE_MINUTES = 10;

type Data = Record<string, unknown>;
type Content = { title: string | null; body: string | null };

export type Deps = {
  recordTaken: (planId: string, medicationId: string, scheduledAt: string) => Promise<unknown>;
  scheduleAt: (at: Date, content: Content, data: Data) => Promise<unknown>;
  openList: () => void;
  now: () => Date;
};

/** Qué hacer cuando la persona toca la notificación de una toma o uno de sus botones. */
export async function handleDoseAction(action: string, data: Data, content: Content, deps: Deps): Promise<void> {
  if (action === "default") return deps.openList();
  const { planId, medicationId, scheduledAt } = data as { planId?: string; medicationId?: string; scheduledAt?: string };
  if (!planId || !medicationId || !scheduledAt) return;
  if (action === "taken") await deps.recordTaken(planId, medicationId, scheduledAt);
  else if (action === "snooze") await deps.scheduleAt(new Date(deps.now().getTime() + SNOOZE_MINUTES * 60_000), content, data);
}
