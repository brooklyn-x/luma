import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import { SF } from "@/components/ui/sf";
import { merchants } from "@/data/merchants";
import type { Transaction } from "@/data/types";
import { haptics } from "@/services/haptics";
import { categoryColors, typography, useTheme } from "@/theme";
import { formatCurrency, formatTime } from "@/utils/format";

type Props = {
  transaction: Transaction;
  showTime?: boolean;
};

export function TransactionCard({ transaction, showTime = true }: Props) {
  const t = useTheme();
  const scale = useSharedValue(1);
  const merchant = merchants[transaction.merchantId];
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => {
    scale.value = withSpring(0.98, { damping: 18, stiffness: 320 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 240 });
  };

  return (
    <Animated.View style={animated}>
      <Link href={`/transaction/${transaction.id}`} asChild>
        <Link.Trigger>
          <Pressable
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            onPress={() => haptics.selection()}
          >
            <View
              style={[
                styles.row,
                {
                  backgroundColor: t.tileFill,
                  borderColor: t.tileBorder,
                },
              ]}
            >
              <MerchantLogo merchantId={transaction.merchantId} size={44} />
              <View style={styles.middle}>
                <View style={styles.titleRow}>
                  <Text style={[styles.merchant, { color: t.text }]} numberOfLines={1}>
                    {merchant?.name ?? transaction.merchantName ?? "Unknown"}
                  </Text>
                  {transaction.recurring ? (
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: t.tileHighlight,
                          borderColor: t.tileBorder,
                        },
                      ]}
                    >
                      <SF name="arrow.triangle.2.circlepath" size={10} tint={t.muted} />
                      <Text style={[styles.badgeText, { color: t.muted }]}>Recurring</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.sub, { color: t.muted }]} numberOfLines={1}>
                  <Text
                    style={[
                      styles.sub,
                      { color: categoryColors[transaction.category] ?? t.muted },
                    ]}
                  >
                    {transaction.category}
                  </Text>
                  <Text style={[styles.sub, { color: t.muted }]}>{` · ${transaction.paymentSource}`}</Text>
                  {showTime ? (
                    <Text style={[styles.sub, { color: t.muted }]}>{` · ${formatTime(transaction.date)}`}</Text>
                  ) : null}
                </Text>
              </View>
              <Text style={[styles.amount, { color: t.text }]}>
                −{formatCurrency(transaction.amount)}
              </Text>
            </View>
          </Pressable>
        </Link.Trigger>
        <Link.Preview />
        <Link.Menu>
          <Link.MenuAction
            title="Mark recurring"
            icon="arrow.triangle.2.circlepath"
            onPress={() => undefined}
          />
          <Link.MenuAction
            title="Recategorize"
            icon="folder"
            onPress={() => undefined}
          />
          <Link.MenuAction
            title="Hide"
            icon="eye.slash"
            destructive
            onPress={() => undefined}
          />
        </Link.Menu>
      </Link>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  middle: { flex: 1, gap: 4 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  merchant: { ...typography.body, fontWeight: "600", flexShrink: 1 },
  sub: { ...typography.caption },
  amount: { ...typography.body, fontWeight: "600", fontVariant: ["tabular-nums"] },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: { ...typography.micro },
});
