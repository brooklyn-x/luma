import { StyleSheet, Text, View } from "react-native";
import type { Bill } from "@/data/types";
import { SF } from "@/components/ui/sf";
import { colors, spacing, typography, useChipShadow, useTheme } from "@/theme";
import { dueLabel, statusOf } from "@/utils/bills";
import { formatCurrency } from "@/utils/format";

type Props = {
  bills: Bill[];
  title?: string;
  /** When true, renders without a section title (used inside card detail). */
  compact?: boolean;
};

export function BillsDueSection({ bills, title = "Bills due", compact }: Props) {
  const t = useTheme();
  const chipShadow = useChipShadow();
  if (!bills.length) return null;

  return (
    <View style={[styles.wrap, compact ? styles.compactWrap : null]}>
      {!compact ? (
        <Text style={[styles.sectionTitle, { color: t.muted }]}>{title}</Text>
      ) : null}
      <View style={styles.list}>
        {bills.map((bill) => {
          const { status, days } = statusOf(bill.dueDate);
          const accent =
            status === "overdue"
              ? colors.red
              : status === "due-soon"
                ? colors.yellow
                : t.muted;
          return (
            <View
              key={bill.id}
              style={[
                styles.row,
                { backgroundColor: t.card, boxShadow: chipShadow },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: accent }]} />
              <View style={styles.middle}>
                <View style={styles.titleRow}>
                  <Text
                    style={[styles.issuer, { color: t.text }]}
                    numberOfLines={1}
                  >
                    {bill.issuer}
                    {bill.cardLast4 ? (
                      <Text style={[styles.last4, { color: t.muted }]}>
                        {`  ••${bill.cardLast4}`}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <Text style={[styles.due, { color: accent }]}>
                  <SF
                    name={status === "overdue" ? "exclamationmark.circle" : "clock"}
                    size={11}
                    tint={accent}
                  />
                  {`  ${dueLabel(days)}`}
                </Text>
              </View>
              <Text style={[styles.amount, { color: t.text }]}>
                {formatCurrency(bill.totalDue)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.hPad,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 10,
  },
  compactWrap: { paddingHorizontal: 0, paddingTop: 0 },
  sectionTitle: {
    ...typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
  },
  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 16,
    borderCurve: "continuous",
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  middle: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  issuer: { ...typography.body, fontWeight: "600", fontSize: 15 },
  last4: { ...typography.caption, fontSize: 13 },
  due: { ...typography.caption, fontSize: 13, fontWeight: "500" },
  amount: { ...typography.body, fontWeight: "700", fontVariant: ["tabular-nums"] },
});
