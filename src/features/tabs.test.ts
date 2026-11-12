import { visibleTabs } from "./tabs";

const act = (planCount: number, supervisedCount: number, invitationCount = 0) => ({ planCount, supervisedCount, invitationCount });

describe("visibleTabs", () => {
  it("dado un paciente con plan, entonces Inicio, Plan, Stock, Avisos y Perfil", () => {
    expect(visibleTabs(act(1, 0))).toEqual(["index", "plan", "stock", "notificaciones", "perfil"]);
  });
  it("dado un usuario nuevo sin nada, entonces también tiene Stock (se llena al crear el plan)", () => {
    expect(visibleTabs(act(0, 0))).toContain("stock");
  });
  it("dado alguien que solo cuida a otros, entonces tiene Cuidados en lugar de Stock", () => {
    const t = visibleTabs(act(0, 1));
    expect(t).toContain("cuidados");
    expect(t).not.toContain("stock");
  });
  it("dado alguien con una invitación pendiente y sin plan propio, entonces tiene Cuidados", () => {
    expect(visibleTabs(act(0, 0, 1))).toContain("cuidados");
  });
  it("dado alguien con plan propio que además cuida a otros, entonces no pasa de 5 pestañas (Cuidados va en Inicio y Perfil)", () => {
    const t = visibleTabs(act(1, 1));
    expect(t).toHaveLength(5);
    expect(t).not.toContain("cuidados");
  });
});
