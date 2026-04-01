export interface PolicyIntelBridgeConfig {
  baseUrl: string;
  requestTimeoutMs: number;
  apiToken?: string;
  statusCacheTtlMs: number;
  briefingCacheTtlMs: number;
  automationCacheTtlMs: number;
  automationEventsCacheTtlMs: number;
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

export interface PolicyIntelBridgeAutomationEventsResult {
  source: "policy-intel";
  generatedAt: string;
  jobs: string[];
  statusFilter: "all" | "success" | "error";
  events: Array<{
    eventId: string;
    source: "scheduler-history";
    jobName: string;
    status: "success" | "error";
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    summary: Record<string, unknown>;
    error?: string;
  }>;
  failures: Array<{ call: string; error: string }>;
  cached: boolean;
}

export interface PolicyIntelBridgeAutomationJobsResult {
  source: "policy-intel";
  generatedAt: string;
  schedulerEnabled: boolean;
  jobs: Array<{
    name: string;
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
  }>;
  failures: Array<{ call: string; error: string }>;
  cached: boolean;
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

interface SchedulerHistoryRecordResponse {
  jobName?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  status?: "success" | "error";
  summary?: Record<string, unknown>;
  error?: string;
}

type IntelBriefingAutomationState = PolicyIntelBridgeAutomationStatusResult["automation"]["intelBriefing"];

const SUPPORTED_AUTOMATION_JOBS = new Set([
  "legiscan-recent",
  "tlo-rss",
  "local-feeds",
  "tec-sweep",
  "intel-briefing",
  "committee-intel-sync",
]);

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
  let automationJobsCache: CacheEntry<PolicyIntelBridgeAutomationJobsResult> | null = null;
  const automationEventsCache = new Map<string, CacheEntry<PolicyIntelBridgeAutomationEventsResult>>();
  let statusInFlight: Promise<PolicyIntelBridgeStatusResult> | null = null;
  let briefingInFlight: Promise<PolicyIntelBridgeBriefingResult> | null = null;
  let automationInFlight: Promise<PolicyIntelBridgeAutomationStatusResult> | null = null;
  let automationJobsInFlight: Promise<PolicyIntelBridgeAutomationJobsResult> | null = null;
  const automationEventsInFlight = new Map<string, Promise<PolicyIntelBridgeAutomationEventsResult>>();

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

  async function loadAutomationJobs(): Promise<PolicyIntelBridgeAutomationJobsResult> {
    const calls = await Promise.allSettled([
      fetchJson("/api/intel/scheduler/status", config.requestTimeoutMs),
    ]);

    const scheduler = calls[0].status === "fulfilled" ? (calls[0].value as SchedulerStatusResponse) : {};
    const jobs = (Array.isArray(scheduler.jobs) ? scheduler.jobs : [])
      .filter((job) => typeof job.name === "string" && SUPPORTED_AUTOMATION_JOBS.has(job.name))
      .map((job) => ({
        name: String(job.name),
        enabled: Boolean(job.enabled),
        cronExpression: typeof job.cronExpression === "string" ? job.cronExpression : null,
        running: Boolean(job.running),
        runningSince: typeof job.runningSince === "string" ? job.runningSince : null,
        lastRun:
          job.lastRun && typeof job.lastRun.finishedAt === "string"
            ? {
                status: job.lastRun.status === "error" ? "error" as const : "success" as const,
                finishedAt: job.lastRun.finishedAt,
                durationMs: Number(job.lastRun.durationMs ?? 0),
              }
            : null,
        runCounts: {
          total: Number(job.runCounts?.total ?? 0),
          success: Number(job.runCounts?.success ?? 0),
          error: Number(job.runCounts?.error ?? 0),
          skippedWhileRunning: Number(job.runCounts?.skippedWhileRunning ?? 0),
        },
        consecutiveFailures: Number(job.consecutiveFailures ?? 0),
        lastSuccessAt: typeof job.lastSuccessAt === "string" ? job.lastSuccessAt : null,
        lastErrorAt: typeof job.lastErrorAt === "string" ? job.lastErrorAt : null,
      }))
      .sort((left, right) => left.name.localeCompare(right.name));

    const failures = calls
      .map((result, idx) => ({ result, idx }))
      .filter((entry) => entry.result.status === "rejected")
      .map((entry) => ({
        call: ["scheduler"][entry.idx],
        error: String((entry.result as PromiseRejectedResult).reason?.message || (entry.result as PromiseRejectedResult).reason),
      }));

    return {
      source: "policy-intel",
      generatedAt: new Date(now()).toISOString(),
      schedulerEnabled: Boolean(scheduler.enabled),
      jobs,
      failures,
      cached: false,
    };
  }

  async function loadAutomationEvents(
    jobs: string[],
    limit: number,
    statusFilter: "all" | "success" | "error",
  ): Promise<PolicyIntelBridgeAutomationEventsResult> {
    const history = (await fetchJson("/api/intel/scheduler/history", config.requestTimeoutMs)) as SchedulerHistoryRecordResponse[];
    const historyRows = Array.isArray(history) ? history : [];
    const jobSet = new Set(jobs);

    const events = historyRows
      .filter((row) => {
        const jobName = typeof row.jobName === "string" ? row.jobName : "";
        if (!jobSet.has(jobName) || typeof row.finishedAt !== "string") {
          return false;
        }
        if (statusFilter === "all") {
          return true;
        }
        return row.status === statusFilter;
      })
      .sort((left, right) => Date.parse(String(right.finishedAt ?? "")) - Date.parse(String(left.finishedAt ?? "")))
      .slice(0, limit)
      .map((row) => {
        const jobName = String(row.jobName ?? "unknown");
        const finishedAt = String(row.finishedAt ?? "");
        const status: "success" | "error" = row.status === "error" ? "error" : "success";
        return {
          eventId: `${jobName}|${finishedAt}|${status}`,
          source: "scheduler-history" as const,
          jobName,
          status,
          startedAt: String(row.startedAt ?? finishedAt),
          finishedAt,
          durationMs: Number(row.durationMs ?? 0),
          summary: row.summary ?? {},
          error: typeof row.error === "string" ? row.error : undefined,
        };
      });

    return {
      source: "policy-intel",
      generatedAt: new Date(now()).toISOString(),
      jobs,
      statusFilter,
      events,
      failures: [],
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

  async function getAutomationJobs(options: { force?: boolean } = {}): Promise<PolicyIntelBridgeAutomationJobsResult> {
    const force = options.force === true;
    const current = now();

    if (!force && config.automationCacheTtlMs > 0 && automationJobsCache && automationJobsCache.expiresAt > current) {
      return { ...automationJobsCache.value, cached: true };
    }

    if (!force && automationJobsInFlight) {
      const inFlight = await automationJobsInFlight;
      return { ...inFlight, cached: true };
    }

    automationJobsInFlight = loadAutomationJobs();
    try {
      const fresh = await automationJobsInFlight;
      if (config.automationCacheTtlMs > 0) {
        automationJobsCache = {
          value: { ...fresh, cached: false },
          expiresAt: now() + config.automationCacheTtlMs,
        };
      }
      return fresh;
    } finally {
      automationJobsInFlight = null;
    }
  }

  async function getAutomationEvents(
    options: {
      force?: boolean;
      limit?: number;
      jobs?: string[];
      status?: "all" | "success" | "error";
    } = {},
  ): Promise<PolicyIntelBridgeAutomationEventsResult> {
    const force = options.force === true;
    const limit = Math.max(1, Math.min(25, Number(options.limit ?? 8)));
    const statusFilter = options.status === "success" || options.status === "error" ? options.status : "all";
    const jobs = Array.isArray(options.jobs) && options.jobs.length > 0
      ? Array.from(new Set(options.jobs.map((job) => String(job).trim()).filter(Boolean)))
      : ["intel-briefing"];
    const cacheKey = `${jobs.slice().sort().join(",")}|${limit}|${statusFilter}`;
    const current = now();

    const cached = automationEventsCache.get(cacheKey);
    if (!force && config.automationEventsCacheTtlMs > 0 && cached && cached.expiresAt > current) {
      return { ...cached.value, cached: true };
    }

    const inFlight = automationEventsInFlight.get(cacheKey);
    if (!force && inFlight) {
      const result = await inFlight;
      return { ...result, cached: true };
    }

    const loader = loadAutomationEvents(jobs, limit, statusFilter);
    automationEventsInFlight.set(cacheKey, loader);

    try {
      const fresh = await loader;
      if (config.automationEventsCacheTtlMs > 0) {
        automationEventsCache.set(cacheKey, {
          value: { ...fresh, cached: false },
          expiresAt: now() + config.automationEventsCacheTtlMs,
        });
      }
      return fresh;
    } finally {
      automationEventsInFlight.delete(cacheKey);
    }
  }

  async function triggerIntelBriefingAutomation(
    options: { force?: boolean } = {},
  ): Promise<PolicyIntelBridgeAutomationTriggerResult> {
    return triggerAutomationJob("intel-briefing", options);
  }

  async function triggerAutomationJob(
    jobName: string,
    options: { force?: boolean } = {},
  ): Promise<PolicyIntelBridgeAutomationTriggerResult> {
    const normalizedJobName = String(jobName || "").trim();
    if (!SUPPORTED_AUTOMATION_JOBS.has(normalizedJobName)) {
      throw new Error(
        `Unsupported automation job \"${normalizedJobName}\". Allowed: ${Array.from(SUPPORTED_AUTOMATION_JOBS).join(", ")}`,
      );
    }

    const force = options.force === true;
    const triggerAcceptedAt = new Date(now()).toISOString();

    if (!force && config.automationTriggerCooldownMs > 0) {
      const schedulerStatus = (await fetchJson("/api/intel/scheduler/status", config.requestTimeoutMs)) as SchedulerStatusResponse;
      const jobs = Array.isArray(schedulerStatus.jobs) ? schedulerStatus.jobs : [];
      const job = jobs.find((entry) => entry.name === normalizedJobName);
      const lastRun =
        job?.lastRun && typeof job.lastRun.finishedAt === "string"
          ? {
              finishedAt: job.lastRun.finishedAt,
            }
          : null;

      if (job?.running === true) {
        return {
          source: "policy-intel",
          triggered: false,
          triggerAcceptedAt,
          cooldownMs: config.automationTriggerCooldownMs,
          nextEligibleAt: null,
          message: `${normalizedJobName} is already running`,
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
            message: `${normalizedJobName} trigger skipped due to cooldown`,
          };
        }
      }
    }

    const record = (await requestJson(`/api/intel/scheduler/trigger/${encodeURIComponent(normalizedJobName)}`, {
      method: "POST",
      timeoutMs: Math.max(config.requestTimeoutMs, 30_000),
    })) as SchedulerTriggerResponse;

    statusCache = null;
    briefingCache = null;
    automationCache = null;
    automationJobsCache = null;
    automationEventsCache.clear();

    return {
      source: "policy-intel",
      triggered: true,
      triggerAcceptedAt,
      cooldownMs: config.automationTriggerCooldownMs,
      nextEligibleAt: config.automationTriggerCooldownMs > 0
        ? new Date(now() + config.automationTriggerCooldownMs).toISOString()
        : null,
      record: {
        jobName: String(record.jobName ?? normalizedJobName),
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
    getAutomationJobs,
    getAutomationEvents,
    triggerIntelBriefingAutomation,
    triggerAutomationJob,
    clearCache() {
      statusCache = null;
      briefingCache = null;
      automationCache = null;
      automationJobsCache = null;
      automationEventsCache.clear();
    },
  };
}
