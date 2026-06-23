import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContinueButton } from "@/components/onboarding/continue-button";
import { FeatureRow } from "@/components/onboarding/feature-row";
import { SF } from "@/components/ui/sf";
import { spacing, typography, useIsDark, useTheme } from "@/theme";

const features = [
  {
    symbol: "envelope.fill",
    title: "Auto-sync from Gmail",
    body: "Receipts read straight from your inbox. No manual entry, ever.",
  },
  {
    symbol: "chart.pie.fill",
    title: "Spend by category",
    body: "Food, travel, bills — see where it really goes.",
  },
  {
    symbol: "arrow.triangle.2.circlepath",
    title: "Bills & subscriptions",
    body: "We catch recurring charges so you never miss a renewal.",
  },
];

export default function Onboarding() {
  const t = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const accent = isDark ? t.limeMid : t.lime;

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 260 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={[t.lime, t.limeStrong]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroWatermark} pointerEvents="none">
            <Text style={styles.heroWatermarkText}>{"₹ ".repeat(60)}</Text>
          </View>
          <View style={styles.heroContent}>
            <Text style={styles.heroLabel}>SPENT IN JUNE</Text>
            <Text style={styles.heroAmount}>₹84,290</Text>
          </View>
        </LinearGradient>

        <Text style={[styles.title, { color: t.text }]}>
          Your inbox is a bank statement.
        </Text>
        <Text style={[styles.subtitle, { color: t.muted }]}>
          Luma reads the receipts already in your Gmail and turns them into a clean
          money timeline.
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
          icon={<SF name="envelope.fill" size={18} tint={accent} />}
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
  hero: {
    height: 190,
    borderRadius: 26,
    borderCurve: "continuous",
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 22,
  },
  heroWatermark: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ rotate: "-8deg" }, { scale: 1.3 }],
  },
  heroWatermarkText: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
    lineHeight: 30,
    color: "rgba(0,0,0,0.07)",
  },
  heroContent: { position: "relative" },
  heroLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(26,46,5,0.7)",
  },
  heroAmount: {
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.5,
    marginTop: 2,
    color: "#1A2E05",
    fontVariant: ["tabular-nums"],
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.8,
    lineHeight: 35,
    marginTop: 28,
  },
  subtitle: {
    ...typography.body,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },
  features: { marginTop: 28, gap: 4 },
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
