import { Stack } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TransactionCard } from "@/components/feed/transaction-card";
import { SectionHeader } from "@/components/ui/section-header";
import { merchants } from "@/data/merchants";
import type { Category } from "@/data/types";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { haptics } from "@/services/haptics";
import { categoryColors, colors, spacing, typography, useTheme } from "@/theme";

const RECENT = ["Swiggy", "Uber", "Subscriptions", "Food", "March"];
const CATEGORIES: Category[] = ["Food", "Shopping", "Travel", "Bills", "Entertainment"];

export default function SearchIndex() {
  const t = useTheme();
  const [query, setQuery] = useState("");
  const { data } = useTransactions();
  const transactions = useMemo(() => selectTransactions(data), [data]);

  const onChangeText = useCallback(
    (e: { nativeEvent: { text: string } }) => {
      setQuery(e.nativeEvent.text);
    },
    []
  );

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return transactions.filter((tr) => {
      const m = merchants[tr.merchantId];
      return (
        m?.name.toLowerCase().includes(q) ||
        tr.merchantName?.toLowerCase().includes(q) ||
        tr.category.toLowerCase().includes(q) ||
        tr.gmailSnippet.toLowerCase().includes(q) ||
        tr.paymentSource.toLowerCase().includes(q)
      );
    });
  }, [query, transactions]);

  const showResults = query.trim().length > 0;

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        paddingBottom: 60,
      }}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Stack.Screen
        options={{
          title: "Search",
          headerSearchBarOptions: {
            placeholder: "Search transactions",
            onChangeText,
            hideWhenScrolling: false,
            obscureBackground: false,
          },
        }}
      />

      {!showResults ? (
        <>
          <SectionHeader title="Recent" />
          <View style={styles.chipsWrap}>
            {RECENT.map((r) => (
              <Pressable
                key={r}
                onPress={() => {
                  haptics.tap();
                  setQuery(r);
                }}
                style={[
                  styles.chip,
                  { backgroundColor: t.tileFill, borderColor: t.tileBorder },
                ]}
              >
                <Text style={[styles.chipText, { color: t.text }]}>{r}</Text>
              </Pressable>
            ))}
          </View>

          <SectionHeader title="Browse" />
          <View style={styles.chipsWrap}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  haptics.tap();
                  setQuery(cat);
                }}
                style={[
                  styles.chip,
                  { backgroundColor: t.tileFill, borderColor: t.tileBorder },
                ]}
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
          <Pressable
            onPress={() => {
              haptics.dismiss();
              setQuery("");
            }}
            hitSlop={10}
            style={styles.clearWrap}
          >
            <Text style={[styles.clearLink, { color: colors.blue }]}>Clear search</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.resultsWrap}>
          <View style={styles.resultsHeader}>
            <Text style={[styles.count, { color: t.muted }]}>
              {results.length} {results.length === 1 ? "result" : "results"} for "{query}"
            </Text>
            <Pressable
              onPress={() => {
                haptics.dismiss();
                setQuery("");
              }}
              hitSlop={10}
            >
              <Text style={[styles.clearLink, { color: colors.blue }]}>Clear</Text>
            </Pressable>
          </View>
          <View style={styles.resultsList}>
            {results.map((tr) => (
              <TransactionCard key={tr.id} transaction={tr} />
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: spacing.hPad,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipDot: { width: 7, height: 7, borderRadius: 3.5 },
  chipText: { ...typography.caption, fontSize: 14, fontWeight: "500" },
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
  resultsWrap: { paddingHorizontal: spacing.hPad, paddingTop: 8, gap: 10 },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  resultsList: { gap: 10 },
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
    fontWeight: "600",
  },
  clearWrap: { marginTop: 8 },
});
