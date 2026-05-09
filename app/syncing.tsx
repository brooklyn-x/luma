import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { merchants } from "@/data/merchants";
import { useSyncMutation, type SyncLogEntry } from "@/hooks/use-transactions";
import { haptics } from "@/services/haptics";
import { SF } from "@/components/ui/sf";
import { colors, spacing, typography, useTheme } from "@/theme";
import { formatCurrency } from "@/utils/format";

type Stage = "list" | "fetch" | "parse" | "done";

const stageMeta: Record<Stage, { label: string; symbol: string }> = {
  list: { label: "Searching your inbox", symbol: "magnifyingglass" },
  fetch: { label: "Reading receipts", symbol: "envelope.fill" },
  parse: { label: "Extracting transactions", symbol: "tray.full" },
  done: { label: "Done", symbol: "checkmark" },
};

const MAX_LIVE_LOG = 40;

export default function Syncing() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ full?: string }>();
  const force = params.full === "1";
  const [stage, setStage] = useState<Stage>("list");
  const [total, setTotal] = useState(0);
  const [processed, setProcessed] = useState(0);
  const [parsed, setParsed] = useState(0);
  const [log, setLog] = useState<SyncLogEntry[]>([]);
  const startedRef = useRef(false);

  const mutation = useSyncMutation(
    (p) => {
      setStage(p.stage);
      setTotal(p.total);
      setProcessed(p.processed);
      setParsed(p.parsed);
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
        router.replace("/(tabs)/(home)");
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

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: t.background, paddingTop: insets.top + 32 },
      ]}
    >
      <View style={styles.heroWrap}>
        <View
          style={[
            styles.iconPlate,
            { backgroundColor: t.tileFill, borderColor: t.tileBorder },
          ]}
        >
          <SF name="envelope.fill" size={28} tint={colors.blue} />
        </View>
        <Text style={[styles.percent, { color: t.text }]}>
          {Math.round(progress * 100)}%
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: t.tileBorder }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round(progress * 100)}%`,
                backgroundColor: colors.blue,
              },
            ]}
          />
        </View>
      </View>

      <Text style={[styles.title, { color: t.text }]}>Reading your inbox</Text>
      <Text style={[styles.subtitle, { color: t.muted }]}>
        {stage === "list"
          ? "Looking for transaction emails…"
          : stage === "done"
            ? `Found ${parsed} transactions in ${total} receipts.`
            : `Processed ${processed} of ${total} · ${parsed} found`}
      </Text>

      <View style={styles.steps}>
        {(["list", "fetch", "parse"] as Stage[]).map((s) => {
          const order: Record<Stage, number> = { list: 0, fetch: 1, parse: 2, done: 3 };
          const status: "done" | "active" | "pending" =
            order[stage] > order[s] || stage === "done"
              ? "done"
              : stage === s
                ? "active"
                : "pending";
          const tint =
            status === "done" ? t.green : status === "active" ? colors.blue : t.muted;
          const sym = status === "done" ? "checkmark" : stageMeta[s].symbol;
          return (
            <View key={s} style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: `${tint}22` }]}>
                <SF name={sym} size={14} tint={tint} />
              </View>
              <Text
                style={[
                  styles.label,
                  { color: status === "active" ? t.text : t.muted },
                ]}
              >
                {stageMeta[s].label}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.logHeader}>
        <Text style={[styles.logTitle, { color: t.muted }]}>Live</Text>
        <Text style={[styles.logCount, { color: t.muted }]}>
          {parsed} parsed · {processed - parsed} skipped
        </Text>
      </View>

      <ScrollView
        style={styles.logScroll}
        contentContainerStyle={styles.logContent}
        showsVerticalScrollIndicator={false}
      >
        {log.length === 0 ? (
          <Text style={[styles.logEmpty, { color: t.muted }]}>
            Waiting for the first email…
          </Text>
        ) : (
          log.map((entry) => (
            <LogRow key={entry.id} entry={entry} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function LogRow({ entry }: { entry: SyncLogEntry }) {
  const t = useTheme();
  const isParsed = entry.status === "parsed";
  const isError = entry.status === "error";

  const tint = isParsed ? colors.green : isError ? colors.red : t.muted;
  const sym = isParsed ? "checkmark.circle.fill" : isError ? "xmark.octagon.fill" : "minus.circle";

  const merchantName = entry.merchantId ? merchants[entry.merchantId]?.name : undefined;
  const primary = isParsed
    ? `${merchantName ?? entry.merchantName ?? entry.merchantId} · ${entry.amount ? formatCurrency(entry.amount) : ""}`
    : entry.from || entry.subject || entry.id;
  const secondary = isParsed
    ? entry.subject
    : entry.reason ?? entry.subject;

  return (
    <View style={styles.logRow}>
      <SF name={sym} size={14} tint={tint} />
      <View style={styles.logRowText}>
        <Text
          style={[
            styles.logPrimary,
            { color: isParsed ? t.text : t.muted, opacity: isParsed ? 1 : 0.7 },
          ]}
          numberOfLines={1}
        >
          {primary}
        </Text>
        {secondary ? (
          <Text style={[styles.logSecondary, { color: t.muted }]} numberOfLines={1}>
            {secondary}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.hPad },
  heroWrap: { alignItems: "center", marginTop: 12, marginBottom: 16, gap: 14 },
  iconPlate: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    ...typography.h2,
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    letterSpacing: -0.4,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  title: {
    ...typography.h2,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 6,
  },
  steps: { marginTop: 18, gap: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...typography.body, fontSize: 14 },
  logHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  logTitle: {
    ...typography.micro,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  logCount: { ...typography.micro },
  logScroll: { flex: 1 },
  logContent: { paddingBottom: 32, gap: 10 },
  logEmpty: {
    ...typography.caption,
    textAlign: "center",
    paddingVertical: 24,
  },
  logRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logRowText: { flex: 1, gap: 1 },
  logPrimary: { ...typography.caption, fontWeight: "500" },
  logSecondary: { ...typography.micro },
});
