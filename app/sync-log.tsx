import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { merchants } from "@/data/merchants";
import { selectSyncLog, useTransactions, type SyncLogEntry } from "@/hooks/use-transactions";
import { SF } from "@/components/ui/sf";
import { colors, spacing, typography, useTheme } from "@/theme";
import { formatCurrency, formatTime } from "@/utils/format";

type Row =
  | { kind: "header"; key: string; label: string; count: number }
  | { kind: "entry"; key: string; entry: SyncLogEntry };

export default function SyncLog() {
  const t = useTheme();
  const { data } = useTransactions();
  const log = useMemo(() => selectSyncLog(data), [data]);
  const fetchedAt = data?.fetchedAt;
  const scanned = data?.scanned ?? 0;

  const { rows, parsedCount, billCount, skippedCount, errorCount } = useMemo(() => {
    const parsed = log.filter((e) => e.status === "parsed");
    const bills = log.filter((e) => e.status === "bill");
    const skipped = log.filter((e) => e.status === "skipped");
    const errors = log.filter((e) => e.status === "error");
    const out: Row[] = [];
    if (parsed.length) {
      out.push({
        kind: "header",
        key: "h-parsed",
        label: "Parsed",
        count: parsed.length,
      });
      parsed.forEach((e) => out.push({ kind: "entry", key: `p-${e.id}`, entry: e }));
    }
    if (bills.length) {
      out.push({
        kind: "header",
        key: "h-bills",
        label: "Bills",
        count: bills.length,
      });
      bills.forEach((e) => out.push({ kind: "entry", key: `b-${e.id}`, entry: e }));
    }
    if (skipped.length) {
      out.push({
        kind: "header",
        key: "h-skipped",
        label: "Skipped",
        count: skipped.length,
      });
      skipped.forEach((e) =>
        out.push({ kind: "entry", key: `s-${e.id}`, entry: e })
      );
    }
    if (errors.length) {
      out.push({
        kind: "header",
        key: "h-errors",
        label: "Errors",
        count: errors.length,
      });
      errors.forEach((e) =>
        out.push({ kind: "entry", key: `e-${e.id}`, entry: e })
      );
    }
    return {
      rows: out,
      parsedCount: parsed.length,
      billCount: bills.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
    };
  }, [log]);

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={styles.spacer} />

      <View style={[styles.summary, { borderColor: t.tileBorder }]}>
        <SummaryStat label="Parsed" value={parsedCount} tint={colors.green} />
        <SummaryStat label="Bills" value={billCount} tint={colors.yellow} />
        <SummaryStat label="Skipped" value={skippedCount} tint={t.muted} />
        <SummaryStat label="Errors" value={errorCount} tint={colors.red} />
        <SummaryStat label="Scanned" value={scanned} tint={colors.blue} />
      </View>

      {fetchedAt ? (
        <Text style={[styles.fetchedAt, { color: t.muted }]}>
          Last sync · {formatTime(fetchedAt)}
        </Text>
      ) : null}

      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { color: t.text }]}>No sync yet</Text>
          <Text style={[styles.emptyBody, { color: t.muted }]}>
            Run a sync to see what your inbox surfaces.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {rows.map((item) =>
            item.kind === "header" ? (
              <View key={item.key} style={styles.section}>
                <Text style={[styles.sectionLabel, { color: t.muted }]}>
                  {item.label}
                </Text>
                <Text style={[styles.sectionCount, { color: t.muted }]}>
                  {item.count}
                </Text>
              </View>
            ) : (
              <View key={item.key} style={styles.rowSpacer}>
                <LogEntryRow entry={item.entry} />
              </View>
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

function SummaryStat({
  label,
  value,
  tint,
}: {
  label: string;
  value: number;
  tint: string;
}) {
  const t = useTheme();
  return (
    <View style={styles.statCol}>
      <Text style={[styles.statValue, { color: tint }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: t.muted }]}>{label}</Text>
    </View>
  );
}

function LogEntryRow({ entry }: { entry: SyncLogEntry }) {
  const t = useTheme();
  const isParsed = entry.status === "parsed";
  const isBill = entry.status === "bill";
  const isError = entry.status === "error";
  const hasAmount = isParsed || isBill;
  const tint = isParsed
    ? colors.green
    : isBill
      ? colors.yellow
      : isError
        ? colors.red
        : t.muted;
  const sym = isParsed
    ? "checkmark.circle.fill"
    : isBill
      ? "doc.text.fill"
      : isError
        ? "xmark.octagon.fill"
        : "minus.circle";

  const merchantName = entry.merchantId
    ? merchants[entry.merchantId]?.name
    : undefined;

  const primary = hasAmount
    ? `${merchantName ?? entry.merchantName ?? entry.merchantId} · ${entry.amount ? formatCurrency(entry.amount) : ""}`
    : entry.subject || entry.from || entry.id;
  const secondary = hasAmount
    ? `${entry.from} · ${formatTime(entry.date)}`
    : entry.reason
      ? `${entry.from || "—"} · ${entry.reason}`
      : entry.from || "";

  return (
    <View
      style={[
        styles.entryRow,
        { backgroundColor: t.tileFill, borderColor: t.tileBorder },
      ]}
    >
      <SF name={sym} size={16} tint={tint} />
      <View style={styles.entryText}>
        <Text style={[styles.entryPrimary, { color: t.text }]} numberOfLines={1}>
          {primary}
        </Text>
        <Text style={[styles.entrySecondary, { color: t.muted }]} numberOfLines={2}>
          {secondary}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  spacer: { height: 8 },
  summary: {
    marginHorizontal: spacing.hPad,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  statCol: { alignItems: "center", gap: 2, flex: 1 },
  statValue: { ...typography.h3, fontVariant: ["tabular-nums"] },
  statLabel: {
    ...typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  fetchedAt: {
    ...typography.micro,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  list: { flex: 1 },
  listContent: {
    paddingHorizontal: spacing.hPad,
    paddingBottom: 60,
  },
  rowSpacer: { marginTop: 8 },
  section: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 18,
    paddingBottom: 6,
  },
  sectionLabel: {
    ...typography.micro,
    textTransform: "uppercase",
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  sectionCount: { ...typography.caption, fontVariant: ["tabular-nums"] },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  entryText: { flex: 1, gap: 2 },
  entryPrimary: { ...typography.caption, fontWeight: "600" },
  entrySecondary: { ...typography.micro, lineHeight: 16 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: { ...typography.h3 },
  emptyBody: { ...typography.body, textAlign: "center" },
});
