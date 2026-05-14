# Database Design Draft

## Database Recommendation

Use PostgreSQL with PostGIS.

Reasons:

- Marketplace queries need filtering by shop/listing location.
- Orders, payments, inventory, compliance, and loyalty need transactions.
- Compliance and audit records benefit from relational integrity and append-only constraints.
- JSONB can preserve flexible fields where the current Base44 model uses objects.

## Cross-Cutting Columns

Most tables should include:

- `id uuid primary key`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `deleted_at timestamptz` for soft-delete where needed

Use database enums or checked text fields for stable statuses.

## Identity And Access

### users

- `id`
- `email`
- `phone`
- `full_name`
- `role` enum: `user`, `admin`
- `user_role` enum: `consumer`, `merchant_owner`, `merchant_staff`, `city_scout`
- `dob_day`, `dob_month`, `dob_year`
- `referral_code unique`
- `referred_by`
- `referral_credits_cents`
- `onboarding_completed`
- `compliance_status`
- `gdpr_consent jsonb`
- `sustainability_stats jsonb`
- `preferred_categories text[]`
- `dietary_preferences text[]`
- `allergens text[]`
- `saved_locations jsonb`

### sessions / auth_accounts

If using first-party auth:

- `sessions`: session token hash, user id, expiry, device metadata.
- `auth_accounts`: password/OAuth provider identities.

### shop_memberships

- `id`
- `shop_id`
- `user_id`
- `role` enum: `owner`, `staff`, `manager`
- unique `(shop_id, user_id)`

This replaces `Shop.owner_id` plus `staff_ids` arrays for permissions, while `owner_id` can remain denormalized during migration.

## Shops And Listings

### shops

- `id`
- `owner_id`
- `name`
- `description`
- `address`
- `location geography(Point, 4326)`
- `district`
- `phone`
- `tax_id`
- `business_hours jsonb`
- `shop_type`
- `photos text[]`
- `is_active`
- `is_accepting_orders`
- `accepts_cash`
- `accepts_pay_at_store`
- `rating_average`
- `total_reviews`
- `total_listings`
- `total_orders`
- `subscription_plan`
- `subscription_start_at`
- `subscription_end_at`
- `has_used_trial`
- `stripe_customer_id`
- `stripe_subscription_id`
- `compliance_badge`
- `waste_reduction_rate`
- `total_kg_rescued`
- `co2_saved_kg`
- `site_baseline jsonb`
- `waste_collector jsonb`

Indexes:

- GiST on `location`
- `(owner_id)`
- `(is_active, is_accepting_orders)`
- `(district, shop_type)`

### listings

- `id`
- `shop_id`
- `merchant_id`
- `title`
- `description`
- `category`
- `photos text[]`
- `original_price_cents`
- `deal_price_cents`
- `quantity_available`
- `quantity_sold`
- `unit`
- `weight_estimate_kg numeric`
- `prepared_at`
- `pickup_window_start`
- `pickup_window_end`
- `pickup_instructions`
- `status`
- `grace_period_expires_at`
- `resolution_notified`
- `ai_confidence`
- `co2_saved_per_bundle_kg`
- `allergens text[]`
- `dietary_tags text[]`
- `prediction_feedback jsonb`
- `is_demo`

Indexes:

- `(shop_id, status)`
- `(status, pickup_window_end)`
- `(merchant_id)`
- text search on title/description if needed

## Orders And Checkout

### orders

- `id`
- `listing_id`
- `shop_id`
- `merchant_id`
- `consumer_id`
- `quantity`
- `subtotal_cents`
- `platform_fee_cents`
- `stripe_fee_cents`
- `total_cents`
- `merchant_payout_cents`
- `payment_method`
- `payment_status`
- `payment_intent_id`
- `pickup_code_hash`
- `status`
- `pickup_window_start`
- `pickup_window_end`
- `picked_up_at`
- `picked_up_by_staff_id`
- `cancelled_at`
- `cancelled_by`
- `cancellation_reason`
- `co2_saved_kg`
- `reminder_sent`
- `review_submitted`
- `is_demo`

Indexes:

- `(consumer_id, created_at desc)`
- `(shop_id, created_at desc)`
- `(merchant_id, created_at desc)`
- `(payment_intent_id)` unique where not null
- `(status, pickup_window_end)`

### order_events

Append-only status/action log:

- `id`
- `order_id`
- `actor_user_id`
- `from_status`
- `to_status`
- `event_type`
- `reason`
- `metadata jsonb`

## Payments And Ledger

### payments

- `id`
- `order_id`
- `provider` default `stripe`
- `provider_payment_intent_id`
- `provider_charge_id`
- `amount_cents`
- `currency`
- `status`
- `raw_provider_status`
- `metadata jsonb`

### retailer_balances

