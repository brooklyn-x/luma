import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ContinueButton } from "@/components/onboarding/continue-button";
import { FeatureRow } from "@/components/onboarding/feature-row";
import { HeroIcon } from "@/components/onboarding/hero-icon";
import { Glass } from "@/components/ui/glass";
import { SF } from "@/components/ui/sf";
import type { Provider } from "@/lib/email-provider";
import { haptics } from "@/services/haptics";
import { useAuthStore } from "@/stores/auth-store";
import { colors, spacing, typography, useTheme } from "@/theme";

const trustItems = [
  {
    symbol: "eye",
    tint: colors.blue,
    title: "Read-only access",
    body: "Luma only reads transaction emails. We can't send or modify anything.",
  },
  {
    symbol: "lock.fill",
    tint: colors.purple,
    title: "No password storage",
    body: "Authentication runs through OAuth. We never see your password.",
  },
  {
    symbol: "checkmark.shield",
    tint: colors.green,
    title: "No OTP scanning",
    body: "Luma ignores OTP-style emails entirely.",
  },
  {
    symbol: "lock.rectangle.stack",
    tint: colors.pink,
    title: "Encrypted on device",
    body: "Tokens kept in iOS Keychain / Android Keystore. Nothing leaves your phone.",
  },
];

const COPY: Record<Provider, { title: string; subtitle: string; cta: string }> = {
  google: {
    title: "Connect to Gmail",
    subtitle: "Luma reads transaction emails to categorize spending. Nothing else.",
    cta: "Connect Gmail",
  },
  microsoft: {
    title: "Connect to Outlook",
    subtitle:
      "Luma reads transaction emails from your Microsoft account to categorize spending. Nothing else.",
    cta: "Connect Outlook",
  },
};

export default function ConnectPermission() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { provider } = useLocalSearchParams<{ provider?: Provider }>();
  const resolvedProvider: Provider =
    provider === "microsoft" ? "microsoft" : "google";
  const signInGoogle = useAuthStore((s) => s.signInGoogle);
  const signInMicrosoft = useAuthStore((s) => s.signInMicrosoft);
  const [busy, setBusy] = useState(false);

  const copy = COPY[resolvedProvider];

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (resolvedProvider === "google") {
        await signInGoogle();
      } else {
        await signInMicrosoft();
      }
      router.replace("/syncing");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed";
      if (!/cancel/i.test(message)) {
        Alert.alert(`Couldn't connect ${resolvedProvider === "google" ? "Gmail" : "Outlook"}`, message);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={[styles.backWrap, { top: insets.top + 8 }]}
      >
        <Glass cornerRadius={16}>
          <View style={styles.backInner}>
            <SF name="chevron.left" size={16} tint={t.text} />
          </View>
        </Glass>
      </Pressable>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroWrap}>
          <HeroIcon symbol="envelope.fill" tint={colors.blue} />
        </View>

        <Text style={[styles.title, { color: t.text }]}>{copy.title}</Text>
        <Text style={[styles.subtitle, { color: t.muted }]}>{copy.subtitle}</Text>

        <View style={styles.features}>
          {trustItems.map((f) => (
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
          label={busy ? "Connecting…" : copy.cta}
          icon={<SF name="envelope.fill" size={18} tint="#FFFFFF" />}
          onPress={handleConnect}
        />
        <Pressable
          onPress={() => {
            haptics.dismiss();
            router.back();
          }}
          style={styles.cancel}
        >
          <Text style={[styles.cancelText, { color: t.muted }]}>Not now</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backWrap: {
    position: "absolute",
    left: spacing.hPad,
    width: 32,
    height: 32,
    zIndex: 2,
  },
  backInner: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
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
  cancel: { alignItems: "center", paddingVertical: 6 },
  cancelText: { ...typography.caption, fontSize: 14 },
});
