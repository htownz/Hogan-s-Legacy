/**
 * Scheduler: automated job orchestration via node-cron.
 *
 * Default schedules (overridable via env vars):
 *  - LegiScan "recent" mode: every 4 hours   (CRON_LEGISCAN)
 *  - TLO RSS feeds:          every 6 hours    (CRON_TLO_RSS)
 *  - Local feeds:            every 6 hours    (CRON_LOCAL_FEEDS)
 *  - TEC sweep:              daily at 3 AM    (CRON_TEC_SWEEP)
 *
 * Set SCHEDULER_ENABLED=false in .env to disable all scheduled jobs.
 */
import cron from "node-cron";
import { queryClient } from "./db";
import { runSwarm } from "./engine/intelligence/swarm-coordinator";
import { runLegiscanJob, type RunLegiscanResult } from "./jobs/run-legiscan";
import { runTloRssJob, type RunTloRssResult } from "./jobs/run-tlo-rss";
import { runLocalFeedsJob, type RunLocalFeedsResult } from "./jobs/run-local-feeds";
import { runTecImportJob, type RunTecResult } from "./jobs/run-tec";
import { syncCommitteeIntelAutoIngestSessions } from "./services/committee-intel-service";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScheduledJobConfig {
  name: string;
  cronExpression: string;
  enabled: boolean;
  task: cron.ScheduledTask | null;
}

interface JobDefinition {
  name: string;
  cron: string;
  fn: () => Promise<Record<string, unknown>>;
  timeoutMs: number;
  enabled?: boolean;
}

export interface JobRunRecord {
  jobName: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: "success" | "error";
  summary: Record<string, unknown>;
  error?: string;
}

export interface SchedulerStatus {
  enabled: boolean;
  startedAt: string | null;
  jobs: Array<{
    name: string;
    cronExpression: string;
    enabled: boolean;
    running: boolean;
    runningSince: string | null;
    lastRun: JobRunRecord | null;
    runCounts: {
      total: number;
      success: number;
      error: number;
      skippedWhileRunning: number;
    };
    consecutiveFailures: number;
    lastSuccessAt: string | null;
    lastErrorAt: string | null;
    nextRun: string | null;
  }>;
  recentHistory: JobRunRecord[];
}

interface JobTelemetry {
  totalRuns: number;
  successRuns: number;
  errorRuns: number;
  skippedWhileRunning: number;
  consecutiveFailures: number;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
}

// ── State ────────────────────────────────────────────────────────────────────

const jobs = new Map<string, ScheduledJobConfig>();
const runningFlags = new Map<string, boolean>();
const runningSince = new Map<string, string | null>();
const lastRuns = new Map<string, JobRunRecord>();
const jobTelemetry = new Map<string, JobTelemetry>();
const history: JobRunRecord[] = [];
const persistedHistory: JobRunRecord[] = [];
const MAX_HISTORY = 50;
const MAX_PERSISTED_HISTORY = 500;
const DEFAULT_JOB_TIMEOUT_MS = Number(process.env.SCHEDULER_JOB_TIMEOUT_MS || 20 * 60 * 1000);
const DEFAULT_INTEL_BRIEFING_TIMEOUT_MS = Number(
  process.env.SCHEDULER_INTEL_BRIEFING_TIMEOUT_MS || 15 * 60 * 1000,
);
const DEFAULT_COMMITTEE_INTEL_SYNC_TIMEOUT_MS = Number(
  process.env.SCHEDULER_COMMITTEE_INTEL_SYNC_TIMEOUT_MS || 5 * 60 * 1000,
);

let schedulerEnabled = false;
let schedulerStartedAt: string | null = null;
let persistenceInitialized = false;
let persistenceEnabled = false;

// ── Helpers ──────────────────────────────────────────────────────────────────

