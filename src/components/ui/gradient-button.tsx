import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Glass } from "@/components/ui/glass";
import { haptics } from "@/services/haptics";
import { gradient, radius, shadows, typography, useTheme } from "@/theme";

type Props = {
  label: string;
  onPress?: () => void;
  icon?: React.ReactNode;
  style?: ViewStyle;
  variant?: "primary" | "ghost";
  disabled?: boolean;
};

export function GradientButton({
  label,
  onPress,
  icon,
  style,
  variant = "primary",
  disabled,
}: Props) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 18, stiffness: 280 });
  };
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 220 });
  };
  const handlePress = () => {
    if (disabled) return;
    haptics.light();
    onPress?.();
  };

  if (variant === "ghost") {
    return (
      <Animated.View style={[animated, style]}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled}
        >
          <Glass cornerRadius={radius.button}>
            <View style={styles.ghostInner}>
              <View style={styles.row}>
                {icon}
                <Text style={[styles.label, { color: t.text }]}>{label}</Text>
              </View>
            </View>
          </Glass>
        </Pressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[{ boxShadow: shadows.glow }, animated, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [{ opacity: disabled ? 0.5 : pressed ? 0.95 : 1 }]}
      >
        <View style={styles.gradientWrap}>
          <LinearGradient
            colors={gradient.primary as unknown as readonly [string, string]}
            start={gradient.start}
            end={gradient.end}
            style={styles.gradient}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.32)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.gradientSheen}
              pointerEvents="none"
            />
            <View style={styles.row}>
              {icon}
              <Text style={styles.label}>{label}</Text>
            </View>
            <View pointerEvents="none" style={styles.gradientRing} />
          </LinearGradient>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  gradientWrap: {
    borderRadius: radius.button,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: radius.button,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gradientSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 24,
  },
  gradientRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radius.button,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.32)",
  },
  ghostInner: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: { ...typography.body, fontWeight: "600", color: "#FFFFFF" },
});
