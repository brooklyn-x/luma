import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Glass } from "@/components/ui/glass";
import { useAuthStore } from "@/stores/auth-store";
import { typography, useTheme } from "@/theme";

export default function Splash() {
  const t = useTheme();
  const connected = useAuthStore((s) => s.connected);
  const fade = useSharedValue(0);
  const lift = useSharedValue(8);
  const pulse = useSharedValue(0.6);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    lift.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    const timer = setTimeout(() => {
      router.replace(connected ? "/(tabs)/(home)" : "/onboarding");
    }, 1700);
    return () => clearTimeout(timer);
  }, [connected, fade, lift, pulse]);

  const wordmark = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: lift.value }],
  }));

  const glow = useAnimatedStyle(() => ({
    opacity: 0.55 * fade.value,
    transform: [{ scale: pulse.value }],
  }));

  const tagline = useAnimatedStyle(() => ({
    opacity: withDelay(300, withTiming(fade.value, { duration: 600 })),
  }));

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <Animated.View style={[styles.glow, glow]} pointerEvents="none">
        <LinearGradient
          colors={["#5B8CFF", "#8B5CF6", "transparent"]}
          start={{ x: 0.2, y: 0.2 }}
          end={{ x: 0.8, y: 0.8 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[styles.plateShadow, wordmark]}>
        <Glass cornerRadius={32}>
          <View style={styles.plateInner}>
            <Text style={[styles.wordmark, { color: t.text }]}>Luma</Text>
          </View>
        </Glass>
      </Animated.View>
      <Animated.Text style={[styles.tag, { color: t.muted }, tagline]}>
        Your money, calmly understood.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  plateShadow: {
    boxShadow: "0 0 40px rgba(91,140,255,0.4)",
  },
  plateInner: {
    paddingHorizontal: 36,
    paddingVertical: 24,
  },
  wordmark: {
    fontSize: 56,
    fontWeight: "700",
    letterSpacing: -2,
  },
  tag: { ...typography.caption },
  glow: {
    position: "absolute",
    width: 380,
    height: 380,
    borderRadius: 190,
    borderCurve: "continuous",
    overflow: "hidden",
  },
});
