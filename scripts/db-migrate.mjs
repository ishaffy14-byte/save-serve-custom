import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://save_serve:save_serve@localhost:5432/save_serve";

const migrationPath = join(process.cwd(), "infra", "db", "migrations", "001_initial_core.sql");
const sql = await readFile(migrationPath, "utf8");

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied migration: ${migrationPath}`);
} finally {
  await client.end();
}

