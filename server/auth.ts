import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { CustomRequest } from "./types";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPgSimple(session);

function resolveSessionSecret(): string {
  const configured = process.env.SESSION_SECRET?.trim();
  if (configured) return configured;

  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  }

  return "dev-secret-key-change-in-production";
}

function buildSessionStore(): session.Store {
  const env = process.env.NODE_ENV;
  const databaseUrl = process.env.DATABASE_URL?.trim();

  // Keep tests fully in-memory to avoid introducing external DB coupling.
  if (env === "test") {
    return new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  if (databaseUrl) {
    return new PostgresSessionStore({
      conString: databaseUrl,
      tableName: "user_sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15,
    });
  }

  if (env === "production") {
    throw new Error("DATABASE_URL must be set in production for persistent session storage");
  }

  return new MemoryStore({
    checkPeriod: 86400000,
  });
}

// Password hashing function
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

// Password verification function using bcrypt
export async function verifyPassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function setupAuth(app: Express) {
  // Session setup
  const sessionSettings: session.SessionOptions = {
    secret: resolveSessionSecret(),
    resave: false,
    saveUninitialized: false,
    store: buildSessionStore(),
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Passport local strategy setup
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        const isPasswordValid = await verifyPassword(password, user.password);
        
        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid username or password" });
        }
        
        return done(null, user);
      } catch (error: any) {
        return done(error);
      }
    })
  );

  // Serialize user to session
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  // Deserialize user from session
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error: any) {
      done(error);
    }
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: CustomRequest, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Not authenticated" });
};

// Function to verify user token for WebSocket connections
export async function verifyToken(token: string): Promise<UserType | null> {
  try {
    // For this implementation, we'll use the session cookie
    // In a real implementation, we'd validate JWT tokens or other authentication mechanisms
    
    // Here, the token could be a session ID or user ID
    // For simplicity, we'll just look up the user
    const userId = parseInt(token, 10);
    if (isNaN(userId)) return null;
    
    const user = await storage.getUser(userId);
    return user || null;
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return null;
  }
}