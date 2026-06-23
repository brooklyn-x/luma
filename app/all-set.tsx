import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContinueButton } from "@/components/onboarding/continue-button";
import { SF } from "@/components/ui/sf";
import { deriveCards } from "@/data/cards";
import { selectTransactions, useTransactions } from "@/hooks/use-transactions";
import { spacing, typography, useCardShadow, useIsDark, useTheme } from "@/theme";
import { cycleOf, sameCycle } from "@/utils/cycle";
import { formatCurrency } from "@/utils/format";

export default function AllSet() {
  const t = useTheme();
  const isDark = useIsDark();
  const accent = isDark ? t.limeMid : t.lime;
  const cardShadow = useCardShadow();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ parsed?: string; total?: string }>();
  const { data } = useTransactions();

  const { tracked, receipts, cards } = useMemo(() => {
    const transactions = selectTransactions(data);
    const paramReceipts = Number(params.total) || 0;
    const paramParsed = Number(params.parsed) || 0;

    if (transactions.length === 0) {
      return { tracked: 0, receipts: paramReceipts, cards: 0 };
    }

    const current = cycleOf(new Date());
    const tracked = transactions
      .filter(
        (tr) =>
          tr.direction === "debit" &&
          tr.kind === "purchase" &&
          sameCycle(cycleOf(tr.date), current)
      )
      .reduce((acc, tr) => acc + tr.amount, 0);

    return {
      tracked,
      receipts: paramParsed || transactions.length,
      cards: deriveCards(transactions).length,
    };
  }, [data, params.parsed, params.total]);

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: t.background, paddingTop: insets.top },
      ]}
    >
      <View style={styles.center}>
        <LinearGradient
          colors={[t.lime, t.limeStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.badge}
        >
          <SF name="checkmark" size={46} tint="#1A2E05" />
        </LinearGradient>
        <Text style={[styles.title, { color: t.text }]}>You&apos;re all set</Text>
        <Text style={[styles.subtitle, { color: t.muted }]}>
          We sorted {receipts} receipts into your money timeline.
        </Text>
      </View>

      <View style={styles.stats}>
        <Stat
          value={formatCurrency(tracked)}
          label="tracked"
          shadow={cardShadow}
        />
        <Stat value={String(receipts)} label="receipts" shadow={cardShadow} />
        <Stat value={String(cards)} label="cards" shadow={cardShadow} />
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <ContinueButton
          label="Open Luma"
          icon={<SF name="arrow.right" size={18} tint={accent} />}
          onPress={() => router.replace("/(tabs)/(home)")}
        />
      </View>
    </View>
  );
}

function Stat({
  value,
  label,
  shadow,
}: {
  value: string;
  label: string;
  shadow: string;
}) {
  const t = useTheme();
  return (
    <View style={[styles.statCard, { backgroundColor: t.card, boxShadow: shadow }]}>
      <Text style={[styles.statValue, { color: t.text }]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: t.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.hPad },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  stats: { flexDirection: "row", gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 20,
    borderCurve: "continuous",
    paddingVertical: 16,
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  statLabel: { ...typography.micro, fontWeight: "600", marginTop: 3 },
  footer: { paddingTop: 4 },
});
