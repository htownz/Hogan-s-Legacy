import { Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types/request-types';
import { createLogger } from '../logger';

const log = createLogger('auth-middleware');

function parseUserIdSet(raw: string | undefined): Set<number> {
  if (!raw) return new Set();

  return new Set(
    raw
      .split(',')
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0),
  );
}

function resolveAuthenticatedUserId(req: AuthRequest): number | null {
  if (req?.session?.userId && Number.isInteger(req.session.userId)) {
    return Number(req.session.userId);
  }

  if (req?.user?.id && Number.isInteger(req.user.id)) {
    return Number(req.user.id);
  }

  const passportUserId = req?.session?.passport?.user;
  if (Number.isInteger(passportUserId)) {
    return Number(passportUserId);
  }

  return null;
}

export function isUserAdminById(userId: number): boolean {
  const adminIds = parseUserIdSet(process.env.ADMIN_USER_IDS);
  return adminIds.has(userId);
}

export function isUserModeratorOrAdminById(userId: number): boolean {
  const moderatorIds = parseUserIdSet(process.env.MODERATOR_USER_IDS);
  return moderatorIds.has(userId) || isUserAdminById(userId);
}

async function ensureUserExists(userId: number): Promise<boolean> {
  const user = await db
    .select({ id: users.id })
    .from(users)
    .$dynamic()
    .where(eq(users.id, userId))
    .limit(1);

  return Array.isArray(user) && user.length > 0;
}

/**
 * Middleware to check if a user is authenticated
 * Supports both Passport.js authentication and session-based authentication
 */
export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (resolveAuthenticatedUserId(req) !== null) {
    return next();
  }

  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized - Please log in to access this resource' });
};

/**
 * Middleware to check if a user is an admin
 */
export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = resolveAuthenticatedUserId(req);
  if (userId === null) {
    return res.status(401).json({ error: 'Unauthorized - Please log in to access this resource' });
  }

  try {
    const userExists = await ensureUserExists(userId);
    if (!userExists) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    if (isUserAdminById(userId)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  } catch (error: any) {
    log.error({ err: error }, 'Error in isAdmin middleware');
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if a user is a moderator or admin
 */
export const isModeratorOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = resolveAuthenticatedUserId(req);
  if (userId === null) {
    return res.status(401).json({ error: 'Unauthorized - Please log in to access this resource' });
  }

  try {
    const userExists = await ensureUserExists(userId);
    if (!userExists) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }

    if (isUserModeratorOrAdminById(userId)) {
      return next();
    }

    return res.status(403).json({ error: 'Forbidden - Moderator or admin access required' });
  } catch (error: any) {
    log.error({ err: error }, 'Error in isModeratorOrAdmin middleware');
    return res.status(500).json({ error: 'Internal server error' });
  }
};