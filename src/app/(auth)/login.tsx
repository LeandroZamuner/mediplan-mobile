import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { authErrorMessage } from "@/lib/auth-errors";
import { firebaseAuth } from "@/lib/firebase";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { GradientScreen } from "@/ui/GradientScreen";
import { BackButton } from "@/ui/BackButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = email.includes("@") && password.length > 0;

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  return (
    <GradientScreen>
      <BackButton />
      <View style={s.spacer} />
      <Text style={s.title}>Iniciar sesión con:</Text>
      {/* TODO: "Cuenta de Google" del diseño (requiere configurar Google en Firebase y el cliente OAuth de Android). */}
      <View style={s.form}>
        <Field onDark placeholder="Credenciales o correo electrónico" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <Field onDark placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Button title="Ingresar" onDark disabled={!ready} loading={busy} onPress={submit} />
        <Button title="Crear cuenta" variant="ghost" onDark onPress={() => router.replace("/register")} />
      </View>
    </GradientScreen>
  );
}

const s = StyleSheet.create({
  spacer: { flex: 1 },
  title: { color: "#fff", fontSize: 16, marginBottom: 16 },
  form: { gap: 12 },
  error: { color: "#FFB4C0", fontSize: 13 },
});
