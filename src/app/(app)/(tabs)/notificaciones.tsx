import { Feather } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { dayLabel } from "@/features/notifications-groups";
import { unreadCount, useNotifications } from "@/features/useNotifications";
import { api } from "@/lib/api";
import { formatTime } from "@/lib/dates";
import type { AppNotification } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";
import { type } from "@/theme/typography";
import { EmptyState } from "@/ui/EmptyState";
import { ScreenHeader } from "@/ui/ScreenHeader";
import { Text } from "@/ui/Text";

const KIND = {
  missed_dose: { icon: "alert-circle", bg: "#F8D7DE", fg: colors.danger },
  low_stock: { icon: "package", bg: "#FFF3CD", fg: "#8a6d00" },
} as const;
const FALLBACK = { icon: "bell", bg: colors.primarySoft, fg: colors.primary } as const;

export default function Notificaciones() {
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const { data, isLoading, mutate } = useNotifications();
  const list = data ?? [];
  const unread = unreadCount(list);

  async function read(n: AppNotification) {
    if (n.readAt) return;
    await mutate(list.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)), { revalidate: false });
    await api(`/notifications/${n.id}/read`, { method: "POST" }).catch(() => mutate());
  }

  async function readAll() {
    const now = new Date().toISOString();
    await mutate(list.map((x) => ({ ...x, readAt: x.readAt ?? now })), { revalidate: false });
    await Promise.all(list.filter((n) => !n.readAt).map((n) => api(`/notifications/${n.id}/read`, { method: "POST" }).catch(() => undefined)));
    await mutate();
  }

  // Agrupadas por día ("Hoy", "Ayer", "10/11"), de la más nueva a la más vieja.
  const groups: { label: string; items: AppNotification[] }[] = [];
  for (const n of list) {
    const label = dayLabel(n.createdAt, tz, new Date());
    const g = groups.find((x) => x.label === label);
    if (g) g.items.push(n);
    else groups.push({ label, items: [n] });
  }

  return (
    <SafeAreaView style={s.screen} edges={["top"]}>
      <ScrollView contentContainerStyle={s.pad}>
        <ScreenHeader back={false} title="Avisos" subtitle={unread > 0 ? `Tenés ${unread} ${unread === 1 ? "aviso sin leer" : "avisos sin leer"}.` : undefined} />
        {unread > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => void readAll()} style={s.readAll}>
            <Feather name="check-circle" size={16} color={colors.primary} />
            <Text style={s.readAllText}>Marcar todos como leídos</Text>
          </Pressable>
        ) : null}

        {!isLoading && list.length === 0 ? <EmptyState icon="bell" title="Estás al día" text="Acá vas a ver los avisos sobre tomas sin registrar y stock bajo." /> : null}

        {groups.map((g) => (
          <View key={g.label} style={{ gap: 8 }}>
            <Text style={s.day}>{g.label}</Text>
            {g.items.map((n) => {
              const k = KIND[n.kind as keyof typeof KIND] ?? FALLBACK;
              return (
                <Pressable key={n.id} onPress={() => void read(n)} style={[s.card, !n.readAt && s.unread]}>
                  <View style={[s.icon, { backgroundColor: k.bg }]}><Feather name={k.icon} size={18} color={k.fg} /></View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={s.row}>
                      <Text style={[s.title, { flex: 1 }]}>{n.title}</Text>
                      <Text style={s.time}>{formatTime(n.createdAt, tz)}</Text>
                    </View>
                    <Text style={s.body}>{n.body}</Text>
                  </View>
                  {!n.readAt ? <View style={s.dot} /> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { padding: 16, gap: 12, paddingBottom: 32 },
  readAll: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingVertical: 4 },
  readAllText: { ...type.label, fontWeight: "500", color: colors.primary },
  day: { ...type.label, fontWeight: "500", color: colors.textMuted, marginTop: 4 },
  card: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14 },
  unread: { backgroundColor: colors.primarySoft },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { ...type.h3, color: colors.text },
  body: { ...type.body, color: colors.text },
  time: { ...type.small, color: colors.textMuted },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
});
