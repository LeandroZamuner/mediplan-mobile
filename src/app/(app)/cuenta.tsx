import { updateProfile } from "firebase/auth";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Text } from "@/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { api } from "@/lib/api";
import { firebaseAuth } from "@/lib/firebase";
import { colors } from "@/theme/tokens";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { Labeled } from "@/ui/Labeled";
import { Select } from "@/ui/Select";

const ZONES = [
  "America/Argentina/Buenos_Aires",
  "America/Montevideo",
  "America/Santiago",
  "America/Sao_Paulo",
  "America/Bogota",
  "America/Lima",
  "America/Mexico_City",
  "Europe/Madrid",
  "UTC",
];

export default function Cuenta() {
  const { me, firebaseUser, recheck } = useAuth();
  const [name, setName] = useState(firebaseUser?.displayName ?? "");
  const [zone, setZone] = useState<string>(me?.timezone ?? ZONES[0]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    try {
      if (firebaseUser && name.trim() !== (firebaseUser.displayName ?? "")) await updateProfile(firebaseUser, { displayName: name.trim() });
      if (zone !== me?.timezone) await api("/me", { method: "PATCH", json: { timezone: zone } });
      await firebaseAuth().currentUser?.reload();
      await recheck();
      setMsg("Cambios guardados.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "No pudimos guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Información de mi cuenta" />
        <Labeled label="Nombre"><Field value={name} onChangeText={setName} placeholder="Tu nombre" /></Labeled>
        <Labeled label="Correo electrónico" hint="El correo no se puede cambiar desde la app."><Field value={me?.email ?? ""} editable={false} /></Labeled>
        <Select label="Zona horaria" placeholder="Elegí tu zona" value={zone} options={ZONES.map((z) => ({ label: z.replace("_", " "), value: z }))} onChange={setZone} />
        <Text style={s.hint}>Los horarios de tus medicamentos se interpretan en esta zona horaria.</Text>
        {msg ? <Text style={s.msg}>{msg}</Text> : null}
        <Button title="Guardar cambios" loading={busy} onPress={() => void save()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 14 },
  title: { fontSize: 24, color: colors.text, marginTop: 8 },
  hint: { fontSize: 11, color: colors.textMuted },
  msg: { fontSize: 13, color: colors.text },
});
