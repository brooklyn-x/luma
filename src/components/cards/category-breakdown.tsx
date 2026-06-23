import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SF } from "@/components/ui/sf";
import type { Category, Transaction } from "@/data/types";
import { categoryColors, typography, useTheme } from "@/theme";
import { formatCurrency } from "@/utils/format";

const CATEGORY_ICON: Record<Category, string> = {
  Shopping: "bag.fill",
  Food: "fork.knife",
  Travel: "airplane",
  Bills: "doc.text.fill",
  Entertainment: "film.fill",
};

type Props = {
  transactions: Transaction[];
  total: number;
};

export function CategoryBreakdown({ transactions, total }: Props) {
  const t = useTheme();

  const rows = useMemo(() => {
    const map = new Map<Category, number>();
    transactions.forEach((tx) => {
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    });
    return Array.from(map.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        pct: total > 0 ? Math.round((amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, total]);

  if (rows.length === 0 || total <= 0) return null;

  return (
    <View style={styles.wrap}>
      {rows.map(({ category, amount, pct }) => {
        const color = categoryColors[category] ?? t.muted;
        return (
          <View key={category} style={styles.row}>
            <View style={styles.topLine}>
              <View style={[styles.chip, { backgroundColor: `${color}1F` }]}>
                <SF name={CATEGORY_ICON[category]} size={17} tint={color} />
              </View>
              <Text style={[styles.name, { color: t.text }]}>{category}</Text>
              <Text style={[styles.amount, { color: t.text }]}>
                {formatCurrency(amount)}
              </Text>
            </View>
            <View style={styles.barLine}>
              <View style={[styles.track, { backgroundColor: t.divider }]}>
                <View
                  style={[
                    styles.fill,
                    { width: `${pct}%`, backgroundColor: color },
                  ]}
                />
              </View>
              <Text style={[styles.pct, { color: t.muted }]}>{pct}%</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  row: { gap: 8 },
  topLine: { flexDirection: "row", alignItems: "center", gap: 11 },
  chip: {
    width: 34,
    height: 34,
    borderRadius: 11,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { ...typography.body, flex: 1, fontSize: 14.5, fontWeight: "700" },
  amount: {
    fontSize: 14.5,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  barLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 45,
  },
  track: {
    flex: 1,
    height: 7,
    borderRadius: 5,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 5 },
  pct: {
    ...typography.micro,
    fontWeight: "700",
    width: 30,
    textAlign: "right",
  },
});
