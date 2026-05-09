import { StyleSheet, Text, View } from "react-native";
import { SF } from "@/components/ui/sf";
import { typography, useTheme } from "@/theme";

type Props = {
  symbol: string;
  tint: string;
  title: string;
  body: string;
};

export function FeatureRow({ symbol, tint, title, body }: Props) {
  const t = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: `${tint}22` }]}>
        <SF name={symbol} size={18} tint={tint} />
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
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { flex: 1, gap: 2, paddingTop: 2 },
  title: { ...typography.body, fontWeight: "600" },
  body: { ...typography.caption, fontSize: 14, lineHeight: 19 },
});
