import type { Database } from "./db.js";

export type ListOptions = {
  limit: number;
  offset: number;
};

export type NearbyOptions = ListOptions & {
  lat: number;
  lng: number;
  radiusMeters: number;
};

type ShopRow = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  lat: number;
  lng: number;
  district: string | null;
  shop_type: string | null;
  photos: string[];
  is_accepting_orders: boolean;
  rating_average: string;
  total_reviews: number;
  total_listings: number;
  total_orders: number;
  is_demo: boolean;
};

type ListingRow = {
  id: string;
  shop_id: string;
  shop_name: string;
  shop_address: string;
  shop_lat: number;
  shop_lng: number;
  title: string;
  description: string | null;
  category: string | null;
  photos: string[];
  original_price_cents: number | null;
  deal_price_cents: number;
  quantity_available: number;
  quantity_sold: number;
  unit: string;
  weight_estimate_kg: string;
  pickup_window_start: string;
  pickup_window_end: string;
  status: string;
  allergens: string[];
  dietary_tags: string[];
  is_demo: boolean;
  distance_meters?: number;
};

const toNumber = (value: string | number | null): number | null => {
  if (value === null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const mapShop = (row: ShopRow) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  address: row.address,
  location: {
    lat: Number(row.lat),
    lng: Number(row.lng)
  },
  district: row.district,
  shop_type: row.shop_type,
  photos: row.photos,
  is_accepting_orders: row.is_accepting_orders,
  rating_average: toNumber(row.rating_average) ?? 0,
  total_reviews: row.total_reviews,
  total_listings: row.total_listings,
  total_orders: row.total_orders,
  is_demo: row.is_demo
});

const mapListing = (row: ListingRow) => ({
  id: row.id,
  shop_id: row.shop_id,
  shop: {
    id: row.shop_id,
    name: row.shop_name,
    address: row.shop_address,
    location: {
      lat: Number(row.shop_lat),
      lng: Number(row.shop_lng)
    }
  },
  title: row.title,
  description: row.description,
  category: row.category,
  photos: row.photos,
  original_price_cents: row.original_price_cents,
  deal_price_cents: row.deal_price_cents,
  quantity_available: row.quantity_available,
  quantity_sold: row.quantity_sold,
  unit: row.unit,
  weight_estimate_kg: toNumber(row.weight_estimate_kg),
  pickup_window_start: row.pickup_window_start,
  pickup_window_end: row.pickup_window_end,
  status: row.status,
  allergens: row.allergens,
  dietary_tags: row.dietary_tags,
  is_demo: row.is_demo,
  distance_meters:
    row.distance_meters === undefined ? undefined : Math.round(Number(row.distance_meters))
});

export const listShops = async (db: Database, options: ListOptions) => {
  const result = await db.query<ShopRow>(
    `
      select
        id,
        name,
        description,
        address,
        st_y(location::geometry) as lat,
        st_x(location::geometry) as lng,
        district,
        shop_type,
        photos,
        is_accepting_orders,
        rating_average,
        total_reviews,
        total_listings,
        total_orders,
        is_demo
      from shops
      where deleted_at is null
        and is_active = true
      order by name asc
      limit $1 offset $2
    `,
    [options.limit, options.offset]
  );

  return result.rows.map(mapShop);
};

const listingSelect = `
  select
    l.id,
    l.shop_id,
    s.name as shop_name,
    s.address as shop_address,
    st_y(s.location::geometry) as shop_lat,
    st_x(s.location::geometry) as shop_lng,
    l.title,
    l.description,
    l.category,
    l.photos,
    l.original_price_cents,
    l.deal_price_cents,
    l.quantity_available,
    l.quantity_sold,
    l.unit,
    l.weight_estimate_kg,
    l.pickup_window_start,
    l.pickup_window_end,
    l.status,
    l.allergens,
    l.dietary_tags,
    l.is_demo
`;

export const listListings = async (db: Database, options: ListOptions) => {
  const result = await db.query<ListingRow>(
    `
      ${listingSelect}
      from listings l
      join shops s on s.id = l.shop_id
      where l.deleted_at is null
        and s.deleted_at is null
        and s.is_active = true
        and l.status = 'active'
        and l.quantity_available > 0
      order by l.pickup_window_end asc
      limit $1 offset $2
    `,
    [options.limit, options.offset]
  );

  return result.rows.map(mapListing);
};

export const listNearbyListings = async (db: Database, options: NearbyOptions) => {
  const result = await db.query<ListingRow>(
    `
      ${listingSelect},
      st_distance(
        s.location,
        st_setsrid(st_makepoint($1, $2), 4326)::geography
      ) as distance_meters
      from listings l
      join shops s on s.id = l.shop_id
      where l.deleted_at is null
        and s.deleted_at is null
        and s.is_active = true
        and s.is_accepting_orders = true
        and l.status = 'active'
        and l.quantity_available > 0
        and st_dwithin(
          s.location,
          st_setsrid(st_makepoint($1, $2), 4326)::geography,
          $3
        )
      order by distance_meters asc, l.pickup_window_end asc
      limit $4 offset $5
    `,
    [options.lng, options.lat, options.radiusMeters, options.limit, options.offset]
  );

  return result.rows.map(mapListing);
};

