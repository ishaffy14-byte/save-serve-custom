# API Design Draft

## API Style

Use REST with OpenAPI for the first rebuild.

Reasons:

- The current frontend maps naturally to resource and action endpoints.
- Mobile apps benefit from stable, cacheable endpoints.
- OpenAPI gives generated clients, docs, validation, and contract tests.
- Webhooks and background jobs remain straightforward.

GraphQL is not recommended initially because most risk is in transactions, authorization, and provider integration, not client query flexibility.

## API Conventions

- Prefix: `/api/v1`
- Auth: secure session cookie for web plus bearer tokens for mobile, or bearer tokens for all clients if implemented carefully.
- Idempotency: `Idempotency-Key` header for checkout, payment, payout, and mutation retries.
- Pagination: cursor-based for feeds and admin lists.
- Errors: stable shape with `code`, `message`, `details`, `request_id`.
- Money: integer cents in API payloads, not floats.
- Dates: ISO 8601 UTC.

## Auth And Current User

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/otp/send`
- `POST /auth/otp/verify`
- `GET /me`
- `PATCH /me`
- `PATCH /me/preferences`
- `PATCH /me/saved-locations`
- `GET /me/impact`

Migration note: exact login methods need product confirmation. Current app depends on Base44 redirect auth and token hydration.

## Shops

- `GET /shops`
- `GET /shops/nearby?lat=&lng=&radius=`
- `GET /shops/{shopId}`
- `POST /shops`
- `PATCH /shops/{shopId}`
- `POST /shops/{shopId}/members`
- `DELETE /shops/{shopId}/members/{userId}`
- `POST /shops/{shopId}/follow`
- `DELETE /shops/{shopId}/follow`
- `PATCH /shops/{shopId}/accepting-orders`
- `GET /shops/{shopId}/reviews`

## Merchant Onboarding

- `POST /merchant-applications`
- `GET /merchant-applications/me`
- `PATCH /merchant-applications/{id}`
- `POST /merchant-applications/{id}/documents`
- `POST /admin/merchant-applications/{id}/approve`
- `POST /admin/merchant-applications/{id}/reject`

## Listings

- `GET /listings`
- `GET /listings/nearby?lat=&lng=&radius=`
- `GET /listings/{listingId}`
- `POST /shops/{shopId}/listings`
- `PATCH /listings/{listingId}`
- `POST /listings/{listingId}/archive`
- `POST /listings/{listingId}/cancel`
- `POST /listings/{listingId}/donate`
- `POST /listings/{listingId}/resolve-expired`
- `POST /listings/{listingId}/prediction-feedback`
- `POST /listings/ai/suggest`
- `POST /listings/ai/predict-quantity`

Important: listing creation should not allow clients to set computed fields such as `co2_saved_per_bundle_kg` directly.

## Checkout And Orders

- `POST /checkout/payment-intents`
- `POST /orders`
- `GET /orders/me`
- `GET /orders/{orderId}`
- `POST /orders/{orderId}/cancel`
- `POST /orders/{orderId}/confirm`
- `POST /orders/{orderId}/ready`
- `POST /orders/{orderId}/pickup`
- `POST /orders/{orderId}/no-show`
- `POST /orders/{orderId}/refund`

Order creation request:

```json
{
  "listing_id": "uuid",
  "quantity": 1,
  "payment_method": "card",
  "payment_intent_id": "pi_..."
}
```

Server responsibilities:

- Fetch listing and shop.
- Calculate price, fee, payout, CO2.
- Verify payment status when required.
- Lock inventory and create order transactionally.
- Emit outbox events for notifications and compliance.

## Payments, Stripe Connect, And Payouts

- `GET /payments/config`
- `POST /payments/stripe/account`
- `POST /payments/stripe/account-session`
- `GET /payments/stripe/account-status`
- `POST /payments/stripe/bank-account`
- `POST /payments/subscriptions/checkout`
- `POST /webhooks/stripe`
- `GET /merchant/balance`
- `GET /merchant/payouts`
- `POST /merchant/payouts/request`
- `POST /admin/payouts/process`
- `GET /admin/payouts/reconciliation`

Webhook requirements:

- Verify Stripe signatures.
- Store event ids with unique constraints.
- Process idempotently.
- Do not trust client payment success without backend or webhook verification.

## Compliance

- `GET /shops/{shopId}/compliance/events`
- `POST /shops/{shopId}/compliance/events`
- `PATCH /compliance/events/{eventId}`
- `POST /compliance/events/{eventId}/resolve`
- `POST /compliance/events/{eventId}/void`
- `GET /shops/{shopId}/waste-logs`
- `POST /shops/{shopId}/waste-logs`
- `GET /shops/{shopId}/compliance/reports`
- `POST /shops/{shopId}/compliance/reports/generate`
- `POST /compliance/reports/{reportId}/finalize`
- `GET /compliance/reports/{reportId}/download`
- `POST /corrections`

## Notifications

- `GET /notifications`
- `PATCH /notifications/{id}/read`
- `POST /notifications/read-all`
- `GET /notification-preferences`
- `PATCH /notification-preferences`
- `POST /push-tokens`
- `DELETE /push-tokens/{id}`

Backend-only worker actions:

- Send push.
- Send email.
- Queue pickup reminders.
- Queue price-drop and saved-search notifications.

## Messaging

- `GET /conversations`
- `POST /conversations`
- `GET /conversations/{id}/messages`
- `POST /conversations/{id}/messages`
- `POST /conversations/{id}/read`
- `POST /messages/{id}/report`

Real-time options:

- Start with polling or TanStack Query refetch for lower implementation risk.
- Add WebSocket/SSE for messages and order notifications after core migration.

## Reviews And Reports

- `POST /orders/{orderId}/review`
- `PATCH /reviews/{reviewId}`
- `POST /reviews/{reviewId}/helpful`
- `POST /reports`
- `GET /admin/reports`
- `POST /admin/reports/{id}/resolve`

## Loyalty And Referrals

- `GET /loyalty/accounts`
- `GET /shops/{shopId}/loyalty-program`
- `PUT /shops/{shopId}/loyalty-program`
- `POST /shops/{shopId}/rewards`
- `PATCH /rewards/{rewardId}`
- `POST /rewards/{rewardId}/redeem`
- `GET /referrals`
- `POST /referrals/claim`

## Admin

- `GET /admin/users`
- `GET /admin/shops`
- `GET /admin/listings`
- `GET /admin/orders`
- `GET /admin/analytics`
- `GET /admin/compliance`
- `GET /admin/audit-trail`
- `POST /admin/challenges`
- `PATCH /admin/challenges/{id}`
- `DELETE /admin/challenges/{id}`

Admin APIs must always paginate and filter server-side.

## Files

- `POST /files/upload-url`
- `POST /files/complete`
- `GET /files/{id}/download-url`

Client flow:

1. Request signed upload URL with purpose and metadata.
2. Upload directly to object storage.
3. Complete upload so backend records file ownership and visibility.

