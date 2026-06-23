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
//
// Registry intentionally left empty — every card renders the generated
// gradient tile, which matches the redesign. To re-enable a real card image,
// drop the PNG into `src/assets/cards/` and add a `Issuer: require(...)` line.
export const cardImages: Record<string, ImageSourcePropType> = {};
