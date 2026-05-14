-- Save&Serve custom backend foundation schema.
-- Initial scope: users, shops, memberships, listings, orders, outbox, and audit trails.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

DO $$
BEGIN
  CREATE TYPE user_platform_role AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE user_business_role AS ENUM ('consumer', 'merchant_owner', 'merchant_staff', 'city_scout');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE shop_membership_role AS ENUM ('owner', 'manager', 'staff');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE listing_status AS ENUM ('active', 'sold_out', 'donated', 'expired', 'cancelled', 'archived', 'pending_resolution');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE order_status AS ENUM ('reserved', 'confirmed', 'ready_for_pickup', 'picked_up', 'no_show', 'cancelled', 'refunded', 'cancelled_wasted', 'cancelled_donated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'succeeded', 'failed', 'refunded', 'pay_at_store', 'reservation', 'demo');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  phone text,
  full_name text,
  platform_role user_platform_role NOT NULL DEFAULT 'user',
  user_role user_business_role NOT NULL DEFAULT 'consumer',
  dob_day integer CHECK (dob_day IS NULL OR dob_day BETWEEN 1 AND 31),
  dob_month integer CHECK (dob_month IS NULL OR dob_month BETWEEN 1 AND 12),
  dob_year integer,
  referral_code text UNIQUE,
  referred_by text,
  referral_credits_cents integer NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  compliance_status text,
  gdpr_consent jsonb NOT NULL DEFAULT '{"accepted": false}'::jsonb,
  sustainability_stats jsonb NOT NULL DEFAULT '{"items_saved": 0, "co2_reduced": 0, "money_saved": 0}'::jsonb,
  preferred_categories text[] NOT NULL DEFAULT '{}',
  dietary_preferences text[] NOT NULL DEFAULT '{}',
  allergens text[] NOT NULL DEFAULT '{}',
  saved_locations jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES users(id),
  name text NOT NULL,
  description text,
  address text NOT NULL,
  location geography(Point, 4326) NOT NULL,
  district text,
  phone text,
  tax_id text,
  business_hours jsonb,
  shop_type text,
  photos text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  is_accepting_orders boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  accepts_cash boolean NOT NULL DEFAULT true,
  accepts_pay_at_store boolean NOT NULL DEFAULT false,
  rating_average numeric(3, 2) NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  total_listings integer NOT NULL DEFAULT 0,
  total_orders integer NOT NULL DEFAULT 0,
  subscription_plan text NOT NULL DEFAULT 'free',
  subscription_start_at timestamptz,
  subscription_end_at timestamptz,
  has_used_trial boolean NOT NULL DEFAULT false,
  stripe_customer_id text,
  stripe_subscription_id text,
  compliance_badge text NOT NULL DEFAULT 'bronze',
  waste_reduction_rate numeric(5, 2) NOT NULL DEFAULT 0,
  total_kg_rescued numeric(12, 3) NOT NULL DEFAULT 0,
  co2_saved_kg numeric(12, 3) NOT NULL DEFAULT 0,
  site_baseline jsonb,
  waste_collector jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS shop_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role shop_membership_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (shop_id, user_id)
);

CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES shops(id),
  merchant_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  description text,
  category text,
  photos text[] NOT NULL DEFAULT '{}',
  original_price_cents integer CHECK (original_price_cents IS NULL OR original_price_cents >= 0),
  deal_price_cents integer NOT NULL CHECK (deal_price_cents > 0),
  quantity_available integer NOT NULL DEFAULT 1 CHECK (quantity_available >= 0),
  quantity_sold integer NOT NULL DEFAULT 0 CHECK (quantity_sold >= 0),
  unit text NOT NULL DEFAULT 'Bundle',
  weight_estimate_kg numeric(10, 3) NOT NULL CHECK (weight_estimate_kg > 0),
  preparation_time_minutes integer CHECK (preparation_time_minutes IS NULL OR preparation_time_minutes >= 0),
  prepared_at timestamptz,
  pickup_window_start timestamptz NOT NULL,
  pickup_window_end timestamptz NOT NULL,
  pickup_instructions text,
  status listing_status NOT NULL DEFAULT 'active',
  grace_period_expires_at timestamptz,
  resolution_notified boolean NOT NULL DEFAULT false,
  ai_confidence numeric(5, 4),
  co2_saved_per_bundle_kg numeric(10, 3),
  allergens text[] NOT NULL DEFAULT '{}',
  dietary_tags text[] NOT NULL DEFAULT '{}',
  prediction_feedback jsonb,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (pickup_window_end > pickup_window_start)
);

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id),
  shop_id uuid NOT NULL REFERENCES shops(id),
  merchant_id uuid NOT NULL REFERENCES users(id),
  consumer_id uuid NOT NULL REFERENCES users(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  platform_fee_cents integer NOT NULL DEFAULT 0 CHECK (platform_fee_cents >= 0),
  stripe_fee_cents integer NOT NULL DEFAULT 0 CHECK (stripe_fee_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  merchant_payout_cents integer NOT NULL CHECK (merchant_payout_cents >= 0),
  payment_method text NOT NULL,
  payment_status payment_status NOT NULL DEFAULT 'pending',
  payment_intent_id text,
  pickup_code_hash text NOT NULL,
  status order_status NOT NULL DEFAULT 'reserved',
  is_demo boolean NOT NULL DEFAULT false,
  pickup_window_start timestamptz NOT NULL,
  pickup_window_end timestamptz NOT NULL,
  picked_up_at timestamptz,
  picked_up_by_staff_id uuid REFERENCES users(id),
  cancelled_at timestamptz,
  cancelled_by text,
  cancellation_reason text,
  co2_saved_kg numeric(10, 3),
  reminder_sent boolean NOT NULL DEFAULT false,
  review_submitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CHECK (pickup_window_end > pickup_window_start)
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_payment_intent_id_unique
  ON orders(payment_intent_id)
  WHERE payment_intent_id IS NOT NULL AND payment_intent_id <> '';

CREATE TABLE IF NOT EXISTS order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id),
  from_status order_status,
  to_status order_status,
  event_type text NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS outbox_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  aggregate_type text NOT NULL,
  aggregate_id uuid NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  available_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_trails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shops(id),
  user_id uuid REFERENCES users(id),
  user_email text,
  user_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_user_role_idx ON users(user_role);
CREATE INDEX IF NOT EXISTS shops_owner_id_idx ON shops(owner_id);
CREATE INDEX IF NOT EXISTS shops_active_idx ON shops(is_active, is_accepting_orders);
CREATE INDEX IF NOT EXISTS shops_location_gist_idx ON shops USING gist(location);
CREATE INDEX IF NOT EXISTS listings_shop_status_idx ON listings(shop_id, status);
CREATE INDEX IF NOT EXISTS listings_status_pickup_end_idx ON listings(status, pickup_window_end);
CREATE INDEX IF NOT EXISTS listings_merchant_id_idx ON listings(merchant_id);
CREATE INDEX IF NOT EXISTS orders_consumer_created_idx ON orders(consumer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_shop_created_idx ON orders(shop_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_merchant_created_idx ON orders(merchant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_pickup_end_idx ON orders(status, pickup_window_end);
CREATE INDEX IF NOT EXISTS order_events_order_created_idx ON order_events(order_id, created_at DESC);
CREATE INDEX IF NOT EXISTS outbox_events_pending_idx ON outbox_events(status, available_at, created_at);
CREATE INDEX IF NOT EXISTS audit_trails_entity_idx ON audit_trails(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_trails_shop_created_idx ON audit_trails(shop_id, created_at DESC);

