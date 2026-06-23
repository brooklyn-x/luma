import { router, Stack } from "expo-router";
import {
  PlatformColor,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SF } from "@/components/ui/sf";
import { MerchantLogo } from "@/components/ui/merchant-logo";
import {
  useNotifications,
  type AppNotification,
} from "@/hooks/use-notifications";
import { useTabScreenBottomPadding } from "@/lib/tab-safe-area";
import { haptics } from "@/services/haptics";
import {
  spacing,
  typography,
  useCardShadow,
  useTheme,
  type Palette,
} from "@/theme";
import { formatCurrency, formatRelativeDay } from "@/utils/format";

export default function Notifications() {
  const t = useTheme();
  const cardShadow = useCardShadow();
  const bottomPad = useTabScreenBottomPadding();
  const { items } = useNotifications();

  const unread = items.filter((n) => n.unread);
  const earlier = items.filter((n) => !n.unread);

  const open = (n: AppNotification) => {
    if (!n.txId) return;
    haptics.tap();
    router.push({ pathname: "/transaction/[id]", params: { id: n.txId } });
  };

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: "",
          headerTintColor: PlatformColor("label") as unknown as string,
          headerShadowVisible: false,
          headerBackButtonDisplayMode: "minimal",
        }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: t.text }]}>Notifications</Text>

        {items.length === 0 ? (
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: t.limeSoft }]}>
              <SF name="bell.fill" size={26} tint={t.limeSoftInk} />
            </View>
            <Text style={[styles.emptyTitle, { color: t.text }]}>
              You&apos;re all caught up
            </Text>
            <Text style={[styles.emptyBody, { color: t.muted }]}>
              We&apos;ll let you know about bills and renewals.
            </Text>
          </View>
        ) : (
          <>
            {unread.length > 0 ? (
              <Section
                title="New"
                items={unread}
                t={t}
                shadow={cardShadow}
                onPress={open}
              />
            ) : null}
            {earlier.length > 0 ? (
              <Section
                title="Earlier"
                items={earlier}
                t={t}
                shadow={cardShadow}
                onPress={open}
              />
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  items,
  t,
  shadow,
  onPress,
}: {
  title: string;
  items: AppNotification[];
  t: Palette;
  shadow: string;
  onPress: (n: AppNotification) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.muted }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: t.card, boxShadow: shadow }]}>
        {items.map((n, idx) => (
          <View key={n.id}>
            <Row n={n} t={t} onPress={onPress} />
            {idx < items.length - 1 ? (
              <View style={[styles.divider, { backgroundColor: t.divider }]} />
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function Row({
  n,
  t,
  onPress,
}: {
  n: AppNotification;
  t: Palette;
  onPress: (n: AppNotification) => void;
}) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => onPress(n)}
      disabled={!n.txId}
    >
      <View style={styles.avatar}>
        {n.merchantId ? (
          <MerchantLogo merchantId={n.merchantId} size={44} />
        ) : (
          <View style={[styles.iconChip, { backgroundColor: `${n.tint}1F` }]}>
            <SF name="creditcard" size={20} tint={n.tint} />
          </View>
        )}
        {n.unread ? (
          <View style={[styles.unreadDot, { backgroundColor: t.lime, borderColor: t.card }]} />
        ) : null}
      </View>

      <View style={styles.middle}>
        <Text style={[styles.title, { color: t.text }]} numberOfLines={1}>
          {n.title}
        </Text>
        <Text style={[styles.body, { color: t.muted }]} numberOfLines={1}>
          {n.body} · {formatRelativeDay(n.date)}
        </Text>
      </View>

      {n.amount != null ? (
        <Text style={[styles.amount, { color: t.text }]}>
          {formatCurrency(n.amount)}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.hPad },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    paddingTop: 4,
    paddingBottom: 4,
  },
  section: { marginTop: 18, gap: 10 },
  sectionTitle: {
    ...typography.micro,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    fontWeight: "700",
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 22,
    borderCurve: "continuous",
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingVertical: 13,
  },
  avatar: { width: 44, height: 44 },
  iconChip: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  middle: { flex: 1, gap: 2 },
  title: { ...typography.body, fontSize: 15, fontWeight: "700" },
  body: { ...typography.caption },
  amount: {
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  divider: { height: StyleSheet.hairlineWidth },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingTop: 100,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", letterSpacing: -0.3 },
  emptyBody: { ...typography.caption, fontSize: 14, textAlign: "center" },
});
