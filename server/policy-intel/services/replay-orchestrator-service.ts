import { and, asc, desc, eq } from "drizzle-orm";
import { policyIntelDb, queryClient } from "../db";
import { replayChunks, replayRuns } from "@shared/schema-policy-intel";
import { runLegiscanJob } from "../jobs/run-legiscan";
import type { LegiscanOrderBy } from "../connectors/texas/legiscan";
import { safeErrorMessage } from "../security";

type ReplayRunRow = typeof replayRuns.$inferSelect;
type ReplayChunkRow = typeof replayChunks.$inferSelect;

type ReplayMode = "recent" | "full" | "backfill";

const DEFAULT_CHUNK_SIZE = 250;
const MAX_CHUNK_SIZE = 2000;
const DEFAULT_ADVANCE_CHUNKS = 1;
const MAX_ADVANCE_CHUNKS = 200;
const REPLAY_ADVISORY_LOCK_NAMESPACE = 87121;
let replayPersistenceReady = false;

const VALID_ORDER_BY: ReadonlySet<LegiscanOrderBy> = new Set([
  "bill_id_asc",
  "bill_id_desc",
  "last_action_date_asc",
  "last_action_date_desc",
]);

export interface CreateLegiscanReplayRunRequest {
  sessionId: number;
  mode?: ReplayMode;
  chunkSize?: number;
  orderBy?: LegiscanOrderBy;
  requestedBy?: string;
  sinceDays?: number;
  detailConcurrency?: number;
}

export interface AdvanceReplayOptions {
  maxChunks?: number;
  untilCompleted?: boolean;
  stopOnError?: boolean;
}

export interface ReplayRunDetail {
  run: ReplayRunRow;
  chunks: ReplayChunkRow[];
  progress: {
    completionRatio: number;
    remainingCandidates: number | null;
    hasMore: boolean;
    processedPerMinute: number | null;
    etaMinutes: number | null;
    successfulChunks: number;
    errorChunks: number;
    lastChunkCompletedAt: string | null;
  };
}

function normalizeMode(mode: string | null | undefined): ReplayMode {
  if (mode === "recent" || mode === "backfill" || mode === "full") {
    return mode;
  }
  return "full";
}

function normalizeOrderBy(orderBy: string | null | undefined): LegiscanOrderBy {
  if (!orderBy) return "bill_id_asc";
  return VALID_ORDER_BY.has(orderBy as LegiscanOrderBy)
    ? (orderBy as LegiscanOrderBy)
    : "bill_id_asc";
}

function normalizeChunkSize(chunkSize: number | null | undefined): number {
  if (!Number.isFinite(chunkSize)) return DEFAULT_CHUNK_SIZE;
  return Math.max(1, Math.min(MAX_CHUNK_SIZE, Math.floor(chunkSize as number)));
}