function pushHistory(record: JobRunRecord) {
  history.unshift(record);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  lastRuns.set(record.jobName, record);

  const telemetry = jobTelemetry.get(record.jobName) ?? {
    totalRuns: 0,
    successRuns: 0,
    errorRuns: 0,
    skippedWhileRunning: 0,
    consecutiveFailures: 0,
    lastSuccessAt: null,
    lastErrorAt: null,
  };

  telemetry.totalRuns += 1;
  if (record.status === "success") {
    telemetry.successRuns += 1;
    telemetry.consecutiveFailures = 0;
    telemetry.lastSuccessAt = record.finishedAt;
  } else {
    telemetry.errorRuns += 1;
    telemetry.consecutiveFailures += 1;
    telemetry.lastErrorAt = record.finishedAt;
  }

  jobTelemetry.set(record.jobName, telemetry);
}

function mapPersistedRow(row: Record<string, unknown>): JobRunRecord {
  const toIso = (value: unknown): string => {
    if (value instanceof Date) return value.toISOString();
    const text = String(value ?? "");
    const parsed = new Date(text);
    return Number.isNaN(parsed.getTime()) ? text : parsed.toISOString();
  };

  const summaryRaw = row.summary_json;
  const summary =
    summaryRaw && typeof summaryRaw === "object" && !Array.isArray(summaryRaw)
      ? (summaryRaw as Record<string, unknown>)
      : {};
  return {
    jobName: String(row.job_name ?? "unknown"),
    startedAt: toIso(row.started_at),
    finishedAt: toIso(row.finished_at),
    durationMs: Number(row.duration_ms ?? 0),
    status: row.status === "error" ? "error" : "success",
    summary,
    error: row.error ? String(row.error) : undefined,
  };
}

function mergeHistoryRecords(): JobRunRecord[] {
  const deduped = new Map<string, JobRunRecord>();
  for (const record of [...history, ...persistedHistory]) {
    const key = `${record.jobName}|${record.startedAt}|${record.finishedAt}`;
    if (!deduped.has(key)) {
      deduped.set(key, record);
    }
  }

  return Array.from(deduped.values())
    .sort((left, right) => {
      const rightTs = Date.parse(right.finishedAt) || 0;
      const leftTs = Date.parse(left.finishedAt) || 0;
      return rightTs - leftTs;
    })
    .slice(0, MAX_PERSISTED_HISTORY);
}

async function initializeHistoryPersistence(): Promise<void> {
  if (persistenceInitialized) return;
  persistenceInitialized = true;

  try {
    await queryClient.unsafe(`
      create table if not exists policy_intel_scheduler_runs (
        id serial primary key,
        job_name varchar(128) not null,
        started_at timestamptz not null,
        finished_at timestamptz not null,
        duration_ms integer not null,
        status varchar(16) not null,
        summary_json jsonb not null default '{}'::jsonb,
        error text,
        created_at timestamptz not null default now()
      )
    `);
    await queryClient.unsafe(`
      create index if not exists policy_intel_scheduler_runs_finished_idx
      on policy_intel_scheduler_runs (finished_at desc)
    `);
    await queryClient.unsafe(`
      create index if not exists policy_intel_scheduler_runs_job_finished_idx
      on policy_intel_scheduler_runs (job_name, finished_at desc)
    `);

    const rows = await queryClient.unsafe(
      `
      select
        job_name,
        started_at,
        finished_at,
        duration_ms,
        status,
        summary_json,
        error
      from policy_intel_scheduler_runs
      order by finished_at desc
      limit $1
      `,
      [MAX_PERSISTED_HISTORY],
    );

    persistedHistory.length = 0;
    persistedHistory.push(...rows.map((row: Record<string, unknown>) => mapPersistedRow(row)));
    persistenceEnabled = true;
  } catch (error: any) {
    persistenceEnabled = false;
    console.warn(`[scheduler] persistent history disabled: ${error?.message ?? String(error)}`);
  }
}

