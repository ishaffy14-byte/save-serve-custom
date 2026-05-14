# Product Modules And User Flows

## Product Summary

Save&Serve is a surplus food marketplace and compliance platform for consumers, food retailers, admins, and city/compliance operators. It combines discounted surplus listings, pickup orders, retailer onboarding, Stripe payments/payouts, waste documentation, sustainability impact, loyalty, messaging, notifications, and admin oversight.

## Primary User Roles

- Consumer: discovers nearby surplus food, orders/reserves, pays, picks up, reviews, earns loyalty/rewards, follows shops, receives notifications.
- Merchant owner: onboards shop, creates listings, manages orders, tracks earnings, handles compliance and donations, manages loyalty programs.
- Merchant staff: supports shop operations, order pickup, inventory/listing updates where authorized.
- Admin: manages retailers, applications, challenges, analytics, compliance review, payout reconciliation.
- City scout/compliance operator: supports merchant onboarding and verification, especially for compliance/site baseline workflows.

## Consumer Flows

### Signup And Profile

1. User lands on `Welcome` or `Home`.
2. User authenticates through Base44 auth today.
3. User completes profile fields such as phone, DOB, dietary preferences, allergens, saved locations, consent, and notification preferences.
4. Referral code may be captured from URL and processed after account creation.

Target rebuild behavior:

- Replace Base44 login with first-party auth.
- Preserve referral and consent tracking.
- Move profile writes through `/me` and preference APIs.

### Discovery And Ordering

1. Consumer grants or enters location.
2. App loads active listings and shops.
3. User filters by category, location, dietary preferences, price, and saved searches.
4. User opens listing details.
5. User orders through online payment, pay-at-store, reservation, or demo flow.
6. Backend creates order, decrements listing availability, calculates CO2 impact, creates pickup code, and triggers notifications.

Critical backend requirements:

- Atomic stock decrement.
- Payment intent validation before order confirmation.
- Server-side price and fee calculation.
- Fraud-resistant pickup code validation.

### Pickup, Cancellation, Review

1. Consumer sees orders in `MyOrders`.
2. Consumer receives order status updates and pickup reminders.
3. Merchant marks ready/picked up/no-show/cancelled.
4. Consumer can cancel within allowed rules.
5. Consumer submits review and photos.
6. Shop rating and order review state are updated.

Target rebuild behavior:

- Use explicit order state machine.
- Make cancellation policies server-owned.
- Recalculate ratings server-side.

### Loyalty And Referrals

1. Consumer earns points per eligible order.
2. Consumer views shop loyalty programs and rewards.
3. Consumer redeems reward codes.
4. Referral rewards are issued after referred user completes required activity.

Target rebuild behavior:

- Record loyalty point ledger entries instead of only mutable totals.
- Prevent duplicate referral and reward issuance with unique constraints.

## Merchant Flows

### Merchant Onboarding

1. Prospective retailer enters shop details, address, phone, tax/compliance information, documents, and business type.
2. Shop is created with pending compliance/verification state.
3. Admin or city scout approves, rejects, or requests documents.
4. Merchant becomes active and can create listings.

Target rebuild behavior:

- Model onboarding as an application workflow.
- Separate `users`, `shops`, `shop_memberships`, and `merchant_applications`.
- Store document metadata and verification decisions in auditable records.

### Listing Creation

1. Merchant uploads one or more photos.
2. App uses AI to suggest category/title/description/quantity.
3. Merchant enters price, quantity, weight, pickup window, allergens, dietary tags, pickup instructions.
4. Listing is published.
5. Compliance event may be generated automatically.
6. Matching saved searches/followers may be notified.

Target rebuild behavior:

- Keep AI assistance optional and server-mediated.
- Validate price, quantity, pickup windows, and weight server-side.
- Generate compliance and notification events asynchronously after commit.

### Order Management

1. Merchant sees active orders.
2. Merchant confirms, marks ready, verifies pickup code, marks picked up/no-show/cancelled.
3. Order updates create notifications and may update compliance outcomes.

Target rebuild behavior:

- Enforce order transitions in backend.
- Record actor, timestamp, reason, and metadata for every status change.

### Earnings And Payouts

1. Merchant connects Stripe account.
2. Online payments route through Stripe Connect.
3. Retailer balance tracks pending balance, gross, fees, and unpaid orders.
4. Payouts are requested or run by schedule.
5. Admin reconciles payouts.

Target rebuild behavior:

- Treat Stripe as source of truth for payment movement.
- Maintain local ledger and reconciliation records.
- Process webhooks idempotently.

### Compliance

1. Merchant logs waste, donations, expired listings, or surplus outcomes.
2. App generates compliance events and monthly reports.
3. Evidence photos and PDFs are uploaded.
4. Admin finalizes/archives reports.
5. Corrections create immutable replacement records.

Target rebuild behavior:

- Use append-only compliance events with correction records.
- Add report snapshots and integrity hashes.
- Keep audit trails for all compliance-sensitive changes.

## Admin Flows

- Review merchant applications.
- Add retailers manually or via CSV.
- Monitor shops, users, listings, and orders.
- Manage challenges and platform analytics.
- Review compliance reports and correction records.
- Reconcile balances and payouts.
- Resolve user reports and message abuse reports.

Target rebuild behavior:

- Replace broad entity list calls with scoped admin APIs.
- Add pagination, search, filters, role checks, and audit logging.

## Communication And Notification Flows

- In-app notifications for order events, price drops, followed shop listings, matching searches, loyalty updates, and reminders.
- Email notifications through Base44 today.
- Push notifications through Firebase token registration and FCM sending.
- Conversations/messages between consumers and merchants.

Target rebuild behavior:

- Create a notification service inside the modular monolith.
- Store notification records in the database.
- Send email/push via jobs after database commits.
- Replace Base44 real-time subscriptions with WebSocket/SSE or polling per flow.

