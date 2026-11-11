import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/ui/Button";
import { GradientScreen } from "@/ui/GradientScreen";

export default function Verify() {
  const { firebaseUser, recheck, signOut } = useAuth();
  const [msg, setMsg] = useState("");
  return (
    <GradientScreen>
      <View style={s.spacer} />
      <Text style={s.title}>Revisá tu correo</Text>
      <Text style={s.body}>Te enviamos un mensaje a {firebaseUser?.email} para confirmar que es tuyo. Cuando lo abras, volvé y tocá “Ya lo verifiqué”.</Text>
      {msg ? <Text style={s.body}>{msg}</Text> : null}
      <View style={s.actions}>
        <Button title="Ya lo verifiqué" onPress={() => void recheck()} />
        <Button
          title="Reenviar correo"
          variant="soft"
          onPress={async () => {
            try {
              if (firebaseUser) await sendEmailVerification(firebaseUser);
              setMsg("Listo, lo reenviamos.");
            } catch {
              setMsg("Esperá unos minutos antes de pedirlo otra vez.");
            }
          }}
        />
        <Button title="Salir" variant="ghost" onDark onPress={() => void signOut()} />
      </View>
    </GradientScreen>
  );
}

const s = StyleSheet.create({
  spacer: { flex: 1 },
  title: { color: "#fff", fontSize: 24, fontWeight: "600" },
  body: { color: "#C9CDEB", fontSize: 13, marginTop: 8, lineHeight: 19 },
  actions: { gap: 8, marginTop: 24 },
});