async function persistHistoryRecord(record: JobRunRecord): Promise<void> {
  if (!persistenceEnabled) return;

  try {
    await queryClient.unsafe(
      `
      insert into policy_intel_scheduler_runs (
        job_name,
        started_at,
        finished_at,
        duration_ms,
        status,
        summary_json,
        error
      )
      values ($1, $2, $3, $4, $5, $6::jsonb, $7)
      `,
      [
        record.jobName,
        record.startedAt,
        record.finishedAt,
        record.durationMs,
        record.status,
        JSON.stringify(record.summary ?? {}),
        record.error ?? null,
      ],
    );

    persistedHistory.unshift(record);
    if (persistedHistory.length > MAX_PERSISTED_HISTORY) {
      persistedHistory.length = MAX_PERSISTED_HISTORY;
    }
  } catch (error: any) {
    console.warn(`[scheduler] failed to persist run history: ${error?.message ?? String(error)}`);
  }
}

function getOrCreateTelemetry(jobName: string): JobTelemetry {
  const existing = jobTelemetry.get(jobName);
  if (existing) return existing;

  const created: JobTelemetry = {
    totalRuns: 0,
    successRuns: 0,
    errorRuns: 0,
    skippedWhileRunning: 0,
    consecutiveFailures: 0,
    lastSuccessAt: null,
    lastErrorAt: null,
  };
  jobTelemetry.set(jobName, created);
  return created;
}

function getNextRun(cronExpr: string): string | null {
  try {
    // node-cron doesn't have a built-in "next run" API, so we compute a rough estimate
    const interval = cron.validate(cronExpr) ? cronExpr : null;
    if (!interval) return null;
    // Return a placeholder; the cron expression itself is the best indicator
    return `cron: ${cronExpr}`;
  } catch {
    return null;
  }
}

