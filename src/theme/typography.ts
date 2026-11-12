import type { TextStyle } from "react-native";

/** Inter, la tipografía del Figma. En Android hay que elegir la familia según el peso (no existe "negrita" sintética). */
export function fontFamilyFor(weight: TextStyle["fontWeight"] | undefined): string {
  const w = weight === "bold" ? 700 : weight === "normal" || weight === undefined ? 400 : Number(weight);
  if (w >= 700) return "Inter_700Bold";
  if (w >= 600) return "Inter_600SemiBold";
  if (w >= 500) return "Inter_500Medium";
  return "Inter_400Regular";
}

/** Escala tipográfica (tamaño / peso) tomada de las exportaciones del Figma. */
export const type = {
  display: { fontSize: 32, fontWeight: "600" as const, lineHeight: 40 },
  title: { fontSize: 28, fontWeight: "600" as const, lineHeight: 36 },
  h2: { fontSize: 20, fontWeight: "500" as const, lineHeight: 28 },
  h3: { fontSize: 16, fontWeight: "600" as const, lineHeight: 22 },
  body: { fontSize: 14, fontWeight: "400" as const, lineHeight: 21 },
  small: { fontSize: 12, fontWeight: "400" as const, lineHeight: 17 },
  label: { fontSize: 15, fontWeight: "600" as const, lineHeight: 20 },
};
