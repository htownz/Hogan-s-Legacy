import type { Server } from "node:http";
import { createPolicyIntelApp } from "./app";
import { validatePolicyIntelAuthConfiguration } from "./auth";
import { ensureDatabaseConnection, queryClient } from "./db";
import { startScheduler, stopScheduler } from "./scheduler";
import { safeErrorMessage } from "./security";
import { createLogger } from "./logger";

const log = createLogger("policy-intel");

// ── Global crash guards ────────────────────────────────────────────────────
// Prevent intermittent Drizzle TypeError (orderSelectedFields) from killing
// the process.  Log and continue so Docker doesn't enter a restart loop.
process.on("uncaughtException", (err) => {
  log.error({ err: safeErrorMessage(err) }, "uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  log.error({ err: safeErrorMessage(reason) }, "unhandledRejection");
});

const port = Number(process.env.POLICY_INTEL_PORT || 5050);
const host = process.env.HOST || "0.0.0.0";

validatePolicyIntelAuthConfiguration();
const app = createPolicyIntelApp();

let server: Server | null = null;
let shuttingDown = false;

async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;

  log.info({ signal }, "shutting down");
  stopScheduler();

  const forcedExit = setTimeout(() => {
    log.error("forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
  forcedExit.unref?.();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server?.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
    await queryClient.end({ timeout: 5 });
    process.exit(0);
  } catch (error) {
    log.error({ err: error }, "shutdown failed");
    process.exit(1);
  } finally {
    clearTimeout(forcedExit);
  }
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});
process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

async function start() {
  await ensureDatabaseConnection();

  server = app.listen(port, host, () => {
    log.info({ host, port }, "listening");
    startScheduler();
  });
}

void start().catch((error) => {
  log.fatal({ err: safeErrorMessage(error) }, "startup failed");
  process.exit(1);
});
