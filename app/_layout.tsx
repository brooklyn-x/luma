import { focusManager } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { AppState, PlatformColor, View, type AppStateStatus } from "react-native";
import "@/global.css";
import { applyGlobalFont, fontAssets } from "@/lib/fonts";
import { RootProvider } from "@/providers/root-provider";
import { useAuthStore } from "@/stores/auth-store";
import { useThemeStore } from "@/stores/theme-store";
import { useIsDark, useTheme } from "@/theme";

// Route every <Text>/<TextInput> through Plus Jakarta Sans. Runs at module
// load — before the first render — so the whole tree picks it up.
applyGlobalFont();

// Wire React Native's AppState into TanStack Query's focusManager so that
// `refetchOnWindowFocus` triggers when the app returns from background.
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
    handleFocus(state === "active");
  });
  return () => sub.remove();
});

export default function RootLayout() {
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateTheme = useThemeStore((s) => s.hydrate);
  const [fontsLoaded] = useFonts(fontAssets);

  useEffect(() => {
    hydrateAuth();
    hydrateTheme();
  }, [hydrateAuth, hydrateTheme]);

  if (!fontsLoaded) return null;

  return (
    <RootProvider>
      <ThemedStack />
    </RootProvider>
  );
}

function ThemedStack() {
  const t = useTheme();
  const isDark = useIsDark();
  return (
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: t.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="splash" options={{ animation: "fade" }} />
        <Stack.Screen name="onboarding" options={{ animation: "slide_from_right" }} />
        <Stack.Screen
          name="connect-permission"
          options={{ animation: "slide_from_right" }}
        />
        <Stack.Screen name="syncing" options={{ animation: "fade" }} />
        <Stack.Screen name="all-set" options={{ animation: "fade" }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="transaction/[id]"
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="merchant/[id]"
          options={{
            presentation: "transparentModal",
            animation: "none",
            gestureEnabled: false,
            contentStyle: { backgroundColor: "transparent" },
          }}
        />
        <Stack.Screen
          name="sync-log"
          options={{
            headerShown: true,
            headerTitle: "Sync log",
            headerLargeTitle: false,
            headerTintColor: PlatformColor("label") as unknown as string,
            headerShadowVisible: false,
            headerBackButtonDisplayMode: "minimal",
            animation: "slide_from_right",
          }}
        />
      </Stack>
    </View>
  );
}
