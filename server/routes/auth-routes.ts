/**
 * Auth routes — registration, login, logout.
 */
import { Router, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { superUserStorage } from "../storage-super-user";
import { insertUserSchema } from "@shared/schema";
import { createLogger } from "../logger";
import rateLimit from "express-rate-limit";

const log = createLogger("routes-auth");
const router = Router();

// Rate limit for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later" },
});

router.post("/register", authRateLimit, async (req, res) => {
  try {
    const userData = insertUserSchema.parse(req.body);

    // Password complexity validation
    const pw = userData.password;
    if (!pw || pw.length < 12) {
      return res.status(400).json({
        message: "Password must be at least 12 characters long",
      });
    }
    if (!/[A-Z]/.test(pw) || !/[a-z]/.test(pw) || !/[0-9]/.test(pw)) {
      return res.status(400).json({
        message:
          "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      });
    }
    const newUser = await storage.createUser(userData);

    // Create default SuperUserRole as Advocate (level 1)
    await superUserStorage.createSuperUserRole({
      userId: newUser.id,
      role: "amplifier",
      level: 1,
      progressToNextLevel: 0,
    });

    // Initialize user network impact
    await superUserStorage.createUserNetworkImpact({
      userId: newUser.id,
      usersInvited: 0,
      activeUsers: 0,
      actionsInspired: 0,
      totalReach: 0,
      r0Value: 0,
    });

    // Create initial progression milestones
    const initialMilestones = [
      {
        userId: newUser.id,
        role: "amplifier",
        targetLevel: 2,
        milestone: "Invite 5 users",
        progress: 0,
        total: 5,
      },
      {
        userId: newUser.id,
        role: "amplifier",
        targetLevel: 2,
        milestone: "Create first Action Circle",
        progress: 0,
        total: 1,
      },
      {
        userId: newUser.id,
        role: "amplifier",
        targetLevel: 2,
        milestone: "Maintain consistent engagement (weekly actions)",
        progress: 0,
        total: 4,
      },
      {
        userId: newUser.id,
        role: "amplifier",
        targetLevel: 2,
        milestone: "Complete Amplifier training modules",
        progress: 0,
        total: 3,
      },
    ];

    for (const milestone of initialMilestones) {
      await superUserStorage.createProgressionMilestone(milestone);
    }

    // Don't return password in response
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({ message: "Error creating user" });
    }
  }
});

router.post("/login", authRateLimit, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await storage.getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isPasswordValid = await storage.checkUserPassword(
      password,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Store user in session
    (req.session as any).userId = user.id;

    // Get user's role info
    const userRole = await superUserStorage.getSuperUserRoleByUserId(user.id);

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      ...userWithoutPassword,
      role: userRole,
    });
  } catch (error: any) {
    log.error({ err: error }, "Login error");
    res.status(500).json({ message: "Error logging in" });
  }
});

router.post("/logout", (req, res) => {
  req.session.destroy((err: Error | null) => {
    if (err) {
      return res.status(500).json({ message: "Error logging out" });
    }
    res.clearCookie("connect.sid");
    res.status(200).json({ message: "Logged out successfully" });
  });
});

export default router;
