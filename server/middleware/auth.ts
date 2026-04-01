import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { isUserAdminById } from "./auth-middleware";
import { createLogger } from "../logger";

const log = createLogger("auth");

type AuthenticatedRequest = Request & {
  session?: {
    userId?: number;
    passport?: {
      user?: number;
    };
  };
  user?: {
    id?: number;
  };
};

function resolveUserId(req: AuthenticatedRequest): number | null {
  if (req.session?.userId && Number.isInteger(req.session.userId)) {
    return Number(req.session.userId);
  }

  if (req.user?.id && Number.isInteger(req.user.id)) {
    return Number(req.user.id);
  }

  if (req.session?.passport?.user && Number.isInteger(req.session.passport.user)) {
    return Number(req.session.passport.user);
  }

  return null;
}

// Middleware to check if the user is authenticated
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (resolveUserId(req) !== null) {
    return next();
  }

  if (typeof req.isAuthenticated === "function" && req.isAuthenticated()) {
    return next();
  }

  if (resolveUserId(req) === null) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }

  next();
};

// Middleware to check if the user has admin role
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (resolveUserId(req) === null) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }
  
  try {
    const userId = resolveUserId(req);
    if (!userId || !isUserAdminById(userId)) {
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
  } catch (error: any) {
    log.error({ err: error }, 'Error in requireAdmin middleware');
    res.status(500).json({ message: "Server error while checking admin role" });
  }
};

// Middleware to check if the user has super user role
export const requireSuperUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userId = resolveUserId(req);
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }
  
  try {
    const superUserRole = await storage.getSuperUserRoleByUserId(userId);
    
    if (!superUserRole) {
      return res.status(403).json({ message: "Forbidden: Super User access required" });
    }
    
    // Add the super user role to the request for later use
    req.superUserRole = superUserRole;
    next();
  } catch (error: any) {
    log.error({ err: error }, 'Error in requireSuperUser middleware');
    res.status(500).json({ message: "Server error while checking super user role" });
  }
};

// Declare the module augmentation for Express.Request
declare global {
  namespace Express {
    interface Request {
      superUserRole?: import("@shared/schema").SuperUserRole;
    }
  }
}