function normalizeMaxChunks(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return DEFAULT_ADVANCE_CHUNKS;
  return Math.max(1, Math.min(MAX_ADVANCE_CHUNKS, Math.floor(value as number)));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

async function ensureReplayPersistence(): Promise<void> {
  if (replayPersistenceReady) return;

  await queryClient.unsafe(`
    do $$
    begin
      create type policy_intel_replay_run_status as enum ('planned', 'running', 'paused', 'completed', 'failed');
    exception
      when duplicate_object then null;
    end
    $$;
  `);

  await queryClient.unsafe(`
    do $$
    begin
      create type policy_intel_replay_chunk_status as enum ('pending', 'running', 'success', 'error', 'skipped');
    exception
      when duplicate_object then null;
    end
    $$;
  `);

  await queryClient.unsafe(`
    create table if not exists policy_intel_replay_runs (
      id serial primary key,
      source varchar(64) not null default 'legiscan',
      session_id integer not null,
      mode varchar(16) not null default 'full',
      order_by varchar(32) not null default 'bill_id_asc',
      chunk_size integer not null default 250,
      next_offset integer not null default 0,
      total_candidates integer,
      processed_candidates integer not null default 0,
      status policy_intel_replay_run_status not null default 'planned',
      requested_by varchar(255),
      options_json jsonb not null default '{}'::jsonb,
      last_error text,
      started_at timestamptz,
      completed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `);

  await queryClient.unsafe(`
    create table if not exists policy_intel_replay_chunks (
      id serial primary key,
      replay_run_id integer not null references policy_intel_replay_runs(id) on delete cascade,
      chunk_index integer not null,
      "offset" integer not null,
      "limit" integer not null,
      status policy_intel_replay_chunk_status not null default 'pending',
      started_at timestamptz,
      finished_at timestamptz,
      fetched integer not null default 0,
      inserted integer not null default 0,
      skipped integer not null default 0,
      alerts_created integer not null default 0,
      fetch_errors integer not null default 0,
      upsert_errors integer not null default 0,
      error text,
      result_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `);

  await queryClient.unsafe(`
    create unique index if not exists policy_intel_replay_chunks_run_chunk_idx
    on policy_intel_replay_chunks (replay_run_id, chunk_index)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_replay_chunks_run_created_idx
    on policy_intel_replay_chunks (replay_run_id, created_at)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_replay_runs_status_created_idx
    on policy_intel_replay_runs (status, created_at)
  `);
  await queryClient.unsafe(`
    create index if not exists policy_intel_replay_runs_source_session_idx
    on policy_intel_replay_runs (source, session_id)
  `);

  replayPersistenceReady = true;
}

function calculateProgress(run: ReplayRunRow, chunks: ReplayChunkRow[]) {
  const successfulChunks = chunks.filter((chunk) => chunk.status === "success" || chunk.status === "skipped").length;
  const errorChunks = chunks.filter((chunk) => chunk.status === "error").length;
  const lastChunkCompletedAt =
    chunks.find((chunk) => chunk.finishedAt instanceof Date)?.finishedAt?.toISOString() ?? null;

  const total = run.totalCandidates;
  const elapsedMs = run.startedAt ? Date.now() - run.startedAt.getTime() : 0;
  const elapsedMinutes = elapsedMs > 0 ? elapsedMs / 60000 : 0;
  const processedPerMinute = elapsedMinutes > 0 && run.processedCandidates > 0
    ? run.processedCandidates / elapsedMinutes
    : null;

  if (!total || total <= 0) {
    return {
      completionRatio: 0,
      remainingCandidates: null,
      hasMore: run.status !== "completed",
      processedPerMinute,
      etaMinutes: null,
      successfulChunks,
      errorChunks,
      lastChunkCompletedAt,
    };
  }

  const processed = Math.max(0, Math.min(run.processedCandidates, total));
  const remaining = Math.max(0, total - processed);
  const etaMinutes = processedPerMinute && processedPerMinute > 0
    ? remaining / processedPerMinute
    : null;

  return {
    completionRatio: total > 0 ? processed / total : 0,
    remainingCandidates: remaining,
    hasMore: remaining > 0 && run.status !== "completed",
    processedPerMinute,
    etaMinutes,
    successfulChunks,
    errorChunks,
    lastChunkCompletedAt,
  };
}

async function tryAcquireRunAdvanceLock(runId: number): Promise<boolean> {
  const rows = await queryClient.unsafe<{ locked: boolean }[]>(
    "select pg_try_advisory_lock($1, $2) as locked",
    [REPLAY_ADVISORY_LOCK_NAMESPACE, runId],
  );
  return Boolean(rows[0]?.locked);
}

async function releaseRunAdvanceLock(runId: number): Promise<void> {
  await queryClient.unsafe("select pg_advisory_unlock($1, $2)", [REPLAY_ADVISORY_LOCK_NAMESPACE, runId]);
}

async function getRunOrThrow(runId: number): Promise<ReplayRunRow> {
  const [run] = await policyIntelDb
    .select()
    .from(replayRuns)
    .where(eq(replayRuns.id, runId));

  if (!run) {
    throw new Error(`Replay run ${runId} was not found`);
  }

  return run;
}

export async function listReplayRuns(
  filters: { status?: ReplayRunRow["status"]; limit?: number } = {},
): Promise<ReplayRunDetail[]> {
  await ensureReplayPersistence();
  const limit = Math.max(1, Math.min(200, Number(filters.limit) || 50));
  const rows = await policyIntelDb
    .select()
    .from(replayRuns)
    .where(filters.status ? eq(replayRuns.status, filters.status) : undefined)
    .orderBy(desc(replayRuns.createdAt))
    .limit(limit);

  return Promise.all(rows.map((row) => getReplayRunDetail(row.id)));
}

export async function getReplayRunDetail(runId: number): Promise<ReplayRunDetail> {
  await ensureReplayPersistence();
  const run = await getRunOrThrow(runId);
  const chunks = await policyIntelDb
    .select()
    .from(replayChunks)
    .where(eq(replayChunks.replayRunId, runId))
    .orderBy(desc(replayChunks.chunkIndex), desc(replayChunks.createdAt))
    .limit(500);

  return {
    run,
    chunks,
    progress: calculateProgress(run, chunks),
  };
}

export async function createLegiscanReplayRun(
  request: CreateLegiscanReplayRunRequest,
): Promise<ReplayRunDetail> {
  await ensureReplayPersistence();
  if (!Number.isFinite(request.sessionId) || request.sessionId <= 0) {
    throw new Error("sessionId is required");
  }

  const mode = normalizeMode(request.mode);
  const chunkSize = normalizeChunkSize(request.chunkSize);
  const orderBy = normalizeOrderBy(request.orderBy);

  const optionsJson: Record<string, unknown> = {
    sinceDays: Number.isFinite(request.sinceDays) ? Math.max(1, Math.floor(request.sinceDays as number)) : undefined,
    detailConcurrency: Number.isFinite(request.detailConcurrency)
      ? Math.max(1, Math.floor(request.detailConcurrency as number))
      : undefined,
  };

  const [created] = await policyIntelDb
    .insert(replayRuns)
    .values({
      source: "legiscan",
      sessionId: Math.floor(request.sessionId),
      mode,
      orderBy,
      chunkSize,
      nextOffset: 0,
      processedCandidates: 0,
      status: "planned",
      requestedBy: request.requestedBy?.trim() || null,
      optionsJson,
      startedAt: null,
      completedAt: null,
      updatedAt: new Date(),
    })
    .returning();

  return getReplayRunDetail(created.id);
}

export async function pauseReplayRun(runId: number): Promise<ReplayRunDetail> {
  await ensureReplayPersistence();
  const run = await getRunOrThrow(runId);
  if (run.status === "completed") {
    return getReplayRunDetail(runId);
  }

  await policyIntelDb
    .update(replayRuns)
    .set({
      status: "paused",
      updatedAt: new Date(),
    })
    .where(eq(replayRuns.id, runId));

  return getReplayRunDetail(runId);
}

export async function advanceReplayRun(
  runId: number,
  options: AdvanceReplayOptions = {},
): Promise<ReplayRunDetail> {
  await ensureReplayPersistence();
  const lockAcquired = await tryAcquireRunAdvanceLock(runId);
  if (!lockAcquired) {
    return getReplayRunDetail(runId);
  }

  const stopOnError = options.stopOnError !== false;
  const maxChunks = options.untilCompleted ? MAX_ADVANCE_CHUNKS : normalizeMaxChunks(options.maxChunks);
  try {
    let run = await getRunOrThrow(runId);
    if (run.status === "completed") {
      return getReplayRunDetail(runId);
    }

    if (run.status === "failed" || run.status === "paused" || run.status === "planned") {
      await policyIntelDb
        .update(replayRuns)
        .set({
          status: "running",
          startedAt: run.startedAt ?? new Date(),
          lastError: null,
          updatedAt: new Date(),
        })
        .where(eq(replayRuns.id, runId));

      run = await getRunOrThrow(runId);
    }

    for (let step = 0; step < maxChunks; step++) {
      run = await getRunOrThrow(runId);

      if (run.status !== "running") {
        break;
      }

      if (run.totalCandidates !== null && run.nextOffset >= run.totalCandidates) {
        await policyIntelDb
          .update(replayRuns)
          .set({
            status: "completed",
            completedAt: run.completedAt ?? new Date(),
            updatedAt: new Date(),
          })
          .where(eq(replayRuns.id, runId));
        break;
      }

      const chunkIndex = Math.floor(run.nextOffset / Math.max(run.chunkSize, 1));
      const [createdChunk] = await policyIntelDb
        .insert(replayChunks)
        .values({
          replayRunId: run.id,
          chunkIndex,
          offset: run.nextOffset,
          limit: run.chunkSize,
          status: "running",
          startedAt: new Date(),
        })
        .returning();

      try {
        const optionsJson = asRecord(run.optionsJson);
        const result = await runLegiscanJob({
          mode: normalizeMode(run.mode),
          sessionId: run.sessionId,
          offset: run.nextOffset,
          limit: run.chunkSize,
          orderBy: normalizeOrderBy(run.orderBy),
          sinceDays: typeof optionsJson.sinceDays === "number" ? optionsJson.sinceDays : undefined,
          detailConcurrency: typeof optionsJson.detailConcurrency === "number" ? optionsJson.detailConcurrency : undefined,
        });

        const totalCandidates = Number.isFinite(result.totalCandidates) ? result.totalCandidates : run.totalCandidates;
        const remaining = totalCandidates === null
          ? null
          : Math.max(0, totalCandidates - run.nextOffset);
        const candidateCount = remaining === null
          ? run.chunkSize
          : Math.min(run.chunkSize, remaining);
        const nextOffset = run.nextOffset + candidateCount;
        const hasMore = totalCandidates === null ? result.fetched > 0 : nextOffset < totalCandidates;

        await policyIntelDb
          .update(replayChunks)
          .set({
            status: result.fetched === 0 && candidateCount === 0 ? "skipped" : "success",
            finishedAt: new Date(),
            fetched: result.fetched,
            inserted: result.inserted,
            skipped: result.skipped,
            alertsCreated: result.alerts.created,
            fetchErrors: result.fetchErrors.length,
            upsertErrors: result.upsertErrors.length,
            resultJson: result as unknown as Record<string, unknown>,
          })
          .where(eq(replayChunks.id, createdChunk.id));

        await policyIntelDb
          .update(replayRuns)
          .set({
            totalCandidates,
            processedCandidates: run.processedCandidates + candidateCount,
            nextOffset: hasMore ? nextOffset : run.nextOffset + candidateCount,
            status: hasMore ? "running" : "completed",
            completedAt: hasMore ? null : new Date(),
            updatedAt: new Date(),
            lastError: null,
          })
          .where(eq(replayRuns.id, run.id));

        if (!hasMore) {
          break;
        }
      } catch (error: unknown) {
        const message = safeErrorMessage(error, "Replay chunk failed");

        await policyIntelDb
          .update(replayChunks)
          .set({
            status: "error",
            finishedAt: new Date(),
            error: message,
          })
          .where(eq(replayChunks.id, createdChunk.id));

        await policyIntelDb
          .update(replayRuns)
          .set({
            status: "failed",
            lastError: message,
            updatedAt: new Date(),
          })
          .where(eq(replayRuns.id, run.id));

        if (stopOnError) {
          break;
        }

        await policyIntelDb
          .update(replayRuns)
          .set({
            status: "running",
            updatedAt: new Date(),
          })
          .where(and(eq(replayRuns.id, run.id), eq(replayRuns.status, "failed")));
      }
    }

    return getReplayRunDetail(runId);
  } finally {
    await releaseRunAdvanceLock(runId);
  }
}
