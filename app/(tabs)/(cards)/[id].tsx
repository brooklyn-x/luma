import { Stack, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  PlatformColor,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CardTileLarge } from "@/components/cards/card-tile-large";
import { DailySpendChart } from "@/components/cards/daily-spend-chart";
import { TransactionCard } from "@/components/feed/transaction-card";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import { SF } from "@/components/ui/sf";
import { deriveCards } from "@/data/cards";
import { merchants } from "@/data/merchants";
import type { Transaction } from "@/data/types";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { spacing, typography, useTheme } from "@/theme";
import { formatCurrency, formatRelativeDay } from "@/utils/format";

type YearMonth = { year: number; month: number };

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

function txYearMonth(tx: Transaction): YearMonth {
  const d = new Date(tx.date);
  return { year: d.getFullYear(), month: d.getMonth() };
}

function ymKey(ym: YearMonth) {
  return `${ym.year}-${ym.month}`;
}

function ymCompare(a: YearMonth, b: YearMonth) {
  return a.year !== b.year ? a.year - b.year : a.month - b.month;
}

function daysInMonthOf(ym: YearMonth) {
  return new Date(ym.year, ym.month + 1, 0).getDate();
}

export default function CardDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);
  const cards = useMemo(() => deriveCards(transactions), [transactions]);
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
    const map = new Map<string, YearMonth>();
    cardTxAll.forEach((tx) => {
      const ym = txYearMonth(tx);
      map.set(ymKey(ym), ym);
    });
    return Array.from(map.values()).sort(ymCompare);
  }, [cardTxAll]);

  const [selected, setSelected] = useState<YearMonth | null>(null);
  const effectiveSelected: YearMonth | null =
    selected ?? months[months.length - 1] ?? null;

  const monthTx = useMemo(() => {
    if (!effectiveSelected) return [];
    return cardTxAll.filter((tx) => {
      const ym = txYearMonth(tx);
      return (
        ym.year === effectiveSelected.year && ym.month === effectiveSelected.month
      );
    });
  }, [cardTxAll, effectiveSelected]);

  const monthTotal = useMemo(
    () => monthTx.reduce((acc, tx) => acc + tx.amount, 0),
    [monthTx]
  );

  const daily = useMemo(() => {
    if (!effectiveSelected) return [];
    const len = daysInMonthOf(effectiveSelected);
    const arr = Array.from({ length: len }, (_, i) => ({
      day: i + 1,
      amount: 0,
    }));
    monthTx.forEach((tx) => {
      const day = new Date(tx.date).getDate();
      if (day >= 1 && day <= len) arr[day - 1].amount += tx.amount;
    });
    return arr;
  }, [monthTx, effectiveSelected]);

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

  const topMerchants = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; total: number; count: number }
    >();
    monthTx.forEach((tx) => {
      const known = merchants[tx.merchantId];
      const name = known?.name ?? tx.merchantName ?? tx.merchantId;
      const key = tx.merchantId;
      const existing = map.get(key);
      if (existing) {
        existing.total += tx.amount;
        existing.count += 1;
      } else {
        map.set(key, { id: key, name, total: tx.amount, count: 1 });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [monthTx]);

  const idx = effectiveSelected
    ? months.findIndex(
        (m) =>
          m.year === effectiveSelected.year && m.month === effectiveSelected.month
      )
    : -1;
  const canPrev = idx > 0;
  const canNext = idx >= 0 && idx < months.length - 1;

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
          headerBackTitle: "Cards",
          headerTintColor: PlatformColor("label") as unknown as string,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "default",
        }}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: spacing.hPad,
          paddingBottom: 60,
        }}
        showsVerticalScrollIndicator={false}
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
                  backgroundColor: t.tileFill,
                  borderColor: t.tileBorder,
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
                  backgroundColor: t.tileFill,
                  borderColor: t.tileBorder,
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
            <Text style={[styles.sectionTitle, { color: t.muted }]}>
              Daily spend
            </Text>
            <DailySpendChart
              daily={daily}
              daysInMonth={daysInMonthOf(effectiveSelected)}
              tint={card.gradientFrom}
            />
          </View>
        ) : null}

        {topMerchants.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.muted }]}>
              Top merchants
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.merchantsRow}
            >
              {topMerchants.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.merchantTile,
                    { backgroundColor: t.tileFill, borderColor: t.tileBorder },
                  ]}
                >
                  <MerchantLogo merchantId={m.id} size={48} />
                  <Text
                    style={[styles.merchantName, { color: t.text }]}
                    numberOfLines={1}
                  >
                    {m.name}
                  </Text>
                  <Text style={[styles.merchantAmount, { color: t.muted }]}>
                    {formatCurrency(m.total)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.muted }]}>
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
                    <View
                      style={[
                        styles.dayPill,
                        {
                          backgroundColor: t.tileFill,
                          borderColor: t.tileBorder,
                        },
                      ]}
                    >
                      <Text style={[styles.dayLabel, { color: t.muted }]}>
                        {group.label}
                      </Text>
                    </View>
                    <Text style={[styles.dayTotal, { color: t.muted }]}>
                      {formatCurrency(group.total)}
                    </Text>
                  </View>
                  {group.items.map((tx) => (
                    <TransactionCard key={tx.id} transaction={tx} />
                  ))}
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
    borderWidth: StyleSheet.hairlineWidth,
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
    ...typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  merchantsRow: { gap: 10, paddingVertical: 4 },
  merchantTile: {
    width: 92,
    alignItems: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  merchantName: { ...typography.caption, fontWeight: "500", marginTop: 2 },
  merchantAmount: { ...typography.micro },
  txList: { gap: 18 },
  dayGroup: { gap: 8 },
  dayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  dayLabel: {
    ...typography.micro,
    textTransform: "uppercase",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  dayTotal: { ...typography.caption, fontVariant: ["tabular-nums"] },
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
