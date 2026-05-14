import { router, Stack } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { BillsDueSection } from "@/components/bills/bills-due-section";
import { TransactionCard } from "@/components/feed/transaction-card";
import { CategoryDonutChart, type DonutSlice } from "@/components/insights/category-donut-chart";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import { SectionHeader } from "@/components/ui/section-header";
import { merchants } from "@/data/merchants";
import type { Category } from "@/data/types";
import {
  selectActiveBills,
  selectTransactions,
  useTransactions,
} from "@/hooks/use-transactions";
import { useTabScreenBottomPadding, useTabScreenTopPadding } from "@/lib/tab-safe-area";
import { useAuthStore } from "@/stores/auth-store";
import { categoryColors, spacing, typography, useTheme } from "@/theme";
import { formatCurrency, formatTime } from "@/utils/format";

function timeOfDayGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function nameFromEmail(email: string | null): string {
  if (!email) return "there";
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[.+_-]/)[0] ?? local;
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

export default function HomeIndex() {
  const t = useTheme();
  const topPad = useTabScreenTopPadding();
  const bottomPad = useTabScreenBottomPadding();
  const gmailEmail = useAuthStore((s) => s.gmailEmail);
  const name = nameFromEmail(gmailEmail);
  const greeting = timeOfDayGreeting();
  const { data, isLoading, isError, refetch } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);
  const bills = useMemo(() => selectActiveBills(data), [data]);

  const { total, received, slices, topMerchants, recent, monthCount } = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const inThisMonth = (iso: string) => {
      const d = new Date(iso);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    };

    const monthTx = transactions.filter((tr) => inThisMonth(tr.date));
    const purchases = monthTx.filter(
      (tr) => tr.direction === "debit" && tr.kind === "purchase"
    );
    const credits = monthTx.filter((tr) => tr.direction === "credit");
    const total = purchases.reduce((acc, tr) => acc + tr.amount, 0);
    const received = credits.reduce((acc, tr) => acc + tr.amount, 0);
    const byCategory = new Map<Category, number>();
    purchases.forEach((tr) => {
      byCategory.set(tr.category, (byCategory.get(tr.category) ?? 0) + tr.amount);
    });
    const slices: DonutSlice[] = Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({
        label,
        value,
        color: categoryColors[label] ?? "#999",
      }));
    const merchantMap = new Map<string, number>();
    purchases.forEach((tr) => {
      merchantMap.set(tr.merchantId, (merchantMap.get(tr.merchantId) ?? 0) + tr.amount);
    });
    const topMerchants = Array.from(merchantMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
    const recent = transactions.slice(0, 5);
    return {
      total,
      received,
      slices,
      topMerchants,
      recent,
      monthCount: monthTx.length,
    };
  }, [transactions]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Luma" }} />
        <ActivityIndicator />
        <Text style={[styles.centerText, { color: t.muted }]}>Reading your inbox…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Luma" }} />
        <Text style={[styles.centerText, { color: t.text }]}>Sync failed</Text>
        <Text
          style={[styles.centerText, { color: t.muted }]}
          onPress={() => refetch()}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!transactions.length) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Luma" }} />
        <Text style={[styles.centerText, { color: t.text }]}>
          No receipts found yet
        </Text>
        <Text
          style={[styles.centerText, { color: t.muted }]}
          onPress={() => refetch()}
        >
          Tap to sync again
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "Luma" }} />

      <View style={styles.greetingWrap}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greetingLabel, { color: t.muted }]}>{greeting},</Text>
          <Text style={[styles.greetingName, { color: t.text }]}>{name}</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}>
          <Text style={[styles.avatarText, { color: t.text }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.heroWrap}>
        <View
          style={[
            styles.heroCard,
            { backgroundColor: t.tileFill, borderColor: t.tileBorder },
          ]}
        >
          <Text style={[styles.heroLabel, { color: t.muted }]}>Spent this month</Text>
          <Text style={[styles.heroAmount, { color: t.text }]}>{formatCurrency(total)}</Text>
          {received > 0 ? (
            <Text style={[styles.heroReceived, { color: t.green }]}>
              +{formatCurrency(received)} received
            </Text>
          ) : null}
          <View style={styles.heroFooter}>
            <Text style={[styles.heroMeta, { color: t.muted }]}>
              {monthCount} transactions
            </Text>
          </View>
        </View>
      </View>

      {bills.length > 0 ? (
        <View style={styles.billsBlock}>
          <BillsDueSection bills={bills} />
        </View>
      ) : null}

      {slices.length > 0 ? (
        <>
          <SectionHeader title="By category" />
          <View style={styles.donutWrap}>
            <CategoryDonutChart data={slices} total={total} size={240} thickness={26} />
          </View>
          <View style={styles.legendWrap}>
            <View
              style={[
                styles.legendCard,
                { backgroundColor: t.tileFill, borderColor: t.tileBorder },
              ]}
            >
              {slices.map((s, idx) => {
                const pct = total > 0 ? (s.value / total) * 100 : 0;
                return (
                  <View key={s.label}>
                    <View style={styles.legendRow}>
                      <View style={[styles.legendDot, { backgroundColor: s.color }]} />
                      <Text style={[styles.legendLabel, { color: t.text }]}>{s.label}</Text>
                      <Text style={[styles.legendPct, { color: t.muted }]}>
                        {pct < 1 ? "<1%" : `${Math.round(pct)}%`}
                      </Text>
                      <Text style={[styles.legendValue, { color: t.text }]}>
                        {formatCurrency(s.value)}
                      </Text>
                    </View>
                    {idx < slices.length - 1 ? (
                      <View
                        style={[styles.legendSeparator, { backgroundColor: t.tileBorder }]}
                      />
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        </>
      ) : null}

      <SectionHeader
        title="Top merchants"
        actionLabel="See all"
        onAction={() => router.push("/(tabs)/(home)/merchants")}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.merchantsRow}
      >
        {topMerchants.map(([id, amount]) => {
          const m = merchants[id];
          return (
            <View
              key={id}
              style={[
                styles.merchantTile,
                { backgroundColor: t.tileFill, borderColor: t.tileBorder },
              ]}
            >
              <MerchantLogo merchantId={id} size={56} />
              <Text style={[styles.merchantName, { color: t.text }]} numberOfLines={1}>
                {m?.name ?? id}
              </Text>
              <Text style={[styles.merchantAmount, { color: t.muted }]}>
                {formatCurrency(amount)}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <SectionHeader
        title="Recent"
        actionLabel="See all"
        onAction={() => router.push("/(tabs)/(timeline)")}
      />
      <View style={styles.recent}>
        {recent.map((tr) => (
          <TransactionCard key={tr.id} transaction={tr} />
        ))}
        {recent[0] ? (
          <Text style={[styles.timeHint, { color: t.muted }]}>
            Last activity {formatTime(recent[0].date)}
          </Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  greetingWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.hPad,
    paddingTop: 8,
    paddingBottom: 18,
    gap: 14,
  },
  greetingLabel: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: "500",
  },
  greetingName: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginTop: 2,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  avatarText: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  heroWrap: { paddingHorizontal: spacing.hPad },
  heroCard: {
    padding: 22,
    borderRadius: 22,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroLabel: { ...typography.caption, textTransform: "uppercase" },
  heroAmount: {
    ...typography.h1,
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  heroReceived: { ...typography.caption, fontSize: 13, fontWeight: "600", marginTop: 4 },
  heroFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  heroMeta: { ...typography.caption },
  billsBlock: { marginTop: 16 },
  donutWrap: { alignItems: "center", paddingVertical: 12 },
  legendWrap: { paddingHorizontal: spacing.hPad, marginTop: 8 },
  legendCard: {
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },
  legendPct: {
    ...typography.micro,
    fontSize: 12,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
    minWidth: 36,
    textAlign: "right",
  },
  legendValue: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
    minWidth: 84,
    textAlign: "right",
  },
  legendSeparator: { height: StyleSheet.hairlineWidth, marginLeft: 38 },
  merchantsRow: { paddingHorizontal: spacing.hPad, gap: 12 },
  merchantTile: {
    width: 96,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  merchantName: { ...typography.caption, fontWeight: "500", marginTop: 4 },
  merchantAmount: { ...typography.micro },
  recent: { paddingHorizontal: spacing.hPad, gap: 10, marginTop: 4 },
  timeHint: { ...typography.micro, textAlign: "center", marginTop: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  centerText: { ...typography.body, textAlign: "center" },
});
