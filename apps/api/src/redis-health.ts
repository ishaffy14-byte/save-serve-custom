import { Socket } from "node:net";
import type { ApiConfig } from "./config.js";
import type { DependencyHealth } from "./db.js";

const REDIS_PING = "*1\r\n$4\r\nPING\r\n";

export const checkRedisHealth = (config: ApiConfig): Promise<DependencyHealth> => {
  const started = performance.now();

  return new Promise((resolve) => {
    const redisUrl = new URL(config.redisUrl);
    const socket = new Socket();
    let resolved = false;

    const finish = (health: DependencyHealth): void => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({
        ...health,
        latency_ms: Math.round(performance.now() - started)
      });
    };

    socket.setTimeout(2_000);

    socket.once("connect", () => {
      socket.write(REDIS_PING);
    });

    socket.once("data", (chunk) => {
      const response = chunk.toString("utf8");
      if (response.startsWith("+PONG")) {
        finish({ status: "ok" });
        return;
      }

      finish({
        status: "error",
        message: `Unexpected Redis response: ${response.trim()}`
      });
    });

    socket.once("timeout", () => {
      finish({
        status: "error",
        message: "Redis health check timed out"
      });
    });

    socket.once("error", (error) => {
      finish({
        status: "error",
        message: error.message.length > 0 ? error.message : "Redis health check failed"
      });
    });

    socket.connect({
      host: redisUrl.hostname,
      port: Number(redisUrl.port || 6379)
    });
  });
};
