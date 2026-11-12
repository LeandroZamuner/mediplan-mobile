import { EmailAuthProvider, deleteUser, reauthenticateWithCredential, type User } from "firebase/auth";
import { api } from "./api";

/**
 * Elimina la cuenta: 1) confirma la contraseña (Firebase lo exige para borrar), 2) borra los datos en la API,
 * 3) borra la cuenta de Firebase. Si el paso 3 falla, los datos ya no existen y la cuenta quedó sin uso.
 */
export async function deleteAccount(user: User, password: string): Promise<void> {
  if (!user.email) throw new Error("La cuenta no tiene correo.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  await api("/me", { method: "DELETE" });
  await deleteUser(user);
}
