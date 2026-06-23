import {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from "@expo-google-fonts/sora";
import { createElement, type ComponentType } from "react";
import { StyleSheet } from "react-native";
import type { TextStyle } from "react-native";

// The runtime `module.exports` of react-native owns the live `Text` /
// `TextInput` getters we redefine below. Use `require` so we mutate that real
// object — an `import * as` namespace can be a sealed copy under Metro interop.
declare function require(moduleName: string): Record<string, unknown>;

/**
 * Font assets passed to `useFonts` at the app root. Sora is the app typeface;
 * each weight is a separate family because React Native resolves custom fonts
 * by family name, not by the `fontWeight` value.
 */
export const fontAssets = {
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} as const;

/** Loaded Sora family names, keyed by intent. */
export const fonts = {
  regular: "Sora_400Regular",
  medium: "Sora_500Medium",
  semibold: "Sora_600SemiBold",
  bold: "Sora_700Bold",
  extrabold: "Sora_800ExtraBold",
} as const;

const FAMILY_BY_WEIGHT: Record<string, string> = {
  "100": fonts.regular,
  "200": fonts.regular,
  "300": fonts.regular,
  "400": fonts.regular,
  normal: fonts.regular,
  "500": fonts.medium,
  "600": fonts.semibold,
  "700": fonts.bold,
  bold: fonts.bold,
  "800": fonts.extrabold,
  "900": fonts.extrabold,
};

function familyFor(style: TextStyle | undefined): string {
  const weight = style?.fontWeight;
  if (weight == null) return fonts.regular;
  return FAMILY_BY_WEIGHT[String(weight)] ?? fonts.regular;
}

function wrap(Original: ComponentType<{ style?: unknown }>): ComponentType<unknown> {
  const Wrapped = (props: { style?: TextStyle | TextStyle[] }) => {
    const flat = StyleSheet.flatten(props?.style) as TextStyle | undefined;
    return createElement(Original, {
      ...props,
      // Our derived family goes first so explicit `fontFamily` in a style still wins.
      style: [{ fontFamily: familyFor(flat) }, props?.style],
    });
  };
  (Wrapped as { displayName?: string }).displayName =
    (Original as { displayName?: string }).displayName ?? "FontPatched";
  return Wrapped as ComponentType<unknown>;
}

let applied = false;

/**
 * Make every `<Text>` / `<TextInput>` render in Sora without touching each
 * call site. In React 19 / RN 0.81 `Text` is a plain function
 * component (no `.render` to patch), so instead we redefine the `Text` /
 * `TextInput` getters on the `react-native` module to return a wrapper that
 * injects the matching family from the style's `fontWeight`. Existing
 * `fontWeight: "800"` etc. styles keep working and map to the right cut.
 *
 * Call this at the root layout's module scope so the patch is installed before
 * the first render (and before the lazily-loaded screens render any text).
 */
export function applyGlobalFont() {
  if (applied) return;
  applied = true;

  const rn = require("react-native");
  for (const key of ["Text", "TextInput"] as const) {
    const Original = rn[key] as ComponentType<{ style?: unknown }> | undefined;
    if (!Original) continue;
    const Wrapped = wrap(Original);
    Object.defineProperty(rn, key, {
      configurable: true,
      enumerable: true,
      get: () => Wrapped,
    });
  }
}
