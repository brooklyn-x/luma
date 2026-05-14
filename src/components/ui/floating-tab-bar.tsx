import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { BlurView } from "expo-blur";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, useIsDark, useTheme } from "@/theme";

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  "(home)": "home",
  "(timeline)": "list",
  "(cards)": "card",
  "(settings)": "settings",
  "(search)": "search",
};

const LABELS: Record<string, string> = {
  "(home)": "Home",
  "(timeline)": "Timeline",
  "(cards)": "Cards",
  "(settings)": "Settings",
  "(search)": "Search",
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + 12 }]}
    >
      <View style={styles.shell}>
        <BlurView
          tint={isDark ? "dark" : "light"}
          intensity={80}
          experimentalBlurMethod="dimezisBlurView"
          style={[
            StyleSheet.absoluteFill,
            styles.blur,
            { borderColor: t.tileBorder },
          ]}
        />
        <View style={styles.row}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const icon = ICONS[route.name];
            const label = LABELS[route.name];
            if (!icon || !label) return null;
            const tint = focused ? colors.blue : t.muted;
            return (
              <Pressable
                key={route.key}
                onPress={() => navigation.navigate(route.name)}
                accessibilityRole="button"
                accessibilityState={{ selected: focused }}
                style={styles.tab}
                hitSlop={6}
              >
                <Ionicons name={icon} size={22} color={tint} />
                <Text style={[styles.label, { color: tint }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 64,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 12,
  },
  shell: {
    flex: 1,
    borderRadius: 32,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  blur: {
    borderRadius: 32,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
  },
});
