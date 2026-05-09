import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  type Theme,
} from "@react-navigation/native";
import { useMemo } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colorsDark, colorsLight } from "@/theme/colors";
import { useEffectiveScheme } from "@/theme/use-theme";
import { QueryProvider } from "./query-provider";

function buildTheme(scheme: "light" | "dark"): Theme {
  const isDark = scheme === "dark";
  const base = isDark ? DarkTheme : DefaultTheme;
  const c = isDark ? colorsDark : colorsLight;
  return {
    ...base,
    colors: {
      ...base.colors,
      background: c.background,
      card: c.background,
      text: c.text,
      border: c.border,
      primary: c.blue,
    },
  };
}

export function RootProvider({ children }: { children: React.ReactNode }) {
  const scheme = useEffectiveScheme();
  const theme = useMemo(() => buildTheme(scheme), [scheme]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={theme}>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
