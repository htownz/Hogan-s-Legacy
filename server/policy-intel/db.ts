import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@shared/schema-policy-intel";

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
        console.log(`[policy-intel] database connection established on attempt ${attempt}`);
      }
      return;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (attempt >= CONNECT_RETRY_ATTEMPTS) {
        throw new Error(`[policy-intel] database connection failed after ${attempt} attempts: ${message}`);
      }

      console.warn(
        `[policy-intel] database connection attempt ${attempt}/${CONNECT_RETRY_ATTEMPTS} failed: ${message}`,
      );
      await sleep(CONNECT_RETRY_DELAY_MS);
    }
  }
}

export const policyIntelDb = drizzle(queryClient, { schema });
export { queryClient };
