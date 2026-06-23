import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useAuthStore } from "@/stores/auth-store";
import { typography, useTheme } from "@/theme";

function PulseDot({ delay, color }: { delay: number; color: string }) {
  const p = useSharedValue(0.35);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 600 }), -1, true)
    );
  }, [delay, p]);
  const style = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.85 + p.value * 0.45 }],
  }));
  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

export default function Splash() {
  const t = useTheme();
  const connected = useAuthStore((s) => s.connected);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(connected ? "/(tabs)/(home)" : "/onboarding");
    }, 800);
    return () => clearTimeout(timer);
  }, [connected]);

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <View style={styles.center}>
        <LinearGradient
          colors={[t.lime, t.limeStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoTile}
        >
          <Text style={styles.logoMark}>l</Text>
        </LinearGradient>
        <Text style={[styles.wordmark, { color: t.text }]}>luma</Text>
        <Text style={[styles.tag, { color: t.muted }]}>Every receipt, sorted.</Text>
      </View>

      <View style={styles.dots}>
        <PulseDot delay={0} color={t.lime} />
        <PulseDot delay={200} color={t.lime} />
        <PulseDot delay={400} color={t.lime} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center", gap: 22 },
  logoTile: {
    width: 96,
    height: 96,
    borderRadius: 30,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  logoMark: {
    fontSize: 54,
    fontWeight: "800",
    color: "#1A2E05",
  },
  wordmark: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    marginTop: -4,
  },
  tag: { ...typography.caption, marginTop: -16 },
  dots: {
    position: "absolute",
    bottom: 54,
    flexDirection: "row",
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
