import { Modal, StyleSheet, Text, View } from "react-native";
import { colors, radius } from "@/theme/tokens";
import { Button } from "./Button";

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  cancelLabel?: string;
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/** Diálogo de confirmación (los "¿Quieres …?" del diseño). */
export function ConfirmModal({ visible, title, message, cancelLabel = "Cancelar", confirmLabel, danger, onCancel, onConfirm }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={s.scrim}>
        <View style={s.card}>
          <Text style={s.title}>{title}</Text>
          {message ? <Text style={s.msg}>{message}</Text> : null}
          <View style={s.row}>
            <View style={s.cell}><Button title={cancelLabel} variant="ghost" onPress={onCancel} /></View>
            <View style={s.cell}><Button title={confirmLabel} variant={danger ? "danger" : "primary"} onPress={onConfirm} /></View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: 16 },
  card: { width: "100%", maxWidth: 328, backgroundColor: "#fff", borderRadius: radius.lg, padding: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: "600", color: colors.text },
  msg: { fontSize: 13, color: colors.textMuted, lineHeight: 18 },
  row: { flexDirection: "row", gap: 8, marginTop: 8 },
  cell: { flex: 1 },
});
