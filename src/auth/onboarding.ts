/** El onboarding se muestra una sola vez, y solo a quien todavía no tiene ningún plan. */
export const needsOnboarding = (doneOnThisPhone: boolean, planCount: number): boolean => !doneOnThisPhone && planCount === 0;
