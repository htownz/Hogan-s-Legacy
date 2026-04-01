/**
 * Act Up - Application Configuration
 * 
 * This file centralizes all environment-specific configuration in one place.
 * Always use this file for accessing configuration values instead of directly
 * accessing process.env to ensure consistent behavior across environments.
 */

// Server configuration
export const SERVER_CONFIG = {
  // Use port 5000 which is forwarded to 80 in production
  PORT: Number(process.env.PORT) || 5000,
  
  // Bind to all network interfaces to work in Replit environment
  HOST: "0.0.0.0",
  
  // Environment detection
  IS_PRODUCTION: process.env.NODE_ENV === "production",
  IS_DEVELOPMENT: process.env.NODE_ENV === "development" || !process.env.NODE_ENV,
  
  // Get Replit specific info for better error reporting
  REPLIT_DOMAIN: process.env.REPLIT_DOMAIN || '',
  REPLIT_ID: process.env.REPL_ID || '',
};
    
// Database configuration
export const DB_CONFIG = {
  // Database connection string
  CONNECTION_STRING: process.env.DATABASE_URL || "",
  
  // Maximum pool size for database connections
  POOL_SIZE: 10,
};

// Session and authentication configuration
export const AUTH_CONFIG = {
  // Secret used for session encryption (defaults to a random string in development)
  SESSION_SECRET: process.env.SESSION_SECRET || (SERVER_CONFIG.IS_PRODUCTION ? "" : "dev-secret-key-change-in-production"),
  
  // Cookie configuration - always secure in Replit, as it uses HTTPS
  COOKIE_SECURE: true, // Always secure when using Replit
  COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

// AWS configuration for file storage
export const AWS_CONFIG = {
  REGION: process.env.AWS_REGION || "us-east-1",
};

// Policy Intel integration configuration (main app -> policy-intel service bridge)
export const POLICY_INTEL_CONFIG = {
  BASE_URL: (process.env.POLICY_INTEL_INTERNAL_URL || "http://localhost:5050").replace(/\/$/, ""),
  REQUEST_TIMEOUT_MS: Math.max(1000, Number(process.env.POLICY_INTEL_REQUEST_TIMEOUT_MS) || 12000),
  API_TOKEN: process.env.POLICY_INTEL_API_TOKEN || "",
  STATUS_CACHE_TTL_MS: Math.max(0, Number(process.env.POLICY_INTEL_STATUS_CACHE_TTL_MS) || 30000),
  BRIEFING_CACHE_TTL_MS: Math.max(0, Number(process.env.POLICY_INTEL_BRIEFING_CACHE_TTL_MS) || 60000),
};

// Feature toggles
export const FEATURES = {
  ENABLE_VERIFICATION: true,
  ENABLE_WAR_ROOM: true,
  ENABLE_ACTION_CIRCLES: true,
  BILL_SCRAPING_ENABLED: true,
};

// API rate limiting
export const RATE_LIMITS = {
  // Default window for most API endpoints (requests per minute)
  STANDARD_WINDOW_MS: 60 * 1000,
  STANDARD_MAX_REQUESTS: 100,
  
  // Stricter limits for authentication endpoints
  AUTH_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  AUTH_MAX_REQUESTS: 10,
  
  // Limits for OpenAI API calls to prevent excessive usage
  openAi: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // 20 requests per minute
  }
};