import { loadConfig } from "./config.js";

const config = loadConfig();

const log = (message: string, extra: Record<string, unknown> = {}): void => {
  console.log(
    JSON.stringify({
      level: "info",
      service: "save-serve-worker",
      message,
      environment: config.env,
      ...extra
    })
  );
};

log("Worker process started", {
  poll_interval_ms: config.pollIntervalMs,
  queues: ["outbox_events"]
});

// Placeholder loop for the first foundation slice. Queue processors will be
// wired here when notifications, report generation, and Stripe jobs migrate.
setInterval(() => {
  log("Worker heartbeat", {
    queue_backend: "pending_redis_integration"
  });
}, config.pollIntervalMs);

