/**
 * API Rate Limiter Middleware
 * 
 * This middleware helps protect our external API connections from overuse
 * by implementing basic rate limiting.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class ApiRateLimiter {
  // Store rate limit information by API and IP
  private rateLimits: Map<string, Map<string, RateLimitEntry>>;
  
  // Configuration for different APIs
  private apiConfigs: {
    [key: string]: {
      maxRequests: number;  // Maximum requests in the time window
      timeWindow: number;   // Time window in milliseconds
    }
  };

  constructor() {
    this.rateLimits = new Map();
    
    // Configure rate limits for different APIs
    this.apiConfigs = {
      'legiscan': {
        maxRequests: 100,  // 100 requests 
        timeWindow: 60 * 1000  // per minute
      },
      'default': {
        maxRequests: 50,   // 50 requests
        timeWindow: 60 * 1000  // per minute
      }
    };
  }

  /**
   * Check if a request should be rate limited
   * @param api The API identifier (e.g., 'legiscan')
   * @param ip The client IP address
   * @returns boolean indicating if the request should be allowed
   */
  private isAllowed(api: string, ip: string): boolean {
    const now = Date.now();
    const config = this.apiConfigs[api] || this.apiConfigs.default;
    
    // Get or create rate limit map for this API
    if (!this.rateLimits.has(api)) {
      this.rateLimits.set(api, new Map());
    }
    const apiLimits = this.rateLimits.get(api)!;
    
    // Get or create rate limit entry for this IP
    if (!apiLimits.has(ip)) {
      apiLimits.set(ip, {
        count: 0,
        resetTime: now + config.timeWindow
      });
    }
    
    const entry = apiLimits.get(ip)!;
    
    // Reset count if the time window has passed
    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + config.timeWindow;
    }
    
    // Increment count and check if it exceeds the limit
    entry.count += 1;
    
    return entry.count <= config.maxRequests;
  }

  /**
   * Get rate limit middleware for a specific API
   * @param api The API identifier
   * @returns Express middleware function
   */
  public getMiddleware(api: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const clientIp = req.ip || '127.0.0.1';
      
      if (this.isAllowed(api, clientIp)) {
        next();
      } else {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.'
        });
      }
    };
  }
}

// Export a singleton instance
export const apiRateLimiter = new ApiRateLimiter();