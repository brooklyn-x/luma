import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Top inset for tab-root ScrollViews.
 *
 * On iOS we set `contentInsetAdjustmentBehavior="automatic"` and let the OS
 * handle the status-bar offset. On Android that prop is a no-op, so we pad
 * the content explicitly with the safe-area top inset.
 */
export function useTabScreenTopPadding(extra = 8): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === "android") return insets.top + extra;
  return 0;
}

/**
 * Bottom padding for tab-root ScrollViews.
 *
 * The tab bar is part of the layout flow (not absolutely positioned), so
 * React Navigation constrains content above it automatically. This padding
 * just adds a small visual gap so the last list item isn't flush against
 * the tab bar edge.
 */
export function useTabScreenBottomPadding(): number {
  return 16;
}
