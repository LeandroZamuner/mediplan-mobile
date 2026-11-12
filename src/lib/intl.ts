const cache = new Map<string, Intl.DateTimeFormat>();

/** `new Intl.DateTimeFormat` es caro (más en Hermes): se crea una vez por combinación de idioma y opciones. */
export function dtf(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = cache.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    cache.set(key, f);
  }
  return f;
}
