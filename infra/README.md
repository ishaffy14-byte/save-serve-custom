# Local Infrastructure

Start local infrastructure:

```bash
docker compose up -d postgres redis
```

Apply pending SQL migrations:

```bash
npm run db:migrate
```

Seed demo marketplace data:

```bash
npm run db:seed
```

Migrations live in `infra/db/migrations` and must use the filename format `NNN_description.sql`, for example `001_initial_core.sql`.

The migration runner records applied filenames and checksums in `schema_migrations`. If an applied migration file changes later, the runner fails. Create a new migration instead of editing an applied one.

This migration approach is intentionally SQL-first for the foundation phase. Once the backend framework and ORM choice is locked, these migrations can be wrapped by Prisma/Drizzle or kept as SQL migrations if that remains simpler.
