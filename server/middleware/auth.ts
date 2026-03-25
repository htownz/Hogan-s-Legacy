// @ts-nocheck
import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Middleware to check if the user is authenticated
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }
  next();
};

// Middleware to check if the user has admin role
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }
  
  try {
    // We can check for admin role in a different way since the User type doesn't have a role property
    // For example, we could have a separate admin table or check a specific user ID
    // This is a simplified implementation that you can customize based on your needs
    if (!req.user || req.user.id !== 1) { // Assuming user with ID 1 is the admin
      return res.status(403).json({ message: "Forbidden: Admin access required" });
    }
    
    next();
  } catch (error: any) {
    console.error("Error in requireAdmin middleware:", error);
    res.status(500).json({ message: "Server error while checking admin role" });
  }
};

// Middleware to check if the user has super user role
export const requireSuperUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized: Authentication required" });
  }
  
  try {
    const superUserRole = await storage.getSuperUserRoleByUserId(req.user!.id);
    
    if (!superUserRole) {
      return res.status(403).json({ message: "Forbidden: Super User access required" });
    }
    
    // Add the super user role to the request for later use
    req.superUserRole = superUserRole;
    next();
  } catch (error: any) {
    console.error("Error in requireSuperUser middleware:", error);
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