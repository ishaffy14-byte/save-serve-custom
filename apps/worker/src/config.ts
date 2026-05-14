export type WorkerConfig = {
  env: string;
  databaseUrl: string;
  redisUrl: string;
  pollIntervalMs: number;
};

const readString = (key: string, fallback: string): string => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value : fallback;
};

const readNumber = (key: string, fallback: number): number => {
  const raw = process.env[key];
  if (!raw) return fallback;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const loadConfig = (): WorkerConfig => ({
  env: readString("NODE_ENV", "development"),
  databaseUrl: readString(
    "DATABASE_URL",
    "postgres://save_serve:save_serve@localhost:5432/save_serve"
  ),
  redisUrl: readString("REDIS_URL", "redis://localhost:6379"),
  pollIntervalMs: readNumber("WORKER_POLL_INTERVAL_MS", 5000)
});

