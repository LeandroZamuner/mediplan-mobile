import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";
import { firebaseAuth } from "@/lib/firebase";
import { deleteAccount } from "@/lib/delete-account";
import { colors } from "@/theme/tokens";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";
import { Field } from "@/ui/Field";

export default function Privacidad() {
  const { me, firebaseUser, signOut } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [asking, setAsking] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
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

  async function remove() {
    if (!firebaseUser) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAccount(firebaseUser, password);
      await signOut();
    } catch (e) {
      setDeleteError(authErrorMessage(e));
      setDeleting(false);
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <ScreenHeader title="Privacidad y seguridad" />
        <Text style={s.h2}>Contraseña</Text>
        <Text style={s.muted}>Para cambiarla te mandamos un enlace por correo.</Text>
        <Button title="Cambiar contraseña" variant="soft" loading={busy} onPress={() => void reset()} />
        {msg ? <Text style={s.msg}>{msg}</Text> : null}
        <Text style={s.h2}>Sesión</Text>
        <Text style={s.muted}>Tus datos de salud solo los ven vos y las personas que invitaste a supervisar tu plan.</Text>
        <Button title="Cerrar sesión en este dispositivo" variant="neutral" onPress={() => void signOut()} />
        <Text style={s.h2}>Documentos</Text>
        <Button title="Política de privacidad" variant="neutral" onPress={() => router.push("/politica-privacidad")} />
        <Button title="Aviso médico" variant="neutral" onPress={() => router.push("/aviso-medico")} />
        <Text style={s.h2}>Eliminar cuenta</Text>
        <Text style={s.muted}>Se borran tu cuenta y todos tus datos: planes, medicamentos, historial de tomas y avisos. No se puede deshacer.</Text>
        <Button title="Eliminar mi cuenta" variant="danger" onPress={() => setConfirming(true)} />
      </ScrollView>
      <ConfirmModal visible={confirming} danger title="¿Eliminar tu cuenta?" message="Se borran tu cuenta y todos tus datos. No se puede deshacer." confirmLabel="Continuar" onCancel={() => setConfirming(false)} onConfirm={() => { setConfirming(false); setAsking(true); }} />
      <Modal visible={asking} transparent animationType="fade" onRequestClose={() => setAsking(false)}>
        <View style={s.scrim}>
          <View style={s.card}>
            <Text style={s.cardTitle}>Confirmá con tu contraseña</Text>
            <Field placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
            {deleteError ? <Text style={s.error}>{deleteError}</Text> : null}
            <Button title="Eliminar definitivamente" variant="danger" loading={deleting} disabled={password.length === 0} onPress={() => void remove()} />
            <Button title="Cancelar" variant="ghost" onPress={() => { setAsking(false); setPassword(""); setDeleteError(""); }} />
          </View>
        </View>
      </Modal>
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
  error: { fontSize: 12, color: colors.danger },
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 328, backgroundColor: "#fff", borderRadius: 16, padding: 20, gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: "600", color: colors.text },
});
