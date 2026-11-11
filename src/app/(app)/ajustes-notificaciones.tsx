import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";
import { BackButton } from "@/ui/BackButton";
import { Button } from "@/ui/Button";

export default function AjustesNotificaciones() {
  const [granted, setGranted] = useState<boolean | null>(null);
  useEffect(() => {
    Notifications.getPermissionsAsync().then((p) => setGranted(p.granted), () => setGranted(false));
  }, []);

  async function enable() {
    const p = await Notifications.requestPermissionsAsync();
    if (p.granted) setGranted(true);
    else await Linking.openSettings();
  }

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView contentContainerStyle={s.pad}>
        <BackButton onDark={false} />
        <Text style={s.title}>Configurar notificaciones</Text>
        <Text style={s.muted}>Los recordatorios de cada toma suenan en tu celular aunque no tengas internet.</Text>
        <Text style={s.status}>{granted === null ? "Revisando…" : granted ? "Las notificaciones están activadas." : "Las notificaciones están desactivadas: no vas a recibir los recordatorios."}</Text>
        {granted === false ? <Button title="Activar notificaciones" onPress={() => void enable()} /> : null}
        <Button title="Abrir ajustes del sistema" variant="neutral" onPress={() => void Linking.openSettings()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12 },
  title: { fontSize: 24, color: colors.text, marginTop: 8 },
  muted: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  status: { fontSize: 14, color: colors.text, marginVertical: 8 },
});
