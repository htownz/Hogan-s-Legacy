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
});
