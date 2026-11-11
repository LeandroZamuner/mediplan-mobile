export type PasswordCheck = { label: string; ok: boolean };

/** Requisitos que muestra el diseño al crear la contraseña. */
export function passwordChecks(p: string): PasswordCheck[] {
  return [
    { label: "Mínimo 8 caracteres.", ok: p.length >= 8 },
    { label: "Una letra mayúscula.", ok: /[A-ZÁÉÍÓÚÑ]/.test(p) },
    { label: "Un número.", ok: /\d/.test(p) },
    { label: "Un carácter especial.", ok: /[^A-Za-z0-9\sÁÉÍÓÚÑáéíóúñ]/.test(p) },
  ];
}

export const isPasswordValid = (p: string) => passwordChecks(p).every((c) => c.ok);
