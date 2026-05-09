import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { typography, useTheme } from "@/theme";
import { formatCurrency } from "@/utils/format";

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type DonutSlice = { label: string; value: number; color: string };

type Props = {
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  total: number;
  caption?: string;
};

const GAP_DEG = 5;

export function CategoryDonutChart({
  data,
  size = 220,
  thickness = 22,
  total,
  caption = "This month",
}: Props) {
  const t = useTheme();
  const radius = (size - thickness) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const sweep = 360 - GAP_DEG * data.length;

  const slices = useMemo(() => {
    const sum = data.reduce((acc, s) => acc + s.value, 0) || 1;
    let cursor = -90 + GAP_DEG / 2;
    return data.map((s) => {
      const span = (s.value / sum) * (sweep > 0 ? sweep : 360);
      const start = cursor;
      const end = cursor + span;
      cursor = end + GAP_DEG;
      const arc = describeArc(cx, cy, radius, start, end);
      const length = arcLength(radius, span);
      return { ...s, arc, length, span };
    });
  }, [data, cx, cy, radius, sweep]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          {slices.map((s, i) => (
            <LinearGradient key={`g${i}`} id={`donut-grad-${i}`} x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={s.color} stopOpacity={1} />
              <Stop offset="1" stopColor={s.color} stopOpacity={0.7} />
            </LinearGradient>
          ))}
        </Defs>
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={t.tileBorder}
          strokeWidth={thickness}
          fill="none"
        />
        {slices.map((s, i) => (
          <AnimatedSlice
            key={s.label}
            d={s.arc}
            length={s.length}
            stroke={`url(#donut-grad-${i})`}
            thickness={thickness}
            delay={i * 110}
          />
        ))}
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={[styles.totalLabel, { color: t.muted }]}>{caption}</Text>
        <Text style={[styles.total, { color: t.text }]}>{formatCurrency(total)}</Text>
        <Text style={[styles.subTotal, { color: t.muted }]}>
          across {data.length} categories
        </Text>
      </View>
    </View>
  );
}

function AnimatedSlice({
  d,
  length,
  stroke,
  thickness,
  delay = 0,
}: {
  d: string;
  length: number;
  stroke: string;
  thickness: number;
  delay?: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedProps = useAnimatedProps(() => {
    const eased = clamp((progress.value * 1400 - delay) / 1100, 0, 1);
    return { strokeDashoffset: length * (1 - eased) };
  });

  return (
    <AnimatedPath
      d={d}
      stroke={stroke}
      strokeWidth={thickness}
      strokeLinecap="round"
      fill="none"
      strokeDasharray={length}
      animatedProps={animatedProps}
    />
  );
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const span = endAngle - startAngle;
  const largeArc = span > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

function arcLength(r: number, angleDeg: number) {
  return (Math.PI * r * angleDeg) / 180;
}

function clamp(v: number, lo: number, hi: number) {
  "worklet";
  return Math.max(lo, Math.min(hi, v));
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", alignSelf: "center" },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  totalLabel: {
    ...typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "600",
  },
  total: {
    ...typography.h2,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  subTotal: {
    ...typography.caption,
    fontSize: 12,
    marginTop: 2,
  },
});
