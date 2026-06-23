import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { haptics } from "@/services/haptics";
import { useTheme } from "@/theme";

type Props = {
  label: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary";
};

export function ContinueButton({
  label,
  icon,
  onPress,
  variant = "primary",
}: Props) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => {
    scale.value = withSpring(0.97, { damping: 18, stiffness: 280 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 220 });
  };
  const handlePress = () => {
    haptics.press();
    onPress?.();
  };

  const isSecondary = variant === "secondary";
  const bg = isSecondary ? t.tileFill : t.text;
  const fg = isSecondary ? t.text : t.background;
  const border = isSecondary ? t.tileBorder : "transparent";

  return (
    <Animated.View style={animated}>
      <Pressable onPress={handlePress} onPressIn={onPressIn} onPressOut={onPressOut}>
        <View
          style={[
            styles.button,
            {
              backgroundColor: bg,
              borderColor: border,
              borderWidth: isSecondary ? StyleSheet.hairlineWidth : 0,
            },
          ]}
        >
          <View style={styles.row}>
            {icon}
            <Text style={[styles.label, { color: fg }]}>{label}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 17,
    borderRadius: 18,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  label: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
});
