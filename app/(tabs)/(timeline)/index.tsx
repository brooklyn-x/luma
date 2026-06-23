import { FlashList } from "@shopify/flash-list";
import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TransactionCard } from "@/components/feed/transaction-card";
import { FilterSheet, type FilterOption } from "@/components/ui/filter-sheet";
import { SF } from "@/components/ui/sf";
import { deriveCards } from "@/data/cards";
import type { Transaction } from "@/data/types";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { useTabScreenBottomPadding, useTabScreenTopPadding } from "@/lib/tab-safe-area";
import { spacing, useCardShadow, useChipShadow, useTheme } from "@/theme";
import { formatRelativeDay } from "@/utils/format";

type Group = {
  label: string;
  debitTotal: number;
  txns: Transaction[];
};

const PERIODS = [
  { key: "all", label: "Period", sheetLabel: "All time", days: null },
  { key: "week", label: "7 days", sheetLabel: "Last 7 days", days: 7 },
  { key: "month", label: "30 days", sheetLabel: "Last 30 days", days: 30 },
  { key: "3m", label: "3 months", sheetLabel: "Last 3 months", days: 90 },
] as const;
type PeriodKey = (typeof PERIODS)[number]["key"];

const SORTS = [
  { key: "recent", label: "Sum", sheetLabel: "Newest first" },
  { key: "high", label: "Highest", sheetLabel: "Highest spend" },
  { key: "low", label: "Lowest", sheetLabel: "Lowest spend" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

const ALL_CARDS = "__all";

export default function TimelineIndex() {
  const t = useTheme();
  const cardShadow = useCardShadow();
  const chipShadow = useChipShadow();
  const topPad = useTabScreenTopPadding();
  const bottomPad = useTabScreenBottomPadding();
  const { data } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);
  const [cardFilter, setCardFilter] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodKey>("all");
  const [sort, setSort] = useState<SortKey>("recent");
  const [openSheet, setOpenSheet] = useState<"period" | "card" | "sum" | null>(null);

  const cards = useMemo(() => deriveCards(transactions), [transactions]);

  const filtered = useMemo(() => {
    const days = PERIODS.find((p) => p.key === period)?.days ?? null;
    const cutoff = days ? Date.now() - days * 86_400_000 : null;
    return transactions.filter((tr) => {
      if (cardFilter && tr.paymentSource !== cardFilter) return false;
      if (cutoff && +new Date(tr.date) < cutoff) return false;
      return true;
    });
  }, [transactions, cardFilter, period]);

  const groups = useMemo<Group[]>(() => {
    const map = new Map<string, Transaction[]>();
    filtered
      .slice()
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))
      .forEach((tr) => {
        const label = formatRelativeDay(tr.date);
        const list = map.get(label) ?? [];
        list.push(tr);
        map.set(label, list);
      });
    const out: Group[] = [];
    map.forEach((txns, label) => {
      const debitTotal = txns
        .filter((tr) => tr.direction === "debit")
        .reduce((acc, tr) => acc + tr.amount, 0);
      out.push({ label, debitTotal, txns });
    });
    // `recent` keeps the date-desc insertion order; the others reorder by spend.
    if (sort === "high") out.sort((a, b) => b.debitTotal - a.debitTotal);
    else if (sort === "low") out.sort((a, b) => a.debitTotal - b.debitTotal);
    return out;
  }, [filtered, sort]);

  const activeCard = cards.find((c) => c.paymentSource === cardFilter) ?? null;

  const periodLabel = PERIODS.find((p) => p.key === period)!.label;
  const sortLabel = SORTS.find((s) => s.key === sort)!.label;
  const cardLabel = activeCard
    ? `${activeCard.issuer}${activeCard.last4 ? ` ·· ${activeCard.last4}` : ""}`
    : "Card";

  const periodOptions: FilterOption[] = PERIODS.map((p) => ({
    key: p.key,
    label: p.sheetLabel,
  }));
  const sortOptions: FilterOption[] = SORTS.map((s) => ({
    key: s.key,
    label: s.sheetLabel,
  }));
  const cardOptions: FilterOption[] = [
    { key: ALL_CARDS, label: "All cards" },
    ...cards.map((c) => ({
      key: c.paymentSource,
      label: c.issuer,
      sublabel: c.last4 ? `•• ${c.last4}` : c.productName,
      swatch: { from: c.gradientFrom, to: c.gradientTo },
    })),
  ];

  const renderChip = (key: string, label: string, active: boolean, onPress: () => void) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: t.text }
          : { backgroundColor: t.card, boxShadow: chipShadow },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? t.background : t.text }]}>{label}</Text>
      <SF name="chevron.down" size={11} tint={active ? t.background : t.text} />
    </Pressable>
  );

  const FilterChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
    >
      {renderChip("period", periodLabel, period !== "all", () => setOpenSheet("period"))}
      {cards.length > 0
        ? renderChip("card", cardLabel, !!activeCard, () => setOpenSheet("card"))
        : null}
      {renderChip("sum", sortLabel, sort !== "recent", () => setOpenSheet("sum"))}
    </ScrollView>
  );

  const ListHeader = (
    <View>
      <Text style={[styles.screenTitle, { color: t.text }]}>Transactions</Text>
      {FilterChips}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ title: "Transactions" }} />
      <FlashList
        data={groups}
        keyExtractor={(g) => g.label}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: spacing.hPad,
          paddingBottom: bottomPad,
        }}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        renderItem={({ item }) => (
          <View style={[styles.groupCard, { backgroundColor: t.card, boxShadow: cardShadow }]}>
            {/* Date / Total header */}
            <View style={styles.groupHeader}>
              <View>
                <Text style={[styles.headerLabel, { color: t.muted2 }]}>Date</Text>
                <Text style={[styles.headerValue, { color: t.text }]}>{item.label}</Text>
              </View>
              {item.debitTotal > 0 ? (
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[styles.headerLabel, { color: t.muted2 }]}>Total</Text>
                  <Text style={[styles.headerValue, { color: t.text }]}>
                    −₹{item.debitTotal.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Transactions */}
            {item.txns.map((tx, idx) => (
              <View key={tx.id}>
                <TransactionCard transaction={tx} embedded />
                {idx < item.txns.length - 1 ? (
                  <View style={[styles.divider, { backgroundColor: t.divider }]} />
                ) : null}
              </View>
            ))}
          </View>
        )}
      />

      <FilterSheet
        visible={openSheet === "period"}
        title="Show transactions from"
        options={periodOptions}
        selectedKey={period}
        onSelect={(key) => setPeriod(key as PeriodKey)}
        onClose={() => setOpenSheet(null)}
      />
      <FilterSheet
        visible={openSheet === "card"}
        title="Filter by card"
        options={cardOptions}
        selectedKey={cardFilter ?? ALL_CARDS}
        onSelect={(key) => setCardFilter(key === ALL_CARDS ? null : key)}
        onClose={() => setOpenSheet(null)}
      />
      <FilterSheet
        visible={openSheet === "sum"}
        title="Sort by"
        options={sortOptions}
        selectedKey={sort}
        onSelect={(key) => setSort(key as SortKey)}
        onClose={() => setOpenSheet(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    paddingTop: 4,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 14,
    paddingRight: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    borderCurve: "continuous",
  },
  chipText: { fontSize: 13, fontWeight: "700" },
  groupCard: {
    borderRadius: 26,
    borderCurve: "continuous",
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  groupHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    paddingHorizontal: 2,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  headerValue: {
    fontSize: 15,
    fontWeight: "800",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  divider: { height: StyleSheet.hairlineWidth },
});
