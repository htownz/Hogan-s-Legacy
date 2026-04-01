import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema-policy-intel";
import { createLogger } from "./logger";

const log = createLogger("db");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for policy-intel service");
}

const queryClient = postgres(process.env.DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

const CONNECT_RETRY_ATTEMPTS = Number(process.env.DB_CONNECT_RETRY_ATTEMPTS || 10);
const CONNECT_RETRY_DELAY_MS = Number(process.env.DB_CONNECT_RETRY_DELAY_MS || 3000);

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function ensureDatabaseConnection(): Promise<void> {
  for (let attempt = 1; attempt <= CONNECT_RETRY_ATTEMPTS; attempt++) {
    try {
      await queryClient`select 1`;
      if (attempt > 1) {
        log.info({ attempt }, "database connection established");
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= CONNECT_RETRY_ATTEMPTS) {
        throw new Error(`[policy-intel] database connection failed after ${attempt} attempts: ${message}`);
      }

      log.warn(
        { attempt, total: CONNECT_RETRY_ATTEMPTS, err: message },
        "database connection attempt failed",
      );
      await sleep(CONNECT_RETRY_DELAY_MS);
    }
  }
}

export const policyIntelDb = drizzle(queryClient, { schema });
export { queryClient };
