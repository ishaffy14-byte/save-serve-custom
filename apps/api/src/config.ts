export type ApiConfig = {
  env: string;
  host: string;
  port: number;
  databaseUrl: string;
  redisUrl: string;
  corsOrigin: string;
  logLevel: string;
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

export const loadConfig = (): ApiConfig => ({
  env: readString("NODE_ENV", "development"),
  host: readString("API_HOST", "0.0.0.0"),
  port: readNumber("API_PORT", 4000),
  databaseUrl: readString(
    "DATABASE_URL",
    "postgres://save_serve:save_serve@localhost:5432/save_serve"
  ),
  redisUrl: readString("REDIS_URL", "redis://localhost:6379"),
  corsOrigin: readString("CORS_ORIGIN", "http://localhost:5173"),
  logLevel: readString("LOG_LEVEL", "info")
});

