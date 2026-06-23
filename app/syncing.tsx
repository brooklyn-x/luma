import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import { useSyncMutation, type SyncLogEntry } from "@/hooks/use-transactions";
import { haptics } from "@/services/haptics";
import {
  categoryColors,
  spacing,
  typography,
  useCardShadow,
  useTheme,
  type Palette,
} from "@/theme";
import { formatCurrency } from "@/utils/format";

type Stage = "list" | "fetch" | "parse" | "done";

const MAX_LIVE_LOG = 40;

const groupSep = new Intl.NumberFormat("en-IN");

export default function Syncing() {
  const t = useTheme();
  const cardShadow = useCardShadow();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ full?: string }>();
  const force = params.full === "1";
  const [stage, setStage] = useState<Stage>("list");
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [parsed, setParsed] = useState(0);
  const [log, setLog] = useState<SyncLogEntry[]>([]);
  const startedRef = useRef(false);
  const parsedRef = useRef(0);
  const totalRef = useRef(0);

  const mutation = useSyncMutation(
    (p) => {
      setStage(p.stage);
      setTotal(p.total);
      setProcessed(p.processed);
      setParsed(p.parsed);
      parsedRef.current = p.parsed;
      totalRef.current = p.total;
      if (p.lastEntry) {
        setLog((prev) => {
          const next = [p.lastEntry as SyncLogEntry, ...prev];
          return next.slice(0, MAX_LIVE_LOG);
        });
      }
    },
    { force }
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    mutation.mutate(undefined, {
      onSuccess: () => {
        haptics.success();
        router.replace({
          pathname: "/all-set",
          params: {
            parsed: String(parsedRef.current),
            total: String(totalRef.current),
          },
        });
      },
      onError: (err) => {
        Alert.alert(
          "Sync failed",
          err instanceof Error ? err.message : "Unknown error",
          [{ text: "OK", onPress: () => router.replace("/(tabs)/(home)") }]
        );
      },
    });
  }, [mutation]);

  const progress =
    stage === "list"
      ? 0.05
      : stage === "done"
        ? 1
        : total
          ? Math.min(0.95, 0.1 + (processed / total) * 0.85)
          : 0.1;
  const pct = Math.round(progress * 100);

  const subtitle =
    stage === "list"
      ? "Looking for transaction emails…"
      : `${groupSep.format(total)} emails · ${parsed} receipts found`;

  // Only the parsed receipts (merchant + amount + category) become cards.
  const sorted = log.filter((e) => e.status === "parsed" || e.status === "bill");

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: t.background, paddingTop: insets.top + 40 },
      ]}
    >
      <View style={styles.hero}>
        <Text style={[styles.percent, { color: t.text }]}>
          {pct}
          <Text style={[styles.percentSign, { color: t.muted2 }]}>%</Text>
        </Text>
        <Text style={[styles.title, { color: t.text }]}>Reading your inbox</Text>
        <Text style={[styles.subtitle, { color: t.muted }]}>{subtitle}</Text>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: t.tileBorder }]}>
        <LinearGradient
          colors={[t.limeStrong, t.lime]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${pct}%` }]}
        />
      </View>

      <Text style={[styles.sortingLabel, { color: t.muted2 }]}>Sorting now</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {sorted.length === 0 ? (
          <Text style={[styles.empty, { color: t.muted }]}>
            Waiting for the first email…
          </Text>
        ) : (
          sorted.map((entry) => (
            <SortCard key={entry.id} entry={entry} t={t} shadow={cardShadow} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function SortCard({
  entry,
  t,
  shadow,
}: {
  entry: SyncLogEntry;
  t: Palette;
  shadow: string;
}) {
  const name = entry.merchantName ?? entry.merchantId ?? "Receipt";
  const catColor = entry.category ? categoryColors[entry.category] : undefined;
  return (
    <View style={[styles.card, { backgroundColor: t.card, boxShadow: shadow }]}>
      <MerchantLogo merchantId={entry.merchantId ?? name} size={42} name={name} />
      <View style={styles.cardMiddle}>
        <Text style={[styles.cardName, { color: t.text }]} numberOfLines={1}>
          {name}
        </Text>
        {entry.amount ? (
          <Text style={[styles.cardAmount, { color: t.muted }]}>
            {formatCurrency(entry.amount)}
          </Text>
        ) : null}
      </View>
      {entry.category && catColor ? (
        <View style={[styles.pill, { backgroundColor: `${catColor}22` }]}>
          <Text style={[styles.pillText, { color: catColor }]} numberOfLines={1}>
            {entry.category}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.hPad },
  hero: { alignItems: "center", marginBottom: 22 },
  percent: {
    ...typography.h1,
    fontSize: 72,
    lineHeight: 80,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -3,
  },
  percentSign: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  sortingLabel: {
    ...typography.micro,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 32, gap: 12 },
  empty: {
    ...typography.caption,
    textAlign: "center",
    paddingVertical: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderRadius: 20,
    borderCurve: "continuous",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardMiddle: { flex: 1, gap: 1 },
  cardName: { ...typography.body, fontSize: 15, fontWeight: "700" },
  cardAmount: {
    ...typography.caption,
    fontVariant: ["tabular-nums"],
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderCurve: "continuous",
  },
  pillText: { fontSize: 12.5, fontWeight: "700" },
});
