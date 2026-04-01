import { z } from "zod";
import type { Request, Response, NextFunction } from "express";

/**
 * Express middleware factory: validates req.body against a Zod schema.
 * Returns 400 with structured errors on failure, calls next() on success.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));
      return res.status(400).json({ message: "Validation failed", errors });
    }
    req.body = result.data;
    next();
  };
}

// ── Shared primitives ──────────────────────────────────────────────────────

const positiveInt = z.number().int().positive();
const optionalPositiveInt = z.number().int().positive().optional();
const optionalString = z.string().optional();
const safeString = z.string().min(1).max(5000);
const optionalSafeString = z.string().max(5000).optional().nullable();

// ── Workspace ──────────────────────────────────────────────────────────────

export const createWorkspaceSchema = z.object({
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(500),
});

// ── Watchlists ─────────────────────────────────────────────────────────────

export const createWatchlistSchema = z.object({
  workspaceId: positiveInt,
  name: z.string().min(1).max(500),
  topic: optionalSafeString,
  description: optionalSafeString,
  rulesJson: z.record(z.unknown()).optional().default({}),
});

export const patchWatchlistSchema = z.object({
  name: z.string().min(1).max(500).optional(),
  topic: optionalSafeString,
  description: optionalSafeString,
  rulesJson: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "Provide at least one field to update" });

// ── Source Documents ───────────────────────────────────────────────────────

export const createSourceDocumentSchema = z.object({
  sourceType: z.string().min(1).max(100),
  publisher: z.string().min(1).max(500),
  sourceUrl: z.string().url().max(2000),
  externalId: optionalSafeString,
  title: z.string().min(1).max(1000),
  summary: optionalSafeString,
  publishedAt: z.string().datetime().optional().nullable(),
  checksum: optionalSafeString,
  rawPayload: z.record(z.unknown()).optional().default({}),
  normalizedText: optionalSafeString,
  tagsJson: z.array(z.string().max(200)).optional().default([]),
});

// ── Alerts ─────────────────────────────────────────────────────────────────

export const createAlertSchema = z.object({
  workspaceId: positiveInt,
  watchlistId: positiveInt,
  sourceDocumentId: positiveInt,
  title: z.string().min(1).max(1000),
  summary: optionalSafeString,
  severity: z.enum(["high", "medium", "low", "info"]).optional().default("info"),
  status: z.enum(["pending_review", "ready", "sent", "suppressed"]).optional().default("pending_review"),
  alertReason: optionalSafeString,
  metadataJson: z.record(z.unknown()).optional(),
});

export const patchAlertSchema = z.object({
  status: z.enum(["pending_review", "ready", "sent", "suppressed"]).optional(),
  reviewerNote: z.string().max(5000).optional(),
}).refine((d) => d.status !== undefined || d.reviewerNote !== undefined, {
  message: "Provide status and/or reviewerNote",
});

export const bulkTriageSchema = z.object({
  suppressBelow: z.number().min(0).max(100).optional().default(20),
  promoteAbove: z.number().min(0).max(100).optional().default(70),
  dryRun: z.boolean().optional().default(false),
  approvalToken: z.string().max(200).optional().default(""),
});

// ── Issue Rooms ────────────────────────────────────────────────────────────

export const createIssueRoomSchema = z.object({
  workspaceId: positiveInt,
  matterId: optionalPositiveInt.nullable(),
  slug: z.string().max(200).optional(),
  title: z.string().min(1).max(1000),
  issueType: optionalSafeString,
  jurisdiction: z.string().max(100).optional().default("texas"),
  status: z.string().max(50).optional().default("active"),
  summary: optionalSafeString,
  recommendedPath: optionalSafeString,
  ownerUserId: optionalPositiveInt.nullable(),
  relatedBillIds: z.array(z.string().max(100)).optional().default([]),
  sourceDocumentIds: z.array(positiveInt).optional(),
});

export const createIssueRoomFromAlertSchema = z.object({
  matterId: optionalPositiveInt.nullable(),
  slug: z.string().max(200).optional(),
  title: z.string().max(1000).optional(),
  issueType: optionalSafeString,
  jurisdiction: z.string().max(100).optional().default("texas"),
  summary: optionalSafeString,
  recommendedPath: optionalSafeString,
  ownerUserId: optionalPositiveInt.nullable(),
  relatedBillIds: z.array(z.string().max(100)).optional().default([]),
});

export const patchIssueRoomSchema = z.object({
  title: z.string().min(1).max(1000).optional(),
  summary: optionalSafeString,
  status: z.string().max(50).optional(),
  recommendedPath: optionalSafeString,
  issueType: optionalSafeString,
  jurisdiction: z.string().max(100).optional(),
}).refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export const createIssueRoomUpdateSchema = z.object({
  title: z.string().min(1).max(1000),
  body: safeString,
  updateType: z.string().max(100).optional().default("analysis"),
  sourcePackJson: z.array(z.unknown()).optional().default([]),
});

export const createStrategyOptionSchema = z.object({
  label: z.string().min(1).max(500),
  description: optionalSafeString,
  prosJson: z.array(z.string().max(1000)).optional().default([]),
  consJson: z.array(z.string().max(1000)).optional().default([]),
  politicalFeasibility: z.number().min(0).max(100).optional(),
  legalDurability: z.number().min(0).max(100).optional(),
  implementationComplexity: z.number().min(0).max(100).optional(),
  recommendationRank: z.number().int().min(0).optional().default(0),
});

export const createTaskSchema = z.object({
  title: z.string().min(1).max(1000),
  description: optionalSafeString,
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional().default("todo"),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional().default("medium"),
  assignee: optionalSafeString,
  dueDate: z.string().datetime().optional().nullable(),
});

export const patchTaskSchema = z.object({
  status: z.enum(["todo", "in_progress", "done", "blocked"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  assignee: z.string().max(500).optional(),
  dueDate: z.string().datetime().optional().nullable(),
  completedAt: z.string().datetime().optional().nullable(),
}).refine((d) => Object.keys(d).length > 0, { message: "At least one field is required" });

// ── Matters ────────────────────────────────────────────────────────────────

export const createMatterSchema = z.object({
  workspaceId: positiveInt,
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(500),
  clientName: optionalSafeString,
  practiceArea: optionalSafeString,
  jurisdictionScope: z.string().max(100).optional().default("texas"),
  status: z.string().max(50).optional().default("active"),
  ownerUserId: optionalPositiveInt.nullable(),
  description: optionalSafeString,
  tagsJson: z.array(z.string().max(200)).optional().default([]),
});

// ── Stakeholders ───────────────────────────────────────────────────────────

export const createStakeholderSchema = z.object({
  workspaceId: positiveInt,
  type: z.string().min(1).max(100),
  name: z.string().min(1).max(500),
  title: optionalSafeString,
  organization: optionalSafeString,
  jurisdiction: optionalSafeString,
  tagsJson: z.array(z.string().max(200)).optional().default([]),
  sourceSummary: optionalSafeString,
});

export const createIssueRoomStakeholderSchema = z.object({
  type: z.string().min(1).max(100),
  name: z.string().min(1).max(500),
  title: optionalSafeString,
  organization: optionalSafeString,
  jurisdiction: optionalSafeString,
  tagsJson: z.array(z.string().max(200)).optional().default([]),
  sourceSummary: optionalSafeString,
});

export const createObservationSchema = z.object({
  sourceDocumentId: optionalPositiveInt,
  matterId: optionalPositiveInt,
  observationText: z.string().min(1).max(5000),
  confidence: z.number().min(0).max(1).optional(),
});

export const createMeetingNoteSchema = z.object({
  noteText: z.string().min(1).max(10000),
  meetingDate: z.string().datetime().optional().nullable(),
  contactMethod: z.string().max(200).optional().nullable(),
  matterId: optionalPositiveInt.nullable(),
});

// ── Activities ─────────────────────────────────────────────────────────────

export const createActivitySchema = z.object({
  workspaceId: positiveInt,
  alertId: optionalPositiveInt.nullable(),
  type: z.string().min(1).max(100),
  ownerUserId: optionalPositiveInt.nullable(),
  summary: z.string().min(1).max(2000),
  detailText: optionalSafeString,
  dueAt: z.string().datetime().optional().nullable(),
});

// ── Briefs ─────────────────────────────────────────────────────────────────

export const generateBriefSchema = z.object({
  workspaceId: positiveInt,
  watchlistId: optionalPositiveInt,
  matterId: optionalPositiveInt,
  sourceDocumentIds: z.array(positiveInt).min(1, "sourceDocumentIds[] must have at least one entry"),
  title: z.string().max(1000).optional(),
});

// ── Deliverables ───────────────────────────────────────────────────────────

export const generateClientAlertSchema = z.object({
  issueRoomId: positiveInt,
  workspaceId: positiveInt,
  recipientName: optionalSafeString,
  firmName: optionalSafeString,
});

export const generateWeeklyReportSchema = z.object({
  workspaceId: positiveInt,
  week: z.string().regex(/^\d{4}-W\d{2}$/).optional(),
  recipientName: optionalSafeString,
  firmName: optionalSafeString,
});

export const generateHearingMemoSchema = z.object({
  hearingId: positiveInt,
  workspaceId: positiveInt,
  recipientName: optionalSafeString,
  firmName: optionalSafeString,
});

// ── Pipeline test ──────────────────────────────────────────────────────────

export const pipelineTestSchema = z.object({
  title: z.string().min(1).max(1000),
  summary: z.string().max(5000).optional().nullable(),
  reasons: z.array(z.record(z.unknown())).optional().default([]),
});

// ── Jobs ───────────────────────────────────────────────────────────────────

export const runLegiscanSchema = z.object({
  mode: z.enum(["recent", "full", "backfill"]).optional().default("recent"),
  sinceDays: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(10000).optional(),
  offset: z.number().int().min(0).optional(),
  orderBy: z.enum(["bill_id_asc", "bill_id_desc", "last_action_date_asc", "last_action_date_desc"]).optional(),
  sessionId: z.number().int().positive().optional(),
  detailConcurrency: z.number().int().min(1).max(20).optional(),
});

export const fetchTecSchema = z.object({
  searchTerm: z.string().min(1).max(500),
});

export const runTecImportSchema = z.object({
  searchTerm: z.string().max(500).optional(),
  workspaceId: positiveInt,
  matterId: optionalPositiveInt,
  mode: z.enum(["search", "sweep"]).optional().default("search"),
}).refine((d) => d.mode === "sweep" || (d.searchTerm && d.searchTerm.length > 0), {
  message: "searchTerm is required for search mode",
});

// ── Committee Intel ────────────────────────────────────────────────────────

export const createCommitteeIntelFromHearingSchema = z.object({
  workspaceId: positiveInt,
  hearingId: positiveInt,
  title: z.string().max(1000).optional(),
  focusTopics: z.array(z.string().max(500)).optional(),
  interimCharges: z.array(z.string().max(500)).optional(),
  clientContext: z.string().max(5000).optional().nullable(),
  monitoringNotes: z.string().max(5000).optional().nullable(),
  videoUrl: z.string().url().max(2000).optional(),
  agendaUrl: z.string().url().max(2000).optional(),
  transcriptSourceType: z.string().max(100).optional(),
  transcriptSourceUrl: z.string().max(2000).optional(),
  autoIngestEnabled: z.boolean().optional(),
  autoIngestIntervalSeconds: z.number().int().min(10).max(3600).optional(),
  status: z.string().max(50).optional(),
});

export const addSegmentSchema = z.object({
  transcriptText: z.string().min(1).max(50000),
  capturedAt: z.string().datetime().optional(),
  startedAtSecond: z.number().min(0).optional().nullable(),
  endedAtSecond: z.number().min(0).optional().nullable(),
  speakerName: z.string().max(500).optional(),
  speakerRole: z.string().max(200).optional(),
  affiliation: z.string().max(500).optional(),
  invited: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const focusedBriefSchema = z.object({
  issue: z.string().min(1).max(2000),
});

// ── Replay ─────────────────────────────────────────────────────────────────

export const createReplayRunSchema = z.object({
  sessionId: positiveInt,
  mode: z.enum(["recent", "full", "backfill"]).optional(),
  chunkSize: z.number().int().min(1).max(1000).optional(),
  orderBy: z.string().max(100).optional(),
  requestedBy: z.string().max(200).optional(),
  sinceDays: z.number().int().positive().optional(),
  detailConcurrency: z.number().int().min(1).max(20).optional(),
  startNow: z.boolean().optional(),
  maxChunks: z.union([z.number().int().positive(), z.literal("all")]).optional(),
});

// ── Legislator Import ──────────────────────────────────────────────────────

export const importLegislatorsSchema = z.object({
  workspaceId: positiveInt,
});

// ── Matter–Watchlist Link ──────────────────────────────────────────────────

export const linkWatchlistToMatterSchema = z.object({
  watchlistId: positiveInt,
});
