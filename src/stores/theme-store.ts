import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";

type ThemeState = {
  mode: ThemeMode;
  isHydrating: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const STORAGE_KEY = "luma_theme_mode";

export const useThemeStore = create<ThemeState>((set) => ({
  mode: "system",
  isHydrating: true,
  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      set({ mode: stored, isHydrating: false });
    } else {
      set({ isHydrating: false });
    }
  },
  setMode: async (mode) => {
    await AsyncStorage.setItem(STORAGE_KEY, mode);
    set({ mode });
  },
}));
