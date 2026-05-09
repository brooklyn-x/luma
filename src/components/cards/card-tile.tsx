import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import type { Card } from "@/data/cards";
import { typography } from "@/theme";
import { formatCurrency } from "@/utils/format";

type Props = {
  card: Card;
  thisMonthSpend: number;
};

export function CardTile({ card, thisMonthSpend }: Props) {
  const fg = card.contrast === "light" ? "#FFFFFF" : "#0B0B0D";
  const fgMuted = card.contrast === "light" ? "rgba(255,255,255,0.72)" : "rgba(11,11,13,0.6)";
  const sheen =
    card.contrast === "light"
      ? ["rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]
      : ["rgba(255,255,255,0.5)", "rgba(255,255,255,0)"];

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[card.gradientFrom, card.gradientTo]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={sheen as unknown as readonly [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.sheen}
        pointerEvents="none"
      />
      <View style={styles.body}>
        <View style={styles.topRow}>
          <Text style={[styles.issuer, { color: fg }]}>{card.issuer}</Text>
          <Text style={[styles.kind, { color: fgMuted }]}>{card.kind.toUpperCase()}</Text>
        </View>
        <View style={styles.bottomRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.productName, { color: fgMuted }]}>{card.productName}</Text>
            <Text style={[styles.last4, { color: fg }]}>
              {card.last4 ? `•• ${card.last4}` : "UPI"}
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.spendLabel, { color: fgMuted }]}>This month</Text>
            <Text style={[styles.spend, { color: fg }]}>{formatCurrency(thisMonthSpend)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    aspectRatio: 1.6,
    borderRadius: 22,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  body: {
    flex: 1,
    padding: 18,
    justifyContent: "space-between",
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  issuer: { ...typography.body, fontWeight: "700", letterSpacing: -0.3 },
  kind: { ...typography.micro, fontWeight: "600", letterSpacing: 1 },
  bottomRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  productName: { ...typography.micro, textTransform: "uppercase", letterSpacing: 0.8 },
  last4: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  spendLabel: { ...typography.micro, textTransform: "uppercase", letterSpacing: 0.6 },
  spend: { ...typography.body, fontWeight: "700", marginTop: 2, fontVariant: ["tabular-nums"] },
});
