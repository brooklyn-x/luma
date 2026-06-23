import { Pressable, StyleSheet, Text, View } from "react-native";
import { fonts } from "@/lib/fonts";
import { haptics } from "@/services/haptics";
import { spacing, typography, useTheme } from "@/theme";

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.title, { color: t.text }]}>{title}</Text>
      {actionLabel ? (
        <Pressable
          onPress={() => {
            haptics.tap();
            onAction?.();
          }}
          hitSlop={12}
        >
          <Text style={[styles.action, { color: t.text }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.hPad,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h3, fontWeight: "800", letterSpacing: -0.3 },
  action: { ...typography.caption, fontWeight: "700", fontSize: 13.5 },
});
