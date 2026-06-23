import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { haptics } from "@/services/haptics";
import { typography, useTheme } from "@/theme";
import type { Cycle } from "@/utils/cycle";
import { formatCurrency } from "@/utils/format";

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Props = {
  /** Per-day amounts for the whole cycle (1-based day order). */
  daily: { day: number; amount: number }[];
  cycle: Cycle;
  /** 1-based index of the most recent day to show (today, or month end). */
  lastDay: number;
  /** Whether the selected cycle contains today. */
  isCurrent: boolean;
  tint: string;
  windowSize?: number;
};

export function DailySpendBars({
  daily,
  cycle,
  lastDay,
  isCurrent,
  tint,
  windowSize = 14,
}: Props) {
  const t = useTheme();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const end = Math.min(lastDay, daily.length);
  const start = Math.max(0, end - windowSize);
  const window = daily.slice(start, end);
  if (window.length === 0) return null;

  const max = Math.max(...window.map((d) => d.amount), 1);
  const sum = window.reduce((acc, d) => acc + d.amount, 0);
  const avg = Math.round(sum / window.length);
  const latest = window[window.length - 1];
  const fmtDay = (day: number) => `${MONTHS_SHORT[cycle.month]} ${day}`;

  // Fall back to the latest day if nothing (or a now-out-of-window day) is selected.
  const active =
    (selectedDay != null
      ? window.find((d) => d.day === selectedDay)
      : undefined) ?? latest;
  const activeIsLatest = active.day === latest.day;

  const onSelect = (day: number) => {
    haptics.selection();
    setSelectedDay(day);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.label, { color: t.muted }]}>Daily spend</Text>
          <Text style={[styles.amount, { color: t.text }]}>
            {formatCurrency(active.amount)}{" "}
            <Text style={[styles.amountSuffix, { color: t.muted }]}>
              {isCurrent && activeIsLatest ? "today" : fmtDay(active.day)}
            </Text>
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.label, { color: t.muted }]}>
            {window.length}-day avg
          </Text>
          <Text style={[styles.avg, { color: t.text }]}>{formatCurrency(avg)}</Text>
        </View>
      </View>

      <View style={styles.bars}>
        {window.map((d) => {
          const ratio = d.amount / max;
          const isActive = d.day === active.day;
          return (
            <Pressable
              key={d.day}
              onPress={() => onSelect(d.day)}
              style={styles.barTrack}
              hitSlop={4}
            >
              <View
                style={[
                  styles.bar,
                  {
                    height: `${Math.max(6, ratio * 100)}%`,
                    backgroundColor: tint,
                    opacity: isActive ? 1 : 0.32 + ratio * 0.33,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.axis}>
        <Text style={[styles.axisLabel, { color: t.muted2 }]}>
          {fmtDay(window[0].day)}
        </Text>
        <Text
          style={[
            styles.axisLabel,
            { color: isCurrent ? t.text : t.muted2, fontWeight: "700" },
          ]}
        >
          {isCurrent ? "Today" : fmtDay(latest.day)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  label: { ...typography.caption, fontWeight: "500" },
  amount: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  amountSuffix: { fontSize: 13, fontWeight: "600" },
  avg: {
    fontSize: 14,
    fontWeight: "800",
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    height: 88,
  },
  barTrack: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    minHeight: 5,
    borderRadius: 4,
  },
  axis: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  axisLabel: { ...typography.micro, fontWeight: "600" },
});
