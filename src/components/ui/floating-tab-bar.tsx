import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

type IconPair = {
  active: keyof typeof Ionicons.glyphMap;
  inactive: keyof typeof Ionicons.glyphMap;
};

const ICONS: Record<string, IconPair> = {
  "(home)": { active: "home", inactive: "home-outline" },
  "(timeline)": { active: "list", inactive: "list-outline" },
  "(cards)": { active: "card", inactive: "card-outline" },
  "(search)": { active: "search", inactive: "search-outline" },
  "(settings)": { active: "settings", inactive: "settings-outline" },
};

const LABELS: Record<string, string> = {
  "(home)": "Home",
  "(timeline)": "Timeline",
  "(cards)": "Cards",
  "(search)": "Search",
  "(settings)": "Settings",
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: t.card,
          borderTopColor: t.tileBorder,
          paddingBottom: Math.max(insets.bottom - 10, 6),
        },
      ]}
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const icon = ICONS[route.name];
          const label = LABELS[route.name];
          if (!icon || !label) return null;
          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              style={styles.tab}
              hitSlop={6}
            >
              <Ionicons
                name={focused ? icon.active : icon.inactive}
                size={24}
                color={focused ? t.text : t.inactive}
              />
              <Text
                style={[
                  styles.label,
                  { color: focused ? t.text : t.inactive, fontWeight: focused ? "700" : "600" },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 12,
  },
  row: {
    flexDirection: "row",
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  label: {
    fontSize: 10.5,
  },
});
