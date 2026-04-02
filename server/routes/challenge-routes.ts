/**
 * Challenge routes for the super-user gamification system.
 */
import { Router } from "express";
import { z } from "zod";
import { superUserStorage } from "../storage-super-user";
import { createLogger } from "../logger";

const log = createLogger("routes-challenges");
const router = Router();

// GET /api/challenges
router.get("/", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const challenges = await superUserStorage.getAllChallenges();
    res.status(200).json(challenges);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving challenges" });
  }
});

// GET /api/users/me/challenges — mounted under /api so path is /users/me/challenges
router.get("/users/me/challenges", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const userChallenges = await superUserStorage.getUserChallengesByUserId(req.session.userId);
    res.status(200).json(userChallenges);
  } catch (error: any) {
    res.status(500).json({ message: "Error retrieving user challenges" });
  }
});

// POST /api/users/me/challenges/:challengeId
router.post("/users/me/challenges/:challengeId", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const challengeId = parseInt(req.params.challengeId);
    const challenge = await superUserStorage.getChallengeById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }
    const existingUserChallenge = await superUserStorage.getUserChallengeByChallengeId(
      req.session.userId,
      challengeId,
    );
    if (existingUserChallenge) {
      return res.status(409).json({ message: "User already has this challenge" });
    }
    const userChallenge = await superUserStorage.createUserChallenge({
      userId: req.session.userId,
      challengeId,
      progress: 0,
      total: 100,
      completed: false,
    });
    res.status(201).json(userChallenge);
  } catch (error: any) {
    res.status(500).json({ message: "Error starting challenge" });
  }
});

// PUT /api/users/me/challenges/:challengeId
router.put("/users/me/challenges/:challengeId", async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const challengeId = parseInt(req.params.challengeId);
    const updateData = z
      .object({
        progress: z.number().optional(),
        completed: z.boolean().optional(),
      })
      .parse(req.body);
    const updatedUserChallenge = await superUserStorage.updateUserChallenge(
      req.session.userId,
      challengeId,
      updateData,
    );
    if (!updatedUserChallenge) {
      return res.status(404).json({ message: "Challenge not found or not started by user" });
    }
    res.status(200).json(updatedUserChallenge);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid input", errors: error.errors });
    } else {
      res.status(500).json({ message: "Error updating challenge progress" });
    }
  }
});

export default router;
