import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { TransactionCard } from "@/components/feed/transaction-card";
import { SF } from "@/components/ui/sf";
import { merchants } from "@/data/merchants";
import type { Category } from "@/data/types";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { useTabScreenBottomPadding, useTabScreenTopPadding } from "@/lib/tab-safe-area";
import { haptics } from "@/services/haptics";
import {
  categoryColors,
  colors,
  spacing,
  typography,
  useCardShadow,
  useChipShadow,
  useTheme,
} from "@/theme";

const RECENT = ["Swiggy", "Uber", "Subscriptions", "Food", "March"];
const CATEGORIES: Category[] = ["Food", "Shopping", "Travel", "Bills", "Entertainment"];

type TypeFilter = "credit" | "card-payment" | "recurring";

const TYPE_FILTERS: { key: TypeFilter; label: string; tint: string }[] = [
  { key: "credit", label: "Credits / Refunds", tint: colors.green },
  { key: "card-payment", label: "Bill payments", tint: colors.purple },
  { key: "recurring", label: "Recurring", tint: colors.blue },
];

export default function SearchIndex() {
  const t = useTheme();
  const cardShadow = useCardShadow();
  const chipShadow = useChipShadow();
  const topPad = useTabScreenTopPadding();
  const bottomPad = useTabScreenBottomPadding();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter | null>(null);
  const { data } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);

  const filterLabel = typeFilter
    ? TYPE_FILTERS.find((f) => f.key === typeFilter)?.label
    : null;

  const results = useMemo(() => {
    if (!query.trim() && !typeFilter) return [];
    const q = query.trim().toLowerCase();
    return transactions.filter((tr) => {
      // Type filter (structured) — applied first
      if (typeFilter === "credit" && tr.direction !== "credit") return false;
      if (typeFilter === "card-payment" && tr.kind !== "card-payment") return false;
      if (typeFilter === "recurring" && !tr.recurring) return false;

      // Free-text query — applied on top of type filter
      if (!q) return true;
      const m = merchants[tr.merchantId];
      return (
        m?.name.toLowerCase().includes(q) ||
        tr.merchantName?.toLowerCase().includes(q) ||
        tr.category.toLowerCase().includes(q) ||
        tr.gmailSnippet.toLowerCase().includes(q) ||
        tr.paymentSource.toLowerCase().includes(q)
      );
    });
  }, [query, transactions, typeFilter]);

  const showResults = query.trim().length > 0 || !!typeFilter;

  const clear = () => {
    haptics.dismiss();
    setQuery("");
    setTypeFilter(null);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingTop: topPad,
        paddingBottom: bottomPad,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Stack.Screen options={{ title: "Search" }} />

      {/* Title */}
      <Text style={[styles.screenTitle, { color: t.text }]}>Search</Text>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBar, { backgroundColor: t.card, boxShadow: cardShadow }]}>
          <SF name="magnifyingglass" size={19} tint={t.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Merchant, amount or category…"
            placeholderTextColor={t.muted2}
            style={[styles.searchInput, { color: t.text }]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {!showResults ? (
        <>
          <Text style={[styles.sectionTitle, { color: t.text }]}>Recent</Text>
          <View style={styles.chipsWrap}>
            {RECENT.map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  haptics.tap();
                  setQuery(r);
                }}
                style={[styles.chip, { backgroundColor: t.card, boxShadow: chipShadow }]}
              >
                <Text style={[styles.chipText, { color: t.text }]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: t.text }]}>Type</Text>
          <View style={styles.chipsWrap}>
            {TYPE_FILTERS.map((f) => (
              <Pressable
                key={f.key}
                onPress={() => {
                  haptics.tap();
                  setTypeFilter(f.key);
                }}
                style={[styles.chip, { backgroundColor: t.card, boxShadow: chipShadow }]}
              >
                <View style={[styles.chipDot, { backgroundColor: f.tint }]} />
                <Text style={[styles.chipText, { color: t.text }]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: t.text }]}>Browse</Text>
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  haptics.tap();
                  setQuery(cat);
                }}
                style={[styles.chip, { backgroundColor: t.card, boxShadow: chipShadow }]}
              >
                <View style={[styles.chipDot, { backgroundColor: categoryColors[cat] }]} />
                <Text style={[styles.chipText, { color: t.text }]}>{cat}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.hint, { color: t.muted }]}>
            Search by merchant, category, or card.
          </Text>
        </>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: t.text }]}>No matches</Text>
          <Text style={[styles.emptyBody, { color: t.muted }]}>
            Try a merchant, category, or card name.
          </Text>
          <Pressable onPress={clear} hitSlop={10} style={styles.clearWrap}>
            <Text style={[styles.clearLink, { color: t.limeMid }]}>Clear search</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.resultsWrap}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.count, { color: t.muted }]}>
              {results.length} {results.length === 1 ? "result" : "results"}
              {filterLabel ? ` · ${filterLabel}` : ""}
              {query ? ` · "${query}"` : ""}
            </Text>
            <Pressable onPress={clear} hitSlop={10}>
              <Text style={[styles.clearLink, { color: t.limeMid }]}>Clear</Text>
            </Pressable>
          </View>
          <View style={[styles.resultsCard, { backgroundColor: t.card, boxShadow: cardShadow }]}>
            {results.map((tr, idx) => (
              <View key={tr.id}>
                <TransactionCard transaction={tr} embedded />
                {idx < results.length - 1 ? (
                  <View style={[styles.divider, { backgroundColor: t.divider }]} />
                ) : null}
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    paddingHorizontal: spacing.hPad,
    paddingTop: 10,
  },
  searchWrap: {
    paddingHorizontal: spacing.hPad,
    marginTop: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    borderRadius: 18,
    borderCurve: "continuous",
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    padding: 0,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: -0.1,
    paddingHorizontal: spacing.hPad,
    marginTop: 24,
    marginBottom: 12,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    paddingHorizontal: spacing.hPad,
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
  chipDot: { width: 7, height: 7, borderRadius: 3.5 },
  chipText: { fontSize: 13, fontWeight: "700" },
  hint: {
    ...typography.caption,
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: spacing.hPad,
    marginTop: 28,
  },
  empty: {
    marginTop: 60,
    paddingHorizontal: 24,
    gap: 6,
    alignItems: "center",
  },
  emptyTitle: { ...typography.h3 },
  emptyBody: { ...typography.caption, textAlign: "center", lineHeight: 20 },
  resultsWrap: { paddingHorizontal: spacing.hPad, paddingTop: 20, gap: 12 },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  resultsCard: {
    borderRadius: 24,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  divider: { height: StyleSheet.hairlineWidth },
  count: {
    ...typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    fontWeight: "600",
    flex: 1,
  },
  clearLink: {
    ...typography.caption,
    fontSize: 14,
    fontWeight: "700",
  },
  clearWrap: { marginTop: 8 },
});
