# Current Repository Analysis

## Repository Shape

The active app checkout analyzed is `save-serve-pr`.

The repository currently contains:

- `src/`: React 18, Vite, Tailwind, shadcn/Radix-style UI components, page-based routing, Base44 client wrappers.
- `base44/entities/`: Base44 JSONC entity schemas for the current data model.
- `base44/functions/`: Deno serverless functions using `@base44/sdk`, Stripe, Firebase, Google APIs, email, file upload, and LLM integrations.
- `android/` and `ios/`: Capacitor native shells.
- `public/firebase-messaging-sw.js`: web push service worker.
- `vite.config.js`: includes `@base44/vite-plugin`, visual edit agent, and Base44 navigation/HMR helpers.

## Current Runtime Stack

- Frontend: React 18, Vite 6, React Router hash routing, TanStack Query, Tailwind, Radix UI primitives.
- Mobile shell: Capacitor 8 for Android and iOS.
- Current backend abstraction: Base44 SDK entities, auth, integrations, and serverless functions.
- Payments: Stripe PaymentIntent, Stripe Connect, connected accounts, subscriptions, payouts, webhooks.
- Push notifications: Firebase Cloud Messaging for web/native token delivery, Capacitor Push Notifications plugin prepared but currently gated in `src/lib/pushNotifications.js`.
- Location: browser/native geolocation, Google Places/geocoding-style server functions.
- AI: Base44 `InvokeLLM` for listing generation, recommendations, prediction, and sanitization flows.
- Files: Base44 `UploadFile` for photos, compliance evidence, PDFs, reports, and generated exports.

## Current Base44 Coupling

The app is tightly coupled to Base44 in three ways:

- Client data access uses `base44.entities.*` directly from pages and components.
- Auth uses `base44.auth` and Base44 public settings/token behavior.
- Server actions use `base44.functions.invoke(...)`, while serverless functions use `createClientFromRequest(req)` and `base44.asServiceRole`.

Key files:

- `src/api/base44Client.js`
- `src/api/entities.js`
- `src/api/integrations.js`
- `src/lib/AuthContext.jsx`
- `src/lib/app-params.js`
- `vite.config.js`
- all `src/functions/*.js` wrappers
- all `base44/functions/*/entry.ts`

## Page And Module Inventory

Main pages include:

- Consumer: `Welcome`, `Auth`, `Discover`, `MyOrders`, `MyReservations`, `Impact`, `Profile`, `Settings`, `Notifications`, `NotificationSettings`, `Loyalty`, `Referrals`, `ShopProfile`, `ShopReviews`, `ReviewRetailer`.
- Retailer: `RetailerOnboarding`, `RetailerDashboard`, `ListingManager`, `AddItem`, `RetailerOrders`, `RetailerPayouts`, `RetailerSubscription`, `RetailerReservations`, `RetailerMenu`, `Compliance`, `LoyaltyManagement`.
- Admin/city operations: `AdminRetailerDashboard`, `AdminComplianceCenter`, `AdminPayoutReconciliation`, `AdminChallenges`, `RetailerApplications`, `AddRetailer`, `PlatformAnalytics`, `SiteBaselineDocumentation`.
- Legal/static: `Home`, `Privacy`, `Terms`, `PaymentSuccess`.

Component directories map to domain areas:

- `checkout`, `consumer`, `discovery`, `listing`, `orders`, `retailer`
- `compliance`, `earnings`, `subscription`
- `messaging`, `inbox`, `notifications`
- `onboarding`, `profile`, `reviews`, `loyalty` through pages/components

## Data Model Inventory

Base44 schemas exist for:

- Core identity and merchant operations: `User`, `Shop`, `UserFollow`
- Marketplace: `Listing`, `Item`, `Order`, `Review`, `SavedSearch`
- Compliance: `ComplianceEvent`, `ComplianceReport`, `CorrectionRecord`, `DonationReceipt`, `WasteLog`, `WasteItem`, `SurplusLog`, `AuditTrail`
- Finance: `RetailerBalance`, `RetailerPayout`
- Loyalty and growth: `LoyaltyProgram`, `LoyaltyPoints`, `Reward`, `RewardRedemption`, `Referral`, `Challenge`
- Communication: `Conversation`, `Message`, `Notification`, `NotificationPreference`, `OTP`, `Report`

Observed schema drift:

- `src/pages/MyReservations.jsx` and `src/pages/RetailerReservations.jsx` reference `base44.entities.Reservation`, but no `Reservation.jsonc` entity exists.
- `src/pages/RetailerSubscription.jsx` and `src/pages/RetailerReservations.jsx` reference `base44.entities.RetailerSubscription`, but no `RetailerSubscription.jsonc` entity exists.
- Some user fields are used in code but not declared in `User.jsonc`, including `push_tokens` and `favorite_listings`.

These should be resolved before migration because custom schema generation will otherwise miss active runtime behavior.

## Server Function Inventory

Base44 functions currently cover:

- Payments and Stripe: `createPaymentIntent`, `verifyPayment`, `createCheckout`, `createSubscriptionCheckout`, `stripePaymentWebhook`, `stripeSubscriptionWebhook`
- Stripe Connect and payouts: `createStripeConnectAccount`, `createStripeAccountSession`, `attachStripeBankAccount`, `uploadStripeId`, `updateStripeAccount`, `checkStripeAccountStatus`, `getRetailerBalance`, `requestPayout`, `triggerPayout`, `processRetailerPayouts`, `stripePayoutWebhook`, `updateOrderFinancials`
- Orders and inventory: `processOrder`, `reconcileInventory`, `resolveSingleListing`, `resolveQuickLog`, `resolveExpiredListing`, `autoResolveListings`, `pickupWindowReminder`
- Notifications: `sendPushNotification`, `notifyOrderStatusChange`, `notifyMerchantNewOrder`, `notifyNewMessage`, `notifyMatchingSearches`, `notifyPriceDrops`, `notifyFollowedShopNewListing`, `onOrderNotificationEvent`, `onOrderCommunicationStatusEvent`, `registerPushToken`
- Compliance: `createComplianceEventFromListing`, `createCorrectionRecord`, `generateCompliancePDF`, `generateMonthlyComplianceReport`, `finalizeComplianceReport`, `exportTransactionHistory`, `donateAllSurplus`, `sanitizeWasteItem`
- Location and AI: `searchPlaces`, `getPlaceDetails`, `reverseGeocode`, `reverseGeocodeLocation`, `getNearbyDeals`, `predictQuantity`, `submitPredictionFeedback`, `generatePitchDeck`
- Utility/demo: `sendOtp`, `verifyOtp`, `seedComplianceData`, `seedDemoShops`, `generateSampleListings`, `resetTransactionalData`

## Architectural Issues To Fix In The Rebuild

- Business logic is split across frontend components, pages, Base44 functions, and Base44 entity permissions.
- Direct frontend writes to entities make authorization and transactional consistency hard to guarantee.
- Inventory reservation is attempted in `processOrder`, but should become a database transaction with row locks or optimistic concurrency.
- Compliance records and financial records need immutability guarantees that Base44 schemas only partially express.
- Admin pages currently list broad datasets directly; custom APIs should enforce admin authorization, pagination, filtering, and audit logs.
- Real-time subscriptions depend on Base44 entity subscriptions and need a replacement strategy.
- Base44 auth/login flow must be replaced cleanly without breaking existing users or mobile deep links.
- File uploads and generated documents need explicit storage ownership, lifecycle rules, access control, and signed URL behavior.

