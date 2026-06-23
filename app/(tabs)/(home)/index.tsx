import { router, Stack } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CardTile } from "@/components/cards/card-tile";
import { TransactionCard } from "@/components/feed/transaction-card";
import { SF } from "@/components/ui/sf";
import { SectionHeader } from "@/components/ui/section-header";
import { deriveCards } from "@/data/cards";
import { useNotifications } from "@/hooks/use-notifications";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { useTabScreenBottomPadding, useTabScreenTopPadding } from "@/lib/tab-safe-area";
import { haptics } from "@/services/haptics";
import { useAuthStore } from "@/stores/auth-store";
import { spacing, typography, useIsDark, useTheme } from "@/theme";
import { cycleOf, sameCycle } from "@/utils/cycle";
import { formatCurrency } from "@/utils/format";

const CARD_SHADOW_LIGHT = "0px 10px 30px rgba(0,0,0,0.06)";
const CARD_SHADOW_DARK = "0px 14px 34px rgba(0,0,0,0.5)";

// Carousel card width ≈ 80% of screen so the next card peeks; height follows aspectRatio 1.6.
const CARD_WIDTH = Math.round(Dimensions.get("window").width * 0.8);

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
  const isDark = useIsDark();
  const cardShadow = isDark ? CARD_SHADOW_DARK : CARD_SHADOW_LIGHT;
  const topPad = useTabScreenTopPadding();
  const bottomPad = useTabScreenBottomPadding();
  const gmailEmail = useAuthStore((s) => s.gmailEmail);
  const name = nameFromEmail(gmailEmail);
  const greeting = timeOfDayGreeting();
  const { data, isLoading, isError, refetch } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);
  const { unreadCount } = useNotifications();

  const { total, received, cards, spendByCard, recent, monthCount } = useMemo(() => {
    const current = cycleOf(new Date());
    const inThisMonth = (iso: string) => sameCycle(cycleOf(iso), current);
    const monthTx = transactions.filter((tr) => inThisMonth(tr.date));
    const purchases = monthTx.filter(
      (tr) => tr.direction === "debit" && tr.kind === "purchase"
    );
    const credits = monthTx.filter((tr) => tr.direction === "credit");
    const total = purchases.reduce((acc, tr) => acc + tr.amount, 0);
    const received = credits.reduce((acc, tr) => acc + tr.amount, 0);

    const allCards = deriveCards(transactions);
    const spendByCard = new Map<string, number>();
    purchases.forEach((tr) => {
      const card = allCards.find((c) => c.paymentSource === tr.paymentSource);
      if (card) spendByCard.set(card.id, (spendByCard.get(card.id) ?? 0) + tr.amount);
    });

    return {
      total,
      received,
      cards: allCards,
      spendByCard,
      recent: transactions.slice(0, 5),
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
        <Text style={[styles.centerText, { color: t.muted }]} onPress={() => refetch()}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (!transactions.length) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: "Luma" }} />
        <Text style={[styles.centerText, { color: t.text }]}>No receipts found yet</Text>
        <Text style={[styles.centerText, { color: t.muted }]} onPress={() => refetch()}>
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

      {/* Greeting */}
      <View style={styles.greetingWrap}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.greetingName, { color: t.text }]}>
            {greeting}, {name}
          </Text>
          <Text style={[styles.greetingSubtitle, { color: t.muted }]}>
            {monthCount} receipts synced from Gmail
          </Text>
        </View>
        <Pressable
          style={[styles.bellBtn, { backgroundColor: t.card, boxShadow: cardShadow }]}
          onPress={() => {
            haptics.tap();
            router.push("/(tabs)/(home)/notifications");
          }}
        >
          <SF name="bell" size={20} tint={t.text} />
          {unreadCount > 0 ? (
            <View style={[styles.bellDot, { backgroundColor: t.lime, borderColor: t.card }]} />
          ) : null}
        </Pressable>
      </View>

      {/* Hero spend card */}
      <View style={styles.heroWrap}>
        <View style={[styles.heroCard, { backgroundColor: t.card, boxShadow: cardShadow }]}>
          <View style={styles.heroLabelRow}>
            <Text style={[styles.heroLabel, { color: t.muted }]}>Spent this month</Text>
          </View>
          <View style={styles.heroAmountRow}>
            <Text style={[styles.heroAmount, { color: t.text }]}>{formatCurrency(total)}</Text>
            <Text style={[styles.heroAmountDecimal, { color: t.muted2 }]}>.00</Text>
          </View>
          {received > 0 ? (
            <View style={styles.heroReceivedRow}>
              <View style={[styles.receivedPill, { backgroundColor: t.limeSoft }]}>
                <View style={[styles.receivedDot, { backgroundColor: t.limeMid }]} />
                <Text style={[styles.receivedText, { color: t.limeSoftInk }]}>
                  +{formatCurrency(received)} received
                </Text>
              </View>
              <Text style={[styles.heroMeta, { color: t.muted }]}>this month</Text>
            </View>
          ) : null}
          <Pressable
            style={[styles.seeAllBtn, { backgroundColor: t.text }]}
            onPress={() => router.push("/(tabs)/(timeline)")}
          >
            <Text style={[styles.seeAllText, { color: t.background }]}>
              See all transactions
            </Text>
            <SF name="arrow.right" size={16} tint={isDark ? t.limeMid : t.lime} />
          </Pressable>
        </View>
      </View>

      {/* Cards horizontal scroll */}
      {cards.length > 0 ? (
        <>
          <SectionHeader
            title="Your cards"
            actionLabel="+ New"
            onAction={() => router.push("/(tabs)/(cards)")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
          >
            {cards.map((card) => (
              <Pressable
                key={card.id}
                style={styles.cardItem}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/(cards)/[id]",
                    params: { id: card.id },
                  })
                }
              >
                <CardTile card={card} thisMonthSpend={spendByCard.get(card.id) ?? 0} />
              </Pressable>
            ))}
          </ScrollView>
        </>
      ) : null}

      {/* Recent transactions — unified card with dividers */}
      <View style={styles.recentWrap}>
        <View style={[styles.recentCard, { backgroundColor: t.card, boxShadow: cardShadow }]}>
          <View style={styles.recentHeader}>
            <Text style={[styles.recentTitle, { color: t.text }]}>Transactions</Text>
            <Pressable hitSlop={12} onPress={() => router.push("/(tabs)/(timeline)")}>
              <Text style={[styles.recentSeeAll, { color: t.limeMid }]}>See all</Text>
            </Pressable>
          </View>
          {recent.map((tr, idx) => (
            <View key={tr.id}>
              <TransactionCard transaction={tr} embedded />
              {idx < recent.length - 1 ? (
                <View style={[styles.recentDivider, { backgroundColor: t.divider }]} />
              ) : null}
            </View>
          ))}
        </View>
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
  greetingName: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    ...typography.caption,
    marginTop: 3,
  },
  bellBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellDot: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
  },
  heroWrap: { paddingHorizontal: spacing.hPad },
  heroCard: {
    padding: 22,
    borderRadius: 28,
    borderCurve: "continuous",
    gap: 0,
  },
  heroLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroLabel: { ...typography.caption, fontSize: 14, fontWeight: "600" },
  heroAmountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
    marginTop: 8,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.5,
    fontVariant: ["tabular-nums"],
  },
  heroAmountDecimal: {
    fontSize: 20,
    fontWeight: "700",
  },
  heroReceivedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  receivedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderCurve: "continuous",
  },
  receivedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  receivedText: { fontSize: 12.5, fontWeight: "700", fontVariant: ["tabular-nums"] },
  heroMeta: { ...typography.caption, fontWeight: "600" },
  seeAllBtn: {
    marginTop: 18,
    height: 52,
    borderRadius: 18,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  seeAllText: { fontSize: 15.5, fontWeight: "700" },
  cardsRow: {
    paddingHorizontal: spacing.hPad,
    gap: 14,
    paddingBottom: 4,
    paddingTop: 2,
  },
  cardItem: { width: CARD_WIDTH },
  recentWrap: { paddingHorizontal: spacing.hPad, marginTop: 26 },
  recentCard: {
    borderRadius: 28,
    borderCurve: "continuous",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 2,
  },
  recentTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  recentSeeAll: { fontSize: 13.5, fontWeight: "700" },
  recentDivider: { height: StyleSheet.hairlineWidth },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  centerText: { ...typography.body, textAlign: "center" },
});
