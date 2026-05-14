# TestFlight Submission Guide

How to ship a new build of Luma to TestFlight.

## Apple account

- **Apple ID:** `shashanksde3@gmail.com` (Shashank Singh's developer account)
- **Bundle ID:** `com.brook-luma.ios`
- **App Store Connect App ID:** `6768082124`
- **Team:** Shashank Singh

The EAS CLI login flow (`npx testflight`) fails on this account — use the Xcode path below instead.

## One-time setup (already done)

For reference only — these don't need to be redone:

- App created in App Store Connect with bundle ID `com.brook-luma.ios`
- App Store Connect API Key uploaded to EAS via `eas credentials`
- `.env.production` created at repo root (required — see "Environment" below)
- Shashank's Apple ID added to Xcode under **Settings → Accounts**

## Workflow for each new build

### 1. Bump the build number

Edit [app.json](app.json):

```json
"ios": {
  "buildNumber": "3"
}
```

Increment by 1 every time. Last shipped build is the source of truth — check https://appstoreconnect.apple.com → Luma → TestFlight → Builds to see what's there.

Only bump `version` (e.g. `1.0.0` → `1.0.1`) when you want a new release line. Within the same version, just bump `buildNumber`.

### 2. Regenerate the native iOS project

```bash
cd /Users/brooklyn/Desktop/duck/mobile/test
npx expo prebuild --platform ios --clean
```

This rebuilds `ios/` from `app.json` + plugins. Takes ~30–60 sec.

### 3. Open in Xcode

```bash
open ios/Luma.xcworkspace
```

### 4. Configure signing (every time, since --clean resets it)

In Xcode → click the blue `Luma` project → select the `Luma` target → **Signing & Capabilities** tab:

- ✅ Automatically manage signing
- **Team:** pick **Shashank Singh** (resets after each `--clean`)
- Wait 5–10 sec for "Provisioning Profile: Xcode Managed Profile" to appear

**General** tab → **Identity**:

- **Version:** matches `app.json`
- **Build:** matches `app.json` `buildNumber`

Top of Xcode window → device selector → **"Any iOS Device (arm64)"**.

### 5. Clean and archive

Menu bar:

1. **Product → Clean Build Folder** (`⇧⌘K`) → Clean
2. **Product → Archive** (5–15 min)

Don't touch anything during the build. The **Organizer** window opens when done.

### 6. Upload to App Store Connect

In Organizer with your new archive selected:

1. **Distribute App** (right side)
2. **App Store Connect** → **Distribute**
3. **Upload** → **Next**
4. Defaults (strip Swift symbols, upload symbols) → **Next**
5. **Automatically manage signing** → **Next**
6. Review → **Upload**

Takes 2–5 min. Wait for **"Upload Successful"**.

You may see warnings about missing dSYMs for `React.framework`, `hermes.framework`, etc. — **ignore them**. They only affect crash report symbolication, not the build itself.

### 7. Wait for processing

https://appstoreconnect.apple.com → Luma → **TestFlight** tab

- Status flips: **Processing** → **Ready to Submit** → **Testing** (after assigned to a group)
- Takes 5–20 min

If status shows **"Missing Compliance"** → click the build → answer **No** to encryption (matches `usesNonExemptEncryption: false` in `app.json`).

### 8. Distribute to testers

The internal group **"Tester"** auto-receives new builds. Testers get an email and can update via the TestFlight app on their phone.

To add testers:

1. TestFlight tab → click **Tester** group
2. **Testers** tab → **+** → add emails
3. Testers must be users in **Users and Access** first

## Environment

`.env.production` must exist at the repo root. If it's missing, the app **crashes on launch** because [src/lib/env.ts](src/lib/env.ts) throws when `EXPO_PUBLIC_API_URL` is undefined.

Required vars (all `EXPO_PUBLIC_*` — public, inlined into JS bundle):

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME`
- `EXPO_PUBLIC_MICROSOFT_CLIENT_ID`

Currently `.env.production` is a copy of `.env.development` (no real production backend yet). When a real backend ships, update `.env.production` to point at it.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `"Invalid username and password combination"` in EAS CLI | EAS auth doesn't work with this Apple ID | Use Xcode path instead |
| `"Bundle version must be higher than..."` | Build number ≤ what's on App Store Connect | Bump `buildNumber` in `app.json`, re-archive |
| Xcode Archive: `'SafeAreaControllable' is not a member type of struct 'ExpoModulesCore'` | `@expo/ui` beta for SDK 55 in an SDK 54 project | Remove `@expo/ui` from `package.json` |
| App crashes on launch in TestFlight | `.env.production` missing or wrong | Verify file exists at repo root, rebuild |
| Tester sees old build | TestFlight app cached the old version | Pull-to-refresh in TestFlight on phone, or delete + reinstall |
| Old broken build still installable | Build is on App Store Connect | Expire it: TestFlight → Builds → click build → **Expire Build** |
| Upload hangs on "Sending analysis" >10 min | Xcode uploader stuck | Cancel → **Distribute App → Custom → Export** the `.ipa` → upload via **Transporter** app from Mac App Store |
| "Upload Symbols Failed" for React.framework/hermes.framework | Harmless dSYM warnings | Ignore — TestFlight installs and runs fine |

## When you eventually ship to the App Store

This guide only covers TestFlight. For a public App Store release:

1. App Store Connect → **App Store** tab (not TestFlight)
2. Fill in metadata (description, keywords, screenshots, privacy policy)
3. Select a build → **Submit for Review**
4. Wait ~24h for Apple's review

Don't do this until ready for public release — TestFlight is the staging area until then.

## Reference

- App Store Connect: https://appstoreconnect.apple.com
- Apple Developer Portal: https://developer.apple.com/account
- Expo docs (build/submit): https://docs.expo.dev/submit/ios/
