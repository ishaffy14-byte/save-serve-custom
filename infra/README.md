# Local Infrastructure

Start local infrastructure:

```bash
docker compose up -d postgres redis
```

Apply the initial SQL migration:

```bash
npm run db:migrate
```

Seed demo marketplace data:

```bash
npm run db:seed
```

This migration is intentionally SQL-first for the foundation slice. Once the backend framework and ORM choice is locked, these tables can become Prisma/Drizzle migrations without changing the schema direction.
