import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import * as net from 'net';
import * as http from 'http';
import { registerRoutes } from "./routes";
import { registerTestDataRoutes } from "./routes-test-data";
import { setupVite, serveStatic, log } from "./vite";
import { SERVER_CONFIG } from "./config";
import { productionStartup } from "./services/production-startup";
import { createLogger } from "./logger";
const pinoLog = createLogger("index");

// Handle unhandled promise rejections for deployment stability
process.on('unhandledRejection', (reason, promise) => {
  pinoLog.error({ err: reason }, 'Unhandled Rejection at:', promise, 'reason');
  // Don't exit the process in production
});

process.on('uncaughtException', (error) => {
  pinoLog.error({ err: error }, 'Uncaught Exception');
  // Don't exit the process in production - let deployment continue
});

const app = express();

// Trust the Replit proxy for secure cookies
app.set('trust proxy', 1);

// CORS configuration - restrict to known origins
const ALLOWED_ORIGINS = [
  // Local development
  'http://localhost:5000',
  'http://localhost:5173',
  'http://localhost:3000',
  // Replit domains
  ...(process.env.REPLIT_DOMAIN ? [
    `https://${process.env.REPLIT_DOMAIN}`,
    `https://${process.env.REPLIT_DOMAIN}:443`,
  ] : []),
  // Additional trusted origins from environment
  ...(process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : []),
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // In development, allow any localhost port
    if (SERVER_CONFIG.IS_DEVELOPMENT && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-CSRF-Token']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// H9: Request ID tracing — unique ID per request for log correlation
import crypto from "crypto";
app.use((req: Request, _res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  next();
});

// C2: CSRF Protection — double-submit cookie pattern
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [k, ...v] = c.trim().split('=');
      return [k, decodeURIComponent(v.join('='))];
    })
  );
}
app.use((req: Request, res: Response, next: NextFunction) => {
  const cookies = parseCookies(req.headers.cookie);
  // Skip CSRF for safe methods and health/API-token endpoints
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    // Issue a CSRF token cookie on safe requests if not present
    if (!cookies['csrf-token']) {
      const token = crypto.randomBytes(32).toString('hex');
      res.cookie('csrf-token', token, {
        httpOnly: false, // Client needs to read & send as header
        secure: SERVER_CONFIG.IS_PRODUCTION,
        sameSite: 'strict',
        path: '/',
      });
    }
    return next();
  }
  // For state-changing methods, validate double-submit
  const cookieToken = cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'] as string | undefined;
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'Invalid or missing CSRF token' });
  }
  next();
});

// Track degraded service state for health endpoint
const serviceStatus: Record<string, { ok: boolean; error?: string }> = {};

