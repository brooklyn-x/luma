import { StyleSheet, View, type ViewProps } from "react-native";
import { Glass } from "@/components/ui/glass";
import { radius, useTheme } from "@/theme";

type Props = ViewProps & {
  padding?: number;
  variant?: "matte" | "elevated" | "subtle";
  cornerRadius?: number;
};

export function Card({
  children,
  style,
  padding = 20,
  variant = "elevated",
  cornerRadius = radius.card,
  ...rest
}: Props) {
  const t = useTheme();

  if (variant === "elevated") {
    return (
      <View
        style={[{ borderRadius: cornerRadius, borderCurve: "continuous" }, style]}
        {...rest}
      >
        <Glass cornerRadius={cornerRadius}>
          <View style={{ padding }}>{children}</View>
        </Glass>
      </View>
    );
  }

  return (
    <View
      style={[
        {
          backgroundColor: t.tileFill,
          borderRadius: cornerRadius,
          borderCurve: "continuous",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: t.tileBorder,
          padding,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
