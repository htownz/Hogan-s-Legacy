import type { Server } from "node:http";
import { createPolicyIntelApp } from "./app";
import { validatePolicyIntelAuthConfiguration } from "./auth";
import { ensureDatabaseConnection, queryClient } from "./db";
import { startScheduler, stopScheduler } from "./scheduler";
import { safeErrorMessage } from "./security";

// ── Global crash guards ────────────────────────────────────────────────────
// Prevent intermittent Drizzle TypeError (orderSelectedFields) from killing
// the process.  Log and continue so Docker doesn't enter a restart loop.
process.on("uncaughtException", (err) => {
  console.error(`[policy-intel] uncaughtException: ${safeErrorMessage(err)}`);
});
process.on("unhandledRejection", (reason) => {
  console.error(`[policy-intel] unhandledRejection: ${safeErrorMessage(reason)}`);
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

  console.log(`[policy-intel] received ${signal}; shutting down`);
  stopScheduler();

  const forcedExit = setTimeout(() => {
    console.error("[policy-intel] forced shutdown after timeout");
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
    console.error("[policy-intel] shutdown failed:", error);
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
    console.log(`[policy-intel] listening on http://${host}:${port}`);
    startScheduler();
  });
}

void start().catch((error) => {
  console.error(`[policy-intel] startup failed: ${safeErrorMessage(error)}`);
  process.exit(1);
});
