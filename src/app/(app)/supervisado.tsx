import { useLocalSearchParams } from "expo-router";
import { DoseListScreen } from "@/features/history/DoseListScreen";

/** Tomas de un plan que supervisás: qué tomó y qué se salteó, día por día (solo lectura). */
export default function Supervisado() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  return <DoseListScreen title={"Tomas de la\npersona"} supervisedPlanId={planId} />;
}
