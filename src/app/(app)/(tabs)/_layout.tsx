import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { unreadCount, useNotifications } from "@/features/useNotifications";
import { useInvitations, usePlans, useSupervised } from "@/features/usePlans";
import { visibleTabs, type TabName } from "@/features/tabs";
import { colors } from "@/theme/tokens";

type Icon = ComponentProps<typeof Feather>["name"];
const TABS: Record<TabName, { title: string; icon: Icon }> = {
  index: { title: "Inicio", icon: "home" },
  plan: { title: "Plan", icon: "clipboard" },
  stock: { title: "Stock", icon: "package" },
  cuidados: { title: "Cuidados", icon: "users" },
  notificaciones: { title: "Avisos", icon: "bell" },
  perfil: { title: "Perfil", icon: "user" },
};
const ALL = Object.keys(TABS) as TabName[];

export default function TabsLayout() {
  const plans = usePlans();
  const supervised = useSupervised();
  const invitations = useInvitations();
  const notifications = useNotifications();
  const shown = visibleTabs({
    planCount: (plans.data ?? []).filter((p) => p.status === "active").length,
    supervisedCount: supervised.data?.length ?? 0,
    invitationCount: (invitations.data ?? []).filter((l) => l.status === "pending").length,
  });
  const unread = unreadCount(notifications.data);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontFamily: "Inter_500Medium" },
        tabBarStyle: { backgroundColor: colors.background, borderTopWidth: 0, elevation: 8, height: 64, paddingBottom: 8 },
      }}
    >
      {ALL.map((name) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title: TABS[name].title,
            href: shown.includes(name) ? undefined : null,
            tabBarBadge: name === "notificaciones" && unread > 0 ? (unread > 9 ? "9+" : unread) : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.danger, color: "#fff", fontSize: 10 },
            tabBarAccessibilityLabel: TABS[name].title,
            tabBarIcon: ({ color }) => <Feather name={TABS[name].icon} size={20} color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  );
}
