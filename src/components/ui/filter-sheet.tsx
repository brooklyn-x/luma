import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { spacing, typography, useTheme } from "@/theme";
import { Drawer, type DrawerHandle } from "./drawer";
import { SF } from "./sf";

export type FilterOption = {
  key: string;
  label: string;
  sublabel?: string;
  /** Leading gradient swatch (used for card rows). */
  swatch?: { from: string; to: string };
};

type Props = {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedKey: string;
  onSelect: (key: string) => void;
  onClose: () => void;
};

/**
 * Generic option picker presented as a custom bottom sheet. Renders inside a
 * core RN `Modal` so it floats above everything (incl. the floating tab bar),
 * and reuses `Drawer` for the slide / backdrop / drag-to-dismiss.
 */
export function FilterSheet({
  visible,
  title,
  options,
  selectedKey,
  onSelect,
  onClose,
}: Props) {
  const t = useTheme();
  const drawerRef = useRef<DrawerHandle>(null);

  // Animate the sheet out, then let `onClose` unmount the Modal.
  const requestClose = () => {
    if (drawerRef.current) drawerRef.current.close();
    else onClose();
  };

  const pick = (key: string) => {
    onSelect(key);
    requestClose();
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={requestClose}
    >
      <GestureHandlerRootView style={styles.fill}>
        <Drawer ref={drawerRef} onClose={onClose} maxHeightRatio={0.7}>
          <View style={styles.content}>
            <Text style={[styles.title, { color: t.text }]}>{title}</Text>
            {options.map((opt) => {
              const selected = opt.key === selectedKey;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => pick(opt.key)}
                  style={({ pressed }) => [
                    styles.row,
                    { backgroundColor: pressed ? t.tileFill : "transparent" },
                  ]}
                >
                  {opt.swatch ? (
                    <LinearGradient
                      colors={[opt.swatch.from, opt.swatch.to]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.swatch}
                    />
                  ) : null}
                  <View style={styles.rowText}>
                    <Text style={[styles.rowLabel, { color: t.text }]} numberOfLines={1}>
                      {opt.label}
                    </Text>
                    {opt.sublabel ? (
                      <Text style={[styles.rowSublabel, { color: t.muted }]} numberOfLines={1}>
                        {opt.sublabel}
                      </Text>
                    ) : null}
                  </View>
                  {selected ? <SF name="checkmark" size={18} tint={t.text} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Drawer>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: {
    paddingHorizontal: spacing.hPad,
    paddingTop: 4,
    paddingBottom: 8,
  },
  title: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderCurve: "continuous",
  },
  swatch: {
    width: 34,
    height: 24,
    borderRadius: 6,
    borderCurve: "continuous",
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: "600" },
  rowSublabel: { ...typography.caption, fontSize: 12.5, marginTop: 1 },
});
