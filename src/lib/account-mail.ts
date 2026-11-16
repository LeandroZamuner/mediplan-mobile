import { sendEmailVerification, sendPasswordResetEmail, type User } from "firebase/auth";
import { api } from "@/lib/api";
import { firebaseAuth } from "@/lib/firebase";

/**
 * Correos de cuenta (verificar correo, recuperar contraseña): primero se pide a la API de MediPlan, que manda un correo
 * con nuestro diseño; si la API no puede (dormida, caída, sin configurar), se usa el correo estándar de Firebase para
 * que el usuario nunca quede sin su enlace.
 */

/** Errores que la persona puede entender y corregir (pedido inválido, demasiados pedidos): no tiene sentido reintentar por otro lado. */
function isUserFacing(error: unknown): boolean {
  const status = typeof error === "object" && error && "status" in error ? (error as { status: unknown }).status : undefined;
  return status === 422 || status === 429;
}

/** Envía el correo para elegir una contraseña nueva. */
export async function requestPasswordReset(email: string): Promise<void> {
  const address = email.trim();
  try {
    await api("/auth/password-reset", { method: "POST", json: { email: address } });
    return;
  } catch (error) {
    if (isUserFacing(error)) throw error;
  }
  await sendPasswordResetEmail(firebaseAuth(), address);
}

/** Envía el correo para confirmar la cuenta. Devuelve false si el correo ya estaba verificado (no se envió nada). */
export async function requestVerification(user: User): Promise<boolean> {
  try {
    return (await api<{ sent: boolean }>("/auth/email-verification", { method: "POST" })).sent;
  } catch (error) {
    if (isUserFacing(error)) throw error;
  }
  await sendEmailVerification(user);
  return true;
}