- `id`
- `merchant_id`
- `shop_id`
- `stripe_account_id`
- `pending_balance_cents`
- `total_paid_out_cents`
- `offline_revenue_cents`
- `negative_balance_cents`
- `total_gross_cents`
- `total_fees_cents`
- `payouts_enabled`
- `charges_enabled`
- `kyc_status`
- `payout_schedule`
- `minimum_payout_threshold_cents`
- `payout_hold`
- `last_payout_at`
- `next_payout_at`

### ledger_entries

Use a ledger instead of only mutable balance fields:

- `id`
- `shop_id`
- `merchant_id`
- `order_id`
- `payout_id`
- `type` enum: `order_gross`, `platform_fee`, `stripe_fee`, `merchant_credit`, `payout_debit`, `adjustment`, `refund`
- `amount_cents`
- `currency`
- `occurred_at`
- `metadata jsonb`

### retailer_payouts

- `id`
- `shop_id`
- `merchant_id`
- `stripe_account_id`
- `stripe_payout_id`
- `payout_batch_id`
- `gross_amount_cents`
- `platform_fees_cents`
- `processing_fees_cents`
- `net_amount_cents`
- `order_count`
- `status`
- `payout_date`
- `paid_at`
- `period_start`
- `period_end`
- `failure_reason`

## Compliance

### compliance_events

- `id`
- `shop_id`
- `merchant_id`
- `workflow_status`
- `final_outcome`
- `outcome_date`
- `item_name`
- `category`
- `quantity`
- `unit`
- `weight`
- `estimation_method`
- `ewc_code`
- `source_type`
- `source_listing_id`
- `source_order_id`
- `auto_generated`
- `evidence_ref`
- `resolved_by`
- `resolved_at`
- `co2_avoided_kg`
- `report_section`
- `is_audit_locked`
- `is_voided`
- `voided_by_correction_id`
- `replaces_record_id`

### waste_logs

- `id`
- `shop_id`
- `merchant_id`
- `date`
- `waste_category`
- `estimated_kg`
- `waste_items jsonb`
- `items_sold`
- `items_donated`
- `donated_items jsonb`
- `total_revenue_cents`
- `notes`
- `evidence_photos text[]`
- immutable/correction fields

### compliance_reports

- `id`
- `shop_id`
- `merchant_id`
- `month_year`
- `summary_stats jsonb`
- `is_finalized`
- `finalized_at`
- `integrity_hash`
- `finalized_by_admin_id`
- `admin_notes`
- `status`
- `pdf_file_id`
- `archived_at`

### correction_records

- `id`
- `entity_type`
- `original_record_id`
- `new_record_id`
- `shop_id`
- `correction_type`
- `changes_made jsonb`
- `original_values jsonb`
- `corrected_values jsonb`
- `reason`
- `created_by_user_id`
- `approved_by_admin_id`
- `correction_status`
- `pdf_file_id`
- `integrity_hash`

## Notifications And Messaging

### notification_preferences

- `id`
- `user_id unique`
- push/email booleans matching current schema
- quiet hour fields

### push_tokens

- `id`
- `user_id`
- `token_hash`
- `encrypted_token`
- `platform`
- `registered_at`
- `last_seen_at`
- unique `(user_id, token_hash)`

### notifications

- `id`
- `user_id`
- `title`
- `message`
- `type`
- `is_read`
- `reference_id`
- `reference_type`
- `icon`
- `link_url`

### conversations

- `id`
- `order_id`
- `shop_id`
- `consumer_id`
- `merchant_id`
- `thread_type`
- `subject`
- `status`
- `last_message`
- `last_message_at`
- unread count fields

### messages

- `id`
- `conversation_id`
- `sender_id`
- `sender_role`
- `content`
- `is_read`

## Loyalty And Growth

### loyalty_programs, loyalty_accounts, loyalty_transactions, rewards, reward_redemptions

Current `LoyaltyPoints` should become `loyalty_accounts`, with `loyalty_transactions` added for auditability.

### referrals

Keep unique constraints to prevent duplicate reward issue:

- unique `(referred_id)`
- unique `(referrer_id, referred_id)`

## Files And Audit

### files

- `id`
- `owner_user_id`
- `shop_id`
- `bucket`
- `object_key`
- `mime_type`
- `size_bytes`
- `purpose`
- `visibility`
- `checksum`

### audit_trails

Use for admin, compliance, payout, merchant verification, and sensitive order events.

### outbox_events

- `id`
- `event_type`
- `aggregate_type`
- `aggregate_id`
- `payload jsonb`
- `status`
- `attempts`
- `available_at`
- `processed_at`

## Migration Notes

- Convert all money from EUR floats to integer cents.
- Convert location objects `{ lat, lng }` into PostGIS points.
- Normalize arrays used for permissions, especially `staff_ids` and `push_tokens`.
- Keep JSONB for flexible compliance fields during the first migration, then normalize only where query patterns demand it.

