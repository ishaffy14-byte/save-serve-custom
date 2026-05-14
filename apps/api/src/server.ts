import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import type { AddressInfo } from "node:net";
import { loadConfig, type ApiConfig } from "./config.js";
import { createRequestContext, sendJson, sendNotFound } from "./http.js";
import { openApiDocument } from "./openapi.js";

const startedAt = new Date();

const buildHealthResponse = (config: ApiConfig) => ({
  service: "save-serve-api",
  status: "ok",
  environment: config.env,
  started_at: startedAt.toISOString(),
  uptime_seconds: Math.round(process.uptime()),
  dependencies: {
    database: "not_checked",
    redis: "not_checked"
  }
});

const setCorsHeaders = (response: ServerResponse, config: ApiConfig): void => {
  response.setHeader("access-control-allow-origin", config.corsOrigin);
  response.setHeader("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
  response.setHeader("access-control-allow-headers", "content-type,authorization,idempotency-key");
};

const routeRequest = (
  request: IncomingMessage,
  response: ServerResponse,
  config: ApiConfig
): void => {
  const context = createRequestContext(request);
  setCorsHeaders(response, config);

  if (context.method === "OPTIONS") {
    response.writeHead(204, { "x-request-id": context.requestId });
    response.end();
    return;
  }

  const path = context.url.pathname.replace(/\/+$/, "") || "/";

  if (context.method === "GET" && (path === "/health" || path === "/api/v1/health")) {
    sendJson(response, 200, buildHealthResponse(config), context.requestId);
    return;
  }

  if (context.method === "GET" && (path === "/openapi.json" || path === "/api/v1/openapi.json")) {
    sendJson(response, 200, openApiDocument, context.requestId);
    return;
  }

  sendNotFound(response, context.requestId);
};

export const startServer = (config: ApiConfig = loadConfig()): void => {
  const server = createServer((request, response) => {
    try {
      routeRequest(request, response, config);
    } catch (error) {
      const context = createRequestContext(request);
      const message = error instanceof Error ? error.message : "Unknown error";
      sendJson(
        response,
        500,
        {
          error: {
            code: "internal_server_error",
            message,
            request_id: context.requestId
          }
        },
        context.requestId
      );
    }
  });

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

