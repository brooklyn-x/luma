import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { useTheme } from "@/theme";

export function useStackScreenOptions(): NativeStackNavigationOptions {
  const t = useTheme();
  return {
    headerShown: false,
    contentStyle: { backgroundColor: t.background },
  };
}
