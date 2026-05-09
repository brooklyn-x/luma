import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { merchants } from "@/data/merchants";
import { deterministicColor } from "@/utils/merchant-display";

type Props = {
  merchantId: string;
  size?: number;
  name?: string;
};

export function MerchantLogo({ merchantId, size = 44, name }: Props) {
  const m = merchants[merchantId];
  const displayN = name ?? m?.name ?? merchantId;
  const initial =
    (m?.initial && m.initial.length > 0 ? m.initial : displayN.charAt(0).toUpperCase()) || "•";
  const bg = m?.color ?? deterministicColor(merchantId);

  const isLight = bg === "#FFFFFF" || bg === "#A2AAAD";
  const fg = isLight ? "#0B0B0D" : "#FFFFFF";

  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.32)", "rgba(255,255,255,0)"]}
        start={{ x: 0.4, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={[StyleSheet.absoluteFillObject, { borderRadius: size / 2 }]}
        pointerEvents="none"
      />
      <Text
        style={{
          color: fg,
          fontWeight: "700",
          fontSize: size * 0.42,
          letterSpacing: -0.5,
        }}
      >
        {initial}
      </Text>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          {
            borderRadius: size / 2,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: "rgba(255,255,255,0.18)",
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
