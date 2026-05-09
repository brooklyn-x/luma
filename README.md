# Luma

An Expo / React Native app that ingests transactions from Gmail and surfaces spend, subscriptions, and AI insights.

> Status: UI-complete against mock data in [src/data/](src/data/). No backend yet — env wiring expects one.

## Quick start

```bash
npm install            # legacy-peer-deps is required (see .npmrc)
npm start              # Metro
npm run ios            # iOS simulator
npm run android        # Android emulator
npm run web            # Web
npm run typecheck      # tsc --noEmit
npm run lint           # eslint-config-expo
```

No test runner is configured.

## Environment

Two env files at the repo root drive `EXPO_PUBLIC_API_URL`:

- `.env.development` → development backend
- `.env.production` → production backend

[src/lib/env.ts](src/lib/env.ts) **throws at import time** if `EXPO_PUBLIC_API_URL` is unset. Read env through `env`, never `process.env.*` directly.

`.env*` files are gitignored — don't commit them.

## Stack

- **Expo SDK 54** with New Architecture (`newArchEnabled: true`), iOS 26 deployment target
- **Expo Router 6** with typed routes; tabs use `expo-router/unstable-native-tabs`
- **TanStack Query** (offline-first, persisted to AsyncStorage under key `LUMA_RQ_CACHE`)
- **Zustand** stores hydrated from SecureStore (auth) and AsyncStorage (theme)
- **NativeWind v5 (preview)** + **Tailwind v4** alongside `StyleSheet.create` — most screens use StyleSheet + theme tokens
- **Reanimated 4** + `react-native-worklets`
- **expo-glass-effect** (Liquid Glass) and **expo-symbols** for iOS 26 chrome, with fallbacks

## Architecture

See [CLAUDE.md](CLAUDE.md) for the full architectural breakdown — routing, theming, styling, data layer, state, and conventions.

Key entry points:

- [app/_layout.tsx](app/_layout.tsx) — root layout, store hydration, sheet routes
- [app/index.tsx](app/index.tsx) — auth-gated boot redirect
- [src/theme/](src/theme/) — palette tokens (use `useTheme()`, not hardcoded hex)
- [src/providers/query-provider.tsx](src/providers/query-provider.tsx) — singleton `QueryClient`
- [src/stores/](src/stores/) — `auth-store`, `theme-store`

## Path alias

`@/*` → `./src/*`. The `app/` directory is **not** aliased — import screens via Expo Router.

## Builds

EAS profiles in [eas.json](eas.json): `development`, `preview`, `production`. `appVersionSource` is `remote`.

`/ios` and `/android` are gitignored — managed workflow. Native config goes through `app.json`, config plugins, and `expo-build-properties`.
