/**
 * Policy Intel bridge routes — proxies requests from main app to the
 * policy-intel bounded context.
 */
import { Router } from "express";
import { isAuthenticated } from "../auth";
import { PolicyIntelBridge } from "../services/policy-intel-bridge";
import { createLogger } from "../logger";

const log = createLogger("routes-policy-intel-bridge");
const router = Router();
const policyIntelBridge = new PolicyIntelBridge();

router.get("/status", isAuthenticated, async (req, res) => {
  const payload = await policyIntelBridge.getStatus({
    force: req.query.force === "true",
  });
  res.json(payload);
});

router.get("/briefing", isAuthenticated, async (req, res) => {
  try {
    const payload = await policyIntelBridge.getBriefing({
      force: req.query.force === "true",
    });
    res.json(payload);
  } catch (error: any) {
    res.status(502).json({
      source: "policy-intel",
      message: "Failed to fetch policy-intel briefing",
      error: error?.message || String(error),
    });
  }
});

router.get("/automation/status", isAuthenticated, async (req, res) => {
  try {
    const payload = await policyIntelBridge.getAutomationStatus({
      force: req.query.force === "true",
    });
    res.json(payload);
  } catch (error: any) {
    res.status(502).json({
      source: "policy-intel",
      message: "Failed to fetch policy-intel automation status",
      error: error?.message || String(error),
    });
  }
});

router.get("/automation/jobs", isAuthenticated, async (req, res) => {
  try {
    const payload = await policyIntelBridge.getAutomationJobs({
      force: req.query.force === "true",
    });
    res.json(payload);
  } catch (error: any) {
    res.status(502).json({
      source: "policy-intel",
      message: "Failed to fetch policy-intel automation jobs",
      error: error?.message || String(error),
    });
  }
});

router.get("/automation/events", isAuthenticated, async (req, res) => {
  try {
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) ? limitRaw : undefined;
    const jobsRaw = typeof req.query.jobs === "string" ? req.query.jobs : "";
    const jobs = jobsRaw
      .split(",")
      .map((job) => job.trim())
      .filter(Boolean);
    const statusRaw = typeof req.query.status === "string" ? req.query.status : "";
    const status = statusRaw === "success" || statusRaw === "error" ? statusRaw : "all";

    const payload = await policyIntelBridge.getAutomationEvents({
      force: req.query.force === "true",
      limit,
      jobs,
      status,
    });
    res.json(payload);
  } catch (error: any) {
    res.status(502).json({
      source: "policy-intel",
      message: "Failed to fetch policy-intel automation events",
      error: error?.message || String(error),
    });
  }
});

router.post("/automation/intel-briefing/run", isAuthenticated, async (req, res) => {
  try {
    const payload = await policyIntelBridge.triggerIntelBriefingAutomation({
      force: req.query.force === "true" || req.body?.force === true,
    });
    if (!payload.triggered) {
      return res.status(429).json(payload);
    }
    res.json(payload);
  } catch (error: any) {
    res.status(502).json({
      source: "policy-intel",
      message: "Failed to trigger policy-intel intel-briefing automation",
      error: error?.message || String(error),
    });
  }
});

router.post("/automation/jobs/:jobName/run", isAuthenticated, async (req, res) => {
  try {
    const payload = await policyIntelBridge.triggerAutomationJob(req.params.jobName, {
      force: req.query.force === "true" || req.body?.force === true,
    });
    if (!payload.triggered) {
      return res.status(429).json(payload);
    }
    res.json(payload);
  } catch (error: any) {
    res.status(502).json({
      source: "policy-intel",
      message: "Failed to trigger policy-intel automation job",
      error: error?.message || String(error),
    });
  }
});

export default router;
