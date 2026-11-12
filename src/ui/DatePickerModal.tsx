import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/ui/Text";
import { MONTHS_SHORT, MONTHS_LONG, WEEK_HEADER, monthGrid, shiftMonth } from "@/features/history/calendar";
import { colors } from "@/theme/tokens";

/** Selector de fecha: calendario del mes y, tocando el mes, una grilla de meses del año. */
export function DatePickerModal({ visible, value, onClose, onPick }: { visible: boolean; value: string; onClose: () => void; onPick: (iso: string) => void }) {
  const [vy, vm] = value.split("-").map(Number);
  const [year, setYear] = useState(vy);
  const [month, setMonth] = useState(vm);
  const [months, setMonths] = useState(false);

  const move = (d: number) => {
    if (months) return setYear((y) => y + d);
    const n = shiftMonth(year, month, d);
    setYear(n.year);
    setMonth(n.month);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={s.scrim} onPress={onClose}>
        <Pressable style={s.card} onPress={() => undefined}>
          <View style={s.head}>
            <Pressable accessibilityLabel="Anterior" onPress={() => move(-1)}><Feather name="chevron-left" size={20} color={colors.textMuted} /></Pressable>
            <Pressable onPress={() => setMonths((m) => !m)} style={s.title}>
              <Text style={s.titleText}>{months ? year : `${MONTHS_SHORT[month - 1]} ${year}`}</Text>
              {!months ? <Feather name="chevron-down" size={14} color={colors.text} /> : null}
            </Pressable>
            <Pressable accessibilityLabel="Siguiente" onPress={() => move(1)}><Feather name="chevron-right" size={20} color={colors.textMuted} /></Pressable>
          </View>

          {months ? (
            <View style={s.months}>
              {MONTHS_SHORT.map((m, i) => (
                <Pressable key={m} accessibilityLabel={MONTHS_LONG[i]} onPress={() => { setMonth(i + 1); setMonths(false); }} style={[s.month, i + 1 === month && year === vy && s.on]}>
                  <Text style={[s.monthText, i + 1 === month && year === vy && s.onText]}>{m}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View>
              <View style={s.week}>{WEEK_HEADER.map((w) => <Text key={w} style={s.weekDay}>{w}</Text>)}</View>
              {monthGrid(year, month).map((row, i) => (
                <View key={i} style={s.week}>
                  {row.map((c) => (
                    <Pressable key={c.iso} onPress={() => { onPick(c.iso); onClose(); }} style={[s.day, c.iso === value && s.on]}>
                      <Text style={[s.dayText, !c.inMonth && { color: "#C5C8CE" }, c.iso === value && s.onText]}>{c.day}</Text>
                    </Pressable>
                  ))}
                </View>
              ))}
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 328, backgroundColor: "#fff", borderRadius: 16, padding: 14, gap: 10 },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { flexDirection: "row", alignItems: "center", gap: 4 },
  titleText: { fontSize: 15, fontWeight: "600", color: colors.text },
  week: { flexDirection: "row" },
  weekDay: { flex: 1, textAlign: "center", fontSize: 11, color: colors.textMuted, fontWeight: "600", paddingVertical: 6 },
  day: { flex: 1, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  dayText: { fontSize: 14, color: colors.text },
  months: { flexDirection: "row", flexWrap: "wrap" },
  month: { width: "33.33%", height: 48, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  monthText: { fontSize: 14, color: colors.text },
  on: { backgroundColor: colors.primary },
  onText: { color: "#fff", fontWeight: "600" },
});
