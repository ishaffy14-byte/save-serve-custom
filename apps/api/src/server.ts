import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { loadConfig, type ApiConfig } from "./config.js";
import { createDatabase, type Database } from "./db.js";
import { createRequestContext, sendError, sendJson, sendNotFound } from "./http.js";
import {
  listListings,
  listNearbyListings,
  listShops,
  type ListOptions,
  type NearbyOptions
} from "./marketplace.js";
import { openApiDocument } from "./openapi.js";
import { checkRedisHealth } from "./redis-health.js";

const startedAt = new Date();

const clampInteger = (value: string | null, fallback: number, min: number, max: number): number => {
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
};

const parseListOptions = (url: URL): ListOptions => ({
  limit: clampInteger(url.searchParams.get("limit"), 50, 1, 100),
  offset: clampInteger(url.searchParams.get("offset"), 0, 0, 10_000)
});

const parseNumberParam = (url: URL, key: string): number | null => {
  const value = url.searchParams.get(key);
  if (!value) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseNearbyOptions = (url: URL): NearbyOptions | null => {
  const lat = parseNumberParam(url, "lat");
  const lng = parseNumberParam(url, "lng");
  const radiusMeters = parseNumberParam(url, "radius_meters") ?? 5_000;

  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180 || radiusMeters <= 0) return null;

  return {
    ...parseListOptions(url),
    lat,
    lng,
    radiusMeters: Math.min(radiusMeters, 50_000)
  };
};

const buildHealthResponse = async (config: ApiConfig, db: Database) => {
  const [database, redis] = await Promise.all([db.health(), checkRedisHealth(config)]);
  const status = database.status === "ok" && redis.status === "ok" ? "ok" : "degraded";

  return {
    service: "save-serve-api",
    status,
    environment: config.env,
    started_at: startedAt.toISOString(),
    uptime_seconds: Math.round(process.uptime()),
    dependencies: {
      database,
      redis
    }
  };
};

const setCorsHeaders = (response: ServerResponse, config: ApiConfig): void => {
  response.setHeader("access-control-allow-origin", config.corsOrigin);
  response.setHeader("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization,idempotency-key");
};

const routeRequest = (
  request: IncomingMessage,
  response: ServerResponse,
  config: ApiConfig,
  db: Database
): Promise<void> => {
  const context = createRequestContext(request);
  setCorsHeaders(response, config);

  if (context.method === "OPTIONS") {
    response.writeHead(204, { "x-request-id": context.requestId });
    response.end();
    return Promise.resolve();
  }

  const path = context.url.pathname.replace(/\/+$/, "") || "/";

  if (context.method === "GET" && (path === "/health" || path === "/api/v1/health")) {
    return buildHealthResponse(config, db).then((body) => {
      sendJson(response, body.status === "ok" ? 200 : 503, body, context.requestId);
    });
  }

  if (context.method === "GET" && (path === "/openapi.json" || path === "/api/v1/openapi.json")) {
    sendJson(response, 200, openApiDocument, context.requestId);
    return Promise.resolve();
  }

  if (context.method === "GET" && path === "/api/v1/shops") {
    return listShops(db, parseListOptions(context.url)).then((shops) => {
      sendJson(response, 200, { data: shops }, context.requestId);
    });
  }

  if (context.method === "GET" && path === "/api/v1/listings") {
    return listListings(db, parseListOptions(context.url)).then((listings) => {
      sendJson(response, 200, { data: listings }, context.requestId);
    });
  }

  if (context.method === "GET" && path === "/api/v1/listings/nearby") {
    const nearbyOptions = parseNearbyOptions(context.url);
    if (!nearbyOptions) {
      sendError(
        response,
        400,
        "invalid_nearby_query",
        "lat, lng, and optional radius_meters query parameters are required.",
        context.requestId
      );
      return Promise.resolve();
    }

    return listNearbyListings(db, nearbyOptions).then((listings) => {
      sendJson(response, 200, { data: listings }, context.requestId);
    });
  }

  sendNotFound(response, context.requestId);
  return Promise.resolve();
};

export const startServer = (config: ApiConfig = loadConfig()): void => {
  const db = createDatabase(config);
  const server = createServer(async (request, response) => {
    try {
      await routeRequest(request, response, config, db);
    } catch (error) {
      const context = createRequestContext(request);
      const message = error instanceof Error ? error.message : "Unknown error";
      sendError(
        response,
        500,
        "internal_server_error",
        message,
        context.requestId
      );
    }
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(
      JSON.stringify({
        level: "info",
        message: "API server shutting down",
        service: "save-serve-api",
        signal
      })
    );

    server.close(() => {
      void db.close().finally(() => process.exit(0));
    });
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));

  server.listen(config.port, config.host, () => {
    const address = server.address() as AddressInfo;
    console.log(
      JSON.stringify({
        level: "info",
        message: "API server listening",
        service: "save-serve-api",
        host: address.address,
        port: address.port,
        environment: config.env
      })
    );
  });
};
