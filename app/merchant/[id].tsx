import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { TransactionCard } from "@/components/feed/transaction-card";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import { merchants } from "@/data/merchants";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { categoryColors, spacing, typography, useTheme } from "@/theme";
import { formatCurrency } from "@/utils/format";
import { deterministicColor } from "@/utils/merchant-display";

export default function MerchantDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useTransactions();
  const txs = useMemo(() => selectTransactions(data), [data]);

  const list = useMemo(() => {
    if (!id) return [];
    return txs
      .filter((tx) => tx.merchantId === id)
      .sort((a, b) => +new Date(b.date) - +new Date(a.date));
  }, [txs, id]);

  const total = useMemo(() => list.reduce((acc, tx) => acc + tx.amount, 0), [list]);
  const merchant = id ? merchants[id] : undefined;
  const displayName = merchant?.name ?? list[0]?.merchantName ?? id ?? "Merchant";
  const category = merchant?.category ?? list[0]?.category;
  const cat = category ? categoryColors[category] ?? t.muted : t.muted;
  const accent = merchant?.color ?? (id ? deterministicColor(id) : t.elevated);

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={styles.merchantBlob} pointerEvents="none">
        <LinearGradient
          colors={[`${accent}66`, "rgba(11,11,13,0)"]}
          start={{ x: 0.5, y: 0.1 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <View style={styles.heroLogoWrap}>
          {id ? <MerchantLogo merchantId={id} size={88} /> : null}
        </View>
        <Text style={[styles.name, { color: t.text }]}>{displayName}</Text>
        {category ? (
          <Text style={[styles.category, { color: cat }]}>{category}</Text>
        ) : null}
        <Text style={[styles.total, { color: t.text }]}>
          {formatCurrency(total)}
        </Text>
        <Text style={[styles.subtotal, { color: t.muted }]}>
          {list.length} {list.length === 1 ? "transaction" : "transactions"}
        </Text>
      </View>

      {list.length === 0 ? (
        <Text style={[styles.empty, { color: t.muted }]}>
          No transactions for this merchant yet.
        </Text>
      ) : (
        <View style={styles.txList}>
          {list.map((tx) => (
            <TransactionCard key={tx.id} transaction={tx} />
          ))}
        </View>
      )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  merchantBlob: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 360,
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: spacing.hPad,
    paddingTop: 28,
    paddingBottom: 60,
  },
  header: {
    paddingBottom: 22,
    alignItems: "center",
    gap: 6,
  },
  heroLogoWrap: { marginBottom: 12 },
  name: {
    ...typography.h3,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  category: {
    ...typography.caption,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  total: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
    fontVariant: ["tabular-nums"],
    marginTop: 6,
  },
  subtotal: { ...typography.caption, fontSize: 13 },
  txList: { gap: 10 },
  empty: {
    ...typography.body,
    textAlign: "center",
    marginTop: 40,
  },
});
