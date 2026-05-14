import { useEffect, useState } from "react";
import { marketplaceApi } from "./api.js";
import "./styles.css";

const berlinCenter = {
  lat: 52.5018,
  lng: 13.4145
};

const formatPrice = (cents) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(cents / 100);

function ListingCard({ listing }) {
  return (
    <article className="listing-card">
      <div>
        <p className="eyebrow">{listing.category ?? "surplus"}</p>
        <h3>{listing.title}</h3>
        <p>{listing.description}</p>
      </div>
      <div className="listing-meta">
        <span>{listing.shop.name}</span>
        <strong>{formatPrice(listing.deal_price_cents)}</strong>
      </div>
      {typeof listing.distance_meters === "number" ? (
        <p className="distance">{(listing.distance_meters / 1000).toFixed(1)} km away</p>
      ) : null}
    </article>
  );
}

function ShopCard({ shop }) {
  return (
    <article className="shop-card">
      <p className="eyebrow">{shop.shop_type ?? "shop"}</p>
      <h3>{shop.name}</h3>
      <p>{shop.description}</p>
      <div className="shop-meta">
        <span>{shop.district ?? "Berlin"}</span>
        <span>{shop.rating_average.toFixed(1)} rating</span>
      </div>
    </article>
  );
}

export default function App() {
  const [state, setState] = useState({
    loading: true,
    error: null,
    shops: [],
    listings: [],
    nearbyListings: []
  });

  useEffect(() => {
    let cancelled = false;

    const loadMarketplace = async () => {
      try {
        const [shops, listings, nearbyListings] = await Promise.all([
          marketplaceApi.listShops(),
          marketplaceApi.listListings(),
          marketplaceApi.listNearbyListings(berlinCenter)
        ]);

        if (!cancelled) {
          setState({
            loading: false,
            error: null,
            shops,
            listings,
            nearbyListings
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            loading: false,
            error: error instanceof Error ? error.message : "Marketplace load failed"
          }));
        }
      }
    };

    void loadMarketplace();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Custom platform preview</p>
          <h1>Save surplus food with a backend we own.</h1>
          <p>
            This first web surface reads from the new custom API only. It is not the old
            Base44 app and it intentionally starts with marketplace discovery.
          </p>
        </div>
        <div className="status-card">
          <span>API</span>
          <strong>{state.loading ? "Loading" : state.error ? "Needs backend" : "Connected"}</strong>
        </div>
      </section>

      {state.error ? (
        <section className="notice">
          <h2>Backend unavailable</h2>
          <p>{state.error}</p>
          <p>Run the API with `npm run api:start` and set `VITE_API_BASE_URL` if needed.</p>
        </section>
      ) : null}

      <section className="section-grid">
        <div>
          <p className="eyebrow">Nearby</p>
          <h2>Listings near Kreuzberg</h2>
        </div>
        <div className="cards">
          {(state.nearbyListings.length > 0 ? state.nearbyListings : state.listings).map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>

      <section className="section-grid">
        <div>
          <p className="eyebrow">Retailers</p>
          <h2>Demo shops</h2>
        </div>
        <div className="cards shop-grid">
          {state.shops.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      </section>
    </main>
  );
}

