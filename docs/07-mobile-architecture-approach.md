# Mobile Architecture Approach

## Current Mobile State

The repository already contains Capacitor Android and iOS shells:

- `android/`
- `ios/`
- `capacitor.config.ts`

The app uses the same React/Vite codebase for web and mobile, with native-specific behavior for:

- Status bar and navigation bar styling.
- Back button behavior on Android.
- Deep link handling.
- Push notification registration.
- Camera/photo capture.
- Geolocation.
- Filesystem/share-style integrations.

## Recommendation

Keep Capacitor for the first custom-backend migration.

Reasoning:

- The product already works across web, Android, and iOS.
- Rewriting to native Swift/Kotlin or React Native at the same time as backend migration would multiply risk.
- Most architectural risk is backend ownership, data model, auth, payments, and compliance, not native UI.
- Capacitor remains acceptable for this marketplace/admin workflow as long as performance and offline requirements are moderate.

## Mobile Target Structure

Short term:

- Keep current `src/` app as shared web/mobile UI.
- Replace Base44 SDK calls with a custom API client.
- Keep Capacitor plugin usage isolated in platform service modules.

Medium term:

- Move web app into `apps/web`.
- Keep native shells under `apps/mobile/android` and `apps/mobile/ios` or continue standard Capacitor layout if simpler.
- Introduce a shared client package for API types and platform abstractions.

Suggested platform services:

- `platform/authSession`
- `platform/deepLinks`
- `platform/pushNotifications`
- `platform/geolocation`
- `platform/camera`
- `platform/haptics`
- `platform/statusBar`

## Auth On Mobile

Current behavior:

- Base44 token is hydrated from deep link query/hash params.
- `localStorage` stores Base44 access token and redirect state.

Target behavior:

- Use a first-party auth callback scheme such as `saveandserve://auth/callback`.
- Store refresh/session tokens securely where possible.
- Avoid keeping long-lived sensitive tokens in plain `localStorage` for native builds.
- Implement explicit session refresh and logout.

Practical path:

1. Preserve the existing deep link route handling while introducing new callback parsing.
2. Add custom auth endpoints.
3. Switch web first if needed, then native.
4. Remove Base44 token hydration after all clients use custom auth.

## Push Notifications

Current behavior:

- Web push uses Firebase JS SDK and service worker.
- Native push code is present but gated by `ENABLE_BASE44_NATIVE_PUSH = false`.
- Tokens are stored in the Base44 `User` record as `push_tokens`.
- Server function `sendPushNotification` sends through FCM HTTP v1.

Target behavior:

- Keep Firebase Cloud Messaging.
- Store device tokens in a dedicated `push_tokens` table.
- Register tokens through `POST /push-tokens`.
- Send notifications from backend workers.
- Keep notification preferences in a dedicated table.
- For native, enable Capacitor Push Notifications in custom builds and test APNs/FCM configuration separately.

## Deep Links

Supported target links should include:

- Order detail.
- Message conversation.
- Listing detail.
- Payment success/failure.
- Notification settings.
- Merchant onboarding.

Implementation:

- Maintain a single `resolveDeepLinkRoute` function in shared app code.
- Backend notification payloads should use stable route identifiers and resource ids, not hard-coded UI paths only.

## Offline And Network Handling

Do not build complex offline sync in phase one.

Minimum mobile requirements:

- Graceful loading/error states.
- Retry failed idempotent mutations.
- Cache read-heavy data with TanStack Query.
- Prevent duplicate checkout/order submission with idempotency keys.
- Persist only safe UI state and cached non-sensitive reads.

Compliance forms may eventually benefit from draft/offline support, but that should be a later dedicated feature.

## App Store Readiness

Before production cutover:

- Confirm bundle ids, app names, icons, splash assets, entitlements.
- Confirm `google-services.json` and `GoogleService-Info.plist` are environment-specific and not leaking production secrets.
- Confirm associated domains/universal links if used.
- Confirm privacy labels and data collection disclosures.
- Confirm payment flows comply with store policies for real-world food orders.
- Confirm crash reporting and release build signing.

## When To Consider Native Or React Native Later

Only consider a mobile rewrite if:

- WebView performance blocks key flows.
- Offline-first merchant operations become central.
- Native maps/camera/scanning workflows become complex.
- App store requirements or UX expectations outgrow Capacitor.

Until then, Capacitor is the pragmatic bridge while backend architecture is rebuilt.

