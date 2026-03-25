import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import * as onboardingSchema from "@shared/schema-onboarding";
import * as communitySchema from "@shared/schema-community";
import * as campaignFinanceSchema from "@shared/schema-campaign-finance";
import * as ethicsSchema from "@shared/schema-ethics";
import * as tecUploadsSchema from "@shared/schema-tec-uploads";
import * as scoutBotSchema from "@shared/schema-scout-bot";
import * as scoutBotExtendedSchema from "@shared/schema-scout-bot-extended";
import * as scoutBotNetworkSchema from "@shared/schema-scout-bot-network";
import * as scoutBotAnalyticsSchema from "@shared/schema-scout-bot-analytics";
import * as collaborativeAnnotationsSchema from "@shared/schema-collaborative-annotations";
import * as liveDataSchema from "@shared/schema-live-data";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ 
  client: pool, 
  schema: {
    ...schema,
    ...onboardingSchema,
    ...communitySchema,
    ...campaignFinanceSchema,
    ...ethicsSchema,
    ...tecUploadsSchema,
    ...scoutBotSchema,
    ...scoutBotExtendedSchema,
    ...scoutBotNetworkSchema,
    ...scoutBotAnalyticsSchema,
    ...collaborativeAnnotationsSchema,
    ...liveDataSchema
  }
});
