import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";
import { firebaseAuth } from "@/lib/firebase";
import { colors } from "@/theme/tokens";
import { BackButton } from "@/ui/BackButton";
import { Button } from "@/ui/Button";

export default function Privacidad() {
  const { me, signOut } = useAuth();
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function reset() {
    if (!me) return;
    setBusy(true);
    try {
      await sendPasswordResetEmail(firebaseAuth(), me.email);
      setMsg(`Te enviamos un correo a ${me.email} para elegir una contraseña nueva.`);
    } catch (e) {
      setMsg(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <BackButton onDark={false} />
        <Text style={s.title}>Privacidad y seguridad</Text>
        <Text style={s.h2}>Contraseña</Text>
        <Text style={s.muted}>Para cambiarla te mandamos un enlace por correo.</Text>
        <Button title="Cambiar contraseña" variant="soft" loading={busy} onPress={() => void reset()} />
        {msg ? <Text style={s.msg}>{msg}</Text> : null}
        <Text style={s.h2}>Sesión</Text>
        <Text style={s.muted}>Tus datos de salud solo los ven vos y las personas que invitaste a supervisar tu plan.</Text>
        <Button title="Cerrar sesión en este dispositivo" variant="neutral" onPress={() => void signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12 },
  title: { fontSize: 24, color: colors.text, marginTop: 8 },
  h2: { fontSize: 17, color: colors.text, marginTop: 12 },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  msg: { fontSize: 13, color: colors.text },
});
