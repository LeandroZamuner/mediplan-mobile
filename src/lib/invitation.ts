/** Enlace de la web (GitHub Pages) donde la persona invitada acepta ser cuidadora. */
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "https://leandrozamuner.github.io/mediplan-web").replace(/\/$/, "");

export const invitationUrl = (token: string) => `${WEB_URL}/invitacion?token=${encodeURIComponent(token)}`;
