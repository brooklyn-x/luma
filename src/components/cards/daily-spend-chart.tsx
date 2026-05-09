import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line, Rect } from "react-native-svg";
import { typography, useTheme } from "@/theme";
import { formatCurrency } from "@/utils/format";

function formatKAmount(value: number): string {
  if (value === 0) return "0";
  const k = value / 1000;
  if (k >= 100) return `${Math.round(k)}k`;
  if (k >= 10) return `${Math.round(k)}k`;
  // 1 decimal for 0–10k range, drop trailing .0
  const rounded = Math.round(k * 10) / 10;
  const text = rounded.toString();
  return `${text}k`;
}

type Props = {
  daily: { day: number; amount: number }[];
  daysInMonth: number;
  tint: string;
  height?: number;
};

const BAR_GAP = 0.18;
const MIN_BAR_HEIGHT = 1;
const Y_AXIS_WIDTH = 38;

export function DailySpendChart({
  daily,
  daysInMonth,
  tint,
  height = 150,
}: Props) {
  const t = useTheme();
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const peak = useMemo(
    () =>
      daily.reduce(
        (best, d) => (d.amount > best.amount ? d : best),
        { day: 0, amount: 0 }
      ),
    [daily]
  );
  const max = peak.amount;

  const activeDay = selectedDay ?? (peak.amount > 0 ? peak.day : null);
  const activeEntry = activeDay ? daily.find((d) => d.day === activeDay) : null;

  const barAreaHeight = height - 26;

  // Y-axis ticks: 0, half, max
  const yTicks =
    max === 0
      ? [0]
      : [max, Math.round(max / 2), 0];

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        {activeEntry ? (
          <>
            <Text style={[styles.label, { color: t.muted }]}>
              {selectedDay ? "Day" : "Peak day"} {activeEntry.day}
            </Text>
            <Text style={[styles.amount, { color: t.text }]}>
              {formatCurrency(activeEntry.amount)}
            </Text>
          </>
        ) : (
          <Text style={[styles.label, { color: t.muted }]}>
            No spend this month
          </Text>
        )}
      </View>

      <View
        style={[
          styles.chartShell,
          { borderColor: t.tileBorder, backgroundColor: t.tileFill },
        ]}
      >
        <View style={styles.chartRow}>
          {/* Y-axis labels */}
          <View style={[styles.yAxis, { height: barAreaHeight }]}>
            {yTicks.map((v) => (
              <Text
                key={v}
                style={[styles.yTick, { color: t.muted }]}
                numberOfLines={1}
              >
                {v === 0 ? "0" : `₹${formatKAmount(v)}`}
              </Text>
            ))}
          </View>

          {/* Bars + touch overlay */}
          <View style={[styles.barsArea, { height: barAreaHeight }]}>
            <Svg
              height={barAreaHeight}
              width="100%"
              viewBox={`0 0 ${daysInMonth} ${barAreaHeight}`}
              preserveAspectRatio="none"
            >
              {/* horizontal grid lines */}
              {max > 0
                ? [0, 0.5, 1].map((frac) => (
                    <Line
                      key={frac}
                      x1={0}
                      x2={daysInMonth}
                      y1={barAreaHeight * frac}
                      y2={barAreaHeight * frac}
                      stroke={t.tileBorder}
                      strokeWidth={0.4}
                      strokeDasharray="0.6,0.6"
                    />
                  ))
                : null}
              {daily.map((d) => {
                const ratio = max === 0 ? 0 : d.amount / max;
                const h = ratio * barAreaHeight;
                const barH = d.amount > 0 ? Math.max(MIN_BAR_HEIGHT, h) : 0;
                const x = d.day - 1 + BAR_GAP / 2;
                const w = 1 - BAR_GAP;
                const y = barAreaHeight - barH;
                const isActive = d.day === activeDay;
                return (
                  <Rect
                    key={d.day}
                    x={x}
                    y={y}
                    width={w}
                    height={barH}
                    fill={tint}
                    opacity={isActive ? 1 : 0.45}
                    rx={0.18}
                  />
                );
              })}
            </Svg>

            <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
              <View style={styles.touchRow}>
                {daily.map((d) => (
                  <Pressable
                    key={d.day}
                    onPress={() =>
                      setSelectedDay((prev) => (prev === d.day ? null : d.day))
                    }
                    style={styles.touchCell}
                    hitSlop={4}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisRow}>
          <View style={{ width: Y_AXIS_WIDTH }} />
          <View style={styles.xAxisLabels}>
            {[
              1,
              Math.ceil(daysInMonth / 4),
              Math.ceil(daysInMonth / 2),
              Math.ceil((daysInMonth * 3) / 4),
              daysInMonth,
            ].map((tick, idx, arr) => (
              <Text
                key={`${tick}-${idx}`}
                style={[
                  styles.xTick,
                  { color: t.muted },
                  idx === 0 ? { textAlign: "left" } : null,
                  idx === arr.length - 1 ? { textAlign: "right" } : null,
                ]}
              >
                {tick}
              </Text>
            ))}
          </View>
        </View>
      </View>

      {selectedDay ? (
        <Text style={[styles.hint, { color: t.muted }]}>
          Tap again to clear
        </Text>
      ) : daily.some((d) => d.amount > 0) ? (
        <Text style={[styles.hint, { color: t.muted }]}>
          Tap a day for details
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  label: {
    ...typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  amount: {
    ...typography.body,
    fontSize: 15,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  chartShell: {
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 14,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  chartRow: { flexDirection: "row", alignItems: "stretch", gap: 6 },
  yAxis: {
    width: Y_AXIS_WIDTH - 6,
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 1,
    paddingBottom: 1,
  },
  yTick: {
    ...typography.micro,
    fontSize: 10,
    fontVariant: ["tabular-nums"],
    lineHeight: 12,
  },
  barsArea: { flex: 1 },
  touchRow: { flex: 1, flexDirection: "row" },
  touchCell: { flex: 1 },
  xAxisRow: { flexDirection: "row", marginTop: 4 },
  xAxisLabels: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  xTick: {
    ...typography.micro,
    flex: 1,
    textAlign: "center",
  },
  hint: { ...typography.micro, textAlign: "center" },
});
