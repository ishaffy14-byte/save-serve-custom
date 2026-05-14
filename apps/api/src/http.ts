import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";

export type RequestContext = {
  requestId: string;
  method: string;
  url: URL;
};

export type JsonBody = Record<string, unknown> | Array<unknown>;

export const createRequestContext = (request: IncomingMessage): RequestContext => {
  const host = request.headers.host ?? "localhost";

  return {
    requestId: randomUUID(),
    method: request.method ?? "GET",
    url: new URL(request.url ?? "/", `http://${host}`)
  };
};

export const sendJson = (
  response: ServerResponse,
  statusCode: number,
  body: JsonBody,
  requestId: string
): void => {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "x-request-id": requestId
  });
  response.end(JSON.stringify(body));
};

export const sendNotFound = (response: ServerResponse, requestId: string): void => {
  sendJson(
    response,
    404,
    {
      error: {
        code: "not_found",
        message: "Route not found",
        request_id: requestId
      }
    },
    requestId
  );
};

export const sendError = (
  response: ServerResponse,
  statusCode: number,
  code: string,
  message: string,
  requestId: string,
  details?: Record<string, unknown>
): void => {
  sendJson(
    response,
    statusCode,
    {
      error: {
        code,
        message,
        request_id: requestId,
        ...(details ? { details } : {})
      }
    },
    requestId
  );
};

