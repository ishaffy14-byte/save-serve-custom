# New Repository Setup

## Repository Intent

This repository is the clean custom architecture for Save&Serve. It should not be deployed from the existing Base44-generated application repository.

The existing app repository remains useful for:

- UI and product behavior reference.
- Base44 schema/function discovery.
- Migration parity checks.
- Temporary production support while the rebuild is incomplete.

## Intended Long-Term Structure

```text
apps/
  api/
  worker/
  web/
  mobile/
packages/
  shared/
infra/
docs/
```

Current first slice includes only:

- `apps/api`
- `apps/worker`
- `infra`
- `docs`

## Deployment Direction

Initial deployable units:

- API service from `apps/api`
- Worker service from `apps/worker`
- PostgreSQL/PostGIS managed database
- Redis managed instance

Future deployable units:

- Web app from `apps/web`
- Capacitor mobile shells under `apps/mobile` or a dedicated mobile workspace

## Migration Rule

Migrate module-by-module. Do not bulk-copy the Base44 app and then try to delete Base44 later.

Recommended next migration target:

1. Database access layer.
2. Real `/health` dependency checks.
3. Read-only shops/listings endpoints.
4. Demo seed data.
5. Frontend adapter in a future `apps/web` workspace.

