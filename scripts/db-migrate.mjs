import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import pg from "pg";

const databaseUrl =
  process.env.DATABASE_URL ?? "postgres://save_serve:save_serve@localhost:5432/save_serve";

const migrationsDir = join(process.cwd(), "infra", "db", "migrations");
const migrationNamePattern = /^\d{3}_[a-z0-9_]+\.sql$/;

const client = new pg.Client({ connectionString: databaseUrl });

const ensureMigrationTable = async () => {
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      checksum text not null,
      applied_at timestamptz not null default now()
    )
  `);
};

const checksumSql = async (sql) => {
  const result = await client.query("select encode(sha256($1::bytea), 'hex') as checksum", [
    Buffer.from(sql, "utf8")
  ]);

  return result.rows[0].checksum;
};

const loadMigrations = async () => {
  const filenames = (await readdir(migrationsDir))
    .filter((filename) => migrationNamePattern.test(filename))
    .sort();

  return Promise.all(
    filenames.map(async (filename) => {
      const fullPath = join(migrationsDir, filename);
      const sql = await readFile(fullPath, "utf8");

      return {
        filename,
        fullPath,
        sql,
        checksum: await checksumSql(sql)
      };
    })
  );
};

const loadAppliedMigrations = async () => {
  const result = await client.query("select filename, checksum from schema_migrations order by filename asc");
  return new Map(result.rows.map((row) => [row.filename, row.checksum]));
};

try {
  await client.connect();
  await ensureMigrationTable();

  const migrations = await loadMigrations();
  const applied = await loadAppliedMigrations();
  let appliedCount = 0;

  for (const migration of migrations) {
    const existingChecksum = applied.get(migration.filename);

    if (existingChecksum) {
      if (existingChecksum !== migration.checksum) {
        throw new Error(
          `Migration checksum mismatch for ${migration.filename}. ` +
            "Create a new migration instead of editing an applied migration."
        );
      }

      console.log(`Already applied: ${migration.filename}`);
      continue;
    }

    await client.query("begin");
    try {
      await client.query(migration.sql);
      await client.query(
        "insert into schema_migrations (filename, checksum) values ($1, $2)",
        [migration.filename, migration.checksum]
      );
      await client.query("commit");
      appliedCount += 1;
      console.log(`Applied migration: ${relative(process.cwd(), migration.fullPath)}`);
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  }

  console.log(`Migration complete. Applied ${appliedCount} new migration(s).`);
} finally {
  await client.end();
}

