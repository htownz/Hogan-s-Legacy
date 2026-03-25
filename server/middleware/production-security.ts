// @ts-nocheck
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

// Rate limiting for different endpoint types
export const createRateLimiters = () => {
  // General API rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Government data endpoints - more restrictive
  const governmentDataLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit to 10 requests per minute for government data
    message: {
      error: 'Government data rate limit exceeded. Please wait before requesting more data.',
      retryAfter: '1 minute'
    }
  });

  // Search endpoints - moderate limiting
  const searchLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: {
      error: 'Search rate limit exceeded. Please wait before searching again.',
      retryAfter: '1 minute'
    }
  });

  // AI/Analysis endpoints - most restrictive
  const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Only 5 AI requests per minute
    message: {
      error: 'AI analysis rate limit exceeded. Please wait before requesting more analysis.',
      retryAfter: '1 minute'
    }
  });

  return {
    general: generalLimiter,
    governmentData: governmentDataLimiter,
    search: searchLimiter,
    ai: aiLimiter
  };
};

// CORS configuration for production
export const createCorsOptions = () => {
  const allowedOrigins = [
    'https://act-up.replit.app',
    'https://actup.replit.app',
    process.env.REPLIT_DOMAIN ? `https://${process.env.REPLIT_DOMAIN}` : '',
    process.env.PRODUCTION_DOMAIN || '',
    // Add your custom domain here when deployed
  ].filter(Boolean);

  return cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
  });
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server signature
  res.removeHeader('X-Powered-By');
  
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.fec.gov https://ethics.state.tx.us https://legiscan.com",
    "frame-ancestors 'none'"
  ].join('; '));
  
  next();
};

// API key validation middleware
export const validateApiKey = (req: Request, res: Response, next: NextFunction) => {
  // For internal API calls, allow through
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  next();
};

// Input sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    // Basic sanitization - remove potential XSS
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    
    req.body = sanitize(req.body);
  }
  
  next();
};

// Environment validation
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'DATABASE_URL',
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'FEC_API_KEY',
    'LEGISCAN_API_KEY'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing);
    console.warn('Some features may not work correctly in production');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  return missing.length === 0;
};