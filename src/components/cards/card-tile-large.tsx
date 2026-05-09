import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import type { Card } from "@/data/cards";
import { typography } from "@/theme";
import { formatCurrency } from "@/utils/format";

type Props = {
  card: Card;
  thisMonthSpend: number;
  txCount: number;
};

export function CardTileLarge({ card, thisMonthSpend, txCount }: Props) {
  const hasImage = !!card.image;
  const fg = card.contrast === "light" ? "#FFFFFF" : "#0B0B0D";
  const fgMuted =
    card.contrast === "light" ? "rgba(255,255,255,0.72)" : "rgba(11,11,13,0.6)";
  const sheen =
    card.contrast === "light"
      ? ["rgba(255,255,255,0.24)", "rgba(255,255,255,0)"]
      : ["rgba(255,255,255,0.55)", "rgba(255,255,255,0)"];

  return (
    <View style={styles.shell}>
      {hasImage ? (
        <>
          <Image
            source={card.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={styles.imageOverlay} pointerEvents="none">
            <View style={styles.infoChip}>
              {card.last4 || card.kind === "upi" ? (
                <Text style={styles.infoLast4} numberOfLines={1}>
                  {card.last4 ? `•• ${card.last4}` : "UPI"}
                </Text>
              ) : null}
              <View style={styles.infoStatsRow}>
                <View>
                  <Text style={styles.infoLabel}>Spent this month</Text>
                  <Text style={styles.infoStat}>{formatCurrency(thisMonthSpend)}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.infoLabel}>Transactions</Text>
                  <Text style={styles.infoStat}>{txCount}</Text>
                </View>
              </View>
            </View>
          </View>
        </>
      ) : (
        <>
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
            </View>
            <View>
              <Text style={[styles.productName, { color: fgMuted }]}>{card.productName}</Text>
              <Text style={[styles.last4, { color: fg }]}>
                {card.last4 ? `•• ${card.last4}` : "UPI"}
              </Text>
            </View>
            <View style={styles.bottomRow}>
              <View>
                <Text style={[styles.spendLabel, { color: fgMuted }]}>Spent this month</Text>
                <Text style={[styles.spend, { color: fg }]}>{formatCurrency(thisMonthSpend)}</Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.spendLabel, { color: fgMuted }]}>Transactions</Text>
                <Text style={[styles.spend, { color: fg }]}>{txCount}</Text>
              </View>
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    height: 220,
    borderRadius: 26,
    borderCurve: "continuous",
    overflow: "hidden",
    backgroundColor: "#000",
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  body: { flex: 1, padding: 22, justifyContent: "space-between" },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  imageOverlay: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 16,
  },
  infoChip: {
    backgroundColor: "rgba(0,0,0,0.78)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderCurve: "continuous",
    gap: 10,
  },
  infoLast4: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 1.4,
    fontVariant: ["tabular-nums"],
  },
  infoStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 16,
  },
  infoLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  infoStat: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    marginTop: 2,
  },
  issuer: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  kind: { ...typography.micro, fontWeight: "600", letterSpacing: 1 },
  productName: { ...typography.micro, textTransform: "uppercase", letterSpacing: 0.8 },
  last4: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginTop: 4,
    fontVariant: ["tabular-nums"],
  },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  spendLabel: { ...typography.micro, textTransform: "uppercase", letterSpacing: 0.6 },
  spend: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
});
