import { readFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://save_serve:save_serve@localhost:5432/save_serve";

const seedPath = join(process.cwd(), "infra", "db", "seeds", "001_demo_marketplace.sql");
const sql = await readFile(seedPath, "utf8");

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(sql);
  console.log(`Applied seed: ${seedPath}`);
} finally {
  await client.end();
}

