import { Ionicons } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { Platform, type ColorValue } from "react-native";

type Props = {
  name: string;
  size?: number;
  tint?: ColorValue;
};

// SF Symbols are iOS-only. On Android, fall back to the closest Ionicons glyph.
// Add new entries here as you introduce new SF names elsewhere.
const SF_TO_IONICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  "arrow.clockwise": "refresh",
  "arrow.triangle.2.circlepath": "refresh",
  "bell.fill": "notifications",
  "chart.pie.fill": "pie-chart",
  "checkmark": "checkmark",
  "checkmark.shield": "shield-checkmark",
  "chevron.down": "chevron-down",
  "chevron.left": "chevron-back",
  "chevron.right": "chevron-forward",
  "creditcard": "card-outline",
  "doc.text.magnifyingglass": "document-text",
  "envelope": "mail-outline",
  "envelope.fill": "mail",
  "eye": "eye-outline",
  "lock.fill": "lock-closed",
  "lock.rectangle.stack": "albums",
  "lock.shield": "shield-checkmark",
  "magnifyingglass": "search",
  "moon.fill": "moon",
  "rectangle.portrait.and.arrow.right": "log-out-outline",
  "sparkles": "sparkles",
  "tray.full": "file-tray-full",
  "xmark": "close",
  "xmark.octagon.fill": "alert-circle",
  "checkmark.circle.fill": "checkmark-circle",
  "minus.circle": "remove-circle-outline",
};

export function SF({ name, size = 20, tint }: Props) {
  if (Platform.OS !== "ios") {
    const ionName = SF_TO_IONICON[name] ?? "help-circle-outline";
    return (
      <Ionicons
        name={ionName}
        size={size}
        color={tint as string | undefined}
      />
    );
  }
  return (
    <SymbolView
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      name={name as any}
      size={size}
      tintColor={tint as string | undefined}
      resizeMode="scaleAspectFit"
    />
  );
}
