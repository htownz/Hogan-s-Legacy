export interface PolicyIntelBridgeConfig {
  baseUrl: string;
  requestTimeoutMs: number;
  apiToken?: string;
  statusCacheTtlMs: number;
  briefingCacheTtlMs: number;
  automationCacheTtlMs: number;
  automationTriggerCooldownMs: number;
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

export interface PolicyIntelBridgeAutomationStatusResult {
  source: "policy-intel";
  checkedAt: string;
  aiSupport: {
    providersConfigured: Array<"openai" | "anthropic">;
    briefingProvider: "anthropic" | "template";
    transcriptionProvider: "openai" | "unavailable";
    enhancedBriefingEnabled: boolean;
  };
  automation: {
    schedulerEnabled: boolean;
    intelBriefing: {
      enabled: boolean;
      cronExpression: string | null;
      running: boolean;
      runningSince: string | null;
      lastRun: {
        status: "success" | "error";
        finishedAt: string;
        durationMs: number;
      } | null;
      runCounts: {
        total: number;
        success: number;
        error: number;
        skippedWhileRunning: number;
      };
      consecutiveFailures: number;
      lastSuccessAt: string | null;
      lastErrorAt: string | null;
    };
    manualTriggerCooldownMs: number;
  };
  failures: Array<{ call: string; error: string }>;
  cached: boolean;
}

export interface PolicyIntelBridgeAutomationTriggerResult {
  source: "policy-intel";
  triggered: boolean;
  triggerAcceptedAt: string;
  cooldownMs: number;
  nextEligibleAt: string | null;
  record?: {
    jobName: string;
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    status: "success" | "error";
    summary: Record<string, unknown>;
    error?: string;
  };
  message?: string;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

interface EnvironmentStatusResponse {
  variables?: Array<{ key?: string; configured?: boolean }>;
}

interface SchedulerStatusResponse {
  enabled?: boolean;
  jobs?: Array<{
    name?: string;
    enabled?: boolean;
    cronExpression?: string;
    running?: boolean;
    runningSince?: string | null;
    lastRun?: {
      status?: "success" | "error";
      finishedAt?: string;
      durationMs?: number;
    } | null;
    runCounts?: {
      total?: number;
      success?: number;
      error?: number;
      skippedWhileRunning?: number;
    };
    consecutiveFailures?: number;
    lastSuccessAt?: string | null;
    lastErrorAt?: string | null;
  }>;
}

interface SchedulerTriggerResponse {
  jobName?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  status?: "success" | "error";
  summary?: Record<string, unknown>;
  error?: string;
}

type IntelBriefingAutomationState = PolicyIntelBridgeAutomationStatusResult["automation"]["intelBriefing"];

export function createPolicyIntelBridgeClient(
  config: PolicyIntelBridgeConfig,
  deps: { fetchImpl?: FetchLike; now?: () => number } = {},
) {
  const fetchImpl = deps.fetchImpl ?? (fetch as FetchLike);
  const now = deps.now ?? Date.now;
  const baseUrl = config.baseUrl.replace(/\/$/, "");

  let statusCache: CacheEntry<PolicyIntelBridgeStatusResult> | null = null;
  let briefingCache: CacheEntry<PolicyIntelBridgeBriefingResult> | null = null;
  let automationCache: CacheEntry<PolicyIntelBridgeAutomationStatusResult> | null = null;
  let statusInFlight: Promise<PolicyIntelBridgeStatusResult> | null = null;
  let briefingInFlight: Promise<PolicyIntelBridgeBriefingResult> | null = null;
  let automationInFlight: Promise<PolicyIntelBridgeAutomationStatusResult> | null = null;

  function headers() {
    const out: Record<string, string> = { Accept: "application/json" };
    if (config.apiToken?.trim()) {
      out.Authorization = `Bearer ${config.apiToken.trim()}`;
    }
    return out;
  }

  async function requestJson(
    path: string,
    options: {
      method?: "GET" | "POST";
      timeoutMs?: number;
    } = {},
  ) {
    const method = options.method ?? "GET";
    const timeoutMs = options.timeoutMs ?? config.requestTimeoutMs;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(`${baseUrl}${path}`, {
        method,
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

  async function fetchJson(path: string, timeoutMs = config.requestTimeoutMs) {
    return requestJson(path, { method: "GET", timeoutMs });
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

  function mapConfiguredProviders(environment: EnvironmentStatusResponse): Array<"openai" | "anthropic"> {
    const variables = Array.isArray(environment.variables) ? environment.variables : [];
    const hasOpenAi = variables.some((variable) => variable.key === "OPENAI_API_KEY" && variable.configured === true);
    const hasAnthropic = variables.some(
      (variable) => variable.key === "ANTHROPIC_API_KEY" && variable.configured === true,
    );

    const providers: Array<"openai" | "anthropic"> = [];
    if (hasOpenAi) providers.push("openai");
    if (hasAnthropic) providers.push("anthropic");
    return providers;
  }

  function mapIntelBriefingJob(scheduler: SchedulerStatusResponse): IntelBriefingAutomationState {
    const jobs = Array.isArray(scheduler.jobs) ? scheduler.jobs : [];
    const job = jobs.find((entry) => entry.name === "intel-briefing");

    return {
      enabled: Boolean(job?.enabled),
      cronExpression: typeof job?.cronExpression === "string" ? job.cronExpression : null,
      running: Boolean(job?.running),
      runningSince: typeof job?.runningSince === "string" ? job.runningSince : null,
      lastRun:
        job?.lastRun && typeof job.lastRun.finishedAt === "string"
          ? {
              status: job.lastRun.status === "error" ? "error" : "success",
              finishedAt: job.lastRun.finishedAt,
              durationMs: Number(job.lastRun.durationMs ?? 0),
            }
          : null,
      runCounts: {
        total: Number(job?.runCounts?.total ?? 0),
        success: Number(job?.runCounts?.success ?? 0),
        error: Number(job?.runCounts?.error ?? 0),
        skippedWhileRunning: Number(job?.runCounts?.skippedWhileRunning ?? 0),
      },
      consecutiveFailures: Number(job?.consecutiveFailures ?? 0),
      lastSuccessAt: typeof job?.lastSuccessAt === "string" ? job.lastSuccessAt : null,
      lastErrorAt: typeof job?.lastErrorAt === "string" ? job.lastErrorAt : null,
    };
  }

  async function loadAutomationStatus(): Promise<PolicyIntelBridgeAutomationStatusResult> {
    const calls = await Promise.allSettled([
      fetchJson("/api/intel/ops/environment", Math.min(config.requestTimeoutMs, 7000)),
      fetchJson("/api/intel/scheduler/status", config.requestTimeoutMs),
    ]);

    const environment = calls[0].status === "fulfilled" ? (calls[0].value as EnvironmentStatusResponse) : {};
    const scheduler = calls[1].status === "fulfilled" ? (calls[1].value as SchedulerStatusResponse) : {};
    const providers = mapConfiguredProviders(environment);
    const intelBriefing = mapIntelBriefingJob(scheduler);

    const failures = calls
      .map((result, idx) => ({ result, idx }))
      .filter((entry) => entry.result.status === "rejected")
      .map((entry) => ({
        call: ["environment", "scheduler"][entry.idx],
        error: String((entry.result as PromiseRejectedResult).reason?.message || (entry.result as PromiseRejectedResult).reason),
      }));

    return {
      source: "policy-intel",
      checkedAt: new Date(now()).toISOString(),
      aiSupport: {
        providersConfigured: providers,
        briefingProvider: providers.includes("anthropic") ? "anthropic" : "template",
        transcriptionProvider: providers.includes("openai") ? "openai" : "unavailable",
        enhancedBriefingEnabled: providers.includes("anthropic"),
      },
      automation: {
        schedulerEnabled: Boolean(scheduler.enabled),
        intelBriefing,
        manualTriggerCooldownMs: config.automationTriggerCooldownMs,
      },
      failures,
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

  async function getAutomationStatus(
    options: { force?: boolean } = {},
  ): Promise<PolicyIntelBridgeAutomationStatusResult> {
    const force = options.force === true;
    const current = now();

    if (!force && config.automationCacheTtlMs > 0 && automationCache && automationCache.expiresAt > current) {
      return { ...automationCache.value, cached: true };
    }

    if (!force && automationInFlight) {
      const inFlight = await automationInFlight;
      return { ...inFlight, cached: true };
    }

    automationInFlight = loadAutomationStatus();
    try {
      const fresh = await automationInFlight;
      if (config.automationCacheTtlMs > 0) {
        automationCache = {
          value: { ...fresh, cached: false },
          expiresAt: now() + config.automationCacheTtlMs,
        };
      }
      return fresh;
    } finally {
      automationInFlight = null;
    }
  }

  async function triggerIntelBriefingAutomation(
    options: { force?: boolean } = {},
  ): Promise<PolicyIntelBridgeAutomationTriggerResult> {
    const force = options.force === true;
    const triggerAcceptedAt = new Date(now()).toISOString();

    if (!force && config.automationTriggerCooldownMs > 0) {
      const status = await getAutomationStatus({ force: true });
      const lastRun = status.automation.intelBriefing.lastRun;
      if (status.automation.intelBriefing.running) {
        return {
          source: "policy-intel",
          triggered: false,
          triggerAcceptedAt,
          cooldownMs: config.automationTriggerCooldownMs,
          nextEligibleAt: null,
          message: "intel-briefing is already running",
        };
      }
      if (lastRun?.finishedAt) {
        const elapsed = now() - Date.parse(lastRun.finishedAt);
        if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < config.automationTriggerCooldownMs) {
          const nextEligibleAt = new Date(
            Date.parse(lastRun.finishedAt) + config.automationTriggerCooldownMs,
          ).toISOString();
          return {
            source: "policy-intel",
            triggered: false,
            triggerAcceptedAt,
            cooldownMs: config.automationTriggerCooldownMs,
            nextEligibleAt,
            message: "intel-briefing trigger skipped due to cooldown",
          };
        }
      }
    }

    const record = (await requestJson("/api/intel/scheduler/trigger/intel-briefing", {
      method: "POST",
      timeoutMs: Math.max(config.requestTimeoutMs, 30_000),
    })) as SchedulerTriggerResponse;

    statusCache = null;
    briefingCache = null;
    automationCache = null;

    return {
      source: "policy-intel",
      triggered: true,
      triggerAcceptedAt,
      cooldownMs: config.automationTriggerCooldownMs,
      nextEligibleAt: config.automationTriggerCooldownMs > 0
        ? new Date(now() + config.automationTriggerCooldownMs).toISOString()
        : null,
      record: {
        jobName: String(record.jobName ?? "intel-briefing"),
        startedAt: String(record.startedAt ?? triggerAcceptedAt),
        finishedAt: String(record.finishedAt ?? triggerAcceptedAt),
        durationMs: Number(record.durationMs ?? 0),
        status: record.status === "error" ? "error" : "success",
        summary: record.summary ?? {},
        error: typeof record.error === "string" ? record.error : undefined,
      },
    };
  }

  return {
    getStatus,
    getBriefing,
    getAutomationStatus,
    triggerIntelBriefingAutomation,
    clearCache() {
      statusCache = null;
      briefingCache = null;
      automationCache = null;
    },
  };
}
