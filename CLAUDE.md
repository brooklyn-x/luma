# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

"Luma" — an Expo / React Native app that ingests transactions from Gmail and surfaces spend, subscriptions, and AI insights. The current code is UI-complete against mock data in [src/data/](src/data/); there is no real backend yet, but the env wiring expects one.

## Commands

```bash
npm start              # expo start (Metro)
npm run ios            # expo start --ios
npm run android        # expo start --android
npm run web            # expo start --web
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint (eslint-config-expo)
```

EAS profiles live in [eas.json](eas.json) (`development` / `preview` / `production`). `appVersionSource` is `remote`. There is no test runner configured.

`legacy-peer-deps=true` is set in [.npmrc](.npmrc) — required because of NativeWind v5 / Tailwind v4 / react-native-css preview versions. Keep it.

## Environment

Two env files at the repo root drive `EXPO_PUBLIC_API_URL`:
- [.env.development](.env.development) → `https://fakestoreapi.com`
- [.env.production](.env.production) → `https://api.production.com`

[src/lib/env.ts](src/lib/env.ts) **throws at import time** if `EXPO_PUBLIC_API_URL` is unset. Don't read `process.env.*` directly elsewhere — go through `env`.

## Architecture

### Routing (Expo Router 6, typed routes)

File-based routing under [app/](app/). The boot flow is:

`app/index.tsx` (auth check) → `splash` → `onboarding` → `gmail-permission` → `syncing` → `(tabs)`

[app/index.tsx](app/index.tsx) waits for `useAuthStore.isHydrating` then `Redirect`s to `/(tabs)/(home)` if connected, else `/splash`. Auth state lives in SecureStore via [src/stores/auth-store.ts](src/stores/auth-store.ts) and is hydrated from [app/_layout.tsx](app/_layout.tsx). Theme is hydrated the same way from [src/stores/theme-store.ts](src/stores/theme-store.ts).

Tabs use `expo-router/unstable-native-tabs` (NativeTabs) — see [app/(tabs)/_layout.tsx](app/(tabs)/_layout.tsx). Each tab is its own route group with a stack (e.g. `(home)/_layout.tsx`). When adding a stack inside a tab, use `useStackScreenOptions()` from [src/lib/screen-options.ts](src/lib/screen-options.ts) so the background follows the theme.

Transaction details are presented as a sheet — see the `transaction/[id]` registration in [app/_layout.tsx](app/_layout.tsx) with `presentation: "formSheet"` and `sheetAllowedDetents: [0.6, 1.0]`.

### Theming (custom, not @react-navigation)

`src/theme/` is the source of truth. Two parallel palettes ([src/theme/colors.ts](src/theme/colors.ts)) — `colorsDark` and `colorsLight`. The active palette is selected by `useEffectiveScheme()` which honors `theme-store.mode` (`system | light | dark`) and falls back to RN's `useColorScheme`.

In components, prefer:

```ts
const t = useTheme();   // returns the active Palette, not a wrapper
// then: { color: t.text, backgroundColor: t.background }
```

Use **palette tokens**, not hardcoded hex — particularly `tileFill`, `tileBorder`, `innerRing`, `liveOverlay`, `card`, `surface`, `elevated`, `muted`. They have light/dark variants by design. Brand colors (`blue`, `purple`, `green`, `red`, `pink`, `yellow`) are constant across schemes; `gradient.primary` is the canonical brand gradient. `categoryColors` maps the five `Category` values to colors.

Spacing/radius/typography/shadow tokens live in their own files; `spacing.hPad = 20` is the standard horizontal screen padding.

[src/providers/root-provider.tsx](src/providers/root-provider.tsx) bridges this palette into `@react-navigation`'s `ThemeProvider` so that any nav chrome that does read it stays consistent.

### Styling: StyleSheet vs NativeWind

Both are wired up; **most screens use `StyleSheet.create` + theme tokens** and that is the dominant pattern — match it when editing existing screens.

NativeWind v5 (preview) is set up via:
- [src/global.css](src/global.css) (theme CSS vars, `@import "tailwindcss/..."`)
- [metro.config.js](metro.config.js) (`withNativewind`, `globalClassNamePolyfill: false`)
- [postcss.config.mjs](postcss.config.mjs) and the `lightningcss` resolution pin in [package.json](package.json)
- Components in [src/tw/](src/tw/) re-export `react-native-css/components` (`View`, `Text`, etc. that accept `className`). [src/tw/image.tsx](src/tw/image.tsx) wraps `expo-image` for `className` support via `useCssElement`. [src/tw/animated.tsx](src/tw/animated.tsx) wraps the `View` for Reanimated.

If you need `className`, import from `@/tw`, not from `react-native`. The `cn()` helper is in [src/lib/cn.ts](src/lib/cn.ts).

### iOS premium chrome

The deploymentTarget is **iOS 26** ([app.json](app.json) → `expo-build-properties`) so we can use:
- `expo-glass-effect` Liquid Glass — [src/components/ui/glass.tsx](src/components/ui/glass.tsx) auto-detects via `isLiquidGlassAvailable()`, with a `BlurView` + bordered overlay fallback for older iOS / Android, and a flat-card fallback in light mode.
- `expo-symbols` — wrapped by [src/components/ui/sf.tsx](src/components/ui/sf.tsx) (`<SF name="..." />`).

Reach for `Glass` and `SF` for surfaces / icons rather than rolling your own — the fallback chain matters.

### Data layer (TanStack Query, persisted, offline-first)

[src/providers/query-provider.tsx](src/providers/query-provider.tsx) configures the singleton `QueryClient` with:
- `staleTime: 5min`, `gcTime: 24h`, `retry: 2`, `networkMode: "offlineFirst"` (mutations too)
- AsyncStorage persistence under key `LUMA_RQ_CACHE`
- `onlineManager` driven by `@react-native-community/netinfo`

When you add real fetching, hang it off this client; don't create a second one.

### State

Two Zustand stores, both hydrated from app/_layout.tsx:
- [auth-store](src/stores/auth-store.ts) — `connected`, `gmailEmail`, persisted in **SecureStore**
- [theme-store](src/stores/theme-store.ts) — `mode`, persisted in **AsyncStorage**

Each exposes `isHydrating` so the UI can hold a loading state until persistence is read.

### Path alias

`@/*` → `./src/*` ([tsconfig.json](tsconfig.json)). The `app/` directory is **not** under the alias — import screens via Expo Router, not by path.

## Conventions

- New Architecture is enabled (`newArchEnabled: true`) — assume Fabric / TurboModules.
- Reanimated 4 + `react-native-worklets` 0.5; `babel-preset-expo` already includes the plugin — don't add `react-native-reanimated/plugin` manually.
- Mocks in [src/data/](src/data/) use INR (`formatCurrency` defaults to `INR` / `en-IN` in [src/utils/format.ts](src/utils/format.ts)) and India-flavored merchants. Keep that locale unless the user changes it.
- `expo-router` `experiments.typedRoutes` is on — route strings are typed.
- `/ios` and `/android` are gitignored (managed workflow); native config goes through `app.json` / config plugins / `expo-build-properties`.
