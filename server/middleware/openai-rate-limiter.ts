/**
 * Middleware for OpenAI API rate limiting
 * This middleware helps prevent excessive requests to the OpenAI API
 */

import { Request, Response, NextFunction } from "express";
import { RATE_LIMITS } from "../config";

// Simple in-memory rate limiting store
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Store OpenAI requests by IP address
// For more advanced applications, consider using Redis or another shared storage
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * OpenAI rate limiter middleware
 * 
 * Limits the number of requests to OpenAI endpoints based on IP address
 * Configurable via the RATE_LIMITS.openAi setting in config.ts
 */
export const openAiRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // Get client IP (or a fallback if not available)
  const clientIp = req.ip || req.connection.remoteAddress || "unknown";
  const now = Date.now();
  
  // Get current rate limit info for this IP
  const rateLimitInfo = rateLimitStore.get(clientIp);
  
  // Window size in ms (default: 1 minute)
  const windowMs = RATE_LIMITS?.openAi?.windowMs || 60 * 1000;
  
  // Max requests per window (default: 20)
  const maxRequests = RATE_LIMITS?.openAi?.maxRequests || 20;
  
  if (!rateLimitInfo || now > rateLimitInfo.resetAt) {
    // First request or window expired, create new entry
    rateLimitStore.set(clientIp, {
      count: 1,
      resetAt: now + windowMs
    });
    next();
  } else if (rateLimitInfo.count < maxRequests) {
    // Increment counter and proceed
    rateLimitInfo.count += 1;
    next();
  } else {
    // Rate limit exceeded
    const retryAfterSeconds = Math.ceil((rateLimitInfo.resetAt - now) / 1000);
    
    res.setHeader('Retry-After', retryAfterSeconds.toString());
    res.status(429).json({
      success: false,
      error: `OpenAI API rate limit exceeded. Please try again in ${retryAfterSeconds} seconds.`
    });
  }
};

// Export some utility functions for checking rate limit status
export const getRateLimitStatus = (clientIp: string) => {
  const entry = rateLimitStore.get(clientIp);
  if (!entry) return { remaining: RATE_LIMITS?.openAi?.maxRequests || 20, resetIn: 0 };
  
  const now = Date.now();
  const resetIn = Math.max(0, entry.resetAt - now);
  const remaining = Math.max(0, (RATE_LIMITS?.openAi?.maxRequests || 20) - entry.count);
  
  return { remaining, resetIn };
};