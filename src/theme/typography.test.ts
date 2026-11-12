import { fontFamilyFor } from "./typography";

describe("fontFamilyFor (Inter, como el Figma)", () => {
  it("sin peso o 400 → regular", () => {
    expect(fontFamilyFor(undefined)).toBe("Inter_400Regular");
    expect(fontFamilyFor("400")).toBe("Inter_400Regular");
    expect(fontFamilyFor("normal")).toBe("Inter_400Regular");
  });
  it("500 → medium, 600 → semibold, 700 y bold → bold", () => {
    expect(fontFamilyFor("500")).toBe("Inter_500Medium");
    expect(fontFamilyFor("600")).toBe("Inter_600SemiBold");
    expect(fontFamilyFor("700")).toBe("Inter_700Bold");
    expect(fontFamilyFor("bold")).toBe("Inter_700Bold");
  });
  it("pesos intermedios se redondean al más cercano hacia arriba permitido", () => {
    expect(fontFamilyFor("800")).toBe("Inter_700Bold");
    expect(fontFamilyFor("300")).toBe("Inter_400Regular");
  });
});
