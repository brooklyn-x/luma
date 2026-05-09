# Luma

Track every transaction from your inbox. Luma is an Expo / React Native app that ingests transactions from Gmail and surfaces spend, subscriptions, cards, merchants, and AI-driven insights — all in one timeline.

> **Status:** UI-complete against mock data in [src/data/](src/data/). The env wiring expects a backend, but no production API exists yet.

---

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Environment](#environment)
- [Project structure](#project-structure)
- [Tech stack](#tech-stack)
- [Architecture highlights](#architecture-highlights)
- [Theming](#theming)
- [Styling](#styling)
- [Builds & releases](#builds--releases)
- [Conventions](#conventions)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Gmail-driven sync** — onboarding flow connects Gmail and parses transaction emails
- **Home, Timeline, Cards, Search, Settings** — five-tab native shell using Expo Router NativeTabs
- **Card detail & merchant detail** — drill into spend by card or by merchant
- **Transaction sheet** — tap any transaction to open a half/full form sheet
- **Liquid Glass chrome** — iOS 26 `expo-glass-effect` with `BlurView` and flat-card fallbacks
- **Light/dark/system theming** — palette tokens with full light/dark parity
- **Offline-first data** — TanStack Query persisted to AsyncStorage with NetInfo-driven `onlineManager`
- **Secure auth state** — connection state stored in SecureStore

---

## Requirements

- **Node** ≥ 20
- **npm** (uses `legacy-peer-deps=true` — see [.npmrc](.npmrc))
- **Xcode 16+** for iOS builds (deployment target is **iOS 26**)
- **Android Studio** with an SDK that supports New Architecture / Fabric
- **EAS CLI** for cloud builds: `npm i -g eas-cli`

---

## Quick start

```bash
git clone <repo>
cd test
npm install            # legacy-peer-deps required
cp .env.development .env.development   # populate EXPO_PUBLIC_API_URL if missing
npm start              # Metro
```

Then press `i` for iOS simulator, `a` for Android, or `w` for web.

---

## Scripts

| Command             | Description                              |
| ------------------- | ---------------------------------------- |
| `npm start`         | Start Metro (Expo dev server)            |
| `npm run ios`       | Open in iOS Simulator                    |
| `npm run android`   | Open on Android emulator/device          |
| `npm run web`       | Open the web build in a browser          |
| `npm run typecheck` | `tsc --noEmit`                           |
| `npm run lint`      | `expo lint` (eslint-config-expo)         |

> No test runner is configured yet.

---

## Environment

Two env files at the repo root drive `EXPO_PUBLIC_API_URL`:

| File                | Purpose                  |
| ------------------- | ------------------------ |
| `.env.development`  | Dev backend URL          |
| `.env.production`   | Production backend URL   |

[src/lib/env.ts](src/lib/env.ts) **throws at import time** if `EXPO_PUBLIC_API_URL` is unset. Always read env through that module — never `process.env.*` directly.

`.env*` files are gitignored. Don't commit them.

---

## Project structure

```
.
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root: store hydration, sheet routes, providers
│   ├── index.tsx           # Auth-gated boot redirect
│   ├── splash.tsx          # Splash → onboarding
│   ├── onboarding.tsx
│   ├── connect-permission.tsx
│   ├── syncing.tsx         # Initial sync screen
│   ├── sync-log.tsx
│   ├── transaction/[id].tsx  # Form-sheet transaction detail
│   └── (tabs)/             # NativeTabs shell
│       ├── (home)/         # Home + merchants drilldown
│       ├── (timeline)/
│       ├── (cards)/        # Cards list + [id] detail
│       ├── (search)/
│       └── (settings)/
├── src/
│   ├── components/         # ui/, cards/, feed/, insights/, onboarding/
│   ├── data/               # Mock cards, merchants, types
│   ├── hooks/
│   ├── lib/                # env, cn, screen-options, providers
│   ├── providers/          # root-provider, query-provider
│   ├── services/           # haptics
│   ├── stores/             # Zustand: auth-store, theme-store
│   ├── theme/              # colors, spacing, radius, shadows, typography, useTheme
│   ├── tw/                 # NativeWind-friendly View/Text/Image/Animated wrappers
│   ├── types/
│   ├── utils/              # format helpers (INR / en-IN by default)
│   └── global.css          # Tailwind v4 entry + theme CSS vars
├── assets/
├── app.json                # Expo config (iOS 26, NewArch, plugins)
├── eas.json                # EAS profiles: development / preview / production
├── metro.config.js         # NativeWind + react-native-css wiring
├── babel.config.js
├── postcss.config.mjs
├── tsconfig.json           # @/* → ./src/*
└── CLAUDE.md               # Deeper architecture notes for AI agents
```

---

## Tech stack

- **Expo SDK 54** with **React Native 0.81** and **React 19**
- **New Architecture** enabled (Fabric / TurboModules)
- **Expo Router 6** — typed routes, NativeTabs (`expo-router/unstable-native-tabs`)
- **TanStack Query 5** — persisted via `@tanstack/query-async-storage-persister`
- **Zustand 5** — `auth-store` (SecureStore), `theme-store` (AsyncStorage)
- **NativeWind v5 (preview)** + **Tailwind v4** alongside `StyleSheet.create`
- **Reanimated 4** + `react-native-worklets`
- **Shopify FlashList 2** for high-performance lists
- **expo-glass-effect** (Liquid Glass), **expo-symbols** (SF Symbols)
- **expo-auth-session** + **expo-web-browser** for Gmail OAuth
- **react-hook-form** + **zod** for forms
- **date-fns** for date math

---

## Architecture highlights

### Boot flow

`app/index.tsx` waits for `useAuthStore.isHydrating`, then redirects:

- Connected → `/(tabs)/(home)`
- Otherwise → `/splash` → `onboarding` → `connect-permission` → `syncing` → `(tabs)`

### Routing

File-based via Expo Router 6 with `experiments.typedRoutes` on. Each tab is its own group with a stack — when adding a stack inside a tab, use `useStackScreenOptions()` from [src/lib/screen-options.ts](src/lib/screen-options.ts) so the background follows the active theme.

Transaction details render as a sheet — see the `transaction/[id]` registration in [app/_layout.tsx](app/_layout.tsx) with `presentation: "formSheet"` and `sheetAllowedDetents: [0.6, 1.0]`.

### Data layer

[src/providers/query-provider.tsx](src/providers/query-provider.tsx) exposes a singleton `QueryClient` with:

- `staleTime: 5min`, `gcTime: 24h`, `retry: 2`
- `networkMode: "offlineFirst"` (queries and mutations)
- AsyncStorage persistence under key `LUMA_RQ_CACHE`
- `onlineManager` driven by `@react-native-community/netinfo`

Add real fetching to this client — don't create a second one.

### State

Two Zustand stores, both hydrated from [app/_layout.tsx](app/_layout.tsx):

| Store                                              | Persistence    | Shape                          |
| -------------------------------------------------- | -------------- | ------------------------------ |
| [auth-store](src/stores/auth-store.ts)             | SecureStore    | `connected`, `gmailEmail`      |
| [theme-store](src/stores/theme-store.ts)           | AsyncStorage   | `mode: system \| light \| dark`|

Each exposes `isHydrating` so the UI can hold a loading state until persistence is read.

---

## Theming

`src/theme/` is the source of truth — not `@react-navigation`.

```ts
import { useTheme } from "@/theme/use-theme";

function MyView() {
  const t = useTheme();   // returns the active Palette directly
  return <View style={{ backgroundColor: t.background, borderColor: t.tileBorder }} />;
}
```

- `useEffectiveScheme()` honors `theme-store.mode`, falling back to RN's `useColorScheme`
- Two parallel palettes in [src/theme/colors.ts](src/theme/colors.ts): `colorsDark` and `colorsLight`
- **Use palette tokens, not hex.** Especially `tileFill`, `tileBorder`, `innerRing`, `liveOverlay`, `card`, `surface`, `elevated`, `muted`
- Brand colors (`blue`, `purple`, `green`, `red`, `pink`, `yellow`) and `gradient.primary` are constant across schemes
- `categoryColors` maps the five `Category` values to colors
- Spacing, radius, typography, shadow tokens live in their own files; `spacing.hPad = 20` is the standard horizontal screen padding

[src/providers/root-provider.tsx](src/providers/root-provider.tsx) bridges this palette into `@react-navigation`'s `ThemeProvider` so any nav chrome that reads it stays consistent.

---

## Styling

Both StyleSheet and NativeWind are wired up — **most screens use `StyleSheet.create` + theme tokens**, and that's the dominant pattern. Match it when editing existing screens.

For NativeWind:

- [src/global.css](src/global.css) — theme CSS vars + `@import "tailwindcss/..."`
- [metro.config.js](metro.config.js) — `withNativewind`, `globalClassNamePolyfill: false`
- [postcss.config.mjs](postcss.config.mjs) and the `lightningcss` resolution pin in [package.json](package.json)
- [src/tw/](src/tw/) re-exports `react-native-css/components` (`View`, `Text`, etc. that accept `className`)
  - [src/tw/image.tsx](src/tw/image.tsx) wraps `expo-image` for `className` support
  - [src/tw/animated.tsx](src/tw/animated.tsx) wraps a `View` for Reanimated
- The `cn()` helper lives in [src/lib/cn.ts](src/lib/cn.ts)

If you need `className`, import from `@/tw`, not from `react-native`.

### iOS premium chrome

The deployment target is **iOS 26** ([app.json](app.json) → `expo-build-properties`) so we can use:

- **`expo-glass-effect` Liquid Glass** — [src/components/ui/glass.tsx](src/components/ui/glass.tsx) auto-detects via `isLiquidGlassAvailable()`, with a `BlurView` + bordered overlay fallback for older iOS / Android, and a flat-card fallback in light mode
- **`expo-symbols`** — wrapped by [src/components/ui/sf.tsx](src/components/ui/sf.tsx): `<SF name="..." />`

Reach for `Glass` and `SF` rather than rolling your own — the fallback chain matters.

---

## Builds & releases

EAS profiles in [eas.json](eas.json):

| Profile       | Purpose                       |
| ------------- | ----------------------------- |
| `development` | Dev client builds             |
| `preview`     | Internal QA / TestFlight TBD  |
| `production`  | Store submissions             |

`appVersionSource` is `remote` — EAS owns the build number.

```bash
eas build --profile development --platform ios
eas build --profile production --platform all
```

`/ios` and `/android` are **gitignored** (managed workflow). Native config goes through `app.json`, config plugins, and `expo-build-properties` — don't hand-edit native projects.

---

## Conventions

- **Path alias:** `@/*` → `./src/*`. The `app/` directory is **not** aliased — import screens via Expo Router, not by path
- **Locale:** Mocks in [src/data/](src/data/) use INR; `formatCurrency` in [src/utils/format.ts](src/utils/format.ts) defaults to `INR` / `en-IN`
- **Reanimated plugin:** `babel-preset-expo` already includes it — don't add `react-native-reanimated/plugin` manually
- **Typed routes:** route strings are typed; trust the autocompletion
- Read environment through [src/lib/env.ts](src/lib/env.ts), never `process.env.*` directly

For deeper architectural notes (especially when working with AI tooling), see [CLAUDE.md](CLAUDE.md).

---

## Troubleshooting

| Symptom                                                 | Fix                                                                  |
| ------------------------------------------------------- | -------------------------------------------------------------------- |
| `npm install` fails with peer-dep errors                | Confirm [.npmrc](.npmrc) has `legacy-peer-deps=true`                 |
| Throws on boot: `EXPO_PUBLIC_API_URL is required`       | Create `.env.development` with `EXPO_PUBLIC_API_URL=...`             |
| iOS build fails on deployment target                    | Update Xcode; deployment target is iOS 26                            |
| `lightningcss` version mismatch                         | The pin in [package.json](package.json) `resolutions`/`overrides` is required for NativeWind v5 / Tailwind v4 |
| Theme doesn't update when toggling system appearance    | Check that the screen uses `useTheme()` rather than a captured value |
