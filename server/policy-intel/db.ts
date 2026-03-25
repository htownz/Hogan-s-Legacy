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

export const policyIntelDb = drizzle(queryClient, { schema });
export { queryClient };
