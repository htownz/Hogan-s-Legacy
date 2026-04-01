import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Response, NextFunction } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { createHmac, timingSafeEqual } from "crypto";
import type { IncomingMessage } from "http";
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
let activeSessionStore: session.Store | null = null;
let activeSessionSecret: string | null = null;

function parseCookiesFromHeader(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const pairs = cookieHeader.split(";");
  const cookies: Record<string, string> = {};

  for (const pair of pairs) {
    const index = pair.indexOf("=");
    if (index <= 0) continue;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!key) continue;
    cookies[key] = value;
  }

  return cookies;
}

function unsignSessionCookie(raw: string, secret: string): string | null {
  const separatorIndex = raw.lastIndexOf(".");
  if (separatorIndex <= 0) return null;

  const value = raw.slice(0, separatorIndex);
  const signature = raw.slice(separatorIndex + 1);
  const expected = createHmac("sha256", secret)
    .update(value)
    .digest("base64")
    .replace(/=+$/g, "");

  const providedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) return null;

  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  return value;
}

function resolveSessionIdFromCookieValue(cookieValue: string, secret: string): string | null {
  const decoded = decodeURIComponent(cookieValue);

  // express-session cookie format: s:<value>.<signature>
  if (decoded.startsWith("s:")) {
    return unsignSessionCookie(decoded.slice(2), secret);
  }

  // Unsigned cookies are unusual but still supported for local/dev compatibility.
  return decoded;
}

function sessionStoreGet(store: session.Store, sid: string): Promise<session.SessionData | null> {
  return new Promise((resolve, reject) => {
    store.get(sid, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      resolve((data as session.SessionData | undefined) ?? null);
    });
  });
}

async function resolveUserFromSessionId(sid: string): Promise<UserType | null> {
  if (!activeSessionStore) return null;

  const sessionData = await sessionStoreGet(activeSessionStore, sid);
  if (!sessionData) return null;

  const rawUserId = (sessionData as any)?.userId ?? (sessionData as any)?.passport?.user;
  const userId = Number(rawUserId);
  if (!Number.isInteger(userId) || userId <= 0) return null;

  const user = await storage.getUser(userId);
  return user ?? null;
}

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
  const secret = resolveSessionSecret();
  const store = buildSessionStore();
  activeSessionSecret = secret;
  activeSessionStore = store;

  // Session setup
  const sessionSettings: session.SessionOptions = {
    secret,
    resave: false,
    saveUninitialized: false,
    store,
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

export async function getAuthenticatedUserFromRequest(req: IncomingMessage): Promise<UserType | null> {
  if (!activeSessionStore || !activeSessionSecret) {
    return null;
  }

  const cookies = parseCookiesFromHeader(req.headers.cookie);
  const sessionCookie = cookies["connect.sid"];
  if (!sessionCookie) return null;

  const sid = resolveSessionIdFromCookieValue(sessionCookie, activeSessionSecret);
  if (!sid) return null;

  try {
    return await resolveUserFromSessionId(sid);
  } catch (error: any) {
    console.error("Error resolving authenticated user from request cookie:", error);
    return null;
  }
}

// Function to verify user token for WebSocket connections
export async function verifyToken(token: string): Promise<UserType | null> {
  try {
    if (!activeSessionStore || !activeSessionSecret) return null;

    const sid = resolveSessionIdFromCookieValue(token, activeSessionSecret);
    if (!sid) return null;

    return await resolveUserFromSessionId(sid);
  } catch (error: any) {
    console.error('Error verifying token:', error);
    return null;
  }
}