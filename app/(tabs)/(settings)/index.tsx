import { router, Stack } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SF } from "@/components/ui/sf";
import { fonts } from "@/lib/fonts";
import { useSyncMutation } from "@/hooks/use-transactions";
import { useTabScreenBottomPadding, useTabScreenTopPadding } from "@/lib/tab-safe-area";
import { haptics } from "@/services/haptics";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore, type ThemeMode } from "@/stores/theme-store";
import { colors, spacing, typography, useCardShadow, useIsDark, useTheme, type Palette } from "@/theme";

export default function SettingsIndex() {
  const t = useTheme();
  const isDark = useIsDark();
  const cardShadow = useCardShadow();
  const topPad = useTabScreenTopPadding();
  const bottomPad = useTabScreenBottomPadding();
  const { gmailEmail, disconnect } = useAuthStore();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const [notifications, setNotifications] = useState(true);

  const onToggleDark = (next: boolean) => {
    setThemeMode(next ? "dark" : "light");
  };

  const onCycleMode = () => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    const nextIdx = (order.indexOf(themeMode) + 1) % order.length;
    haptics.selection();
    setThemeMode(order[nextIdx]);
  };

  const themeSubLabel =
    themeMode === "system"
      ? "Follows system appearance"
      : themeMode === "dark"
        ? "Always-on dark interface"
        : "Always-on light interface";

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "Settings" }} />

      <Text style={[styles.screenTitle, { color: t.text }]}>Settings</Text>

      <View style={styles.section}>
        <View
          style={[styles.card, { backgroundColor: t.card, boxShadow: cardShadow }]}
        >
          <View style={[styles.row, { paddingVertical: 18 }]}>
            <View style={styles.iconWrap}>
              <SF name="envelope.fill" size={21} tint={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: t.text }]}>Connected Gmail</Text>
              <Text style={[styles.subLabel, { color: t.muted }]}>
                {gmailEmail ?? "Not connected"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <SectionTitle label="Sync" t={t} />
      <View style={styles.section}>
        <View
          style={[styles.card, { backgroundColor: t.card, boxShadow: cardShadow }]}
        >
          <ActionRow
            t={t}
            symbol="arrow.clockwise"
            label="Resync inbox"
            sub="Full re-scan — last 180 days of receipts"
            onPress={() => {
              haptics.tap();
              router.push({
                pathname: "/syncing",
                params: { full: "1" },
              });
            }}
          />
          <Divider t={t} />
          <ActionRow
            t={t}
            symbol="doc.text.magnifyingglass"
            label="View sync log"
            sub="What was parsed, skipped, or errored"
            onPress={() => {
              haptics.tap();
              router.push("/sync-log");
            }}
          />
        </View>
      </View>

      <SectionTitle label="Preferences" t={t} />
      <View style={styles.section}>
        <View
          style={[styles.card, { backgroundColor: t.card, boxShadow: cardShadow }]}
        >
          <ToggleRow
            t={t}
            symbol="bell.fill"
            label="Notifications"
            sub="Weekly insights and renewal reminders"
            value={notifications}
            onValueChange={setNotifications}
          />
          <Divider t={t} />
          <ToggleRow
            t={t}
            symbol="moon.fill"
            label="Dark mode"
            sub={themeSubLabel}
            value={isDark}
            onValueChange={onToggleDark}
            onLabelPress={onCycleMode}
          />
        </View>
      </View>

      <SectionTitle label="Privacy" t={t} />
      <View style={styles.section}>
        <View
          style={[styles.card, { backgroundColor: t.card, boxShadow: cardShadow }]}
        >
          <ActionRow
            t={t}
            symbol="lock.shield"
            label="Privacy & data"
            sub="What Luma reads, where it lives"
            onPress={() => undefined}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          onPress={() => {
            haptics.destructive();
            disconnect().then(() => router.replace("/onboarding"));
          }}
        >
          <View
            style={[styles.card, { backgroundColor: t.card, boxShadow: cardShadow }]}
          >
            <View style={styles.row}>
              <View style={styles.iconWrap}>
                <SF name="rectangle.portrait.and.arrow.right" size={21} tint={t.red} />
              </View>
              <Text style={[styles.label, { color: t.red, flex: 1 }]}>Disconnect Gmail</Text>
            </View>
          </View>
        </Pressable>
      </View>

      <Text style={[styles.version, { color: t.muted }]}>Luma · v1.0.0</Text>
    </ScrollView>
  );
}

function SectionTitle({ label, t }: { label: string; t: Palette }) {
  return <Text style={[styles.sectionTitle, { color: t.text }]}>{label}</Text>;
}

function ActionRow({
  t,
  symbol,
  label,
  sub,
  onPress,
}: {
  t: Palette;
  symbol: string;
  label: string;
  sub?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.iconWrap}>
        <SF name={symbol} size={21} tint={t.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: t.text }]}>{label}</Text>
        {sub ? <Text style={[styles.subLabel, { color: t.muted }]}>{sub}</Text> : null}
      </View>
      <SF name="chevron.right" size={16} tint={t.muted} />
    </Pressable>
  );
}

function ToggleRow({
  t,
  symbol,
  label,
  sub,
  value,
  onValueChange,
  onLabelPress,
}: {
  t: Palette;
  symbol: string;
  label: string;
  sub?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  onLabelPress?: () => void;
}) {
  const labelContent = (
    <View style={{ flex: 1 }}>
      <Text style={[styles.label, { color: t.text }]}>{label}</Text>
      {sub ? <Text style={[styles.subLabel, { color: t.muted }]}>{sub}</Text> : null}
    </View>
  );

  return (
    <View style={styles.row}>
      <View style={styles.iconWrap}>
        <SF name={symbol} size={21} tint={t.text} />
      </View>
      {onLabelPress ? (
        <Pressable onPress={onLabelPress} style={{ flex: 1 }} hitSlop={6}>
          {labelContent}
        </Pressable>
      ) : (
        labelContent
      )}
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: t.tileBorder, true: t.lime }}
        thumbColor="#fff"
        ios_backgroundColor={t.tileBorder}
      />
    </View>
  );
}

function Divider({ t }: { t: Palette }) {
  return <View style={[styles.divider, { backgroundColor: t.divider }]} />;
}

const styles = StyleSheet.create({
  screenTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
    paddingHorizontal: spacing.hPad,
    paddingTop: 4,
  },
  section: { paddingHorizontal: spacing.hPad, marginTop: 12 },
  card: {
    borderRadius: 24,
    borderCurve: "continuous",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.2,
    paddingHorizontal: spacing.hPad,
    paddingTop: 26,
    paddingBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { ...typography.body, fontFamily: fonts.medium, fontWeight: "500" },
  subLabel: { ...typography.caption, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 18,
  },
  version: {
    ...typography.micro,
    textAlign: "center",
    marginTop: 28,
  },
});
