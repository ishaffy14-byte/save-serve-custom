# Phased Migration Plan

## Phase 0: Discovery Hardening

Goal: remove ambiguity before implementation.

Actions:

- Confirm `save-serve-pr` is the canonical repository.
- Export Base44 production schemas and sample data.
- Inventory every Base44 entity call and function invocation.
- Resolve missing entity definitions for `Reservation` and `RetailerSubscription`.
- Identify all runtime secrets and provider accounts.
- Decide auth method and deployment provider.

Deliverables:

- Final data dictionary.
- Provider/secrets inventory.
- Migration acceptance checklist.

## Phase 1: Foundation

Goal: create custom backend skeleton without changing user-facing behavior.

Actions:

- Add TypeScript API app.
- Add PostgreSQL/PostGIS migrations.
- Add Redis/job worker setup.
- Add config/secrets management.
- Add logging, error handling, health checks.
- Add OpenAPI scaffolding.
- Add frontend API client abstraction.

Deliverables:

- Deployable API and worker.
- Local Docker Compose environment.
- CI checks for lint/test/build/migrations.

## Phase 2: Auth, Users, Shops

Goal: establish identity and merchant ownership.

Actions:

- Implement auth/session flow.
- Implement `/me`, profile, preferences, saved locations.
- Implement shops and shop memberships.
- Implement merchant onboarding/application basics.
- Build migration scripts for users and shops.

Deliverables:

- Users and shops readable/writable outside Base44.
- Role and record-level authorization policies tested.
- Frontend can run auth/profile/shop flows against custom API.

## Phase 3: Listings And Discovery

Goal: migrate marketplace browsing and merchant listing creation.

Actions:

- Implement listings CRUD and nearby search.
- Implement signed upload flow for listing photos.
- Implement AI listing suggestion endpoint.
- Implement saved searches and follows.
- Update `Discover`, `AddItem`, and `ListingManager` through API adapter.

Deliverables:

- Consumers can browse custom listings.
- Merchants can create and manage custom listings.
- Discovery uses PostGIS instead of client-side broad list filtering.

## Phase 4: Checkout And Orders

Goal: migrate the most critical transactional path.

Actions:

- Implement order creation with stock locking.
- Implement payment intent creation and payment verification.
- Implement order state machine.
- Implement pickup codes and cancellation policy.
- Implement order notifications through outbox jobs.
- Update checkout, `MyOrders`, `RetailerOrders`, and dashboard order widgets.

Deliverables:

- End-to-end custom order flow.
- Concurrency tests prove no overselling.
- Payment and order idempotency tests pass.

## Phase 5: Stripe Connect, Balances, Payouts

Goal: migrate merchant money movement and reconciliation.

Actions:

- Implement Connect onboarding/account sessions.
- Implement balance and ledger tables.
- Implement Stripe webhooks idempotently.
- Implement payout request and admin reconciliation APIs.
- Update `RetailerPayouts` and `AdminPayoutReconciliation`.

Deliverables:

- Stripe test mode parity.
- Local ledger reconciles against Stripe events.
- Admin payout flow has audit trail.

## Phase 6: Compliance

Goal: migrate compliance-sensitive workflows with stronger auditability.

Actions:

- Implement waste logs, compliance events, donation receipts.
- Implement corrections and audit locks.
- Implement monthly report generation.
- Implement PDF generation and storage.
- Update `Compliance`, `AdminComplianceCenter`, and related components.

Deliverables:

- Compliance data model is append-only where required.
- PDF/report generation works without Base44 uploads.
- Corrections preserve original values and audit trail.

## Phase 7: Notifications, Messaging, Loyalty

Goal: complete engagement features.

Actions:

- Implement in-app notifications and preferences.
- Implement FCM token table and push sender.
- Implement email provider integration.
- Implement conversations/messages.
- Implement loyalty programs, point ledger, rewards, redemptions.
- Update notification/messaging/loyalty UI modules.

Deliverables:

- Notification delivery jobs replace Base44 automations.
- Messaging no longer uses Base44 subscriptions.
- Loyalty has auditable point changes.

## Phase 8: Admin, Analytics, And Cleanup

Goal: remove remaining Base44 dependencies and harden production operations.

Actions:

- Implement admin APIs for all operational dashboards.
- Add analytics queries/materialized views where needed.
- Remove `@base44/sdk` and `@base44/vite-plugin`.
- Remove Base44 function wrappers.
- Remove visual edit agent if no longer needed.
- Complete security review and load testing.

Deliverables:

- No runtime Base44 dependency.
- Production deployment checklist complete.
- Monitoring and rollback plan ready.

## Phase 9: Production Cutover

Goal: safely switch production traffic.

Actions:

- Run final data migration.
- Freeze Base44 writes during cutover window or implement dual-write only if unavoidable.
- Validate counts and financial/compliance records.
- Smoke test web, Android, and iOS.
- Monitor errors, payments, job queues, notifications, and checkout conversion.

Deliverables:

- Production custom backend live.
- Base44 retained read-only temporarily for rollback/reference.

