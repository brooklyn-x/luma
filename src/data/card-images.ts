import type { ImageSourcePropType } from "react-native";

// Card art registry. Add an entry here AFTER you drop a file into
// `src/assets/cards/`. Key must match an ISSUER_STYLES key from `cards.ts`
// (e.g. HDFC, Amex, ICICI, "SBI Card", "IDFC First", PhonePe, ...).
//
// React Native bundles `require()` paths at compile time, so paths must be
// string literals — no dynamic loading. To register a new card image:
//   1. Save the file as `src/assets/cards/<issuer-slug>.png` (1.6:1, ~1280x800).
//   2. Uncomment / add the matching line below.
//
// Cards without an entry here keep using the gradient tile fallback.
export const cardImages: Record<string, ImageSourcePropType> = {
  HDFC: require("@/assets/cards/hdfc.png"),
  ICICI: require("@/assets/cards/icici.png"),
  // Amex: require("@/assets/cards/amex.png"),
  SBI: require("@/assets/cards/sbi.png"),
  // Axis: require("@/assets/cards/axis.png"),
  // Kotak: require("@/assets/cards/kotak.png"),
  Yes: require("@/assets/cards/yes.png"),
  // Federal: require("@/assets/cards/federal.png"),
  // Kiwi: require("@/assets/cards/kiwi.png"),
  "SBI Card": require("@/assets/cards/sbi.png"),
  // AU: require("@/assets/cards/au.png"),
  // "IDFC First": require("@/assets/cards/idfc-first.png"),
  // IndusInd: require("@/assets/cards/indusind.png"),
  // "GPay UPI": require("@/assets/cards/gpay.png"),
  // PhonePe: require("@/assets/cards/phonepe.png"),
  // Paytm: require("@/assets/cards/paytm.png"),
  // Razorpay: require("@/assets/cards/razorpay.png"),
  // Stripe: require("@/assets/cards/stripe.png"),
};
