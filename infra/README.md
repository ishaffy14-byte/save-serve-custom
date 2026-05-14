# Local Infrastructure

Start local infrastructure:

```bash
docker compose up -d postgres redis
```

Apply the initial SQL migration with `psql`:

```bash
psql "postgres://save_serve:save_serve@localhost:5432/save_serve" -f infra/db/migrations/001_initial_core.sql
```

This migration is intentionally SQL-first for the foundation slice. Once the backend framework and ORM choice is locked, these tables can become Prisma/Drizzle migrations without changing the schema direction.

