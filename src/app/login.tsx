import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { authErrorMessage } from "@/lib/auth-errors";
import { firebaseAuth } from "@/lib/firebase";
import { colors, spacing } from "@/theme/tokens";

/** Pantalla provisoria de inicio de sesión; el diseño final sale del Figma. */
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.screen}>
      <Text style={s.title}>MediPlan</Text>
      <TextInput style={s.input} placeholder="Correo" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <Pressable style={s.button} onPress={submit} disabled={busy}>
        <Text style={s.buttonText}>{busy ? "Ingresando…" : "Iniciar sesión"}</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, justifyContent: "center", padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background },
  title: { fontSize: 28, fontWeight: "700", color: colors.text, marginBottom: spacing.md },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: spacing.md, fontSize: 16 },
  error: { color: colors.danger },
  button: { backgroundColor: colors.primary, borderRadius: 8, padding: spacing.md, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
