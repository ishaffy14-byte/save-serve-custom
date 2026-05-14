# Verification Guide

## GitHub Checks

Every pull request runs:

- backend TypeScript build
- web build
- database migration against Postgres/PostGIS
- demo data seed
- marketplace integration smoke test
- API and worker Docker image builds

Open the repository Actions tab or the PR checks section to inspect results.

## Full Local Preview With Docker

From the repository root:

```bash
docker compose up --build postgres redis migrate seed api worker web
```

Then open:

```text
http://localhost:5173
```

Useful API URLs:

```text
http://localhost:4000/health
http://localhost:4000/openapi.json
http://localhost:4000/api/v1/shops
http://localhost:4000/api/v1/listings
http://localhost:4000/api/v1/listings/nearby?lat=52.5018&lng=13.4145
```

Stop the stack:

```bash
docker compose down
```

Reset local data:

```bash
docker compose down -v
```

## Manual Local Preview Without Full Compose

If you already have Postgres/PostGIS and Redis running:

```bash
npm install
npm run backend:build
npm run web:build
npm run db:migrate
npm run db:seed
npm run api:start
```

In another terminal:

```bash
npm run web:dev
```

Then open:

```text
http://localhost:5173
```

## Current Preview Scope

The web app currently shows a read-only marketplace preview backed by the custom API:

- demo shops
- active listings
- nearby listings around Kreuzberg

It does not include auth, checkout, merchant dashboards, payments, messaging, or mobile behavior yet.

