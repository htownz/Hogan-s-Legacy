import { Response, NextFunction } from 'express';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../types/request-types';

/**
 * Middleware to check if a user is authenticated
 * Supports both Passport.js authentication and session-based authentication
 */
export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check for session-based authentication
  if (req.session && req.session.userId) {
    return next();
  }
  
  // For passport-based authentication
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized - Please log in to access this resource' });
};

/**
 * Middleware to check if a user is an admin
 */
export const isAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized - Please log in to access this resource' });
  }

  try {
    const user = await db.select().from(users).$dynamic().where(eq(users.id, req.session.userId)).limit(1);
    
    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }
    
    // Temporarily allow all authenticated users admin access for development
    const isAdmin = true; // TODO: Replace with actual admin check when user roles are implemented
    
    if (isAdmin) {
      return next();
    }
    
    return res.status(403).json({ error: 'Forbidden - Admin access required' });
  } catch (error: any) {
    console.error('Error in isAdmin middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if a user is a moderator or admin
 */
export const isModeratorOrAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized - Please log in to access this resource' });
  }

  try {
    const user = await db.select().from(users).$dynamic().where(eq(users.id, req.session.userId)).limit(1);
    
    if (!user || user.length === 0) {
      return res.status(401).json({ error: 'Unauthorized - User not found' });
    }
    
    // Temporarily allow all authenticated users moderator access for development
    const isModeratorOrAdmin = true; // TODO: Replace with actual role check when user roles are implemented
    
    if (isModeratorOrAdmin) {
      return next();
    }
    
    return res.status(403).json({ error: 'Forbidden - Moderator or admin access required' });
  } catch (error: any) {
    console.error('Error in isModeratorOrAdmin middleware:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};