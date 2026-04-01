import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set for policy-intel migrations");
}

export default defineConfig({
  out: "./migrations/policy-intel",
  schema: ["./shared/schema-policy-intel.ts", "./shared/schema-power-network.ts"],
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
