import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text } from "@/ui/Text";
import { authErrorMessage } from "@/lib/auth-errors";
import { requestPasswordReset } from "@/lib/account-mail";
import { BackButton } from "@/ui/BackButton";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { GradientScreen } from "@/ui/GradientScreen";

/** Recuperar contraseña: Firebase manda un enlace al correo para elegir una nueva. */
export default function Recuperar() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = email.includes("@");

  async function submit() {
    if (!valid) return;
    setBusy(true);
    setError("");
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (e) {
      // Si el correo no tiene cuenta no se dice (no revelamos quién la tiene): mismo aviso de éxito.
      if ((e as { code?: string }).code === "auth/user-not-found") setSent(true);
      else setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <GradientScreen>
      <BackButton />
      <View style={s.spacer} />
      <Text style={s.title}>Recuperar contraseña</Text>
      <Text style={s.body}>Ingresá tu correo y te enviamos un enlace para elegir una contraseña nueva.</Text>
      {sent ? (
        <Text style={s.ok}>Si hay una cuenta con ese correo, te enviamos un enlace. Revisá tu bandeja de entrada y la carpeta de spam.</Text>
      ) : (
        <View style={s.form}>
          <Field onDark placeholder="Correo electrónico" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Button title="Enviar enlace" onDark disabled={!valid} loading={busy} onPress={submit} />
        </View>
      )}
    </GradientScreen>
  );
}

const s = StyleSheet.create({
  spacer: { flex: 1 },
  title: { color: "#fff", fontSize: 26, fontWeight: "600", marginBottom: 8 },
  body: { color: "#C9CDEB", fontSize: 13, lineHeight: 19, marginBottom: 16 },
  form: { gap: 12 },
  ok: { color: "#fff", fontSize: 14, lineHeight: 20 },
  error: { color: "#FFB4C0", fontSize: 13 },
});
