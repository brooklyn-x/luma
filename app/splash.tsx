import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Glass } from "@/components/ui/glass";
import { useAuthStore } from "@/stores/auth-store";
import { typography, useTheme } from "@/theme";

export default function Splash() {
  const t = useTheme();
  const connected = useAuthStore((s) => s.connected);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(connected ? "/(tabs)/(home)" : "/onboarding");
    }, 800);
    return () => clearTimeout(timer);
  }, [connected]);

  return (
    <View style={[styles.root, { backgroundColor: t.background }]}>
      <Glass cornerRadius={32}>
        <View style={styles.plateInner}>
          <Text style={[styles.wordmark, { color: t.text }]}>Luma</Text>
        </View>
      </Glass>
      <Text style={[styles.tag, { color: t.muted }]}>
        Your money, calmly understood.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  plateInner: {
    paddingHorizontal: 36,
    paddingVertical: 24,
  },
  wordmark: {
    fontSize: 56,
    fontWeight: "700",
    letterSpacing: -2,
  },
  tag: { ...typography.caption },
});
