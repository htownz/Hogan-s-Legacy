import { describe, it, expect, vi } from "vitest";
import { createPolicyIntelBridgeClient } from "../server/services/policy-intel-bridge";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
    },
  });
}

describe("policy-intel bridge contract", () => {
  it("builds the status contract payload", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("/health")) return jsonResponse({ ok: true });
      if (url.endsWith("/api/intel/dashboard/stats")) return jsonResponse({ totalAlerts: 12 });
      if (url.endsWith("/api/intel/intelligence/forecast/drift")) {
        return jsonResponse({
          trend: "stable",
          driftAlert: false,
          latestAccuracy: 0.71,
          latestRankingAccuracy: 0.67,
        });
      }
      if (url.endsWith("/api/intel/replay/legiscan/runs?limit=1")) {
        return jsonResponse([
          {
            run: { id: 9, status: "running" },
            progress: { completionRatio: 0.5, hasMore: true },
          },
        ]);
      }
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        apiToken: "abc",
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => 1_000 },
    );

    const status = await bridge.getStatus();

    expect(status.connected).toBe(true);
    expect(status.forecastDrift?.trend).toBe("stable");
    expect(status.replay?.runId).toBe(9);
    expect(status.failures).toEqual([]);
    expect(status.cached).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(4);
  });

  it("caches status calls inside TTL", async () => {
    let now = 10_000;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("/health")) return jsonResponse({ ok: true });
      if (url.endsWith("/api/intel/dashboard/stats")) return jsonResponse({});
      if (url.endsWith("/api/intel/intelligence/forecast/drift")) return jsonResponse({});
      if (url.endsWith("/api/intel/replay/legiscan/runs?limit=1")) return jsonResponse([]);
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => now },
    );

    const first = await bridge.getStatus();
    const second = await bridge.getStatus();

    expect(first.cached).toBe(false);
    expect(second.cached).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(4);

    now += 31_000;
    const third = await bridge.getStatus();
    expect(third.cached).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(8);
  });

  it("caches briefing and supports force refresh", async () => {
    let now = 5_000;
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("/api/intel/intelligence/briefing")) {
        return jsonResponse({
          generatedAt: "2026-03-31T00:00:00.000Z",
          forecast: { delta: { threatTrend: "stable" } },
          crossRefInsights: [{ id: 1 }],
          risk: { criticalRisks: [{ id: 1 }, { id: 2 }] },
          anomalies: { anomalies: [{ id: 1 }] },
        });
      }
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => now },
    );

    const first = await bridge.getBriefing();
    const second = await bridge.getBriefing();

    expect(first.summary.keyInsightCount).toBe(1);
    expect(second.cached).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const forced = await bridge.getBriefing({ force: true });
    expect(forced.cached).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(2);

    now += 61_000;
    await bridge.getBriefing();
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("builds automation status with AI provider readiness", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("/api/intel/ops/environment")) {
        return jsonResponse({
          variables: [
            { key: "OPENAI_API_KEY", configured: true },
            { key: "ANTHROPIC_API_KEY", configured: false },
          ],
        });
      }
      if (url.endsWith("/api/intel/scheduler/status")) {
        return jsonResponse({
          enabled: true,
          jobs: [
            {
              name: "intel-briefing",
              enabled: true,
              cronExpression: "30 */6 * * *",
              running: false,
              runningSince: null,
              lastRun: {
                status: "success",
                finishedAt: "2026-03-31T00:00:00.000Z",
                durationMs: 1234,
              },
              runCounts: { total: 4, success: 4, error: 0, skippedWhileRunning: 0 },
              consecutiveFailures: 0,
              lastSuccessAt: "2026-03-31T00:00:00.000Z",
              lastErrorAt: null,
            },
          ],
        });
      }
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => 10_000 },
    );

    const status = await bridge.getAutomationStatus();

    expect(status.aiSupport.providersConfigured).toEqual(["openai"]);
    expect(status.aiSupport.briefingProvider).toBe("template");
    expect(status.automation.intelBriefing.enabled).toBe(true);
    expect(status.automation.intelBriefing.lastRun?.durationMs).toBe(1234);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("returns automation jobs with scheduler metadata", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("/api/intel/scheduler/status")) {
        return jsonResponse({
          enabled: true,
          jobs: [
            {
              name: "intel-briefing",
              enabled: true,
              cronExpression: "30 */6 * * *",
              running: false,
              runningSince: null,
              lastRun: {
                status: "success",
                finishedAt: "2026-03-31T00:00:00.000Z",
                durationMs: 2200,
              },
              runCounts: { total: 8, success: 7, error: 1, skippedWhileRunning: 0 },
              consecutiveFailures: 0,
              lastSuccessAt: "2026-03-31T00:00:00.000Z",
              lastErrorAt: "2026-03-30T18:00:00.000Z",
            },
          ],
        });
      }
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => 10_000 },
    );

    const jobs = await bridge.getAutomationJobs();
    expect(jobs.schedulerEnabled).toBe(true);
    expect(jobs.jobs).toHaveLength(1);
    expect(jobs.jobs[0].name).toBe("intel-briefing");
    expect(jobs.jobs[0].runCounts.total).toBe(8);
  });

  it("enforces cooldown for automation trigger and allows force", async () => {
    let now = Date.parse("2026-03-31T00:02:00.000Z");
    const recentRun = new Date(now - 30_000).toISOString();

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/intel/ops/environment")) {
        return jsonResponse({ variables: [] });
      }
      if (url.endsWith("/api/intel/scheduler/status")) {
        return jsonResponse({
          enabled: true,
          jobs: [
            {
              name: "intel-briefing",
              enabled: true,
              running: false,
              runningSince: null,
              lastRun: { status: "success", finishedAt: recentRun, durationMs: 5000 },
              runCounts: { total: 1, success: 1, error: 0, skippedWhileRunning: 0 },
              consecutiveFailures: 0,
              lastSuccessAt: recentRun,
              lastErrorAt: null,
            },
          ],
        });
      }
      if (url.endsWith("/api/intel/scheduler/trigger/intel-briefing") && init?.method === "POST") {
        return jsonResponse({
          jobName: "intel-briefing",
          startedAt: "2026-03-31T00:02:00.000Z",
          finishedAt: "2026-03-31T00:02:10.000Z",
          durationMs: 10000,
          status: "success",
          summary: { insights: 3 },
        });
      }
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => now },
    );

    const skipped = await bridge.triggerIntelBriefingAutomation();
    expect(skipped.triggered).toBe(false);
    expect(skipped.message).toContain("cooldown");

    now += 1_000;
    const forced = await bridge.triggerIntelBriefingAutomation({ force: true });
    expect(forced.triggered).toBe(true);
    expect(forced.record?.jobName).toBe("intel-briefing");
  });

  it("supports triggering non-briefing automation jobs", async () => {
    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/intel/scheduler/status")) {
        return jsonResponse({
          enabled: true,
          jobs: [
            {
              name: "local-feeds",
              enabled: true,
              running: false,
              runningSince: null,
              lastRun: {
                status: "success",
                finishedAt: "2026-03-30T23:00:00.000Z",
                durationMs: 2000,
              },
              runCounts: { total: 3, success: 3, error: 0, skippedWhileRunning: 0 },
              consecutiveFailures: 0,
              lastSuccessAt: "2026-03-30T23:00:00.000Z",
              lastErrorAt: null,
            },
          ],
        });
      }
      if (url.endsWith("/api/intel/scheduler/trigger/local-feeds") && init?.method === "POST") {
        return jsonResponse({
          jobName: "local-feeds",
          startedAt: "2026-03-31T00:05:00.000Z",
          finishedAt: "2026-03-31T00:05:04.000Z",
          durationMs: 4000,
          status: "success",
          summary: { inserted: 12 },
        });
      }
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => Date.parse("2026-03-31T00:06:00.000Z") },
    );

    const result = await bridge.triggerAutomationJob("local-feeds");
    expect(result.triggered).toBe(true);
    expect(result.record?.jobName).toBe("local-feeds");
    expect(result.record?.summary).toEqual({ inserted: 12 });
  });

  it("skips generic job during cooldown and allows force", async () => {
    let now = Date.parse("2026-03-31T00:06:00.000Z");
    const recentRun = new Date(now - 20_000).toISOString();

    const fetchImpl = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/intel/scheduler/status")) {
        return jsonResponse({
          enabled: true,
          jobs: [
            {
              name: "local-feeds",
              enabled: true,
              running: false,
              runningSince: null,
              lastRun: {
                status: "success",
                finishedAt: recentRun,
                durationMs: 2000,
              },
              runCounts: { total: 2, success: 2, error: 0, skippedWhileRunning: 0 },
              consecutiveFailures: 0,
              lastSuccessAt: recentRun,
              lastErrorAt: null,
            },
          ],
        });
      }
      if (url.endsWith("/api/intel/scheduler/trigger/local-feeds") && init?.method === "POST") {
        return jsonResponse({
          jobName: "local-feeds",
          startedAt: "2026-03-31T00:06:00.000Z",
          finishedAt: "2026-03-31T00:06:03.000Z",
          durationMs: 3000,
          status: "success",
          summary: { inserted: 3 },
        });
      }
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => now },
    );

    const skipped = await bridge.triggerAutomationJob("local-feeds");
    expect(skipped.triggered).toBe(false);
    expect(skipped.message).toContain("cooldown");

    now += 1_000;
    const forced = await bridge.triggerAutomationJob("local-feeds", { force: true });
    expect(forced.triggered).toBe(true);
    expect(forced.record?.jobName).toBe("local-feeds");
  });

  it("returns filtered automation events and caches by options", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.endsWith("/api/intel/scheduler/history")) {
        return jsonResponse([
          {
            jobName: "intel-briefing",
            startedAt: "2026-03-31T00:00:00.000Z",
            finishedAt: "2026-03-31T00:00:08.000Z",
            durationMs: 8000,
            status: "success",
            summary: { insights: 4 },
          },
          {
            jobName: "local-feeds",
            startedAt: "2026-03-31T00:01:00.000Z",
            finishedAt: "2026-03-31T00:01:03.000Z",
            durationMs: 3000,
            status: "success",
            summary: { inserted: 2 },
          },
          {
            jobName: "intel-briefing",
            startedAt: "2026-03-31T00:02:00.000Z",
            finishedAt: "2026-03-31T00:02:05.000Z",
            durationMs: 5000,
            status: "error",
            summary: {},
            error: "timeout",
          },
        ]);
      }
      return jsonResponse({ message: "not found" }, 404);
    });

    const bridge = createPolicyIntelBridgeClient(
      {
        baseUrl: "http://policy-intel.local",
        requestTimeoutMs: 10_000,
        statusCacheTtlMs: 30_000,
        briefingCacheTtlMs: 60_000,
        automationCacheTtlMs: 15_000,
        automationEventsCacheTtlMs: 15_000,
        automationTriggerCooldownMs: 120_000,
      },
      { fetchImpl: fetchImpl as any, now: () => 10_000 },
    );

    const first = await bridge.getAutomationEvents({ limit: 5 });
    expect(first.events).toHaveLength(2);
    expect(first.events[0].jobName).toBe("intel-briefing");
    expect(first.events[0].status).toBe("error");
    expect(first.statusFilter).toBe("all");

    const second = await bridge.getAutomationEvents({ limit: 5 });
    expect(second.cached).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const successOnly = await bridge.getAutomationEvents({ limit: 5, status: "success" });
    expect(successOnly.events).toHaveLength(1);
    expect(successOnly.events[0].status).toBe("success");
    expect(successOnly.statusFilter).toBe("success");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
