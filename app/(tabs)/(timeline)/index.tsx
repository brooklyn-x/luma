import { FlashList } from "@shopify/flash-list";
import { Stack } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { TransactionCard } from "@/components/feed/transaction-card";
import type { Transaction } from "@/data/types";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { spacing, typography, useTheme } from "@/theme";
import { formatRelativeDay } from "@/utils/format";

type Row =
  | { kind: "header"; key: string; label: string; total: number }
  | { kind: "tx"; key: string; tx: Transaction };

export default function TimelineIndex() {
  const t = useTheme();
  const { data } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);

  const rows = useMemo<Row[]>(() => {
    const groups = new Map<string, Transaction[]>();
    transactions
      .slice()
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .forEach((tr) => {
        const label = formatRelativeDay(tr.date);
        const list = groups.get(label) ?? [];
        list.push(tr);
        groups.set(label, list);
      });
    const out: Row[] = [];
    groups.forEach((list, label) => {
      const total = list.reduce((acc, tr) => acc + tr.amount, 0);
      out.push({ kind: "header", key: `h-${label}`, label, total });
      list.forEach((tx) => out.push({ kind: "tx", key: tx.id, tx }));
    });
    return out;
  }, [transactions]);

  return (
    <>
      <Stack.Screen options={{ title: "Timeline" }} />
      <FlashList
        data={rows}
        keyExtractor={(r) => r.key}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.hPad,
          paddingBottom: 60,
        }}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) =>
          item.kind === "header" ? (
            <View style={styles.section}>
              <View
                style={[
                  styles.sectionPill,
                  { backgroundColor: t.tileFill, borderColor: t.tileBorder },
                ]}
              >
                <Text style={[styles.sectionLabel, { color: t.muted }]}>{item.label}</Text>
              </View>
              <Text style={[styles.sectionTotal, { color: t.muted }]}>
                ₹{item.total.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </Text>
            </View>
          ) : (
            <TransactionCard transaction={item.tx} />
          )
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 22,
    paddingBottom: 6,
  },
  sectionPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  sectionLabel: {
    ...typography.micro,
    textTransform: "uppercase",
    fontWeight: "600",
  },
  sectionTotal: { ...typography.caption, fontVariant: ["tabular-nums"] },
});
