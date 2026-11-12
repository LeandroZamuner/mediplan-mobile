import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";

export function BackButton({ onPress, onDark = true }: { onPress?: () => void; onDark?: boolean }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={6} accessibilityLabel="Volver" onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace("/")))} style={[s.btn, { backgroundColor: onDark ? "rgba(255,255,255,0.15)" : "#EFF0F1" }]}>
      <Feather name="arrow-left" size={18} color={onDark ? "#fff" : "#27353B"} />
    </Pressable>
  );
}

const s = StyleSheet.create({ btn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginTop: 8 } });
