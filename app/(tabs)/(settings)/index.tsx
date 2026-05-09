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
import { useSyncMutation } from "@/hooks/use-transactions";
import { haptics } from "@/services/haptics";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore, type ThemeMode } from "@/stores/theme-store";
import { colors, spacing, typography, useIsDark, useTheme, type Palette } from "@/theme";

export default function SettingsIndex() {
  const t = useTheme();
  const isDark = useIsDark();
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
      contentContainerStyle={{ paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      <Stack.Screen options={{ title: "Settings" }} />

      <View style={styles.section}>
        <View
          style={[styles.card, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}
        >
          <View style={[styles.row, { paddingVertical: 18 }]}>
            <View style={[styles.iconWrap, { backgroundColor: "rgba(91,140,255,0.22)", borderColor: t.tileBorder }]}>
              <SF name="envelope.fill" size={18} tint={colors.blue} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: t.text }]}>Connected Gmail</Text>
              <Text style={[styles.subLabel, { color: t.muted }]}>
                {gmailEmail ?? "Not connected"}
              </Text>
            </View>
            <View style={[styles.dot, { backgroundColor: t.green }]} />
          </View>
        </View>
      </View>

      <SectionTitle label="Sync" t={t} />
      <View style={styles.section}>
        <View
          style={[styles.card, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}
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
          style={[styles.card, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}
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
          style={[styles.card, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}
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
            style={[styles.card, { backgroundColor: t.tileFill, borderColor: t.tileBorder }]}
          >
            <View style={styles.row}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: "rgba(239,68,68,0.18)", borderColor: t.tileBorder },
                ]}
              >
                <SF name="rectangle.portrait.and.arrow.right" size={18} tint={t.red} />
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
  return <Text style={[styles.sectionTitle, { color: t.muted }]}>{label}</Text>;
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
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: t.tileHighlight, borderColor: t.tileBorder },
        ]}
      >
        <SF name={symbol} size={18} tint={t.text} />
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
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: t.tileHighlight, borderColor: t.tileBorder },
        ]}
      >
        <SF name={symbol} size={18} tint={t.text} />
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
        trackColor={{ false: t.tileBorder, true: colors.blue }}
        thumbColor="#fff"
        ios_backgroundColor={t.tileBorder}
      />
    </View>
  );
}

function Divider({ t }: { t: Palette }) {
  return <View style={[styles.divider, { backgroundColor: t.tileBorder }]} />;
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: spacing.hPad, marginTop: 12 },
  card: {
    borderRadius: 20,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionTitle: {
    ...typography.micro,
    textTransform: "uppercase",
    paddingHorizontal: spacing.hPad,
    paddingTop: 22,
    paddingBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderCurve: "continuous",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  label: { ...typography.body, fontWeight: "500" },
  subLabel: { ...typography.caption, marginTop: 2 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 64,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    boxShadow: "0 0 6px rgba(52,211,153,0.7)",
  },
  version: {
    ...typography.micro,
    textAlign: "center",
    marginTop: 28,
  },
});
