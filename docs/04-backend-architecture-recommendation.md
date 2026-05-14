# Backend Architecture Recommendation

## Recommended Backend Stack

Use TypeScript for continuity with the current frontend and Base44 functions.

Recommended default:

- Runtime: Node.js LTS.
- Framework: NestJS for module boundaries, dependency injection, guards, validation, OpenAPI generation, and background worker organization.
- Database: PostgreSQL with PostGIS.
- ORM: Prisma.
- Queue: BullMQ with Redis.
- Validation: Zod or class-validator. Prefer Zod if shared schemas with frontend are important.
- API docs: OpenAPI generated from backend routes.
- Tests: Vitest or Jest for unit tests; Playwright/API integration tests for critical flows.

Lean alternative:

- Fastify + Zod + Prisma + BullMQ.

Choose Fastify if the team wants less framework ceremony. Choose NestJS if multiple engineers will own domain modules and consistency matters more than minimalism.

## Backend Application Layout

Proposed structure:

```text
apps/
  api/
    src/
      main.ts
      app.module.ts
      config/
      common/
        auth/
        errors/
        guards/
        logging/
        pagination/
        validation/
      modules/
        auth/
        users/
        shops/
        listings/
        orders/
        payments/
        ledger/
        compliance/
        notifications/
        messaging/
        loyalty/
        admin/
        files/
        geo/
        ai/
      jobs/
      prisma/
  worker/
    src/
      main.ts
      processors/
packages/
  shared/
    src/
      api-contracts/
      domain-types/
      constants/
```

This can live in the existing repo or in a new monorepo root. If the rebuild remains in this repo, introduce `apps/web` only after the current `src` is migrated or moved.

## Authorization Model

Replace Base44 RLS with explicit authorization policies.

Core rules:

- Consumers can read public active shops/listings and their own orders/messages/preferences.
- Merchants can manage shops where they are owner/staff.
- Merchants can manage listings and orders belonging to their shops.
- Admins can read and manage operational records.
- City scouts can access onboarding and compliance verification records explicitly assigned or permitted by role.

Implementation pattern:

- Put identity in `RequestContext`.
- Use route guards for broad role checks.
- Use policy functions for record-level checks, for example `canManageShop(user, shopId)`.
- Never trust frontend-supplied `merchant_id`, `consumer_id`, prices, fees, or status transitions.

## Transaction Boundaries

Critical transactions:

- Order creation: validate listing, lock stock row, decrement quantity, create order, create event records.
- Payment completion: verify Stripe event idempotently, update payment/order/ledger.
- Pickup confirmation: validate code and transition order to picked up once.
- Listing expiration/donation/resolution: update listing and compliance outcome together.
- Loyalty award/redemption: write ledger entry and update account balances atomically.
- Compliance correction: void/supersede records and create audit trail atomically.

Use database transactions and idempotency keys for all externally retried operations.

## Background Jobs

Move these out of request/response paths:

- Email and push delivery.
- Pickup reminders.
- Price drop and saved search matching.
- Followed shop listing notifications.
- Auto-expire listings.
- Compliance PDF/report generation.
- Monthly compliance report generation.
- Payout batch processing.
- Stripe reconciliation.
- AI predictions and enrichment when not needed synchronously.

## Eventing Pattern

Within the monolith, use an outbox table instead of ad hoc side effects.

Flow:

1. API writes domain records and an `outbox_events` row in the same transaction.
2. Worker reads pending events.
3. Worker sends notifications, emails, webhooks, or generated documents.
4. Worker marks event processed or retries with backoff.

This prevents lost notifications and duplicate emails when requests fail midway.

## Security Requirements

- Store secrets only in backend environment variables or a secret manager.
- Use signed upload URLs and server-validated file metadata.
- Enforce rate limits on auth, OTP, checkout, messaging, and AI endpoints.
- Validate Stripe webhook signatures.
- Do not let clients directly set financial fields, compliance lock fields, payout state, or notification delivery state.
- Encrypt or tightly restrict sensitive merchant compliance/tax fields.
- Keep audit logs for admin, compliance, payout, and order-status actions.

## Observability

Minimum production setup:

- Structured logs with request id and user id.
- Error tracking such as Sentry.
- Metrics for checkout success/failure, payment webhooks, notification delivery, job failures, API latency.
- Admin audit log search.
- Health checks for API, worker, database, Redis, and external provider reachability.

