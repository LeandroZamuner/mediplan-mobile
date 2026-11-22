import { isPlanLimitMessage, longDate, premiumView, priceLabel } from "@/lib/premium";
import type { Subscription } from "@/lib/types";

const base: Subscription = {
  tier: "free",
  cancelled: false,
  pending: false,
  currentPeriodEnd: null,
  limits: { maxActivePlans: 1, maxMedications: 3, maxCaregiversPerPlan: 1 },
  usage: { activePlans: 0, medications: 0 },
  payments: { enabled: true, priceArs: 2999, currency: "ARS", period: "month" },
};

describe("premiumView", () => {
  it("dada una cuenta gratis con pagos habilitados, entonces se ofrece pasar a Premium", () => {
    expect(premiumView(base)).toBe("free");
  });
  it("dada una cuenta gratis con un pago iniciado, entonces figura pendiente", () => {
    expect(premiumView({ ...base, pending: true })).toBe("pending");
  });
  it("dada una cuenta gratis sin pagos habilitados, entonces no se puede pagar todavía", () => {
    expect(premiumView({ ...base, payments: { enabled: false } })).toBe("unavailable");
  });
  it("dada una cuenta Premium, entonces figura activa; si se dio de baja, figura por terminar", () => {
    expect(premiumView({ ...base, tier: "premium" })).toBe("premium");
    expect(premiumView({ ...base, tier: "premium", cancelled: true })).toBe("premium-ending");
  });
});

describe("textos", () => {
  it("dado un precio, entonces se muestra con punto de miles y por mes", () => {
    expect(priceLabel(base)).toBe("$2.999 por mes");
    expect(priceLabel({ ...base, payments: { enabled: false } })).toBe("");
  });
  it("dado el aviso de tope de la API, entonces se reconoce", () => {
    expect(isPlanLimitMessage("Llegaste al límite del plan gratuito: podés cargar hasta 3 medicamentos. Pasate a Premium para quitar el límite.")).toBe(true);
    expect(isPlanLimitMessage("No pudimos crear el plan.")).toBe(false);
  });
  it("dada una fecha, entonces se escribe en español", () => {
    expect(longDate("2026-12-17T15:00:00Z")).toBe("17 de diciembre de 2026");
  });
});
