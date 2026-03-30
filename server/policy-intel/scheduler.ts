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
import { runLegiscanJob, type RunLegiscanResult } from "./jobs/run-legiscan";
import { runTloRssJob, type RunTloRssResult } from "./jobs/run-tlo-rss";
import { runLocalFeedsJob, type RunLocalFeedsResult } from "./jobs/run-local-feeds";
import { runTecImportJob, type RunTecResult } from "./jobs/run-tec";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ScheduledJobConfig {
  name: string;
  cronExpression: string;
  enabled: boolean;
  task: cron.ScheduledTask | null;
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
    lastRun: JobRunRecord | null;
    nextRun: string | null;
  }>;
  recentHistory: JobRunRecord[];
}

// ── State ────────────────────────────────────────────────────────────────────

const jobs = new Map<string, ScheduledJobConfig>();
const runningFlags = new Map<string, boolean>();
const lastRuns = new Map<string, JobRunRecord>();
const history: JobRunRecord[] = [];
const MAX_HISTORY = 50;

let schedulerEnabled = false;
let schedulerStartedAt: string | null = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function pushHistory(record: JobRunRecord) {
  history.unshift(record);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  lastRuns.set(record.jobName, record);
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

async function executeJob(
  jobName: string,
  runner: () => Promise<Record<string, unknown>>,
) {
  if (runningFlags.get(jobName)) {
    console.log(`[scheduler] ${jobName} already running – skipping`);
    return;
  }

  runningFlags.set(jobName, true);
  const start = Date.now();
  const startedAt = new Date().toISOString();

  try {
    console.log(`[scheduler] ▶ starting ${jobName}`);
    const result = await runner();
    const record: JobRunRecord = {
      jobName,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
      status: "success",
      summary: result,
    };
    pushHistory(record);
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
    console.error(`[scheduler] ✗ ${jobName} failed: ${record.error}`);
  } finally {
    runningFlags.set(jobName, false);
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

  const legiscanCron = process.env.CRON_LEGISCAN ?? "0 */4 * * *";  // every 4 hours
  const tloCron = process.env.CRON_TLO_RSS ?? "0 1,7,13,19 * * *"; // 4x daily
  const localCron = process.env.CRON_LOCAL_FEEDS ?? "0 2,8,14,20 * * *"; // 4x daily
  const tecCron = process.env.CRON_TEC_SWEEP ?? "0 3 * * *"; // daily at 3 AM

  // Register jobs
  const jobDefs: Array<{ name: string; cron: string; fn: () => Promise<Record<string, unknown>> }> = [
    { name: "legiscan-recent", cron: legiscanCron, fn: legiscanRecent },
    { name: "tlo-rss", cron: tloCron, fn: tloRss },
    { name: "local-feeds", cron: localCron, fn: localFeeds },
    { name: "tec-sweep", cron: tecCron, fn: tecSweep },
  ];

  for (const def of jobDefs) {
    if (!cron.validate(def.cron)) {
      console.error(`[scheduler] invalid cron expression for ${def.name}: ${def.cron}`);
      continue;
    }

    const task = cron.schedule(def.cron, () => {
      executeJob(def.name, def.fn);
    });

    jobs.set(def.name, {
      name: def.name,
      cronExpression: def.cron,
      enabled: true,
      task,
    });

    runningFlags.set(def.name, false);
    console.log(`[scheduler] registered ${def.name} → ${def.cron}`);
  }

  console.log(`[scheduler] started with ${jobs.size} jobs`);
}

export function stopScheduler() {
  jobs.forEach((job) => {
    job.task?.stop();
    job.enabled = false;
  });
  schedulerEnabled = false;
  console.log("[scheduler] stopped all jobs");
}

export function getSchedulerStatus(): SchedulerStatus {
  const jobStatuses = Array.from(jobs.values()).map((j) => ({
    name: j.name,
    cronExpression: j.cronExpression,
    enabled: j.enabled,
    running: runningFlags.get(j.name) ?? false,
    lastRun: lastRuns.get(j.name) ?? null,
    nextRun: getNextRun(j.cronExpression),
  }));

  return {
    enabled: schedulerEnabled,
    startedAt: schedulerStartedAt,
    jobs: jobStatuses,
    recentHistory: history.slice(0, 20),
  };
}

/** Manually trigger a scheduled job (runs immediately, outside cron). */
export async function triggerJob(jobName: string): Promise<JobRunRecord | null> {
  const runners: Record<string, () => Promise<Record<string, unknown>>> = {
    "legiscan-recent": legiscanRecent,
    "tlo-rss": tloRss,
    "local-feeds": localFeeds,
    "tec-sweep": tecSweep,
  };

  const runner = runners[jobName];
  if (!runner) return null;

  await executeJob(jobName, runner);
  return lastRuns.get(jobName) ?? null;
}

export function getJobHistory(): JobRunRecord[] {
  return [...history];
}
