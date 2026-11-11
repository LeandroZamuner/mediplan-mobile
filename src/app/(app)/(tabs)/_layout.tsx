import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { colors } from "@/theme/tokens";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11 },
        tabBarStyle: { backgroundColor: colors.background, borderTopWidth: 0, elevation: 8, height: 64, paddingBottom: 8 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Inicio", tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color as string} /> }} />
      <Tabs.Screen name="plan" options={{ title: "Plan médico", tabBarIcon: ({ color }) => <Feather name="clipboard" size={20} color={color as string} /> }} />
      <Tabs.Screen name="perfil" options={{ title: "Perfil", tabBarIcon: ({ color }) => <Feather name="user" size={20} color={color as string} /> }} />
    </Tabs>
  );
}
