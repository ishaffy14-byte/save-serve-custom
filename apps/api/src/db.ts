import pg from "pg";
import type { ApiConfig } from "./config.js";

const { Pool } = pg;

export type Database = {
  query: <T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[]
  ) => Promise<pg.QueryResult<T>>;
  health: () => Promise<DependencyHealth>;
  close: () => Promise<void>;
};

export type DependencyHealth = {
  status: "ok" | "error";
  latency_ms?: number;
  message?: string;
};

export const createDatabase = (config: ApiConfig): Database => {
  const pool = new Pool({
    connectionString: config.databaseUrl,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 2_000
  });

  return {
    query: <T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values?: unknown[]) =>
      pool.query<T>(text, values),
    health: async () => {
      const started = performance.now();

      try {
        await pool.query("select 1");
        return {
          status: "ok",
          latency_ms: Math.round(performance.now() - started)
        };
      } catch (error) {
        return {
          status: "error",
          latency_ms: Math.round(performance.now() - started),
          message:
            error instanceof Error && error.message.length > 0
              ? error.message
              : "Database health check failed"
        };
      }
    },
    close: () => pool.end()
  };
};
