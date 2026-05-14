# Recommended Next Implementation Order

## Principle

Do not start by rewriting screens. Start by extracting boundaries and rebuilding the backend foundations that the existing screens can consume.

The safest path is to keep the working UI and progressively replace Base44 access with custom APIs.

## Step 1: Confirm Scope And Canonical Source

Tasks:

- Confirm `save-serve-pr` is the source of truth.
- Decide whether rebuild happens in this repo or a new monorepo.
- Confirm production Base44 app id, environments, and data ownership.
- Freeze a parity checklist of current web, Android, and iOS flows.

Output:

- One canonical repo branch and one migration checklist.

## Step 2: Build The Base44 Dependency Map

Tasks:

- Generate a complete list of `base44.entities.*`, `base44.functions.invoke`, `base44.auth.*`, and `base44.integrations.*` usages.
- Classify each usage by module and risk.
- Resolve missing `Reservation` and `RetailerSubscription` schemas.
- Compare schemas against production data export.

Output:

- Final data dictionary and migration backlog.

## Step 3: Create Backend Foundation

Tasks:

- Add API app, worker app, PostgreSQL/PostGIS, Redis, migrations, config, health checks.
- Add OpenAPI and shared API client generation.
- Add CI for lint, tests, typecheck, migration validation, and builds.

Output:

- Empty but deployable backend foundation.

## Step 4: Introduce Frontend API Adapter

Tasks:

- Create an internal data access layer in the frontend.
- Wrap current Base44 calls behind module services such as `listingService`, `orderService`, `shopService`.
- Do not change UI behavior yet.

Output:

- The frontend can switch modules from Base44 to custom API one at a time.

## Step 5: Migrate Auth, Users, And Shops

Tasks:

- Implement first-party auth/session.
- Implement `/me`, user preferences, saved locations.
- Implement shops and shop memberships.
- Migrate merchant onboarding basics.

Output:

- Identity and ownership are no longer Base44-dependent.

## Step 6: Migrate Listings And Discovery

Tasks:

- Implement listings CRUD.
- Implement nearby listing/shop search with PostGIS.
- Implement signed uploads for photos.
- Implement AI suggestion endpoint if needed for listing creation parity.

Output:

- Consumer browsing and merchant listing creation use custom backend.

## Step 7: Migrate Checkout And Orders

Tasks:

- Implement order transaction and inventory locking.
- Implement payment intent creation.
- Implement order state machine.
- Implement pickup code verification.
- Implement cancellation rules.

Output:

- The marketplace core works without Base44.

This is the highest-value milestone because it proves the custom architecture can support real revenue flow.

## Step 8: Migrate Notifications Around Orders

Tasks:

- Implement outbox events.
- Implement in-app notifications.
- Implement push token registration.
- Implement email/push jobs for order updates and pickup reminders.

Output:

- Order lifecycle communication no longer depends on Base44 automations.

## Step 9: Migrate Payments, Ledger, And Payouts

Tasks:

- Implement Stripe Connect onboarding.
- Implement webhook processor.
- Implement ledger entries and balance projection.
- Implement payout requests and admin reconciliation.

Output:

- Merchant money movement is auditable and production-ready.

## Step 10: Migrate Compliance

Tasks:

- Implement compliance events, waste logs, donation receipts.
- Implement corrections and report finalization.
- Implement PDF generation and storage.
- Implement admin compliance review.

Output:

- Compliance reporting works with stronger immutability than the current Base44 model.

## Step 11: Migrate Messaging, Loyalty, Referrals, Challenges

Tasks:

- Migrate conversations/messages.
- Migrate loyalty program and reward redemption.
- Migrate referrals and challenge analytics.
- Add real-time transport only where needed.

Output:

- Engagement and retention features are custom-backed.

## Step 12: Remove Base44

Tasks:

- Remove `@base44/sdk`.
- Remove `@base44/vite-plugin`.
- Remove `base44/functions` from runtime deployment.
- Remove Base44 auth/token/app params.
- Remove direct Base44 integration wrappers.
- Run full parity and regression testing.

Output:

- Save&Serve no longer depends on Base44 at runtime.

## First Engineering Ticket Recommendation

Create a non-user-facing backend foundation PR:

- Add `apps/api` and `apps/worker`.
- Add PostgreSQL/PostGIS and Redis local setup.
- Add migrations for `users`, `shops`, `shop_memberships`, `listings`, and `orders`.
- Add health endpoint.
- Add OpenAPI scaffolding.
- Add CI checks.

Do not migrate UI in that first PR. It should prove the custom foundation can build, run, migrate, and deploy cleanly before product behavior moves over.

