import { router } from "expo-router";
import { useState } from "react";
import { Image } from "expo-image";
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "@/ui/Text";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/auth/AuthProvider";
import { colors, radius } from "@/theme/tokens";
import { Button } from "@/ui/Button";
import { ConfirmModal } from "@/ui/ConfirmModal";

const SLIDES: { image: number; title: string; text: string }[] = [
  { image: require("../../../assets/images/onboarding-plan.jpg"), title: "Gestionar tu plan\nde tratamiento", text: "Organiza tus medicamentos, configura recordatorios personalizados para asegurarte de tomarlos a tiempo, y marca fácilmente si has seguido o no tu tratamiento." },
  { image: require("../../../assets/images/onboarding-stock.jpg"), title: "Controlar tu stock de medicamentos", text: "Lleva un seguimiento del stock de tus medicamentos y recibe alertas cuando queden pocas dosis para asegurarte de estar siempre preparado." },
  { image: require("../../../assets/images/onboarding-cuidadores.jpg"), title: "Sincronización\ncon cuidadores", text: "Comparte tu progreso y estado del tratamiento con familiares o cuidadores de manera automática para que estén al tanto de tu bienestar." },
];

/** Presentación de las funciones (3 pantallas deslizables). */
export default function Features() {
  const { width } = useWindowDimensions();
  const { completeOnboarding } = useAuth();
  const [page, setPage] = useState(0);
  const [skipping, setSkipping] = useState(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => setPage(Math.round(e.nativeEvent.contentOffset.x / width));

  return (
    <SafeAreaView style={s.screen}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScroll} style={s.fill}>
        {SLIDES.map((sl) => (
          <View key={sl.title} style={{ width, paddingHorizontal: 16, justifyContent: "center", gap: 16 }}>
            <Image source={sl.image} style={[s.image, { width: width - 32, height: ((width - 32) * 240) / 328 }]} contentFit="cover" />
            <Text style={s.title}>{sl.title}</Text>
            <Text style={s.text}>{sl.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={s.dots}>{SLIDES.map((_, i) => <View key={i} style={[s.dot, i === page && s.dotOn]} />)}</View>
      <View style={s.actions}>
        <Button title="Configurar mi perfil" onPress={() => router.push("/cuenta")} />
        <Button title="Omitir, por ahora" variant="neutral" onPress={() => setSkipping(true)} />
      </View>
      <ConfirmModal visible={skipping} title="¿Quiere iniciar sin configurar su perfil?" message="Confirme esta acción pulsando Si. No se preocupe, puede hacerlo en cualquier momento." confirmLabel="Si" onCancel={() => setSkipping(false)} onConfirm={() => { setSkipping(false); void completeOnboarding(); }} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
  image: { borderRadius: radius.lg },
  title: { fontSize: 26, fontWeight: "600", color: colors.text, lineHeight: 34 },
  text: { fontSize: 14, color: colors.textMuted, lineHeight: 22 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginVertical: 12 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EBEBEE" },
  dotOn: { width: 40, backgroundColor: "#B1B3BA" },
  actions: { padding: 16, gap: 8 },
});
