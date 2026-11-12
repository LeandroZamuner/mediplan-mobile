import { Feather } from "@expo/vector-icons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { useNotifications } from "@/features/useNotifications";
import { api } from "@/lib/api";
import { formatDateTime } from "@/lib/dates";
import type { AppNotification } from "@/lib/types";
import { colors, radius } from "@/theme/tokens";

const ICON: Record<string, "alert-circle" | "package" | "bell"> = { missed_dose: "alert-circle", low_stock: "package" };

export default function Notificaciones() {
  const { me } = useAuth();
  const tz = me?.timezone ?? "America/Argentina/Buenos_Aires";
  const { data, isLoading, mutate } = useNotifications();

  async function read(n: AppNotification) {
    if (n.readAt) return;
    await mutate(data?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)), { revalidate: false });
    await api(`/notifications/${n.id}/read`, { method: "POST" }).catch(() => mutate());
  }

  return (
    <SafeAreaView style={s.screen}>
      <Text style={s.title}>Notificaciones</Text>
      <FlatList
        data={data ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={s.pad}
        ListEmptyComponent={<Text style={s.empty}>{isLoading ? "Cargando…" : "No tenés notificaciones."}</Text>}
        renderItem={({ item }) => (
          <Pressable onPress={() => void read(item)} style={[s.card, !item.readAt && s.unread]}>
            <Feather name={ICON[item.kind] ?? "bell"} size={20} color={item.kind === "missed_dose" ? colors.danger : colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.title}</Text>
              <Text style={s.body}>{item.body}</Text>
              <Text style={s.when}>{formatDateTime(item.createdAt, tz)}</Text>
            </View>
            {!item.readAt ? <View style={s.dot} /> : null}
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  pad: { paddingHorizontal: 16, gap: 10 },
  title: { fontSize: 28, color: colors.text, paddingHorizontal: 16, marginVertical: 12 },
  empty: { color: colors.textMuted, textAlign: "center", paddingVertical: 32 },
  card: { flexDirection: "row", gap: 12, alignItems: "flex-start", backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14 },
  unread: { backgroundColor: colors.primarySoft },
  name: { fontSize: 14, fontWeight: "600", color: colors.text },
  body: { fontSize: 13, color: colors.text, marginTop: 2 },
  when: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, marginTop: 4 },
});
