import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Drawer } from "@/components/ui/drawer";
import { SF } from "@/components/ui/sf";
import { merchants } from "@/data/merchants";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { categoryColors, colors, spacing, typography, useTheme } from "@/theme";
import { formatCurrency, formatLongDate } from "@/utils/format";
import { deterministicColor } from "@/utils/merchant-display";

function categoryPillColors(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { bg: `rgba(${r},${g},${b},0.12)`, text: hex };
}

export default function TransactionDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useTransactions();
  const tx = selectTransactions(data).find((tr) => tr.id === id);

  if (!tx) {
    return (
      <Drawer onClose={() => router.back()}>
        <Text style={[styles.notFound, { color: t.muted }]}>Transaction not found</Text>
      </Drawer>
    );
  }

  const merchant = merchants[tx.merchantId];
  const merchantColor = merchant?.color ?? deterministicColor(tx.merchantId);
  const catHex = categoryColors[tx.category] ?? t.muted;
  const catPill = categoryPillColors(catHex);
  const displayName = merchant?.name ?? tx.merchantName ?? "Unknown";
  const initial = displayName.charAt(0).toUpperCase();

  const txType =
    tx.kind === "card-payment"
      ? "Card bill payment"
      : tx.direction === "credit"
        ? "Refund / Credit"
        : "Purchase";

  return (
    <Drawer onClose={() => router.back()}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Merchant avatar */}
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatar,
              {
                backgroundColor: merchantColor,
                shadowColor: merchantColor,
              },
            ]}
          >
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        </View>

        {/* Merchant name */}
        <Text style={[styles.merchantName, { color: t.text }]}>{displayName}</Text>

        {/* Category badge */}
        <View style={styles.badgeRow}>
          <View style={[styles.categoryBadge, { backgroundColor: catPill.bg }]}>
            <Text style={[styles.categoryBadgeText, { color: catPill.text }]}>
              {tx.category}
            </Text>
          </View>
          {tx.recurring ? (
            <View style={[styles.categoryBadge, { backgroundColor: t.tileFill, borderColor: t.tileBorder, borderWidth: StyleSheet.hairlineWidth }]}>
              <Text style={[styles.categoryBadgeText, { color: t.muted }]}>Recurring</Text>
            </View>
          ) : null}
        </View>

        {/* Amount */}
        <Text
          style={[
            styles.amount,
            { color: tx.direction === "credit" ? colors.green : t.text },
          ]}
        >
          {tx.direction === "credit" ? "+" : "−"}
          {formatCurrency(tx.amount)}
        </Text>

        {/* Details card */}
        <View style={[styles.detailCard, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}>
          <DetailRow label="Date" value={formatLongDate(tx.date)} t={t} />
          <View style={[styles.rowDivider, { backgroundColor: t.tileBorder }]} />
          <DetailRow label="Paid with" value={tx.paymentSource} t={t} />
          <View style={[styles.rowDivider, { backgroundColor: t.tileBorder }]} />
          <DetailRow label="Reference" value={tx.refId} t={t} />
          <View style={[styles.rowDivider, { backgroundColor: t.tileBorder }]} />
          <DetailRow label="Type" value={txType} t={t} />
          <View style={[styles.rowDivider, { backgroundColor: t.tileBorder }]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: t.muted }]}>Source</Text>
            <View style={styles.sourceRow}>
              <SF name="envelope" size={13} tint={t.muted} />
              <Text style={[styles.detailValue, { color: t.text }]}>Gmail receipt</Text>
            </View>
          </View>
        </View>

        {/* Gmail snippet */}
        {tx.gmailSnippet ? (
          <View style={[styles.snippetCard, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}>
            <Text style={[styles.snippetText, { color: t.muted }]} numberOfLines={4}>
              {tx.gmailSnippet}
            </Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtn, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}
          >
            <Text style={[styles.actionBtnText, { color: t.text }]}>Recategorize</Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.actionBtnPrimary, { backgroundColor: t.text }]}
          >
            <Text style={[styles.actionBtnText, { color: t.background }]}>View email</Text>
            <SF name="chevron.right" size={14} tint={t.lime} />
          </Pressable>
        </View>
      </ScrollView>
    </Drawer>
  );
}

function DetailRow({
  label,
  value,
  t,
}: {
  label: string;
  value: string;
  t: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={[styles.detailLabel, { color: t.muted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: t.text }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.hPad,
    paddingTop: 24,
    paddingBottom: 48,
    alignItems: "center",
  },
  avatarWrap: { marginBottom: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 22,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    shadowOpacity: 0.32,
  },
  avatarInitial: { fontSize: 30, fontWeight: "800", color: "#fff" },
  merchantName: { fontSize: 20, fontWeight: "800", textAlign: "center" },
  badgeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    justifyContent: "center",
    flexWrap: "wrap",
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderCurve: "continuous",
  },
  categoryBadgeText: { fontSize: 12, fontWeight: "700" },
  amount: {
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.5,
    textAlign: "center",
    marginTop: 18,
    fontVariant: ["tabular-nums"],
  },
  detailCard: {
    width: "100%",
    borderRadius: 24,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginTop: 28,
    paddingHorizontal: 18,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    gap: 16,
  },
  detailLabel: { ...typography.caption, fontSize: 13.5 },
  detailValue: { ...typography.caption, fontSize: 14.5, fontWeight: "500", flex: 1, textAlign: "right" },
  sourceRow: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" },
  rowDivider: { height: StyleSheet.hairlineWidth },
  snippetCard: {
    width: "100%",
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 12,
  },
  snippetText: { ...typography.caption, lineHeight: 20 },
  actionsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  actionBtnPrimary: { borderWidth: 0 },
  actionBtnText: { fontSize: 14.5, fontWeight: "700" },
  notFound: { ...typography.body, textAlign: "center", marginTop: 80 },
});
