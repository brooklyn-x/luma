import type { TextStyle } from "react-native";
import { fonts } from "@/lib/fonts";

export const typography = {
  h1: { fontFamily: fonts.bold, fontSize: 38, fontWeight: "700", lineHeight: 44, letterSpacing: -0.8 },
  h2: { fontFamily: fonts.bold, fontSize: 30, fontWeight: "700", lineHeight: 36, letterSpacing: -0.6 },
  h3: { fontFamily: fonts.semibold, fontSize: 22, fontWeight: "600", lineHeight: 28, letterSpacing: -0.3 },
  body: { fontFamily: fonts.regular, fontSize: 16, fontWeight: "400", lineHeight: 22 },
  caption: { fontFamily: fonts.medium, fontSize: 13, fontWeight: "500", lineHeight: 18, letterSpacing: 0.1 },
  micro: { fontFamily: fonts.medium, fontSize: 11, fontWeight: "500", lineHeight: 14, letterSpacing: 0.4 },
} satisfies Record<string, TextStyle>;

export type TypographyKey = keyof typeof typography;
