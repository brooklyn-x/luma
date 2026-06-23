import { LinearGradient } from "expo-linear-gradient";
import { Link, Stack } from "expo-router";
import { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CardTile } from "@/components/cards/card-tile";
import { SF } from "@/components/ui/sf";
import { deriveCards } from "@/data/cards";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { useTabScreenBottomPadding, useTabScreenTopPadding } from "@/lib/tab-safe-area";
import { haptics } from "@/services/haptics";
import { spacing, typography, useTheme } from "@/theme";
import { cycleOf, sameCycle } from "@/utils/cycle";
import { formatCurrency } from "@/utils/format";

export default function CardsIndex() {
  const t = useTheme();
  const topPad = useTabScreenTopPadding();
  const bottomPad = useTabScreenBottomPadding();
  const { data, isLoading, isError, isFetching, refetch } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);
  const cards = useMemo(() => deriveCards(transactions), [transactions]);

  const spendByCard = useMemo(() => {
    const current = cycleOf(new Date());
    const totals = new Map<string, number>();
    for (const card of cards) totals.set(card.id, 0);
    for (const tx of transactions) {
      if (tx.direction !== "debit" || tx.kind !== "purchase") continue;
      if (!sameCycle(cycleOf(tx.date), current)) continue;
      const card = cards.find((c) => c.paymentSource === tx.paymentSource);
      if (!card) continue;
      totals.set(card.id, (totals.get(card.id) ?? 0) + tx.amount);
    }
    return totals;
  }, [transactions, cards]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={[styles.centerText, { color: t.muted }]}>Reading your inbox…</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={[styles.centerText, { color: t.text }]}>Sync failed</Text>
        <Text style={[styles.centerText, { color: t.muted }]} onPress={() => refetch()}>
          Tap to retry
        </Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[styles.center, { paddingTop: topPad }]}>
        <Stack.Screen options={{ title: "Cards" }} />
        <Text style={[styles.emptyTitle, { color: t.text }]}>No cards detected</Text>
        <Text style={[styles.emptyBody, { color: t.muted }]}>
          Sync your inbox first — Luma will surface every card or UPI source it
          sees in your receipts.
        </Text>
        <Text style={[styles.emptyAction, { color: t.text }]} onPress={() => refetch()}>
          Sync now
        </Text>
      </View>
    );
  }

  const featured = cards[0]!;
  const featuredSpend = spendByCard.get(featured.id) ?? 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "Cards" }} />

      {/* Screen header */}
      <View style={styles.headerRow}>
        <Text style={[styles.screenTitle, { color: t.text }]}>Cards</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sync inbox to find new cards"
          disabled={isFetching}
          onPress={() => {
            haptics.tap();
            refetch();
          }}
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: t.text, opacity: pressed || isFetching ? 0.7 : 1 },
          ]}
        >
          {isFetching ? (
            <ActivityIndicator size="small" color={t.background as string} />
          ) : (
            <SF name="plus" size={18} tint={t.background} />
          )}
        </Pressable>
      </View>

      {/* Featured card */}
      <View style={styles.featuredWrap}>
        <Link href={{ pathname: "/(tabs)/(cards)/[id]", params: { id: featured.id } }} asChild>
          <Pressable onPressIn={() => haptics.tap()}>
            <CardTile card={featured} thisMonthSpend={featuredSpend} />
          </Pressable>
        </Link>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}>
          <Text style={[styles.statLabel, { color: t.muted }]}>Spent this month</Text>
          <Text style={[styles.statValue, { color: t.text }]}>
            {formatCurrency(featuredSpend)}
          </Text>
        </View>
      </View>

      {/* All cards list */}
      <Text style={[styles.sectionTitle, { color: t.text }]}>All cards</Text>
      <View style={[styles.listCard, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}>
        {cards.map((card, idx) => {
          const spend = spendByCard.get(card.id) ?? 0;
          const isLast = idx === cards.length - 1;
          return (
            <Link
              key={card.id}
              href={{ pathname: "/(tabs)/(cards)/[id]", params: { id: card.id } }}
              asChild
            >
              <Pressable onPressIn={() => haptics.tap()}>
                <View style={styles.cardRow}>
                  <LinearGradient
                    colors={[card.gradientFrom, card.gradientTo]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardThumb}
                  />
                  <View style={styles.cardRowMid}>
                    <Text style={[styles.cardRowName, { color: t.text }]}>
                      {card.issuer} {card.productName}
                    </Text>
                    <Text style={[styles.cardRowLast4, { color: t.muted }]}>
                      {card.last4 ? `···· ${card.last4}` : "UPI"}
                    </Text>
                  </View>
                  <View style={styles.cardRowRight}>
                    <Text style={[styles.cardRowSpend, { color: t.text }]}>
                      {formatCurrency(spend)}
                    </Text>
                    <Text style={[styles.cardRowSpendLabel, { color: t.muted }]}>
                      this month
                    </Text>
                  </View>
                </View>
                {!isLast ? (
                  <View style={[styles.divider, { backgroundColor: t.tileBorder }]} />
                ) : null}
              </Pressable>
            </Link>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.hPad,
    paddingTop: 12,
    paddingBottom: 20,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  featuredWrap: {
    paddingHorizontal: spacing.hPad,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: spacing.hPad,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 5,
  },
  statLabel: { ...typography.caption, fontWeight: "600" },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: -0.2,
    paddingHorizontal: spacing.hPad,
    marginTop: 24,
    marginBottom: 12,
  },
  listCard: {
    marginHorizontal: spacing.hPad,
    borderRadius: 24,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
  },
  cardThumb: {
    width: 46,
    height: 32,
    borderRadius: 9,
    borderCurve: "continuous",
  },
  cardRowMid: { flex: 1 },
  cardRowName: { fontSize: 15, fontWeight: "700" },
  cardRowLast4: { ...typography.caption, marginTop: 1 },
  cardRowRight: { alignItems: "flex-end" },
  cardRowSpend: {
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  cardRowSpendLabel: { ...typography.micro, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth },
  empty: { marginTop: 48, paddingHorizontal: 12, alignItems: "center", gap: 8 },
  emptyTitle: { ...typography.h3 },
  emptyBody: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    maxWidth: 320,
  },
  emptyAction: {
    ...typography.body,
    fontWeight: "600",
    marginTop: 8,
    textDecorationLine: "underline",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, padding: 32 },
  centerText: { ...typography.body, textAlign: "center" },
});
