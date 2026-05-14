# Save&Serve Web

Vite/React scaffold for the custom Save&Serve frontend.

This app reads from the custom API only. It does not use Base44 runtime code.

## Environment

```bash
VITE_API_BASE_URL=http://localhost:4000
```

If omitted, the app defaults to `http://localhost:4000`.

## Commands

```bash
npm run web:dev
npm run web:build
```

## Current Scope

- Read-only demo marketplace preview
- Shops from `GET /api/v1/shops`
- Listings from `GET /api/v1/listings`
- Nearby listings from `GET /api/v1/listings/nearby`

