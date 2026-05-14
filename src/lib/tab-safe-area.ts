import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const FLOATING_BAR_HEIGHT = 64;
const FLOATING_BAR_BOTTOM_MARGIN = 12;
const FLOATING_BAR_CLEARANCE = 16;

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
 * Android renders a floating tab bar (see app/(tabs)/_layout.tsx) so content
 * must scroll past the bar's height + its margin + the system inset. iOS
 * keeps the flat bar where react-navigation pads itself, so we return the
 * baseline value used previously.
 */
export function useTabScreenBottomPadding(): number {
  const insets = useSafeAreaInsets();
  if (Platform.OS === "android") {
    return (
      FLOATING_BAR_HEIGHT +
      FLOATING_BAR_BOTTOM_MARGIN +
      insets.bottom +
      FLOATING_BAR_CLEARANCE
    );
  }
  return 60;
}