// Add health check endpoint - this is essential for Replit to verify the server is up
app.get('/health', (req, res) => {
  const degradedServices = Object.entries(serviceStatus)
    .filter(([, s]) => !s.ok)
    .map(([name, s]) => ({ name, error: s.error }));

  const status = degradedServices.length > 0 ? 'degraded' : 'ok';

  res.status(200).json({
    status,
    message: 'Act Up server is running',
    ...(degradedServices.length > 0 && { degradedServices }),
  });
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

/**
 * Helper function to check if a port is in use 
 * (ES Module compatible)
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const tester = net.createServer()
      .once('error', () => {
        // Port is in use
        resolve(true);
      })
      .once('listening', () => {
        // Port is free, close the server
        tester.close(() => resolve(false));
      })
      .listen(port, '0.0.0.0');
  });
}

/**
 * Setup a proxy server to forward traffic from port 80 to our internal port
 */
function setupPortForwarding(internalPort: number): void {
  const EXTERNAL_PORT = 80;

  // Create a simple HTTP proxy server that forwards requests to the main application
  const proxyServer = http.createServer((req, res) => {
    const options = {
      hostname: 'localhost',
      port: internalPort,
      path: req.url,
      method: req.method,
      headers: req.headers
    };

    // Forward the request to our main application server
    const proxyReq = http.request(options, (proxyRes) => {
      // Copy the headers from the proxied response
      Object.keys(proxyRes.headers).forEach(key => {
        const value = proxyRes.headers[key];
        if (value !== undefined) {
          res.setHeader(key, value);
        }
      });

      res.writeHead(proxyRes.statusCode || 200);

      // Pipe the response back to the client
      proxyRes.pipe(res);
    });

    // Handle errors in the proxy request
    proxyReq.on('error', (error) => {
      pinoLog.error({ err: error }, 'Proxy Request Error');
      res.writeHead(500);
      res.end('Proxy Error: ' + error.message);
    });

    // If there's request body data, forward it to the proxy request
    req.pipe(proxyReq);
  });

  // Start the proxy server on port 80
  proxyServer.listen(EXTERNAL_PORT, '0.0.0.0', () => {
    log(`Port forwarding proxy set up: forwarding port ${EXTERNAL_PORT} to internal port ${internalPort}`);
  }).on('error', (err) => {
    // Handle common errors - typically permission issues when binding to port 80
    if ((err as any).code === 'EACCES') {
      log(`ERROR: Cannot bind to port ${EXTERNAL_PORT} due to insufficient permissions.`);
      log('You might need to run the application with elevated privileges to use port 80.');
    } else if ((err as any).code === 'EADDRINUSE') {
      log(`ERROR: Port ${EXTERNAL_PORT} is already in use. Port forwarding will not be available.`);
    } else {
      log(`ERROR: Failed to set up port forwarding: ${err.message}`);
    }

    // Continue with application startup even if proxy fails
    log('Application will still be available directly on the internal port.');
  });
}

(async () => {
  try {
    // Check if our target port is already in use
    const targetPort = SERVER_CONFIG.PORT;

    log(`Checking if port ${targetPort} is in use...`);
    if (await isPortInUse(targetPort)) {
      log(`WARNING: Port ${targetPort} appears to be in use already.`);
      log(`This might be due to a previous server instance that didn't shut down properly.`);
      log(`The server will still attempt to bind to the port, but might fail if it's really in use.`);
    } else {
      log(`Port ${targetPort} is available. Proceeding with server startup.`);
    }

    const server = await registerRoutes(app);
    registerTestDataRoutes(app);

    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const requestId = req.headers['x-request-id'] as string;
      // H6: Consistent error response format with request ID tracing (H9)
      // Never leak internal error details to the client in production
      const message = SERVER_CONFIG.IS_PRODUCTION
        ? (status < 500 ? (err.message || "Request error") : "Internal Server Error")
        : (err.message || "Internal Server Error");

      res.status(status).json({ message, ...(requestId && { requestId }) });
      pinoLog.error({ err, requestId, method: req.method, path: req.path }, 'Request error');
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Log extensive environment details for debugging
    log(`=== ENVIRONMENT DETAILS ===`);
    log(`- PORT: ${process.env.PORT || 'not set'}`);
    log(`- NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    log(`- REPLIT_DB_URL: ${process.env.REPLIT_DB_URL ? 'set' : 'not set'}`);
    log(`- REPLIT_DOMAIN: ${process.env.REPLIT_DOMAIN || 'not set'}`);
    log(`- REPL_ID: ${process.env.REPL_ID || 'not set'}`);
    log(`- REPL_OWNER: ${process.env.REPL_OWNER || 'not set'}`);
    log(`- SERVER_CONFIG.PORT: ${SERVER_CONFIG.PORT}`);
    log(`- SERVER_CONFIG.HOST: ${SERVER_CONFIG.HOST}`);
    log(`- HOSTNAME: ${process.env.HOSTNAME || 'not set'}`);
    log(`=== END ENVIRONMENT DETAILS ===`);

    // Use SERVER_CONFIG.PORT consistently instead of hardcoding to ensure configuration alignment
    const PORT = SERVER_CONFIG.PORT;

    // Attempting to start server with the required port for Replit
    log(`Attempting to start server on ${SERVER_CONFIG.HOST}:${PORT}`);

    // Set a timeout to determine if the server fails to start
    const startupTimeout = setTimeout(() => {
      log('WARNING: Server startup timeout occurred. This may indicate a port conflict.');
    }, 5000);

    // Start the server with proper configuration for Replit
    server.listen(Number(PORT), SERVER_CONFIG.HOST, () => {
      clearTimeout(startupTimeout);
      log(`Act Up server successfully running on ${SERVER_CONFIG.HOST}:${PORT}`);
      log(`Environment: ${SERVER_CONFIG.IS_PRODUCTION ? 'Production' : 'Development'}`);
      log(`Vite configured: ${app.get("env") === "development" ? 'Yes (Development)' : 'No (Production)'}`);
      log(`Access URL (local): http://localhost:${PORT}`);
      log(`For Replit: Server should be accessible at https://${process.env.REPLIT_DOMAIN || '[your-repl-name].replit.dev'}`);

      // Check if we're using the port configured in the .replit file
      if (PORT !== 5000) {
        log(`⚠️ WARNING: You're running on port ${PORT}, but the .replit file is configured for port 5000`);
        log(`⚠️ This may cause issues with the Replit webview`);
      }

      // Setup port forwarding for production
      try {
        setupPortForwarding(PORT);
        log(`Set up port forwarding from port 80 to internal port ${PORT}`);
      } catch (error: any) {
        log(`Failed to set up port forwarding: ${(error as Error).message}`);
        pinoLog.error({ err: error }, 'Port forwarding error');
      }

      // Initialize bill tracking service
      try {
        import('./services/bill-tracking-service').then(module => {
          const { billTrackingService } = module;
          billTrackingService.initialize();
          serviceStatus['bill-tracking'] = { ok: true };
          log('Bill tracking service initialized successfully');
        }).catch(error => {
          serviceStatus['bill-tracking'] = { ok: false, error: (error as Error).message };
          log('Failed to initialize bill tracking service: ' + (error as Error).message);
          pinoLog.error({ err: error }, 'Bill tracking service error');
        });
      } catch (error: any) {
        serviceStatus['bill-tracking'] = { ok: false, error: (error as Error).message };
        log('Failed to initialize bill tracking service: ' + (error as Error).message);
        pinoLog.error({ err: error }, 'Bill tracking service error');
      }
    }).on('error', (err) => {
      clearTimeout(startupTimeout);
      log(`Server error occurred: ${err.message}`);

      if ((err as any).code === 'EADDRINUSE') {
        log(`ERROR: Port ${PORT} is already in use. This could be caused by:`);
        log(`1. Another instance of Act Up is already running`);
        log(`2. Another service is using port ${PORT}`);
        log('ERROR: Cannot start server due to port conflict.');
        log('Please check no other servers are running and restart the Replit workflow.');
      } else {
        log('FATAL ERROR: Server could not start for an unknown reason.');
        pinoLog.error(err);
      }
    });
  } catch (error: any) {
    log('FATAL ERROR: Failed during server initialization');
    pinoLog.error(error);
  }
})();
// Import directly from tecProcessor since it's an ES module
// @ts-ignore - tecProcessor may not have type declarations
import { processTECReports } from './server/tecProcessor.js';
