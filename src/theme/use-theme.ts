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

/** Soft drop shadow for card surfaces — matches the prototype's `--card-shadow`. */
export function useCardShadow(): string {
  return useIsDark()
    ? "0px 14px 34px rgba(0,0,0,0.5)"
    : "0px 10px 30px rgba(0,0,0,0.06)";
}

/** Lighter shadow for pill chips. */
export function useChipShadow(): string {
  return useIsDark()
    ? "0px 3px 10px rgba(0,0,0,0.4)"
    : "0px 3px 10px rgba(0,0,0,0.05)";
}
