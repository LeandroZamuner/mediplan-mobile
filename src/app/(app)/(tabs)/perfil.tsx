import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { useCaregivers, useInvitations, usePlans, useSupervised } from "@/features/usePlans";
import { colors, radius } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { Avatar } from "@/ui/Avatar";
import { Button } from "@/ui/Button";
import { SectionTitle } from "@/ui/SectionTitle";
import { Text } from "@/ui/Text";

type Href = "/cuidados" | "/cuenta" | "/privacidad" | "/idioma" | "/ajustes-notificaciones" | "/politica-privacidad" | "/aviso-medico";
const SETTINGS: { label: string; href: Href }[] = [
  { label: "Información de mi cuenta", href: "/cuenta" },
  { label: "Privacidad y seguridad", href: "/privacidad" },
  { label: "Preferencias de idioma", href: "/idioma" },
  { label: "Configurar notificaciones", href: "/ajustes-notificaciones" },
];
const HELP: { label: string; href: Href }[] = [
  { label: "Política de privacidad", href: "/politica-privacidad" },
  { label: "Aviso médico", href: "/aviso-medico" },
];

export default function Perfil() {
  const { me, firebaseUser, signOut } = useAuth();
  const plans = usePlans();
  const planId = plans.data?.find((p) => p.status === "active")?.id;
  const caregivers = useCaregivers(planId);
  const accepted = (caregivers.data ?? []).filter((c) => c.status === "accepted");
  const supervised = useSupervised();
  const invitations = useInvitations();
  const caresForOthers = (supervised.data?.length ?? 0) + (invitations.data ?? []).filter((l) => l.status === "pending").length > 0;
  const name = firebaseUser?.displayName || me?.email.split("@")[0] || "";

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.pad}>
        <View style={s.head}>
          <Avatar label={name} size={72} square />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{name}</Text>
            <Text style={s.email}>{me?.email}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Editar perfil" onPress={() => router.push("/cuenta")} style={s.edit}>
            <Feather name="edit-2" size={18} color={colors.text} />
          </Pressable>
        </View>

        <SectionTitle>Familiares y cuidadores</SectionTitle>
        {accepted.length === 0 ? (
          <Text style={s.email}>Todavía no tenés cuidadores con la invitación aceptada.</Text>
        ) : (
          <View style={s.people}>
            {accepted.map((c) => (
              <View key={c.id} style={s.person}>
                <Avatar label={c.email} size={40} />
                <View>
                  <Text style={s.personName}>{c.email.split("@")[0]}</Text>
                  <Text style={s.email}>Cuidador</Text>
                </View>
              </View>
            ))}
          </View>
        )}
        <Button title="Gestionar cuidadores" variant="soft" onPress={() => router.push("/cuidadores/nuevo")} />

        <SectionTitle muted>Configuración</SectionTitle>
        {caresForOthers ? <Row label="Personas que cuido" onPress={() => router.push("/cuidados")} /> : null}
        {SETTINGS.map((it) => <Row key={it.href} label={it.label} onPress={() => router.push(it.href)} />)}

        <SectionTitle muted>Ayuda</SectionTitle>
        {HELP.map((it) => <Row key={it.href} label={it.label} onPress={() => router.push(it.href)} />)}
        <Pressable accessibilityRole="button" onPress={() => void signOut()} style={s.signOut}>
          <Feather name="log-out" size={16} color={colors.danger} />
          <Text style={s.signOutText}>Cerrar sesión</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" style={s.item} onPress={onPress}>
      <Text style={s.itemText}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12, paddingBottom: 32 },
  head: { flexDirection: "row", alignItems: "center", gap: 14 },
  name: { ...type.title, fontSize: 22, lineHeight: 28, color: colors.text },
  email: { ...type.body, color: colors.textMuted },
  edit: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  people: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  person: { flexDirection: "row", alignItems: "center", gap: 10 },
  personName: { ...type.label, color: colors.text },
  item: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 16, height: 52 },
  itemText: { ...type.body, fontSize: 15, color: colors.text },
  signOut: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 52, marginTop: 4 },
  signOutText: { ...type.label, color: colors.danger },
});
