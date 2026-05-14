# Risks, Unknowns, And Assumptions

## Assumptions

- `save-serve-pr` is the current source tree to plan against.
- The existing Base44 product is the functional reference for parity.
- The goal is to preserve current web, Android, and iOS behavior during migration.
- A modular monolith is acceptable unless future scale proves otherwise.
- Stripe, Firebase, Google location services, email, and file storage can remain external providers.
- The team prefers practical maintainability over a large platform rewrite.

## High Risks

### Auth Migration

Current auth is Base44-specific and includes redirect login, public settings checks, access token URL hydration, and mobile deep link behavior.

Risk:

- Users may lose access or mobile login may break if token/session migration is not planned carefully.

Mitigation:

- Decide auth provider early.
- Build dual-compatible login callback temporarily.
- Test web, Android, and iOS login separately.

### Payment And Payout Correctness

Payments currently span frontend checkout, Base44 functions, Stripe PaymentIntents, Stripe Connect accounts, balances, payouts, subscriptions, and webhooks.

Risk:

- Incorrect ledger/payout handling can create financial loss or reconciliation gaps.

Mitigation:

- Treat Stripe webhooks as source of truth.
- Add idempotency and unique provider event ids.
- Use integer cents.
- Build ledger entries before payout automation.

### Inventory Race Conditions

Current `processOrder` decrements listing quantity in a server function, but Base44 does not express database-level locking in the repository.

Risk:

- Overselling during concurrent checkout.

Mitigation:

- Use PostgreSQL transaction with row-level lock or optimistic version column.
- Add concurrency tests before production checkout migration.

### Compliance Immutability

Compliance records include audit locks, corrections, generated PDFs, and integrity hashes.

Risk:

- A naive CRUD migration can weaken regulatory/audit behavior.

Mitigation:

- Use append-only event/correction records for compliance-sensitive data.
- Restrict updates after finalization.
- Hash report snapshots and store source data versions.

### Hidden Base44 Behavior

Base44 may provide implicit behavior not visible in the repo: auth user fields, created/updated timestamps, entity permissions, subscriptions, file upload handling, scheduled functions, or public settings.

Risk:

- Custom backend may miss runtime behavior used in production.

Mitigation:

- Export production metadata and sample records.
- Exercise every flow in Base44 and record API side effects.
- Add parity tests around critical flows.

## Medium Risks

### Schema Drift

Observed references to missing entities:

- `Reservation`
- `RetailerSubscription`

Observed undeclared user fields:

- `push_tokens`
- `favorite_listings`

Risk:

- Automated schema migration would omit fields required by current UI.

Mitigation:

- Generate schema from both Base44 entity files and code usage.
- Validate against production data export.

### Frontend Business Logic

Several flows calculate or mutate important domain state from pages/components.

Risk:

- Rebuild may preserve insecure client-owned rules.

Mitigation:

- Move price, fees, order transitions, loyalty awards, compliance locking, and notification decisions server-side.

### Real-Time Features

The app uses Base44 entity subscriptions for orders, messages, conversations, and notifications.

Risk:

- Removing Base44 will degrade live updates.

Mitigation:

- Start with polling where acceptable.
- Add SSE/WebSocket selectively for chat/order notifications.

### Mobile Push

Native push code is currently gated and Base44 mobile builds appear limited.

Risk:

- Push behavior differs across web, Android, and iOS after migration.

Mitigation:

- Build a dedicated push test matrix.
- Store tokens separately.
- Use environment-specific Firebase projects and APNs configuration.

### File Storage Access

Current upload URLs and permissions are hidden behind Base44 `UploadFile`.

Risk:

- Files may become public/private incorrectly or links may break.

Mitigation:

- Introduce explicit file metadata, signed URLs, storage purpose, and ownership checks.

## Unknowns To Resolve

- Which auth methods are required: email/password, magic link, OTP, OAuth, phone, or Base44 account migration?
- Is there production data that must be migrated, or can the rebuild start fresh?
- What are the current active markets beyond Berlin districts in the schema?
- Which payment methods must launch first: card, Apple Pay, Google Pay, PayPal, girocard, pay-at-store?
- Are reservations still active product scope, given missing `Reservation` schema?
- Are retailer subscriptions active product scope, given missing `RetailerSubscription` schema?
- What compliance standard detail is legally required for GewAbfV reporting and audit retention?
- What email/SMS providers should replace Base44 integrations?
- What deployment target is preferred: Render, Fly.io, Railway, AWS, GCP, Azure, Vercel plus managed services, or another platform?
- Who needs admin access and what operational actions need approval workflows?

## Technical Debt To Track

- Direct Base44 calls across many UI files.
- Base44 Vite plugin and visual edit agent in production build path.
- Hash routing may complicate deep links and SEO.
- Mixed demo/test behavior in production domain models.
- Some large page components contain business logic and should be split during migration.
- Money fields use EUR decimal numbers instead of integer cents.
- Some permissions are represented as arrays on records instead of normalized membership tables.

