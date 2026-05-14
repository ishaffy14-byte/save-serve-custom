const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

const readJson = async (path) => {
  const response = await fetch(`${API_BASE_URL}${path}`);
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = body?.error?.message ?? `Request failed with ${response.status}`;
    throw new Error(message);
  }

  return body;
};

export const marketplaceApi = {
  async listShops() {
    const body = await readJson("/api/v1/shops");
    return body.data;
  },

  async listListings() {
    const body = await readJson("/api/v1/listings");
    return body.data;
  },

  async listNearbyListings({ lat, lng, radiusMeters = 5000 }) {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius_meters: String(radiusMeters)
    });
    const body = await readJson(`/api/v1/listings/nearby?${params}`);
    return body.data;
  }
};

