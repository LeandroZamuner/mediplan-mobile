import { tabBarMetrics } from "./tab-bar";

describe("tabBarMetrics", () => {
  it("dado un celular sin barra del sistema, cuando se calcula la barra, entonces queda con el alto y el relleno de siempre", () => {
    expect(tabBarMetrics(0)).toEqual({ height: 64, paddingBottom: 8, paddingTop: 6 });
  });

  it("dado un celular con botones táctiles (48 de alto), cuando se calcula la barra, entonces crece lo justo para no quedar tapada", () => {
    const m = tabBarMetrics(48);
    expect(m.paddingBottom).toBe(48);
    expect(m.height).toBe(56 + 48);
  });

  it("dado un celular con gestos (24 de alto), cuando se calcula la barra, entonces se agrega ese espacio abajo", () => {
    expect(tabBarMetrics(24)).toEqual({ height: 80, paddingBottom: 24, paddingTop: 6 });
  });

  it("dado un valor de inset inválido, cuando se calcula la barra, entonces no rompe y usa el mínimo", () => {
    expect(tabBarMetrics(-5).paddingBottom).toBe(8);
    expect(tabBarMetrics(Number.NaN).paddingBottom).toBe(8);
  });
});
