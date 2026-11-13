import { Feather } from "@expo/vector-icons";
import { sendEmailVerification } from "firebase/auth";
import { useEffect, useState } from "react";
import { AppState, StyleSheet, View } from "react-native";
import { useAuth } from "@/auth/AuthProvider";
import { Button } from "@/ui/Button";
import { GradientScreen } from "@/ui/GradientScreen";
import { Text } from "@/ui/Text";

/** Verificar el correo: mismo estilo que el resto de las pantallas de acceso (degradado azul, sin Figma propio). */
export default function Verify() {
  const { firebaseUser, recheck, signOut } = useAuth();
  const [msg, setMsg] = useState("");
  const [checking, setChecking] = useState(false);

  // Al volver a la app después de tocar el enlace del correo, se comprueba sola (si ya está verificado, la pantalla se cierra).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => state === "active" && void recheck());
    return () => sub.remove();
  }, [recheck]);

  async function check() {
    setChecking(true);
    setMsg("");
    await recheck();
    setChecking(false);
    setMsg("Todavía no vemos tu correo verificado. Abrí el enlace del mensaje y volvé a probar."); // si ya estaba verificado, esta pantalla ya no está
  }

  return (
    <GradientScreen>
      <View style={s.center}>
        <View style={s.badge}><Feather name="mail" size={34} color="#fff" /></View>
      </View>
      <Text style={s.title}>{"Revisá\ntu correo"}</Text>
      <Text style={s.body}>Te enviamos un mensaje a {firebaseUser?.email} para confirmar que es tuyo. Abrí el enlace y volvé acá.</Text>
      {msg ? <Text style={s.msg}>{msg}</Text> : null}
      <View style={s.actions}>
        <Button title="Ya lo verifiqué" loading={checking} onPress={() => void check()} />
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  badge: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#2B3585", alignItems: "center", justifyContent: "center" },
  title: { color: "#fff", fontSize: 26, fontWeight: "600", lineHeight: 32 },
  body: { color: "#C9CDEB", fontSize: 13, lineHeight: 19, marginTop: 12 },
  msg: { color: "#C9CDEB", fontSize: 13, marginTop: 8 },
  actions: { gap: 8, marginTop: 24 },
});
