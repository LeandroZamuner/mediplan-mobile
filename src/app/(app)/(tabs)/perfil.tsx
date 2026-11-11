import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { useCaregivers, usePlans } from "@/features/usePlans";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";

const ITEMS: { label: string; href: "/cuenta" | "/privacidad" | "/idioma" | "/ajustes-notificaciones" | "/supervisados" | "/stock" | "/notificaciones" }[] = [
  { label: "Información de mi cuenta", href: "/cuenta" },
  { label: "Privacidad y seguridad", href: "/privacidad" },
  { label: "Preferencias de idioma", href: "/idioma" },
  { label: "Configurar notificaciones", href: "/ajustes-notificaciones" },
];
const MORE: typeof ITEMS = [
  { label: "Personas que cuido", href: "/supervisados" },
  { label: "Stock y consumos", href: "/stock" },
  { label: "Notificaciones", href: "/notificaciones" },
];

export default function Perfil() {
  const { me, firebaseUser, signOut } = useAuth();
  const plans = usePlans();
  const planId = plans.data?.find((p) => p.status === "active")?.id;
  const caregivers = useCaregivers(planId);
  const accepted = caregivers.data?.filter((c) => c.status === "accepted") ?? [];
  const name = firebaseUser?.displayName || me?.email.split("@")[0] || "";

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.head}>
          <View style={s.avatar}><Text style={s.avatarText}>{name.slice(0, 1).toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.email}>{me?.email}</Text>
          </View>
        </View>

        <Text style={s.h2}>Familiares y cuidadores</Text>
        <View style={s.people}>
          {accepted.length === 0 ? <Text style={s.email}>Todavía no tenés cuidadores.</Text> : accepted.map((c) => <Text key={c.id} style={s.person}>{c.email}</Text>)}
        </View>
        <Button title="Gestionar cuidadores" variant="soft" onPress={() => router.push("/cuidadores/nuevo")} />

        <Text style={s.label}>Configuración</Text>
        {[...MORE, ...ITEMS].map((t) => (
          <Pressable key={t.href} style={s.item} onPress={() => router.push(t.href)}>
            <Text style={s.itemText}>{t.label}</Text>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </Pressable>
        ))}

        <Text style={s.label}>Ayuda</Text>
        <Button title="Cerrar sesión" variant="ghost" onPress={() => void signOut()} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 12 },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 26, color: colors.primary, fontWeight: "700" },
  name: { fontSize: 20, fontWeight: "600", color: colors.text },
  email: { fontSize: 13, color: colors.textMuted },
  h2: { fontSize: 18, color: colors.text, marginTop: 8 },
  people: { gap: 4 },
  person: { fontSize: 14, color: colors.text },
  label: { fontSize: 15, color: colors.textMuted, marginTop: 12 },
  item: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 16 },
  itemText: { fontSize: 15, color: colors.text },
});
