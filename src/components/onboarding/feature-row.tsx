import { StyleSheet, Text, View } from "react-native";
import { SF } from "@/components/ui/sf";
import { typography, useTheme } from "@/theme";

type Props = {
  symbol: string;
  /** Optional icon-color override. Defaults to the lime-soft accent. */
  tint?: string;
  title: string;
  body: string;
};

export function FeatureRow({ symbol, tint, title, body }: Props) {
  const t = useTheme();
  const iconTint = tint ?? t.limeSoftInk;
  return (
    <View style={styles.row}>
      <View style={[styles.iconChip, { backgroundColor: t.limeSoft }]}>
        <SF name={symbol} size={20} tint={iconTint} />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, { color: t.text }]}>{title}</Text>
        <Text style={[styles.body, { color: t.muted }]}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 9,
  },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2 },
  title: { ...typography.body, fontWeight: "600" },
  body: { ...typography.caption, fontSize: 14, lineHeight: 19 },
});
