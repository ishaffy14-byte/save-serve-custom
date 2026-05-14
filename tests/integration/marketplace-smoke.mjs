import { spawn } from "node:child_process";

const apiPort = Number(process.env.API_PORT ?? 4090);
const apiBaseUrl = process.env.API_BASE_URL ?? `http://127.0.0.1:${apiPort}`;
const shouldStartApi = !process.env.API_BASE_URL;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const readJson = async (path) => {
  const response = await fetch(`${apiBaseUrl}${path}`);
  const text = await response.text();
  let body;

  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`Expected JSON from ${path}, got: ${text}`);
  }

  return {
    status: response.status,
    body
  };
};

const waitForHealthyApi = async () => {
  const deadline = Date.now() + 20_000;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const health = await readJson("/health");
      if (health.status === 200 && health.body.status === "ok") {
        return health.body;
      }

      lastError = new Error(`Health check returned ${health.status}: ${JSON.stringify(health.body)}`);
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw lastError ?? new Error("API did not become healthy");
};

let stdout = "";
let stderr = "";
let apiProcess;

if (shouldStartApi) {
  try {
    apiProcess = spawn(process.execPath, ["apps/api/dist/main.js"], {
      env: {
        ...process.env,
        API_HOST: "127.0.0.1",
        API_PORT: String(apiPort)
      },
      stdio: ["ignore", "pipe", "pipe"]
    });

    apiProcess.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    apiProcess.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
  } catch (error) {
    console.error("Could not start API process for integration test");
    console.error(error);
    process.exit(1);
  }
}

const stopApi = async () => {
  if (!apiProcess) return;
  if (apiProcess.exitCode !== null) return;

  apiProcess.kill("SIGTERM");

  await Promise.race([
    new Promise((resolve) => apiProcess.once("exit", resolve)),
    delay(5_000).then(() => apiProcess.kill("SIGKILL"))
  ]);
};

try {
  const health = await waitForHealthyApi();
  assert(health.dependencies.database.status === "ok", "Database dependency should be healthy");
  assert(health.dependencies.redis.status === "ok", "Redis dependency should be healthy");

  const shops = await readJson("/api/v1/shops");
  assert(shops.status === 200, `Expected shops 200, got ${shops.status}`);
  assert(Array.isArray(shops.body.data), "shops response data should be an array");
  assert(shops.body.data.length >= 2, "expected at least two demo shops");

  const listings = await readJson("/api/v1/listings");
  assert(listings.status === 200, `Expected listings 200, got ${listings.status}`);
  assert(Array.isArray(listings.body.data), "listings response data should be an array");
  assert(listings.body.data.length >= 4, "expected at least four demo listings");

  const nearby = await readJson("/api/v1/listings/nearby?lat=52.5018&lng=13.4145&radius_meters=5000");
  assert(nearby.status === 200, `Expected nearby listings 200, got ${nearby.status}`);
  assert(Array.isArray(nearby.body.data), "nearby response data should be an array");
  assert(nearby.body.data.length >= 1, "expected at least one nearby demo listing");
  assert(
    typeof nearby.body.data[0].distance_meters === "number",
    "nearby listing should include distance_meters"
  );

  console.log("Marketplace integration smoke test passed");
} catch (error) {
  console.error("Marketplace integration smoke test failed");
  console.error(error);
  console.error("API stdout:");
  console.error(stdout);
  console.error("API stderr:");
  console.error(stderr);
  process.exitCode = 1;
} finally {
  await stopApi();
}
