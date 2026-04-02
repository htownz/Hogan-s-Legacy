import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../logger';

const log = createLogger('security');

// M4: Tightened Content Security Policy — removed unsafe-eval
export const contentSecurityPolicy = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://vitejs.dev; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.legiscan.com https://api.openai.com wss:; " +
    "font-src 'self' data:; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self';"
  );
  next();
};

// Rate limiting for API endpoints
export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for AI/analysis endpoints
export const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit AI requests to prevent abuse
  message: {
    error: 'AI analysis rate limit exceeded. Please try again later.',
    code: 'AI_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Check for potentially malicious content
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /exec\s*\(/gi,
    /system\s*\(/gi,
    /\$\([^)]*\)/g,
    /document\.cookie/gi,
    /localStorage/gi,
    /sessionStorage/gi
  ];

  const checkForSuspiciousContent = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(obj));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const value of Object.values(obj)) {
        if (checkForSuspiciousContent(value)) {
          return true;
        }
      }
    }
    
    return false;
  };

  if (checkForSuspiciousContent(req.body) || checkForSuspiciousContent(req.query)) {
    return res.status(400).json({
      error: 'Invalid input detected. Request blocked for security reasons.',
      code: 'SECURITY_VIOLATION'
    });
  }

  next();
};

// Purpose validation middleware - ensures requests are for legitimate civic purposes
export const validatePurpose = (req: Request, res: Response, next: NextFunction) => {
  const userAgent = req.get('User-Agent') || '';
  const origin = req.get('Origin') || '';
  const referer = req.get('Referer') || '';

  // Block obvious bot/scraper patterns
  const suspiciousBots = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /postman/i
  ];

  if (suspiciousBots.some(pattern => pattern.test(userAgent)) && 
      !userAgent.includes('legitimate-research')) {
    return res.status(403).json({
      error: 'Automated access detected. This platform is intended for human civic engagement only.',
      code: 'BOT_ACCESS_DENIED'
    });
  }

  // Check for legitimate civic engagement patterns in requests
  const legitimatePatterns = [
    'bill',
    'legislat',
    'civic',
    'democracy',
    'voting',
    'representative',
    'government',
    'transparency',
    'ethics'
  ];

  const requestContent = JSON.stringify(req.body).toLowerCase() + 
                        JSON.stringify(req.query).toLowerCase() + 
                        req.path.toLowerCase();

  const hasLegitimateContent = legitimatePatterns.some(pattern => 
    requestContent.includes(pattern)
  );

  // Allow certain system endpoints regardless of content
  const systemEndpoints = [
    '/api/debug',
    '/api/health',
    '/api/status',
    '/favicon.ico',
    '/_vite',
    '/assets'
  ];

  const isSystemEndpoint = systemEndpoints.some(endpoint => 
    req.path.startsWith(endpoint)
  );

  if (!hasLegitimateContent && !isSystemEndpoint && req.method !== 'GET') {
    log.warn({ method: req.method, path: req.path, userAgent, origin, body: req.body }, 'Potentially non-civic request blocked');
    
    return res.status(403).json({
      error: 'This platform is designed exclusively for civic engagement and legislative transparency.',
      code: 'NON_CIVIC_PURPOSE_DENIED',
      message: 'Please ensure your request relates to legitimate democratic participation.'
    });
  }

  next();
};

// CORS configuration for secure origins only
export const secureCorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow Replit domains
    if (origin.includes('.replit.dev') || origin.includes('replit.com')) {
      return callback(null, true);
    }
    
    // Block all other origins in production
    const error = new Error('CORS policy violation: Unauthorized origin');
    callback(error, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// Audit logging middleware for sensitive operations
export const auditLogger = (req: Request, res: Response, next: NextFunction) => {
  const sensitiveEndpoints = [
    '/api/alerts',
    '/api/translator',
    '/api/multimodal',
    '/api/contextual',
    '/api/scout-bot',
    '/api/ethics'
  ];

  const isSensitive = sensitiveEndpoints.some(endpoint => 
    req.path.startsWith(endpoint)
  );

  if (isSensitive) {
    const auditLog = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      origin: req.get('Origin'),
      userId: (req as any).user?.id || (req as any).session?.userId || 'anonymous',
      requestId: req.get('X-Request-ID') || 'unknown'
    };

    log.info({ audit: auditLog }, 'AUDIT');
  }

  next();
};

// Header security middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Feature policy to restrict sensitive features
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  );

  next();
};