/**
 * Canales de Android. Un canal ya creado NO se puede modificar (solo el nombre), así que cada vez que cambia el sonido o
 * la importancia hay que usar un id nuevo y borrar el anterior (por eso el sufijo _v2).
 */
export const CHANNEL_NORMAL = "doses_v2";
export const CHANNEL_STRONG = "doses_strong_v2";
/** Ids de versiones anteriores: se borran al arrancar. */
export const LEGACY_CHANNELS = ["doses", "doses_strong"];

/** Archivos de res/raw que agrega el plugin `expo-notifications` (opción `sounds` de app.json). */
export const SOUND_NORMAL = "recordatorio.wav";
export const SOUND_STRONG = "alarma_fuerte.wav";
