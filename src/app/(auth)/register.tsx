import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ROLE_KEY } from "@/auth/AuthProvider";
import { authErrorMessage } from "@/lib/auth-errors";
import { firebaseAuth } from "@/lib/firebase";
import { passwordChecks, isPasswordValid } from "@/lib/password";
import { BackButton } from "@/ui/BackButton";
import { Button } from "@/ui/Button";
import { Field } from "@/ui/Field";
import { GradientScreen } from "@/ui/GradientScreen";

type Role = "patient" | "caregiver";

/** Crear cuenta en 3 pasos (datos → contraseña → tipo de perfil), como el Figma. */
export default function Register() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    setError("");
    try {
      await AsyncStorage.setItem(ROLE_KEY, role).catch(() => {});
      const cred = await createUserWithEmailAndPassword(firebaseAuth(), email.trim(), password);
      await sendEmailVerification(cred.user);
      // El resto lo resuelve AuthProvider: pasa a "verificá tu correo".
    } catch (e) {
      setError(authErrorMessage(e));
      setBusy(false);
    }
  }

  const back = () => (step === 0 ? router.back() : setStep(step - 1));

  return (
    <GradientScreen>
      <BackButton onPress={back} />
      <View style={s.spacer} />
      <Text style={s.kicker}>Crear cuenta</Text>

      {step === 0 && (
        <View style={s.form}>
          <Text style={s.title}>Complete los campos</Text>
          <Field onDark placeholder="Nombre completo" value={name} onChangeText={setName} />
          <Field onDark placeholder="Correo electrónico" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Button title="Siguiente" onDark disabled={name.trim().length < 2 || !email.includes("@")} onPress={() => setStep(1)} />
        </View>
      )}

      {step === 1 && (
        <View style={s.form}>
          <Text style={s.title}>Cree una contraseña</Text>
          <Field onDark placeholder="Contraseña" secureTextEntry value={password} onChangeText={setPassword} />
          <Text style={s.hint}>Su contraseña debe cumplir los siguientes requisitos:</Text>
          {passwordChecks(password).map((c) => (
            <View key={c.label} style={s.check}>
              <Feather name={c.ok ? "check-circle" : "circle"} size={13} color={c.ok ? "#1FC188" : "#9AA1CE"} />
              <Text style={[s.hint, c.ok && { color: "#1FC188" }]}>{c.label}</Text>
            </View>
          ))}
          <Button title="Siguiente" onDark disabled={!isPasswordValid(password)} onPress={() => setStep(2)} />
        </View>
      )}

      {step === 2 && (
        <View style={s.form}>
          <Text style={s.title}>Seleccione un tipo de perfil</Text>
          <Choice label="Paciente" icon="user" selected={role === "patient"} onPress={() => setRole("patient")} />
          <Choice label="Supervisor" icon="shield" selected={role === "caregiver"} onPress={() => setRole("caregiver")} />
          {error ? <Text style={s.error}>{error}</Text> : null}
          <Button title="Siguiente" onDark loading={busy} onPress={create} />
        </View>
      )}
    </GradientScreen>
  );
}

function Choice({ label, icon, selected, onPress }: { label: string; icon: "user" | "shield"; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[s.choice, selected && s.choiceOn]}>
      <Feather name={icon} size={16} color={selected ? "#3646AB" : "#fff"} />
      <Text style={[s.choiceText, selected && { color: "#3646AB" }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  spacer: { flex: 1 },
  kicker: { color: "#C9CDEB", fontSize: 11, marginBottom: 4 },
  title: { color: "#fff", fontSize: 20, fontWeight: "600", marginBottom: 8 },
  form: { gap: 12 },
  hint: { color: "#C9CDEB", fontSize: 11 },
  check: { flexDirection: "row", alignItems: "center", gap: 6 },
  error: { color: "#FFB4C0", fontSize: 13 },
  choice: { flexDirection: "row", alignItems: "center", gap: 10, height: 48, borderRadius: 12, paddingHorizontal: 14, backgroundColor: "#53597D" },
  choiceOn: { backgroundColor: "#E0E3F5" },
  choiceText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
