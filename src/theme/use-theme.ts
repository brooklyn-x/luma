import { useColorScheme } from "react-native";
import { useThemeStore } from "@/stores/theme-store";
import { colorsDark, colorsLight, type Palette } from "./colors";

export function useEffectiveScheme(): "light" | "dark" {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  if (mode === "light") return "light";
  if (mode === "dark") return "dark";
  return system === "light" ? "light" : "dark";
}

export function useTheme(): Palette {
  return useEffectiveScheme() === "light" ? colorsLight : colorsDark;
}

export function useIsDark(): boolean {
  return useEffectiveScheme() === "dark";
}
