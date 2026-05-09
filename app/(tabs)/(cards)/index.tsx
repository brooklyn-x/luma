import { Link, Stack } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { CardTile } from "@/components/cards/card-tile";
import { deriveCards } from "@/data/cards";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { haptics } from "@/services/haptics";
import { spacing, typography, useTheme } from "@/theme";

export default function CardsIndex() {
  const t = useTheme();
  const { data, isLoading, isError, refetch } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);
  const cards = useMemo(() => deriveCards(transactions), [transactions]);

  const spendByCard = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const totals = new Map<string, number>();
    for (const card of cards) totals.set(card.id, 0);
    for (const tx of transactions) {
      // Only count actual purchases — skip refunds (credits) and card-bill payments
      if (tx.direction !== "debit" || tx.kind !== "purchase") continue;
      // Only count current calendar month, matching the "this month" label
      const d = new Date(tx.date);
      if (d.getFullYear() !== curYear || d.getMonth() !== curMonth) continue;
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
        <Text
          style={[styles.centerText, { color: t.muted }]}
          onPress={() => refetch()}
        >
          Tap to retry
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.scroll, { paddingBottom: 60 }]}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "Cards" }} />

      {cards.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: t.text }]}>No cards detected</Text>
          <Text style={[styles.emptyBody, { color: t.muted }]}>
            Sync your inbox first — Luma will surface every card or UPI source it
            sees in your receipts.
          </Text>
          <Text
            style={[styles.emptyAction, { color: t.text }]}
            onPress={() => refetch()}
          >
            Sync now
          </Text>
        </View>
      ) : (
        <View style={styles.stack}>
          {cards.map((card) => (
            <Link
              key={card.id}
              href={{ pathname: "/(tabs)/(cards)/[id]", params: { id: card.id } }}
              asChild
            >
              <Pressable onPressIn={() => haptics.tap()}>
                <CardTile card={card} thisMonthSpend={spendByCard.get(card.id) ?? 0} />
              </Pressable>
            </Link>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: spacing.hPad, paddingTop: 8 },
  title: {
    ...typography.h1,
    fontSize: 32,
    letterSpacing: -0.8,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 6,
    maxWidth: "85%",
  },
  stack: { marginTop: 24, gap: 16 },
  empty: {
    marginTop: 48,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },
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
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  centerText: { ...typography.body, textAlign: "center" },
});
