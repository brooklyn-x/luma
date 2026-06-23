import { StyleSheet, View, type ViewStyle } from "react-native";
import { useTheme } from "@/theme";

type Props = {
  children?: React.ReactNode;
  cornerRadius?: number;
  interactive?: boolean;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  fallbackTint?: string;
};

export function Glass({ children, cornerRadius = 24, style }: Props) {
  const t = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: cornerRadius,
          borderCurve: "continuous" as const,
          overflow: "hidden" as const,
          backgroundColor: t.tileFill,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.tileBorder,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
