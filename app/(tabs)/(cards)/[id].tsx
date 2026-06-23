import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  PlatformColor,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BillsDueSection } from "@/components/bills/bills-due-section";
import { CardTileLarge } from "@/components/cards/card-tile-large";
import { CategoryBreakdown } from "@/components/cards/category-breakdown";
import { DailySpendBars } from "@/components/cards/daily-spend-bars";
import { TransactionCard } from "@/components/feed/transaction-card";
import { SF } from "@/components/ui/sf";
import { deriveCards } from "@/data/cards";
import type { Transaction } from "@/data/types";
import {
  selectActiveBills,
  selectTransactions,
  useSyncMutation,
  useTransactions,
} from "@/hooks/use-transactions";
import { useTabScreenBottomPadding } from "@/lib/tab-safe-area";
import { haptics } from "@/services/haptics";
import {
  spacing,
  typography,
  useCardShadow,
  useChipShadow,
  useTheme,
} from "@/theme";
import {
  type Cycle,
  compareCycle,
  cycleKey,
  cycleOf,
  dayInCycle,
  daysInCycle,
  sameCycle,
} from "@/utils/cycle";
import { formatCurrency, formatRelativeDay } from "@/utils/format";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function CardDetail() {
  const t = useTheme();
  const cardShadow = useCardShadow();
  const chipShadow = useChipShadow();
  const bottomPad = useTabScreenBottomPadding();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);
  const cards = useMemo(() => deriveCards(transactions), [transactions]);

  const syncMutation = useSyncMutation();
  const onRefresh = useCallback(() => {
    syncMutation.mutate(undefined, {
      onSuccess: () => haptics.success(),
    });
  }, [syncMutation]);
  const card = useMemo(
    () => (id ? cards.find((c) => c.id === id) : undefined),
    [cards, id]
  );

  const cardTxAll = useMemo(
    () =>
      card
        ? transactions
            .filter((tx) => tx.paymentSource === card.paymentSource)
            .sort((a, b) => +new Date(b.date) - +new Date(a.date))
        : [],
    [transactions, card]
  );

  const months = useMemo(() => {
    const map = new Map<string, Cycle>();
    cardTxAll.forEach((tx) => {
      const c = cycleOf(tx.date);
      map.set(cycleKey(c), c);
    });
    return Array.from(map.values()).sort(compareCycle);
  }, [cardTxAll]);

  const [selected, setSelected] = useState<Cycle | null>(null);
  const effectiveSelected: Cycle | null =
    selected ?? months[months.length - 1] ?? null;

  const monthTx = useMemo(() => {
    if (!effectiveSelected) return [];
    return cardTxAll.filter((tx) => {
      const c = cycleOf(tx.date);
      return c.year === effectiveSelected.year && c.month === effectiveSelected.month;
    });
  }, [cardTxAll, effectiveSelected]);

  const monthPurchases = useMemo(
    () =>
      monthTx.filter(
        (tx) => tx.direction === "debit" && tx.kind === "purchase"
      ),
    [monthTx]
  );

  const monthTotal = useMemo(
    () => monthPurchases.reduce((acc, tx) => acc + tx.amount, 0),
    [monthPurchases]
  );

  const daily = useMemo(() => {
    if (!effectiveSelected) return [];
    const len = daysInCycle(effectiveSelected);
    const arr = Array.from({ length: len }, (_, i) => ({
      day: i + 1,
      amount: 0,
    }));
    monthPurchases.forEach((tx) => {
      const day = dayInCycle(tx.date, effectiveSelected);
      if (day >= 1 && day <= len) arr[day - 1].amount += tx.amount;
    });
    return arr;
  }, [monthPurchases, effectiveSelected]);

  const cardBills = useMemo(() => {
    if (!card) return [];
    return selectActiveBills(data).filter(
      (b) =>
        b.issuer === card.issuer ||
        (card.last4 && b.cardLast4 === card.last4)
    );
  }, [data, card]);

  const groupedByDay = useMemo(() => {
    const groups = new Map<
      string,
      { label: string; total: number; items: Transaction[]; sortKey: number }
    >();
    monthTx.forEach((tx) => {
      const d = new Date(tx.date);
      const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const existing = groups.get(dayKey);
      if (existing) {
        existing.total += tx.amount;
        existing.items.push(tx);
      } else {
        groups.set(dayKey, {
          label: formatRelativeDay(tx.date),
          total: tx.amount,
          items: [tx],
          sortKey: +new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        });
      }
    });
    return Array.from(groups.values()).sort((a, b) => b.sortKey - a.sortKey);
  }, [monthTx]);

  const idx = effectiveSelected
    ? months.findIndex(
        (m) =>
          m.year === effectiveSelected.year && m.month === effectiveSelected.month
      )
    : -1;
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < months.length - 1;

  const isCurrentCycle = effectiveSelected
    ? sameCycle(effectiveSelected, cycleOf(new Date()))
    : false;
  const lastDay = effectiveSelected
    ? isCurrentCycle
      ? dayInCycle(new Date().toISOString(), effectiveSelected)
      : daysInCycle(effectiveSelected)
    : 0;

  if (!card) {
    return (
      <View style={[styles.empty, { backgroundColor: t.background }]}>
        <Text style={[styles.emptyText, { color: t.muted }]}>Card not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerTintColor: PlatformColor("label") as unknown as string,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.hPad,
          paddingBottom: bottomPad,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={syncMutation.isPending}
            onRefresh={onRefresh}
            tintColor={t.muted}
          />
        }
      >
        <View style={styles.heroBlock}>
          <CardTileLarge
            card={card}
            thisMonthSpend={monthTotal}
            txCount={monthTx.length}
          />
        </View>

        {effectiveSelected ? (
          <View style={styles.monthBar}>
            <Pressable
              onPress={() => canPrev && setSelected(months[idx - 1])}
              disabled={!canPrev}
              hitSlop={12}
              style={[
                styles.monthBtn,
                {
                  backgroundColor: t.card,
                  boxShadow: chipShadow,
                  opacity: canPrev ? 1 : 0.35,
                },
              ]}
            >
              <SF name="chevron.left" size={14} tint={t.text} />
            </Pressable>

            <View style={styles.monthLabelWrap}>
              <Text style={[styles.monthLabel, { color: t.text }]}>
                {MONTH_NAMES[effectiveSelected.month]} {effectiveSelected.year}
              </Text>
              <Text style={[styles.monthMeta, { color: t.muted }]}>
                {formatCurrency(monthTotal)} · {monthTx.length}{" "}
                {monthTx.length === 1 ? "transaction" : "transactions"}
              </Text>
            </View>

            <Pressable
              onPress={() => canNext && setSelected(months[idx + 1])}
              disabled={!canNext}
              hitSlop={12}
              style={[
                styles.monthBtn,
                {
                  backgroundColor: t.card,
                  boxShadow: chipShadow,
                  opacity: canNext ? 1 : 0.35,
                },
              ]}
            >
              <SF name="chevron.right" size={14} tint={t.text} />
            </Pressable>
          </View>
        ) : null}

        {effectiveSelected && monthTx.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>
              Daily spend
            </Text>
            <View
              style={[styles.card, { backgroundColor: t.card, boxShadow: cardShadow }]}
            >
              <DailySpendBars
                daily={daily}
                cycle={effectiveSelected}
                lastDay={lastDay}
                isCurrent={isCurrentCycle}
                tint={card.gradientFrom}
              />
            </View>
          </View>
        ) : null}

        {cardBills.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>
              Upcoming bills
            </Text>
            <BillsDueSection bills={cardBills} compact />
          </View>
        ) : null}

        {monthPurchases.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.text }]}>
              Where it goes
            </Text>
            <View
              style={[styles.card, { backgroundColor: t.card, boxShadow: cardShadow }]}
            >
              <CategoryBreakdown transactions={monthPurchases} total={monthTotal} />
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.text }]}>
            Transactions
          </Text>
          {monthTx.length === 0 ? (
            <Text style={[styles.emptyMonth, { color: t.muted }]}>
              No transactions on this card{" "}
              {effectiveSelected
                ? `in ${MONTH_NAMES[effectiveSelected.month]}`
                : "yet"}
              .
            </Text>
          ) : (
            <View style={styles.txList}>
              {groupedByDay.map((group) => (
                <View key={group.sortKey} style={styles.dayGroup}>
                  <View style={styles.dayHeader}>
                    <Text style={[styles.dayLabel, { color: t.muted }]}>
                      {group.label}
                    </Text>
                    <Text style={[styles.dayTotal, { color: t.muted }]}>
                      {formatCurrency(group.total)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.dayCard,
                      { backgroundColor: t.card, boxShadow: cardShadow },
                    ]}
                  >
                    {group.items.map((tx, idx) => (
                      <View key={tx.id}>
                        <TransactionCard transaction={tx} embedded />
                        {idx < group.items.length - 1 ? (
                          <View
                            style={[styles.divider, { backgroundColor: t.divider }]}
                          />
                        ) : null}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  heroBlock: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  monthBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 12,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  monthLabelWrap: { flex: 1, alignItems: "center" },
  monthLabel: {
    ...typography.body,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  monthMeta: { ...typography.micro, marginTop: 2 },
  section: { marginTop: 22, gap: 12 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
  },
  card: {
    borderRadius: 24,
    borderCurve: "continuous",
    padding: 18,
  },
  txList: { gap: 18 },
  dayGroup: { gap: 8 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  dayCard: {
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  divider: { height: StyleSheet.hairlineWidth },
  dayLabel: {
    ...typography.micro,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  dayTotal: {
    ...typography.caption,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  emptyMonth: {
    ...typography.body,
    fontSize: 14,
    paddingVertical: 24,
    textAlign: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { ...typography.body },
});
