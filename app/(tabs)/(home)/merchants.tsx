import { router, Stack } from "expo-router";
import { useMemo } from "react";
import {
  PlatformColor,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import { merchants } from "@/data/merchants";
import type { Category } from "@/data/types";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { useTabScreenBottomPadding } from "@/lib/tab-safe-area";
import { haptics } from "@/services/haptics";
import { categoryColors, spacing, typography, useTheme } from "@/theme";
import { displayName } from "@/utils/merchant-display";
import { formatCurrency } from "@/utils/format";

type Row = {
  id: string;
  name: string;
  category?: Category;
  count: number;
  total: number;
};

export default function MerchantsList() {
  const t = useTheme();
  const bottomPad = useTabScreenBottomPadding();
  const { data } = useTransactions();
  const txs = useMemo(() => selectTransactions(data), [data]);

  const rows = useMemo<Row[]>(() => {
    const map = new Map<string, Row>();
    for (const tx of txs) {
      const id = tx.merchantId;
      const existing = map.get(id);
      if (existing) {
        existing.count += 1;
        existing.total += tx.amount;
      } else {
        map.set(id, {
          id,
          name: displayName(id, tx.merchantName),
          category: merchants[id]?.category ?? tx.category,
          count: 1,
          total: tx.amount,
        });
      }
    }
    return Array.from(map.values())
      .filter((r) => r.name.length >= 2)
      .sort((a, b) => b.total - a.total);
  }, [txs]);

  const total = rows.reduce((acc, r) => acc + r.total, 0);

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
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
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.hero,
            { backgroundColor: t.tileFill, borderColor: t.tileBorder },
          ]}
        >
          <View style={styles.heroCol}>
            <Text style={[styles.heroLabel, { color: t.muted }]}>Total spent</Text>
            <Text style={[styles.heroValue, { color: t.text }]}>
              {formatCurrency(total)}
            </Text>
          </View>
          <View style={[styles.heroDivider, { backgroundColor: t.tileBorder }]} />
          <View style={styles.heroCol}>
            <Text style={[styles.heroLabel, { color: t.muted }]}>Across</Text>
            <Text style={[styles.heroValue, { color: t.text }]}>
              {rows.length} {rows.length === 1 ? "merchant" : "merchants"}
            </Text>
          </View>
        </View>

        {rows.length === 0 ? (
          <Text style={[styles.empty, { color: t.muted }]}>No merchants yet.</Text>
        ) : (
          <View
            style={[
              styles.listCard,
              { backgroundColor: t.tileFill, borderColor: t.tileBorder },
            ]}
          >
            {rows.map((row, idx) => {
              const cat = row.category ? categoryColors[row.category] : undefined;
              const pctOfTotal = total > 0 ? (row.total / total) * 100 : 0;
              return (
                <View key={row.id}>
                  <Pressable
                    onPress={() => {
                      haptics.tap();
                      router.push({
                        pathname: "/merchant/[id]",
                        params: { id: row.id },
                      });
                    }}
                    android_ripple={{ color: t.tileHighlight }}
                    style={({ pressed }) =>
                      pressed ? { backgroundColor: t.tileHighlight } : null
                    }
                  >
                    <View style={styles.row}>
                      <MerchantLogo merchantId={row.id} size={36} name={row.name} />
                      <View style={styles.middle}>
                        <Text
                          style={[styles.name, { color: t.text }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {row.name}
                        </Text>
                        <View style={styles.metaRow}>
                          {cat ? (
                            <View
                              style={[styles.categoryDot, { backgroundColor: cat }]}
                            />
                          ) : null}
                          <Text
                            style={[styles.meta, { color: t.muted }]}
                            numberOfLines={1}
                          >
                            {row.category ? `${row.category} · ` : ""}
                            {row.count} {row.count === 1 ? "txn" : "txns"}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.right}>
                        <Text
                          style={[styles.amount, { color: t.text }]}
                          numberOfLines={1}
                        >
                          {formatCurrency(row.total)}
                        </Text>
                        <Text style={[styles.percent, { color: t.muted }]}>
                          {pctOfTotal < 1 ? "<1%" : `${Math.round(pctOfTotal)}%`}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                  {idx < rows.length - 1 ? (
                    <View
                      style={[
                        styles.separator,
                        { backgroundColor: t.tileBorder },
                      ]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.hPad, paddingTop: 8 },
  title: { ...typography.h1, fontSize: 32, letterSpacing: -0.8 },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroCol: { flex: 1, gap: 4 },
  heroDivider: { width: StyleSheet.hairlineWidth, alignSelf: "stretch" },
  heroLabel: {
    ...typography.micro,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },
  heroValue: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"],
  },
  listCard: {
    marginTop: 20,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  middle: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  meta: { ...typography.caption, fontSize: 12, flexShrink: 1 },
  right: { alignItems: "flex-end", gap: 1, minWidth: 72 },
  amount: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  percent: {
    ...typography.micro,
    fontSize: 11,
    fontWeight: "500",
    fontVariant: ["tabular-nums"],
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 62 },
  empty: { ...typography.body, marginTop: 32, textAlign: "center" },
});
