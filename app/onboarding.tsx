import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContinueButton } from "@/components/onboarding/continue-button";
import { FeatureRow } from "@/components/onboarding/feature-row";
import { HeroIcon } from "@/components/onboarding/hero-icon";
import { SF } from "@/components/ui/sf";
import { colors, spacing, typography, useTheme } from "@/theme";

const features = [
  {
    symbol: "envelope.fill",
    tint: colors.blue,
    title: "Auto-detected from your inbox",
    body: "Receipts read straight from your email. No manual entry.",
  },
  {
    symbol: "arrow.triangle.2.circlepath",
    tint: colors.purple,
    title: "Subscriptions surfaced",
    body: "We catch recurring charges so nothing slips by.",
  },
  {
    symbol: "chart.pie.fill",
    tint: colors.pink,
    title: "Spend by category",
    body: "Food, travel, bills — see where your money goes.",
  },
  {
    symbol: "lock.shield",
    tint: colors.green,
    title: "Private & on-device",
    body: "Read-only mailbox access. Tokens stored securely on your phone.",
  },
];

export default function Onboarding() {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 220 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <HeroIcon symbol="sparkles" tint={colors.blue} />
        </View>

        <Text style={[styles.title, { color: t.text }]}>Welcome to Luma</Text>
        <Text style={[styles.subtitle, { color: t.muted }]}>
          Track every rupee, automatically. Connect your inbox and Luma does the rest.
        </Text>

        <View style={styles.features}>
          {features.map((f) => (
            <FeatureRow key={f.title} {...f} />
          ))}
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + 20, backgroundColor: t.background },
        ]}
      >
        <ContinueButton
          label="Continue with Google"
          icon={<SF name="envelope.fill" size={18} tint="#FFFFFF" />}
          onPress={() =>
            router.push({
              pathname: "/connect-permission",
              params: { provider: "google" },
            })
          }
        />
        <ContinueButton
          label="Continue with Microsoft"
          variant="secondary"
          icon={<SF name="envelope" size={18} tint={t.text} />}
          onPress={() =>
            router.push({
              pathname: "/connect-permission",
              params: { provider: "microsoft" },
            })
          }
        />
        <Text style={[styles.fineprint, { color: t.muted }]}>
          Read-only access. Encrypted on device.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: spacing.hPad },
  heroWrap: { alignItems: "center", marginBottom: 24 },
  title: {
    ...typography.h2,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  subtitle: {
    ...typography.body,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 12,
  },
  features: { marginTop: 36, gap: 4 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.hPad,
    paddingTop: 16,
    gap: 10,
  },
  fineprint: {
    ...typography.micro,
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
