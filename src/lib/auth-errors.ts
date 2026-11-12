/** Traduce los códigos de error de Firebase Auth a mensajes claros. */
export function authErrorMessage(error: unknown): string {
  const code = typeof error === "object" && error && "code" in error ? String((error as { code: unknown }).code) : "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "El correo o la contraseña no coinciden.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con ese correo. Probá iniciar sesión.";
    case "auth/weak-password":
      return "La contraseña es muy corta. Usá al menos 8 caracteres.";
    case "auth/invalid-email":
      return "Revisá el correo: no parece válido.";
    case "auth/too-many-requests":
      return "Hiciste demasiados intentos. Esperá unos minutos y volvé a probar.";
    case "auth/network-request-failed":
      return "No hay conexión. Revisá tu internet y probá de nuevo.";
    default:
      return "No pudimos completar la acción. Probá de nuevo en un momento.";
  }
}
