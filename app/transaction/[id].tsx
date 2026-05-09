import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Glass } from "@/components/ui/glass";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import { SF } from "@/components/ui/sf";
import { merchants } from "@/data/merchants";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { haptics } from "@/services/haptics";
import { categoryColors, radius, spacing, typography, useTheme } from "@/theme";
import { formatCurrency, formatLongDate } from "@/utils/format";

export default function TransactionDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data } = useTransactions();
  const tx = selectTransactions(data).find((tr) => tr.id === id);

  if (!tx) {
    return (
      <View style={[styles.root, { backgroundColor: t.background }]}>
        <Text style={[styles.notFound, { color: t.muted }]}>Transaction not found</Text>
        <Pressable
          onPress={() => {
            haptics.dismiss();
            router.back();
          }}
          style={styles.closeButtonWrap}
          hitSlop={12}
        >
          <Glass cornerRadius={20}>
            <View style={styles.closeButtonInner}>
              <SF name="xmark" size={18} tint={t.text} />
            </View>
          </Glass>
        </Pressable>
      </View>
    );
  }

  const merchant = merchants[tx.merchantId];
  const accent = merchant?.color ?? t.elevated;
  const cat = categoryColors[tx.category] ?? t.muted;

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
      <View style={styles.topRow}>
        <Pressable
          onPress={() => {
            haptics.dismiss();
            router.back();
          }}
          hitSlop={12}
        >
          <Glass cornerRadius={20}>
            <View style={styles.closeButtonInner}>
              <SF name="xmark" size={18} tint={t.text} />
            </View>
          </Glass>
        </Pressable>
        <View style={styles.badgeRow}>
          {tx.recurring ? (
            <Glass cornerRadius={999}>
              <View style={styles.badgeInner}>
                <SF name="arrow.triangle.2.circlepath" size={12} tint={t.muted} />
                <Text style={[styles.badgeText, { color: t.muted }]}>Recurring</Text>
              </View>
            </Glass>
          ) : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.hPad, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.heroLogoWrap}>
          <MerchantLogo merchantId={tx.merchantId} size={88} />
        </View>
        <Text style={[styles.merchant, { color: t.text }]}>
          {merchant?.name ?? tx.merchantName ?? "Unknown"}
        </Text>
        <Text style={[styles.amount, { color: t.text }]}>−{formatCurrency(tx.amount)}</Text>
        <Text style={[styles.date, { color: t.muted }]}>{formatLongDate(tx.date)}</Text>

        <View style={styles.metaRow}>
          <Glass cornerRadius={999}>
            <View style={styles.metaPillInner}>
              <View style={[styles.metaDot, { backgroundColor: cat }]} />
              <Text style={[styles.metaPillText, { color: cat }]}>{tx.category}</Text>
            </View>
          </Glass>
          <Glass cornerRadius={999}>
            <View style={styles.metaPillInner}>
              <SF name="creditcard" size={12} tint={t.muted} />
              <Text style={[styles.metaPillText, { color: t.muted }]}>{tx.paymentSource}</Text>
            </View>
          </Glass>
        </View>

        <View style={{ marginTop: 28, gap: 12 }}>
          <Accordion symbol="envelope" title="Gmail receipt" defaultOpen>
            <Text style={[styles.snippet, { color: t.muted }]}>{tx.gmailSnippet}</Text>
            <View style={[styles.metaTable, { borderColor: t.tileBorder }]}>
              <MetaRow label="Received" value={formatLongDate(tx.date)} />
            </View>
          </Accordion>

          <Accordion symbol="creditcard" title="Payment metadata">
            <View style={[styles.metaTable, { borderColor: t.tileBorder }]}>
              <MetaRow label="Source" value={tx.paymentSource} />
              <MetaRow label="Reference" value={tx.refId} />
              <MetaRow label="Category" value={tx.category} valueColor={cat} />
            </View>
          </Accordion>
        </View>
      </ScrollView>
    </View>
  );
}

function Accordion({
  symbol,
  title,
  children,
  defaultOpen = false,
}: {
  symbol: string;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(defaultOpen);
  const rotation = useSharedValue(defaultOpen ? 1 : 0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 180}deg` }],
  }));

  const toggle = () => {
    const next = !open;
    setOpen(next);
    rotation.value = withTiming(next ? 1 : 0, { duration: 220 });
  };

  return (
    <Glass cornerRadius={radius.card}>
      <Pressable onPress={toggle} style={styles.accordionHeader}>
        <View
          style={[
            styles.accordionIcon,
            { backgroundColor: t.tileHighlight, borderColor: t.tileBorder },
          ]}
        >
          <SF name={symbol} size={16} tint={t.text} />
        </View>
        <Text style={[styles.accordionTitle, { color: t.text }]}>{title}</Text>
        <Animated.View style={chevronStyle}>
          <SF name="chevron.down" size={16} tint={t.muted} />
        </Animated.View>
      </Pressable>
      {open ? <View style={styles.accordionBody}>{children}</View> : null}
    </Glass>
  );
}

function MetaRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  const t = useTheme();
  return (
    <View style={[styles.metaTableRow, { borderBottomColor: t.tileBorder }]}>
      <Text style={[styles.metaTableLabel, { color: t.muted }]}>{label}</Text>
      <Text style={[styles.metaTableValue, { color: valueColor ?? t.text }]}>{value}</Text>
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.hPad,
    paddingTop: 16,
  },
  closeButtonWrap: { width: 36, height: 36 },
  closeButtonInner: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeRow: { flexDirection: "row", gap: 8 },
  badgeInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { ...typography.micro, fontWeight: "600" },
  notFound: {
    ...typography.body,
    textAlign: "center",
    marginTop: 80,
  },
  heroLogoWrap: { alignItems: "center", marginTop: 20, marginBottom: 16 },
  merchant: { ...typography.h3, textAlign: "center" },
  amount: {
    ...typography.h1,
    textAlign: "center",
    marginTop: 6,
    fontVariant: ["tabular-nums"],
  },
  date: { ...typography.caption, textAlign: "center", marginTop: 6 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 18,
    flexWrap: "wrap",
  },
  metaPillInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metaDot: { width: 8, height: 8, borderRadius: 4 },
  metaPillText: { ...typography.caption, fontWeight: "500" },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  accordionIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  accordionTitle: { ...typography.body, fontWeight: "600", flex: 1 },
  accordionBody: { paddingHorizontal: 18, paddingBottom: 18, gap: 12 },
  snippet: { ...typography.body, lineHeight: 22 },
  metaTable: {
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginTop: 4,
  },
  metaTableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaTableLabel: { ...typography.caption },
  metaTableValue: { ...typography.caption, fontWeight: "500" },
});
