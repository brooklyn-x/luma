import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { useIsDark, useTheme } from "@/theme";

type Props = {
  children?: React.ReactNode;
  cornerRadius?: number;
  interactive?: boolean;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  fallbackTint?:
    | "systemMaterial"
    | "systemThinMaterial"
    | "systemUltraThinMaterial"
    | "systemThickMaterial"
    | "systemChromeMaterial"
    | "dark"
    | "light"
    | "default"
    | "prominent";
};

const liquidGlassAvailable = isLiquidGlassAvailable();

export function Glass({
  children,
  cornerRadius = 24,
  interactive,
  style,
  intensity = 80,
  fallbackTint,
}: Props) {
  const t = useTheme();
  const isDark = useIsDark();

  const shellStyle = [
    {
      borderRadius: cornerRadius,
      borderCurve: "continuous" as const,
      overflow: "hidden" as const,
    },
    style,
  ];

  if (!isDark) {
    return (
      <View
        style={[
          shellStyle,
          {
            backgroundColor: t.card,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.tileBorder,
          },
        ]}
      >
        {children}
      </View>
    );
  }

  if (liquidGlassAvailable) {
    return (
      <GlassView style={shellStyle} isInteractive={interactive}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={shellStyle}>
      <BlurView
        tint={fallbackTint ?? "systemMaterial"}
        intensity={intensity}
        experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: t.liveOverlay }]}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: cornerRadius,
            borderCurve: "continuous",
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: t.innerRing,
          },
        ]}
      />
      {children}
    </View>
  );
}
