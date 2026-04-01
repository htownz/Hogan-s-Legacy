export interface PolicyIntelBridgeConfig {
  baseUrl: string;
  requestTimeoutMs: number;
  apiToken?: string;
  statusCacheTtlMs: number;
  briefingCacheTtlMs: number;
}

export interface PolicyIntelBridgeStatusResult {
  connected: boolean;
  checkedAt: string;
  latencyMs: number;
  baseUrl: string;
  tokenConfigured: boolean;
  health: any;
  dashboard: any;
  forecastDrift: {
    trend: string;
    driftAlert: boolean;
    latestAccuracy: number | null;
    latestRankingAccuracy: number | null;
  } | null;
  replay: {
    runId?: number;
    status?: string;
    completionRatio?: number;
    hasMore?: boolean;
  } | null;
  failures: Array<{ call: string; error: string }>;
  cached: boolean;
}

export interface PolicyIntelBridgeBriefingResult {
  source: "policy-intel";
  summary: {
    generatedAt: string;
    threatTrend: string;
    keyInsightCount: number;
    highRiskBillCount: number;
    anomalyCount: number;
  };
  briefing: any;
  cached: boolean;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export function createPolicyIntelBridgeClient(
  config: PolicyIntelBridgeConfig,
  deps: { fetchImpl?: FetchLike; now?: () => number } = {},
) {
  const fetchImpl = deps.fetchImpl ?? (fetch as FetchLike);
  const now = deps.now ?? Date.now;
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  let statusCache: CacheEntry<PolicyIntelBridgeStatusResult> | null = null;
  let briefingCache: CacheEntry<PolicyIntelBridgeBriefingResult> | null = null;
  let statusInFlight: Promise<PolicyIntelBridgeStatusResult> | null = null;
  let briefingInFlight: Promise<PolicyIntelBridgeBriefingResult> | null = null;

  function headers() {
    const out: Record<string, string> = { Accept: "application/json" };
    if (config.apiToken?.trim()) {
      out.Authorization = `Bearer ${config.apiToken.trim()}`;
    }
    return out;
  }

  async function fetchJson(path: string, timeoutMs = config.requestTimeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${baseUrl}${path}`, {
        method: "GET",
        headers: headers(),
        signal: controller.signal,
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(`policy-intel ${path} failed (${res.status}): ${body || res.statusText}`);
      }

      return await res.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  async function loadStatus(): Promise<PolicyIntelBridgeStatusResult> {
    const started = now();
    const calls = await Promise.allSettled([
      fetchJson("/health", Math.min(config.requestTimeoutMs, 5000)),
      fetchJson("/api/intel/dashboard/stats"),
      fetchJson("/api/intel/intelligence/forecast/drift"),
      fetchJson("/api/intel/replay/legiscan/runs?limit=1"),
    ]);

    const health = calls[0].status === "fulfilled" ? calls[0].value : null;
    const stats = calls[1].status === "fulfilled" ? calls[1].value : null;
    const drift = calls[2].status === "fulfilled" ? calls[2].value : null;
    const replay = calls[3].status === "fulfilled" ? calls[3].value : null;

    const failures = calls
      .map((result, idx) => ({ result, idx }))
      .filter((entry) => entry.result.status === "rejected")
      .map((entry) => ({
        call: ["health", "dashboard", "forecastDrift", "replay"][entry.idx],
        error: String((entry.result as PromiseRejectedResult).reason?.message || (entry.result as PromiseRejectedResult).reason),
      }));

    return {
      connected: Boolean(health?.ok),
      checkedAt: new Date(now()).toISOString(),
      latencyMs: Math.max(0, now() - started),
      baseUrl,
      tokenConfigured: Boolean(config.apiToken?.trim()),
      health,
      dashboard: stats,
      forecastDrift: drift
        ? {
            trend: drift.trend,
            driftAlert: Boolean(drift.driftAlert),
            latestAccuracy: drift.latestAccuracy ?? null,
            latestRankingAccuracy: drift.latestRankingAccuracy ?? null,
          }
        : null,
      replay: Array.isArray(replay) && replay.length > 0
        ? {
            runId: replay[0]?.run?.id,
            status: replay[0]?.run?.status,
            completionRatio: replay[0]?.progress?.completionRatio,
            hasMore: replay[0]?.progress?.hasMore,
          }
        : null,
      failures,
      cached: false,
    };
  }

  async function loadBriefing(force = false): Promise<PolicyIntelBridgeBriefingResult> {
    const forceQuery = force ? "?force=true" : "";
    const briefing = await fetchJson(`/api/intel/intelligence/briefing${forceQuery}`, Math.max(config.requestTimeoutMs, 25000));

    return {
      source: "policy-intel",
      summary: {
        generatedAt: briefing?.generatedAt || new Date(now()).toISOString(),
        threatTrend: briefing?.forecast?.delta?.threatTrend || "unknown",
        keyInsightCount: Array.isArray(briefing?.crossRefInsights) ? briefing.crossRefInsights.length : 0,
        highRiskBillCount: Array.isArray(briefing?.risk?.criticalRisks) ? briefing.risk.criticalRisks.length : 0,
        anomalyCount: Array.isArray(briefing?.anomalies?.anomalies) ? briefing.anomalies.anomalies.length : 0,
      },
      briefing,
      cached: false,
    };
  }

  async function getStatus(options: { force?: boolean } = {}): Promise<PolicyIntelBridgeStatusResult> {
    const force = options.force === true;
    const current = now();

    if (!force && config.statusCacheTtlMs > 0 && statusCache && statusCache.expiresAt > current) {
      return { ...statusCache.value, cached: true };
    }

    if (!force && statusInFlight) {
      const inFlight = await statusInFlight;
      return { ...inFlight, cached: true };
    }

    statusInFlight = loadStatus();
    try {
      const fresh = await statusInFlight;
      if (config.statusCacheTtlMs > 0) {
        statusCache = {
          value: { ...fresh, cached: false },
          expiresAt: now() + config.statusCacheTtlMs,
        };
      }
      return fresh;
    } finally {
      statusInFlight = null;
    }
  }

  async function getBriefing(options: { force?: boolean } = {}): Promise<PolicyIntelBridgeBriefingResult> {
    const force = options.force === true;
    const current = now();

    if (!force && config.briefingCacheTtlMs > 0 && briefingCache && briefingCache.expiresAt > current) {
      return { ...briefingCache.value, cached: true };
    }

    if (!force && briefingInFlight) {
      const inFlight = await briefingInFlight;
      return { ...inFlight, cached: true };
    }

    briefingInFlight = loadBriefing(force);
    try {
      const fresh = await briefingInFlight;
      if (config.briefingCacheTtlMs > 0) {
        briefingCache = {
          value: { ...fresh, cached: false },
          expiresAt: now() + config.briefingCacheTtlMs,
        };
      }
      return fresh;
    } finally {
      briefingInFlight = null;
    }
  }

  return {
    getStatus,
    getBriefing,
    clearCache() {
      statusCache = null;
      briefingCache = null;
    },
  };
}
