const CONTENT_HEIGHT = 56;
const MIN_BOTTOM = 8;
const TOP = 6;

/** Medidas de la barra de pestañas: sube lo que ocupen los botones táctiles o la barra de gestos del celular. */
export function tabBarMetrics(bottomInset: number) {
  const bottom = Number.isFinite(bottomInset) ? Math.max(bottomInset, MIN_BOTTOM) : MIN_BOTTOM;
  return { height: CONTENT_HEIGHT + bottom, paddingBottom: bottom, paddingTop: TOP };
}
