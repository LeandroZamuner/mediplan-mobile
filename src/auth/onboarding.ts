export type UserActivity = { planCount: number; supervisedCount: number; invitationCount: number };

/** El onboarding (crear plan y cuidadores) se muestra una sola vez, y solo a quien todavía no usa MediPlan ni como paciente ni como cuidador. */
export function needsOnboarding(doneOnThisPhone: boolean, a: UserActivity): boolean {
  return !doneOnThisPhone && a.planCount === 0 && a.supervisedCount === 0 && a.invitationCount === 0;
}
