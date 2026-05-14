# Deployment

## Deployable Services

The custom platform currently has two deployable Node.js services:

- API service from `apps/api/Dockerfile`
- Worker service from `apps/worker/Dockerfile`

Both services are built from the repository root as Docker build context.

## Required Infrastructure

- PostgreSQL with PostGIS enabled
- Redis
- Container runtime or Node.js 22 runtime

## Required Environment Variables

API:

- `NODE_ENV=production`
- `API_HOST=0.0.0.0`
- `API_PORT=4000`
- `DATABASE_URL`
- `REDIS_URL`
- `CORS_ORIGIN`
- `LOG_LEVEL=info`

Worker:

- `NODE_ENV=production`
- `DATABASE_URL`
- `REDIS_URL`
- `WORKER_POLL_INTERVAL_MS=5000`

## Build Images

```bash
docker build -f apps/api/Dockerfile -t save-serve-api .
docker build -f apps/worker/Dockerfile -t save-serve-worker .
```

## Run API Image

```bash
docker run --rm -p 4000:4000 \
  -e API_HOST=0.0.0.0 \
  -e API_PORT=4000 \
  -e DATABASE_URL=postgres://save_serve:save_serve@host.docker.internal:5432/save_serve \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  -e CORS_ORIGIN=http://localhost:5173 \
  save-serve-api
```

## Run Worker Image

```bash
docker run --rm \
  -e DATABASE_URL=postgres://save_serve:save_serve@host.docker.internal:5432/save_serve \
  -e REDIS_URL=redis://host.docker.internal:6379 \
  save-serve-worker
```

## Release Sequence

1. Build API and worker images from the same Git SHA.
2. Apply database migrations once per environment.
3. Deploy API service.
4. Deploy worker service.
5. Verify `GET /health` reports `status: ok`.

## Provider Notes

No cloud provider is assumed yet. The images should run on Render, Fly.io, Railway, ECS, Cloud Run, Azure Container Apps, or any platform that supports Docker containers plus managed Postgres and Redis.