function normaliseTimeoutMs(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

async function withTimeout<T>(
  jobName: string,
  timeoutMs: number,
  runner: () => Promise<T>,
): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`${jobName} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    timeoutHandle.unref?.();
  });

  try {
    return await Promise.race([runner(), timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

async function executeJob(
  jobName: string,
  runner: () => Promise<Record<string, unknown>>,
  timeoutMs = DEFAULT_JOB_TIMEOUT_MS,
) {
  if (!persistenceInitialized) {
    await initializeHistoryPersistence();
  }

  if (runningFlags.get(jobName)) {
    const telemetry = getOrCreateTelemetry(jobName);
    telemetry.skippedWhileRunning += 1;
    console.log(`[scheduler] ${jobName} already running – skipping`);
    return;
  }

  runningFlags.set(jobName, true);
  const start = Date.now();
  const startedAt = new Date().toISOString();
  runningSince.set(jobName, startedAt);

  try {
    console.log(`[scheduler] ▶ starting ${jobName}`);
    const result = await withTimeout(jobName, timeoutMs, runner);
    const record: JobRunRecord = {
      jobName,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      status: "success",
      summary: result,
    };
    pushHistory(record);
    await persistHistoryRecord(record);
    console.log(`[scheduler] ✓ ${jobName} completed in ${record.durationMs}ms`);
  } catch (err: any) {
    const record: JobRunRecord = {
      jobName,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      status: "error",
      summary: {},
      error: err?.message ?? String(err),
    };
    pushHistory(record);
    await persistHistoryRecord(record);
    console.error(`[scheduler] ✗ ${jobName} failed: ${record.error}`);
  } finally {
    runningFlags.set(jobName, false);
    runningSince.set(jobName, null);
  }
}

// ── Job wrappers ─────────────────────────────────────────────────────────────

async function legiscanRecent(): Promise<Record<string, unknown>> {
  const r: RunLegiscanResult = await runLegiscanJob({ mode: "recent", sinceDays: 7 });
  return {
    mode: r.mode,
    sessionName: r.sessionName,
    fetched: r.fetched,
    inserted: r.inserted,
    skipped: r.skipped,
    alertsCreated: r.alerts.created,
    errors: r.fetchErrors.length + r.upsertErrors.length,
  };
}

async function tloRss(): Promise<Record<string, unknown>> {
  const r: RunTloRssResult = await runTloRssJob();
  return {
    feedsAttempted: r.feedsAttempted,
    totalFetched: r.totalFetched,
    inserted: r.inserted,
    skipped: r.skipped,
    alertsCreated: r.alerts.created,
    feedErrors: r.feedErrors.length,
  };
}

async function localFeeds(): Promise<Record<string, unknown>> {
  const r: RunLocalFeedsResult = await runLocalFeedsJob();
  return {
    feedsAttempted: r.feedsAttempted,
    totalFetched: r.totalFetched,
    inserted: r.inserted,
    skipped: r.skipped,
    alertsCreated: r.alerts.created,
    feedErrors: r.feedErrors.length,
  };
}

async function tecSweep(): Promise<Record<string, unknown>> {
  const r: RunTecResult = await runTecImportJob({ mode: "sweep", workspaceId: 2 });
  return {
    mode: r.mode,
    searchTerms: r.searchTerms.length,
    stakeholdersCreated: r.stakeholdersCreated,
    stakeholdersExisting: r.stakeholdersExisting,
    sourceDocsInserted: r.sourceDocsInserted,
    sourceDocsSkipped: r.sourceDocsSkipped,
    observationsCreated: r.observationsCreated,
    errors: r.errors.length,
  };
}

async function intelligenceBriefing(): Promise<Record<string, unknown>> {
  const briefing = await runSwarm();
  return {
    generatedAt: briefing.generatedAt,
    analysisTimeMs: briefing.analysisTimeMs,
    insights: briefing.insights.length,
    criticalRisks: briefing.risk.criticalRisks.length,
    anomalies: briefing.anomalies.anomalies.length,
    forecastHistoryDepth: briefing.forecast.historyDepth,
    threatTrend: briefing.delta.threatTrend,
  };
}

async function committeeIntelSync(): Promise<Record<string, unknown>> {
  return syncCommitteeIntelAutoIngestSessions();
}

// ── Public API ───────────────────────────────────────────────────────────────

export function startScheduler() {
  const enabled = process.env.SCHEDULER_ENABLED !== "false";
  if (!enabled) {
    console.log("[scheduler] disabled via SCHEDULER_ENABLED=false");
    schedulerEnabled = false;
    return;
  }

  schedulerEnabled = true;
  schedulerStartedAt = new Date().toISOString();
  void initializeHistoryPersistence();

  const legiscanCron = process.env.CRON_LEGISCAN ?? "0 */4 * * *";  // every 4 hours
  const tloCron = process.env.CRON_TLO_RSS ?? "0 1,7,13,19 * * *"; // 4x daily
  const localCron = process.env.CRON_LOCAL_FEEDS ?? "0 2,8,14,20 * * *"; // 4x daily
  const tecCron = process.env.CRON_TEC_SWEEP ?? "0 3 * * *"; // daily at 3 AM
  const intelBriefingCron = process.env.CRON_INTEL_BRIEFING ?? "30 */6 * * *"; // every 6 hours
  const intelBriefingEnabled = process.env.SCHEDULER_INTEL_BRIEFING !== "false";
  const committeeIntelSyncCron = process.env.CRON_COMMITTEE_INTEL_SYNC ?? "*/2 * * * *"; // every 2 minutes
  const committeeIntelSyncEnabled = process.env.SCHEDULER_COMMITTEE_INTEL_SYNC !== "false";

  // Register jobs
  const jobDefs: JobDefinition[] = [
    {
      name: "legiscan-recent",
      cron: legiscanCron,
      fn: legiscanRecent,
      timeoutMs: normaliseTimeoutMs(Number(process.env.SCHEDULER_LEGISCAN_TIMEOUT_MS), DEFAULT_JOB_TIMEOUT_MS),
    },
    {
      name: "tlo-rss",
      cron: tloCron,
      fn: tloRss,
      timeoutMs: normaliseTimeoutMs(Number(process.env.SCHEDULER_TLO_RSS_TIMEOUT_MS), DEFAULT_JOB_TIMEOUT_MS),
    },
    {
      name: "local-feeds",
      cron: localCron,
      fn: localFeeds,
      timeoutMs: normaliseTimeoutMs(Number(process.env.SCHEDULER_LOCAL_FEEDS_TIMEOUT_MS), DEFAULT_JOB_TIMEOUT_MS),
    },
    {
      name: "tec-sweep",
      cron: tecCron,
      fn: tecSweep,
      timeoutMs: normaliseTimeoutMs(Number(process.env.SCHEDULER_TEC_TIMEOUT_MS), DEFAULT_JOB_TIMEOUT_MS),
    },
    {
      name: "intel-briefing",
      cron: intelBriefingCron,
      fn: intelligenceBriefing,
      timeoutMs: normaliseTimeoutMs(
        Number(process.env.SCHEDULER_INTEL_BRIEFING_TIMEOUT_MS),
        DEFAULT_INTEL_BRIEFING_TIMEOUT_MS,
      ),
      enabled: intelBriefingEnabled,
    },
    {
      name: "committee-intel-sync",
      cron: committeeIntelSyncCron,
      fn: committeeIntelSync,
      timeoutMs: normaliseTimeoutMs(
        Number(process.env.SCHEDULER_COMMITTEE_INTEL_SYNC_TIMEOUT_MS),
        DEFAULT_COMMITTEE_INTEL_SYNC_TIMEOUT_MS,
      ),
      enabled: committeeIntelSyncEnabled,
    },
  ];

  for (const def of jobDefs) {
    if (def.enabled === false) {
      console.log(`[scheduler] skipped ${def.name} → disabled`);
      continue;
    }

    if (!cron.validate(def.cron)) {
      console.error(`[scheduler] invalid cron expression for ${def.name}: ${def.cron}`);
      continue;
    }

    const task = cron.schedule(def.cron, () => {
      void executeJob(def.name, def.fn, def.timeoutMs);
    });

    jobs.set(def.name, {
      name: def.name,
      cronExpression: def.cron,
      enabled: true,
      task,
    });

    runningFlags.set(def.name, false);
    runningSince.set(def.name, null);
    getOrCreateTelemetry(def.name);
    console.log(`[scheduler] registered ${def.name} → ${def.cron}`);
  }

  console.log(`[scheduler] started with ${jobs.size} jobs`);
}

export function stopScheduler() {
  jobs.forEach((job) => {
    job.task?.stop();
    job.enabled = false;
  });
  runningSince.forEach((_value, key) => {
    runningSince.set(key, null);
  });
  schedulerEnabled = false;
  console.log("[scheduler] stopped all jobs");
}

export function getSchedulerStatus(): SchedulerStatus {
  const jobStatuses = Array.from(jobs.values()).map((j) => ({
    ...(() => {
      const telemetry = getOrCreateTelemetry(j.name);
      return {
        runCounts: {
          total: telemetry.totalRuns,
          success: telemetry.successRuns,
          error: telemetry.errorRuns,
          skippedWhileRunning: telemetry.skippedWhileRunning,
        },
        consecutiveFailures: telemetry.consecutiveFailures,
        lastSuccessAt: telemetry.lastSuccessAt,
        lastErrorAt: telemetry.lastErrorAt,
      };
    })(),
    name: j.name,
    cronExpression: j.cronExpression,
    enabled: j.enabled,
    running: runningFlags.get(j.name) ?? false,
    runningSince: runningSince.get(j.name) ?? null,
    lastRun: lastRuns.get(j.name) ?? null,
    nextRun: getNextRun(j.cronExpression),
  }));

  return {
    enabled: schedulerEnabled,
    startedAt: schedulerStartedAt,
    jobs: jobStatuses,
    recentHistory: mergeHistoryRecords().slice(0, 20),
  };
}

/** Manually trigger a scheduled job (runs immediately, outside cron). */
export async function triggerJob(jobName: string): Promise<JobRunRecord | null> {
  const runners: Record<string, () => Promise<Record<string, unknown>>> = {
    "legiscan-recent": legiscanRecent,
    "tlo-rss": tloRss,
    "local-feeds": localFeeds,
    "tec-sweep": tecSweep,
    "intel-briefing": intelligenceBriefing,
    "committee-intel-sync": committeeIntelSync,
  };

  const runner = runners[jobName];
  if (!runner) return null;

  await executeJob(jobName, runner);
  return lastRuns.get(jobName) ?? null;
}

export function getJobHistory(): JobRunRecord[] {
  return mergeHistoryRecords();
}
