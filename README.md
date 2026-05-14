# Save&Serve Custom Platform

Clean rebuild repository for Save&Serve without Base44 runtime dependencies.

The existing Base44-backed app remains the product/reference implementation. This repository is where the custom backend, worker, infrastructure, and future migrated clients should live.

## Current Contents

- `apps/api`: TypeScript API scaffold with health and OpenAPI endpoints.
- `apps/worker`: TypeScript worker scaffold for future background jobs.
- `apps/web`: Vite/React marketplace preview backed by the custom API.
- `infra`: local infrastructure notes and initial PostgreSQL/PostGIS schema.
- `docs`: discovery and migration planning documents.
- `docker-compose.yml`: local Postgres/PostGIS and Redis services.

## Local Setup

Install dependencies:

```bash
npm install
```

Build backend targets:

```bash
npm run backend:build
```

Build the web app:

```bash
npm run web:build
```

Start local infrastructure:

```bash
docker compose up -d postgres redis
```

Run the full local preview stack:

```bash
docker compose up --build postgres redis migrate seed api worker web
```

Then open `http://localhost:5173`.

Apply pending database migrations:

```bash
npm run db:migrate
```

Seed demo marketplace data:

```bash
npm run db:seed
```

Run the API:

```bash
npm run api:start
```

Run the web app:

```bash
npm run web:dev
```

Then open:

```text
http://localhost:4000/health
http://localhost:4000/openapi.json
http://localhost:4000/api/v1/shops
http://localhost:4000/api/v1/listings
http://localhost:4000/api/v1/listings/nearby?lat=52.5018&lng=13.4145
```

## CI

GitHub Actions runs backend build, database migration, demo seed, and marketplace integration smoke tests against Postgres/PostGIS and Redis on pull requests and pushes to `main`.

## Docker

Build production container images:

```bash
docker build -f apps/api/Dockerfile -t save-serve-api .
docker build -f apps/worker/Dockerfile -t save-serve-worker .
```

Deployment notes are in [docs/deployment.md](./docs/deployment.md).

Verification notes are in [docs/verification.md](./docs/verification.md).

## Base44 Boundary

Do not copy Base44 runtime code into this repository as production code:

- `base44/`
- `@base44/sdk`
- `@base44/vite-plugin`
- `src/api/base44Client.js`
- direct `base44.entities.*` UI access

The old app can be used as a behavior reference while modules are rebuilt behind custom APIs.
