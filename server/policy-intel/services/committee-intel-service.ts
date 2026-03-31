import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { and, asc, desc, eq, gte, ilike, inArray } from "drizzle-orm";
import * as cheerio from "cheerio";
import { policyIntelDb } from "../db";
import { safeErrorMessage } from "../security";
import {
  committeeIntelSegments,
  committeeIntelSignals,
  committeeIntelSessions,
  committeeMembers,
  hearingEvents,
  sourceDocuments,
  stakeholders,
} from "@shared/schema-policy-intel";

type CommitteeIntelSessionRow = typeof committeeIntelSessions.$inferSelect;
type CommitteeIntelSegmentRow = typeof committeeIntelSegments.$inferSelect;
type CommitteeIntelSignalRow = typeof committeeIntelSignals.$inferSelect;
type HearingRow = typeof hearingEvents.$inferSelect;

type CommitteeIntelSpeakerRole = CommitteeIntelSegmentRow["speakerRole"];
type CommitteeIntelPosition = CommitteeIntelSegmentRow["position"];
type CommitteeIntelEntityType = CommitteeIntelSignalRow["entityType"];
type CommitteeIntelTranscriptSourceType = CommitteeIntelSessionRow["transcriptSourceType"];
type CommitteeIntelAutoIngestStatus = CommitteeIntelSessionRow["autoIngestStatus"];
type CommitteeIntelSyncSourceMode = "feed" | "audio_transcription";
type CommitteeIntelFeedSourceType = Exclude<CommitteeIntelTranscriptSourceType, "manual" | "official">;

interface IssueCatalogEntry {
  tag: string;
  label: string;
  patterns: RegExp[];
}

interface StakeholderLookupEntry {
  id: number;
  name: string;
  type: string;
  organization: string | null;
  party: string | null;
  chamber: string | null;
  title: string | null;
}

interface CommitteeMemberLookupEntry {
  stakeholderId: number;
  name: string;
  role: string;
  party: string | null;
  chamber: string | null;
}

interface CommitteeIntelEntityPosition {
  issueTag: string;
  label: string;
  position: CommitteeIntelPosition;
  confidence: number;
  mentionCount: number;
}

interface NormalizedTranscriptFeedEntry {
  externalKey: string;
  cursorValue: string;
  capturedAt: string;
  startedAtSecond: number | null;
  endedAtSecond: number | null;
  speakerName: string | null;
  speakerRole?: CommitteeIntelSpeakerRole;
  affiliation: string | null;
  transcriptText: string;
  invited: boolean;
  metadata: Record<string, unknown>;
}

export interface CommitteeIntelIssueSummary {
  issueTag: string;
  label: string;
  mentionCount: number;
  supportCount: number;
  opposeCount: number;
  questioningCount: number;
  neutralCount: number;
  keyEntities: string[];
}

export interface CommitteeIntelMoment {
  segmentId: number;
  timestampLabel: string;
  timestampSecond: number | null;
  speakerName: string | null;
  speakerRole: CommitteeIntelSpeakerRole;
  summary: string;
  importance: number;
  position: CommitteeIntelPosition;
  issueTags: string[];
}

export interface CommitteeIntelEntitySummary {
  entityName: string;
  entityType: CommitteeIntelEntityType;
  stakeholderId: number | null;
  affiliation: string | null;
  mentionCount: number;
  invited: boolean;
  primaryIssues: string[];
  positions: CommitteeIntelEntityPosition[];
}

export interface CommitteeIntelPositionRow {
  entityName: string;
  entityType: CommitteeIntelEntityType;
  stakeholderId: number | null;
  affiliation: string | null;
  issueTag: string;
  label: string;
  position: CommitteeIntelPosition;
  confidence: number;
  mentionCount: number;
  invited: boolean;
}

export interface CommitteeIntelAnalysis {
  analyzedAt: string | null;
  summary: string;
  totalSegments: number;
  totalSignals: number;
  trackedEntities: number;
  invitedWitnessCount: number;
  issueCoverage: CommitteeIntelIssueSummary[];
  keyMoments: CommitteeIntelMoment[];
  electedFocus: CommitteeIntelEntitySummary[];
  activeWitnesses: CommitteeIntelEntitySummary[];
  witnessRankings: CommitteeIntelWitnessRanking[];
  postHearingRecap: CommitteeIntelPostHearingRecap | null;
  positionMap: CommitteeIntelPositionRow[];
}

export interface CommitteeIntelSessionDetail {
  session: CommitteeIntelSessionRow;
  hearing: HearingRow | null;
  segments: CommitteeIntelSegmentRow[];
  signals: CommitteeIntelSignalRow[];
  analysis: CommitteeIntelAnalysis;
}

export interface CommitteeIntelFocusedBrief {
  issue: string;
  matchedIssueTags: string[];
  summary: string;
  topMoments: CommitteeIntelMoment[];
  supporters: CommitteeIntelPositionRow[];
  opponents: CommitteeIntelPositionRow[];
  electedFocus: CommitteeIntelEntitySummary[];
  activeWitnesses: CommitteeIntelEntitySummary[];
  recommendations: string[];
}

export interface CommitteeIntelWitnessRanking {
  rank: number;
  entityName: string;
  entityType: CommitteeIntelEntityType;
  stakeholderId: number | null;
  affiliation: string | null;
  invited: boolean;
  score: number;
  dominantPosition: CommitteeIntelPosition;
  mentionCount: number;
  issueBreadth: number;
  keyMomentCount: number;
  primaryIssues: string[];
  summary: string;
}

export interface CommitteeIntelPostHearingRecap {
  generatedAt: string;
  headline: string;
  overview: string;
  issueHighlights: string[];
  memberPressurePoints: string[];
  witnessLeaderboard: CommitteeIntelWitnessRanking[];
  agencyCommitments: string[];
  followUpActions: string[];
}

export interface CommitteeIntelTranscriptSyncResult {
  sessionId: number;
  sourceType: CommitteeIntelTranscriptSourceType;
  sourceMode: CommitteeIntelSyncSourceMode;
  sourceUrl: string | null;
  sourceLabel: string | null;
  resolvedFrom: string | null;
  fetchedAt: string;
  totalParsed: number;
  ingestedSegments: number;
  updatedSegments: number;
  duplicateSegments: number;
  cursor: string | null;
  status: CommitteeIntelAutoIngestStatus;
  outcome: "synced" | "waiting_source" | "failed";
  retryable: boolean;
  waitReason: string | null;
  attemptedAt: string;
  completedAt: string;
  durationMs: number;
  nextEligibleAutoIngestAt: string | null;
  nextEligibleAutoIngestInSeconds: number | null;
  error?: string;
}

export interface CommitteeIntelResetResult {
  sessionId: number;
  clearedSegments: number;
  clearedSignals: number;
  resetAt: string;
}

export interface CommitteeIntelRebuildResult {
  detail: CommitteeIntelSessionDetail;
  reset: CommitteeIntelResetResult;
  sync: CommitteeIntelTranscriptSyncResult | null;
}

export interface CreateCommitteeIntelSessionRequest {
  workspaceId: number;
  hearingId: number;
  title?: string;
  focusTopics?: string[];
  interimCharges?: string[];
  clientContext?: string;
  monitoringNotes?: string;
  videoUrl?: string;
  agendaUrl?: string;
  transcriptSourceType?: CommitteeIntelTranscriptSourceType;
  transcriptSourceUrl?: string;
  autoIngestEnabled?: boolean;
  autoIngestIntervalSeconds?: number;
  status?: CommitteeIntelSessionRow["status"];
}

export interface UpdateCommitteeIntelSessionRequest {
  title?: string;
  focusTopics?: string[];
  interimCharges?: string[];
  clientContext?: string | null;
  monitoringNotes?: string | null;
  liveSummary?: string | null;
  agendaUrl?: string | null;
  videoUrl?: string | null;
  transcriptSourceType?: CommitteeIntelTranscriptSourceType;
  transcriptSourceUrl?: string | null;
  autoIngestEnabled?: boolean;
  autoIngestIntervalSeconds?: number;
  status?: CommitteeIntelSessionRow["status"];
}

export interface AddCommitteeIntelSegmentRequest {
  capturedAt?: string;
  startedAtSecond?: number | null;
  endedAtSecond?: number | null;
  speakerName?: string;
  speakerRole?: CommitteeIntelSpeakerRole;
  affiliation?: string;
  transcriptText: string;
  invited?: boolean;
  metadata?: Record<string, unknown>;
}

const ISSUE_CATALOG: IssueCatalogEntry[] = [
  {
    tag: "critical_infrastructure",
    label: "Critical Infrastructure",
    patterns: [/\bcritical infrastructure\b/i, /\bgrid security\b/i, /\binfrastructure security\b/i, /\bsecure the grid\b/i],
  },
  {
    tag: "supply_chain_integrity",
    label: "Supply Chain Integrity",
    patterns: [/\bsupply chain\b/i, /\bprocurement\b/i, /\bvendor risk\b/i, /\bmanufactur/i],
  },
  {
    tag: "foreign_entity_risk",
    label: "Foreign Entity Risk",
    patterns: [/\bchina\b/i, /\brussia\b/i, /\biran\b/i, /\bforeign entit(y|ies)\b/i, /\bhostile foreign\b/i],
  },
  {
    tag: "utility_regulation",
    label: "Utility Regulation",
    patterns: [/\bercot\b/i, /\bpuct\b/i, /\bpublic utility commission\b/i, /\bpublic utility counsel\b/i, /\btransmission\b/i],
  },
  {
    tag: "grid_reliability",
    label: "Grid Reliability",
    patterns: [/\breliab/i, /\boutage\b/i, /\bblackout\b/i, /\bresilien/i, /\bgeneration\b/i],
  },
  {
    tag: "ratepayer_impact",
    label: "Ratepayer Impact",
    patterns: [/\bratepayer/i, /\baffordab/i, /\brate(s)?\b/i, /\bcost(s)?\b/i, /\bprice(s)?\b/i],
  },
  {
    tag: "witness_process",
    label: "Witness Process",
    patterns: [/\binvited testimony\b/i, /\bpublic testimony\b/i, /\bwitness(es)?\b/i, /\bpublic comment\b/i],
  },
];

const AGENCY_HINTS = ["commission", "council", "office", "department", "agency", "authority", "ercot", "utility"];
const ORGANIZATION_HINTS = ["association", "alliance", "coalition", "chamber", "company", "corp", "foundation", "group", "llc", "inc", "union"];
const TEXAS_CAPITOL_TIME_ZONE = "America/Chicago";
const OFFICIAL_TRANSCRIPTION_CLIP_SECONDS = 150;
const OFFICIAL_TRANSCRIPTION_OVERLAP_SECONDS = 8;
const OFFICIAL_TRANSCRIPTION_TIMEOUT_MS = 120_000;
const FFMPEG_BINARY = process.env.FFMPEG_PATH?.trim() || "ffmpeg";
const execFileAsync = promisify(execFile);
const NON_SPEECH_TRANSCRIPT_PATTERNS = [
  /^\[(?:music|applause|laughter|inaudible|silence|noise|crosstalk|cross talk|background noise|gavel|off mic|off-mic|unintelligible)[^\]]*\]$/i,
  /^\((?:music|applause|laughter|inaudible|silence|noise|crosstalk|cross talk|background noise|gavel|off mic|off-mic|unintelligible)[^\)]*\)$/i,
  /^(?:music|applause|laughter|inaudible|silence|noise|crosstalk|cross talk|background noise|gavel|off mic|off-mic|unintelligible)\.?$/i,
];
const SPEAKER_ROLE_VALUES: CommitteeIntelSpeakerRole[] = [
  "chair",
  "member",
  "staff",
  "agency",
  "invited_witness",
  "public_witness",
  "moderator",
  "unknown",
];

interface CommitteeIntelOfficialSource {
  sourceId: string;
  chamber: "House" | "Senate";
  sourceLabel: string;
  officialPageUrl: string | null;
  videoStreamUrl: string | null;
  transcriptUrl: string | null;
  transcriptFormat: CommitteeIntelFeedSourceType | null;
  eventDateKey: string | null;
  metadata: Record<string, unknown>;
}

interface CommitteeIntelResolvedSyncSource {
  sourceType: CommitteeIntelTranscriptSourceType;
  sourceMode: CommitteeIntelSyncSourceMode;
  sourceUrl: string | null;
  sourceLabel: string | null;
  resolvedFrom: string | null;
  feedType: CommitteeIntelFeedSourceType | null;
  officialSource: CommitteeIntelOfficialSource | null;
}

interface CommitteeIntelTranscriptUpsertResult {
  ingestedSegments: number;
  updatedSegments: number;
  duplicateSegments: number;
}

interface HouseVideoEventRecord {
  id: number;
  date: string;
  time: string;
  name: string;
  captions?: boolean;
  videoUrl?: string | null;
  videoTTV?: string | null;
  videoTXT?: string | null;
  EventUrl?: string | null;
  channel?: string | null;
  room?: string | null;
  duration?: string | null;
}

interface SenateArchiveEventRecord {
  dateKey: string | null;
  title: string;
  officialPageUrl: string;
  sourceId: string;
}

interface CommitteeIntelAudioTranscriptionSegment {
  start: number;
  end: number;
  text: string;
}

interface CommitteeIntelAudioTranscriptionResult {
  text: string;
  segments: CommitteeIntelAudioTranscriptionSegment[];
}

function hashValue(value: string): string {
  return createHash("sha1").update(value).digest("hex");
}

function getMetadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function buildTranscriptFeedIdentityKey(
  sessionId: number,
  sourceType: string | null | undefined,
  cursorValue: string | null | undefined,
  sourceId: string | number | null | undefined,
): string | null {
  const normalizedSourceType = sourceType?.trim().toLowerCase() || null;
  if (!normalizedSourceType || normalizedSourceType === "manual") return null;

  const normalizedCursor = cursorValue?.trim() || "";
  const normalizedSourceId = sourceId === null || sourceId === undefined ? "" : String(sourceId).trim();
  if (!normalizedCursor && !normalizedSourceId) return null;

  return [sessionId, normalizedSourceType, normalizedSourceId, normalizedCursor].join("|");
}

function cleanUrl(value: string | null | undefined): string | null {
  const next = value?.trim();
  return next ? next : null;
}

function resolveCandidateTranscriptSourceUrl(
  sourceType: CommitteeIntelTranscriptSourceType,
  transcriptSourceUrl: string | null | undefined,
  videoUrl: string | null | undefined,
): string | null {
  const explicit = cleanUrl(transcriptSourceUrl);
  if (explicit) return explicit;

  if (sourceType !== "manual") {
    const fallback = cleanUrl(videoUrl);
    if (fallback && /^(data:|https?:)/i.test(fallback) && /\.(vtt|json|txt)(\?.*)?$/i.test(fallback)) {
      return fallback;
    }
  }

  return null;
}

function resolveTranscriptSourceUrl(session: CommitteeIntelSessionRow): string | null {
  return resolveCandidateTranscriptSourceUrl(session.transcriptSourceType, session.transcriptSourceUrl, session.videoUrl);
}

function resolveAutoIngestStatus(
  sourceType: CommitteeIntelTranscriptSourceType,
  sourceUrl: string | null,
  autoIngestEnabled: boolean,
  current: CommitteeIntelAutoIngestStatus,
): CommitteeIntelAutoIngestStatus {
  if (!autoIngestEnabled) return "idle";
  if (sourceType === "manual") return current === "error" ? "error" : "idle";
  if (sourceType === "official") return current === "error" ? "error" : "ready";
  if (!sourceUrl) return current === "error" ? "error" : "idle";
  return current === "error" ? "error" : "ready";
}

function parseTimestampToSeconds(value: string | null | undefined): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = trimmed.match(/^(?:(\d+):)?(\d{1,2}):(\d{2})(?:[\.,](\d{1,3}))?$/);
  if (!match) return null;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  const milliseconds = Number((match[4] ?? "0").padEnd(3, "0"));
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

function buildCapturedAtFromOffset(session: CommitteeIntelSessionRow, startedAtSecond: number | null, fallbackIndex: number): string {
  const base = toDate(session.hearingDate) ?? new Date();
  const offset = startedAtSecond ?? fallbackIndex * 30;
  return new Date(base.getTime() + Math.max(offset, 0) * 1000).toISOString();
}

function normaliseSpeakerFromText(transcriptText: string): {
  speakerName: string | null;
  affiliation: string | null;
  transcriptText: string;
} {
  const cleaned = transcriptText.replace(/^>>\s*/, "").trim();
  const patterns = [
    /^([^:(\-—]{2,120}?)(?:\s+\(([^)]+)\))?\s*[:\-—]\s+(.+)$/s,
    /^([^:(]{2,120}?)(?:\s+\(([^)]+)\))?:\s+(.+)$/s,
  ];
  const match = patterns
    .map((pattern) => cleaned.match(pattern))
    .find((candidate): candidate is RegExpMatchArray => Boolean(candidate));

  if (!match) {
    return {
      speakerName: null,
      affiliation: null,
      transcriptText: cleaned,
    };
  }

  const rawSpeakerName = match[1]?.trim() || null;
  const speakerName = isLikelySpeakerLabel(rawSpeakerName) ? rawSpeakerName : null;
  const affiliation = match[2]?.trim() || null;
  const nextText = match[3]?.trim() || cleaned;

  if (!speakerName) {
    return {
      speakerName: null,
      affiliation: null,
      transcriptText: cleaned,
    };
  }

  return {
    speakerName,
    affiliation,
    transcriptText: nextText,
  };
}

function isLikelySpeakerLabel(value: string | null | undefined): boolean {
  const label = value?.trim() ?? "";
  if (!label || label.length < 2 || label.length > 80) return false;
  if (!/[A-Za-z]/.test(label)) return false;
  if (/[.!?]/.test(label)) return false;
  if (/\d{1,2}:\d{2}/.test(label)) return false;
  if (/^(agenda|item|today|thank you|thanks|question|answer)$/i.test(label)) return false;

  const tokenCount = label.split(/\s+/).length;
  return tokenCount <= 8;
}

function decodeBasicHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, " ");
}

function cleanTranscriptText(value: string): string | null {
  const cleaned = decodeBasicHtmlEntities(
    value
      .replace(/<\d{2}:\d{2}:\d{2}\.\d{3}>/g, " ")
      .replace(/<\/?c(?:\.[^>]+)?>/gi, " ")
      .replace(/<\/?(?:i|b|u|v|ruby|rt|lang)[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return null;

  const normalized = cleaned.replace(/[.!?]+$/g, "").trim();
  if (!normalized) return null;
  if (NON_SPEECH_TRANSCRIPT_PATTERNS.some((pattern) => pattern.test(cleaned) || pattern.test(normalized))) {
    return null;
  }

  return cleaned;
}

function normalizeSpeakerRole(value: unknown): CommitteeIntelSpeakerRole | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  if (SPEAKER_ROLE_VALUES.includes(normalized as CommitteeIntelSpeakerRole)) {
    return normalized as CommitteeIntelSpeakerRole;
  }

  if (/chair/.test(normalized)) return "chair";
  if (/(member|senator|representative|legislator|committee member)/.test(normalized)) return "member";
  if (/staff/.test(normalized)) return "staff";
  if (/(agency|commission|department|director|commissioner)/.test(normalized)) return "agency";
  if (/invited/.test(normalized)) return "invited_witness";
  if (/(public witness|public testimony|public)/.test(normalized)) return "public_witness";
  if (/(moderator|host|facilitator)/.test(normalized)) return "moderator";
  if (/witness/.test(normalized)) return "public_witness";

  return undefined;
}

function buildTranscriptExternalKey(parts: Array<string | number | null | undefined>): string {
  return hashValue(parts.map((part) => String(part ?? "")).join("|"));
}

function buildFeedEntry(
  session: CommitteeIntelSessionRow,
  index: number,
  value: {
    cursorValue?: string;
    capturedAt?: string | null;
    startedAtSecond?: number | null;
    endedAtSecond?: number | null;
    speakerName?: string | null;
    speakerRole?: CommitteeIntelSpeakerRole;
    affiliation?: string | null;
    transcriptText: string;
    invited?: boolean;
    metadata?: Record<string, unknown>;
  },
): NormalizedTranscriptFeedEntry | null {
  const cleanedInputText = cleanTranscriptText(value.transcriptText);
  if (!cleanedInputText) return null;

  const metadata = getMetadataRecord(value.metadata);
  const sourceType = typeof metadata.sourceType === "string" ? metadata.sourceType : null;
  const sourceId = typeof metadata.sourceId === "string" || typeof metadata.sourceId === "number"
    ? metadata.sourceId
    : null;
  const normalizedSpeaker = normaliseSpeakerFromText(cleanedInputText);
  const speakerName = value.speakerName?.trim() || normalizedSpeaker.speakerName;
  const affiliation = value.affiliation?.trim() || normalizedSpeaker.affiliation;
  const candidateText = speakerName || affiliation ? normalizedSpeaker.transcriptText : cleanedInputText;
  const transcriptText = cleanTranscriptText(candidateText);
  if (!transcriptText) return null;
  const startedAtSecond = value.startedAtSecond ?? null;
  const endedAtSecond = value.endedAtSecond ?? null;
  const capturedAt = value.capturedAt ?? buildCapturedAtFromOffset(session, startedAtSecond, index);
  const cursorValue = value.cursorValue ?? String(startedAtSecond ?? index);
  const dedupKey = buildTranscriptFeedIdentityKey(session.id, sourceType, cursorValue, sourceId);
  const externalKey = buildTranscriptExternalKey([
    session.id,
    cursorValue,
    startedAtSecond,
    endedAtSecond,
    speakerName,
    affiliation,
    transcriptText,
  ]);

  return {
    externalKey,
    cursorValue,
    capturedAt,
    startedAtSecond,
    endedAtSecond,
    speakerName,
    speakerRole: value.speakerRole,
    affiliation,
    transcriptText,
    invited: value.invited ?? false,
    metadata: {
      ...metadata,
      externalKey,
      dedupKey,
      feedCursor: cursorValue,
    },
  };
}

function buildFeedEntryDedupKey(sessionId: number, entry: NormalizedTranscriptFeedEntry): string {
  const metadata = getMetadataRecord(entry.metadata);
  const storedKey = typeof metadata.dedupKey === "string" ? metadata.dedupKey.trim() : "";
  if (storedKey) return storedKey;

  return buildTranscriptFeedIdentityKey(
    sessionId,
    typeof metadata.sourceType === "string" ? metadata.sourceType : null,
    entry.cursorValue,
    typeof metadata.sourceId === "string" || typeof metadata.sourceId === "number" ? metadata.sourceId : null,
  ) ?? entry.externalKey;
}

function parseWebVttFeed(content: string, session: CommitteeIntelSessionRow): NormalizedTranscriptFeedEntry[] {
  const cues: NormalizedTranscriptFeedEntry[] = [];
  const blocks = content
    .replace(/^WEBVTT\s*/i, "")
    .split(/\r?\n\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  let cueIndex = 0;
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const timeLineIndex = lines.findIndex((line) => line.includes("-->"));
    if (timeLineIndex === -1) continue;

    const timeLine = lines[timeLineIndex];
    const [rawStart, rawEnd] = timeLine.split("-->").map((part) => part.trim());
    const startedAtSecond = parseTimestampToSeconds(rawStart);
    const endedAtSecond = parseTimestampToSeconds(rawEnd);
    const textLines = lines.slice(timeLineIndex + 1).filter((line) => !line.startsWith("NOTE"));
    const entry = buildFeedEntry(session, cueIndex, {
      cursorValue: `${cueIndex}:${rawStart}`,
      startedAtSecond: startedAtSecond === null ? null : Math.floor(startedAtSecond),
      endedAtSecond: endedAtSecond === null ? null : Math.floor(endedAtSecond),
      transcriptText: textLines.join(" "),
      metadata: {
        sourceType: "webvtt",
      },
    });
    if (entry) cues.push(entry);
    cueIndex += 1;
  }

  return cues;
}

function findJsonTranscriptArray(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
  }
  if (!value || typeof value !== "object") return [];

  const record = value as Record<string, unknown>;
  for (const key of ["segments", "items", "entries", "cues", "transcript", "data"]) {
    const next = record[key];
    if (Array.isArray(next)) {
      return next.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
    }
  }

  return [];
}

function parseJsonFeed(content: string, session: CommitteeIntelSessionRow): NormalizedTranscriptFeedEntry[] {
  const parsed = JSON.parse(content) as unknown;
  const items = findJsonTranscriptArray(parsed);

  return items
    .map((item, index) => {
      const transcriptText = String(item.text ?? item.content ?? item.body ?? item.transcript ?? "").trim();
      const startedAtSecond = item.start === undefined ? item.startTime : item.start;
      const endedAtSecond = item.end === undefined ? item.endTime : item.end;
      const capturedAt = item.capturedAt ?? item.timestamp ?? item.createdAt ?? null;
      const entry = buildFeedEntry(session, index, {
        cursorValue: String(item.id ?? item.sequence ?? item.index ?? startedAtSecond ?? index),
        capturedAt: typeof capturedAt === "string" ? capturedAt : null,
        startedAtSecond: typeof startedAtSecond === "number" ? startedAtSecond : parseTimestampToSeconds(String(startedAtSecond ?? "")),
        endedAtSecond: typeof endedAtSecond === "number" ? endedAtSecond : parseTimestampToSeconds(String(endedAtSecond ?? "")),
        speakerName: typeof item.speaker === "string" ? item.speaker : typeof item.name === "string" ? item.name : null,
        speakerRole: normalizeSpeakerRole(item.role),
        affiliation: typeof item.affiliation === "string" ? item.affiliation : typeof item.organization === "string" ? item.organization : null,
        transcriptText,
        invited: Boolean(item.invited),
        metadata: {
          sourceType: "json",
          sourceId: item.id ?? null,
        },
      });
      return entry;
    })
    .filter((entry): entry is NormalizedTranscriptFeedEntry => Boolean(entry));
}

function parseTextFeed(content: string, session: CommitteeIntelSessionRow): NormalizedTranscriptFeedEntry[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines
    .map((line, index) => {
      const timestampMatch = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?(?:[\.,]\d{1,3})?)\]?\s+(.*)$/);
      const startedAtSecond = timestampMatch ? parseTimestampToSeconds(timestampMatch[1]) : null;
      const transcriptText = timestampMatch ? timestampMatch[2] : line;
      return buildFeedEntry(session, index, {
        cursorValue: String(index),
        startedAtSecond: startedAtSecond === null ? null : Math.floor(startedAtSecond),
        transcriptText,
        metadata: {
          sourceType: "text",
        },
      });
    })
    .filter((entry): entry is NormalizedTranscriptFeedEntry => Boolean(entry));
}

function parseTranscriptFeed(
  content: string,
  sourceType: CommitteeIntelTranscriptSourceType,
  session: CommitteeIntelSessionRow,
): NormalizedTranscriptFeedEntry[] {
  if (sourceType === "webvtt") return parseWebVttFeed(content, session);
  if (sourceType === "json") return parseJsonFeed(content, session);
  if (sourceType === "text") return parseTextFeed(content, session);
  return [];
}

function inferTranscriptFeedTypeFromUrl(value: string | null | undefined): CommitteeIntelFeedSourceType | null {
  const cleaned = cleanUrl(value);
  if (!cleaned) return null;
  if (/\.vtt(\?.*)?$/i.test(cleaned)) return "webvtt";
  if (/\.json(\?.*)?$/i.test(cleaned)) return "json";
  if (/\.txt(\?.*)?$/i.test(cleaned)) return "text";
  return null;
}

function formatTexasDateKey(value: Date | string | null | undefined): string | null {
  const date = toDate(value);
  if (!date) return null;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TEXAS_CAPITOL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseUsDateToKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.trim().match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (!match) return null;

  const month = Number(match[1]);
  const day = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return Number.isNaN(date.getTime()) ? null : formatTexasDateKey(date);
}

function dayDifferenceFromDateKeys(left: string | null, right: string | null): number {
  if (!left || !right) return Number.POSITIVE_INFINITY;
  const leftDate = new Date(`${left}T12:00:00Z`);
  const rightDate = new Date(`${right}T12:00:00Z`);
  return Math.round(Math.abs(leftDate.getTime() - rightDate.getTime()) / 86_400_000);
}

function normalizeCommitteeName(value: string | null | undefined): string {
  return normalizeText(value)
    .replace(/\b(committee|subcommittee|joint|hearing|select|special|part|room|house|senate|on)\b/g, " ")
    .replace(/\b(i|ii|iii|iv|v)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeCommitteeName(value: string | null | undefined): string[] {
  return normalizeCommitteeName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function scoreCommitteeMatch(expected: string, candidate: string): number {
  const expectedName = normalizeCommitteeName(expected);
  const candidateName = normalizeCommitteeName(candidate);
  if (!expectedName || !candidateName) return 0;
  if (expectedName === candidateName) return 120;

  let score = 0;
  if (candidateName.includes(expectedName) || expectedName.includes(candidateName)) {
    score += 40;
  }

  const expectedTokens = new Set(tokenizeCommitteeName(expected));
  const candidateTokens = new Set(tokenizeCommitteeName(candidate));
  let matches = 0;
  for (const token of expectedTokens) {
    if (candidateTokens.has(token)) matches += 1;
  }

  if (matches === 0) return score;

  score += matches * 18;
  score += Math.round((matches / Math.max(expectedTokens.size, candidateTokens.size, 1)) * 30);
  return score;
}

function scoreOfficialSourceCandidate(
  session: CommitteeIntelSessionRow,
  candidateTitle: string,
  candidateDateKey: string | null,
): number {
  const committeeScore = scoreCommitteeMatch(session.committee, candidateTitle);
  if (committeeScore === 0) return 0;

  const hearingDateKey = formatTexasDateKey(session.hearingDate);
  if (!hearingDateKey || !candidateDateKey) return committeeScore;

  const dayDifference = dayDifferenceFromDateKeys(hearingDateKey, candidateDateKey);
  if (dayDifference === 0) return committeeScore + 100;
  if (dayDifference <= 2) return committeeScore + 30 - dayDifference * 10;
  if (dayDifference <= 7) return committeeScore - dayDifference * 6;
  return committeeScore - dayDifference * 12;
}

function resolveTexasLegislativeSessionInfo(session: CommitteeIntelSessionRow): {
  rawToken: string | null;
  sessionNumber: string;
  houseArchiveCode: string;
} {
  const sourceValues = [session.agendaUrl, session.videoUrl, session.transcriptSourceUrl].filter((value): value is string => Boolean(value));
  for (const value of sourceValues) {
    const match = value.match(/\/tlodocs\/(\d{2,3}[A-Z0-9]*)\//i);
    if (!match) continue;

    const rawToken = match[1].toUpperCase();
    const tokenMatch = rawToken.match(/^(\d{2,3})([A-Z0-9]*)$/);
    if (!tokenMatch) continue;

    const suffix = tokenMatch[2] || "R";
    return {
      rawToken,
      sessionNumber: tokenMatch[1],
      houseArchiveCode: suffix === "R" ? "R" : suffix.replace(/^[A-Z]+/, "") || suffix,
    };
  }

  const hearingDate = toDate(session.hearingDate) ?? new Date();
  const year = hearingDate.getUTCFullYear();
  const bienniumStartYear = year % 2 === 0 ? year - 1 : year;
  const sessionNumber = 89 + Math.round((bienniumStartYear - 2025) / 2);
  return {
    rawToken: null,
    sessionNumber: String(sessionNumber),
    houseArchiveCode: "R",
  };
}

function isHlsUrl(value: string | null | undefined): boolean {
  return Boolean(value && /\.m3u8(\?.*)?$/i.test(value));
}

function extractHouseVideoEventId(value: string | null | undefined): number | null {
  const cleaned = cleanUrl(value);
  if (!cleaned) return null;
  const match = cleaned.match(/house\.texas\.gov\/videos\/(\d+)/i);
  if (!match) return null;
  const eventId = Number(match[1]);
  return Number.isFinite(eventId) ? eventId : null;
}

function extractSenateVideoPlayerUrl(value: string | null | undefined): string | null {
  const cleaned = cleanUrl(value);
  if (!cleaned) return null;
  return /senate\.texas\.gov\/videoplayer\.php/i.test(cleaned) ? cleaned : null;
}

async function fetchJsonResponse<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json,text/plain,*/*",
    },
  });

  if (!response.ok) {
    throw new Error(`Request for ${url} failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function fetchTextResponse(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.5",
    },
  });

  if (!response.ok) {
    throw new Error(`Request for ${url} failed with status ${response.status}`);
  }

  return response.text();
}

function buildHouseOfficialSource(event: HouseVideoEventRecord): CommitteeIntelOfficialSource {
  const transcriptUrl = cleanUrl(event.videoTTV) ?? cleanUrl(event.videoTXT);
  return {
    sourceId: String(event.id),
    chamber: "House",
    sourceLabel: event.name,
    officialPageUrl: cleanUrl(event.EventUrl),
    videoStreamUrl: cleanUrl(event.videoUrl),
    transcriptUrl,
    transcriptFormat: cleanUrl(event.videoTTV) ? "webvtt" : cleanUrl(event.videoTXT) ? "text" : null,
    eventDateKey: parseUsDateToKey(event.date),
    metadata: {
      channel: event.channel ?? null,
      room: event.room ?? null,
      duration: event.duration ?? null,
      captions: Boolean(event.captions),
    },
  };
}

async function fetchHouseOfficialEventById(eventId: number): Promise<CommitteeIntelOfficialSource | null> {
  const event = await fetchJsonResponse<HouseVideoEventRecord>(`https://www.house.texas.gov/api/GetVideoEvent/${eventId}`);
  if (!event?.id) return null;
  return buildHouseOfficialSource(event);
}

async function resolveHouseOfficialSource(session: CommitteeIntelSessionRow): Promise<CommitteeIntelOfficialSource | null> {
  const explicitEventId = extractHouseVideoEventId(session.videoUrl) ?? extractHouseVideoEventId(session.transcriptSourceUrl);
  if (explicitEventId) {
    return fetchHouseOfficialEventById(explicitEventId);
  }

  const { sessionNumber, houseArchiveCode } = resolveTexasLegislativeSessionInfo(session);
  const events = await fetchJsonResponse<HouseVideoEventRecord[]>(
    `https://www.house.texas.gov/api/GetVideoEvents/${sessionNumber}/${houseArchiveCode}/published/committee`,
  );

  const scored = events
    .map((event) => ({
      event,
      score: scoreOfficialSourceCandidate(session, event.name, parseUsDateToKey(event.date)),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score || left.event.id - right.event.id);

  const best = scored[0];
  if (!best || best.score < 110) return null;
  return buildHouseOfficialSource(best.event);
}

function parseSenateArchiveEvents(html: string): SenateArchiveEventRecord[] {
  const $ = cheerio.load(html);
  const results: SenateArchiveEventRecord[] = [];
  const seen = new Set<string>();

  $('a[href*="videoplayer.php?vid="]').each((_index, element) => {
    const link = $(element).attr("href");
    if (!link) return;

    const url = new URL(link, "https://senate.texas.gov/");
    const officialPageUrl = url.toString();
    if (seen.has(officialPageUrl)) return;
    seen.add(officialPageUrl);

    const row = $(element).closest("tr");
    const rowCells = row.find("td");
    const rowText = row.text().replace(/\s+/g, " ").trim();
    const rowDateText = rowCells.first().text().trim();
    const rowTitle = row.find("td.av-prog").first().text().replace(/\s+/g, " ").trim();

    const container = row.length > 0 ? row : $(element).closest("li,article,section,div,p");
    const containerText = container.text().replace(/\s+/g, " ").trim();
    const linkText = $(element).text().replace(/\s+/g, " ").trim();

    const dateKey = parseUsDateToKey(rowDateText) ?? parseUsDateToKey(rowText) ?? parseUsDateToKey(containerText);
    const title = rowTitle || linkText || containerText || rowText || "Senate committee hearing";

    results.push({
      dateKey,
      title,
      officialPageUrl,
      sourceId: url.searchParams.get("vid") ?? hashValue(officialPageUrl),
    });
  });

  return results;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function decodeSenatePlayerStreamUrl(officialPageUrl: string): Promise<string | null> {
  const html = await fetchTextResponse(officialPageUrl);

  const directQuotedMatch = html.match(/src\s*:\s*['"]([^'"]+\.m3u8[^'"]*)['"]/i);
  if (directQuotedMatch) {
    return directQuotedMatch[1];
  }

  const atobLiteralMatch = html.match(/src\s*:\s*atob\(\s*['"]([^'"]+)['"]\s*\)/i);
  if (atobLiteralMatch) {
    try {
      const decoded = Buffer.from(atobLiteralMatch[1], "base64").toString("utf8").trim();
      if (isHlsUrl(decoded) || /^https?:\/\//i.test(decoded)) {
        return decoded;
      }
    } catch {
      // Keep probing additional patterns below when a base64 payload is malformed.
    }
  }

  const atobVariableMatch = html.match(/src\s*:\s*atob\(\s*([A-Za-z_$][\w$]*)\s*\)/i);
  if (atobVariableMatch) {
    const variableName = atobVariableMatch[1].trim();
    const variableMatch = html.match(new RegExp(`(?:const|let|var)\\s+${escapeRegExp(variableName)}\\s*=\\s*['\"]([^'\"]+)['\"]`, "i"));
    if (variableMatch) {
      try {
        const decoded = Buffer.from(variableMatch[1], "base64").toString("utf8").trim();
        if (isHlsUrl(decoded) || /^https?:\/\//i.test(decoded)) {
          return decoded;
        }
      } catch {
        // Keep probing additional patterns below when a base64 payload is malformed.
      }
    }
  }

  const fallbackUrlMatch = html.match(/https?:\/\/[^\s"']+\.m3u8[^\s"']*/i);
  return fallbackUrlMatch ? fallbackUrlMatch[0] : null;
}

function buildSenateOfficialSource(
  event: SenateArchiveEventRecord,
  videoStreamUrl: string,
): CommitteeIntelOfficialSource {
  return {
    sourceId: event.sourceId,
    chamber: "Senate",
    sourceLabel: event.title,
    officialPageUrl: event.officialPageUrl,
    videoStreamUrl,
    transcriptUrl: null,
    transcriptFormat: null,
    eventDateKey: event.dateKey,
    metadata: {},
  };
}

function shouldProbeSenateLiveSource(session: CommitteeIntelSessionRow): boolean {
  const hearingDate = toDate(session.hearingDate);
  if (!hearingDate) return false;

  const now = Date.now();
  const probeWindowStartMs = hearingDate.getTime() - 10 * 60 * 60 * 1000;
  const probeWindowEndMs = hearingDate.getTime() + 24 * 60 * 60 * 1000;
  return now >= probeWindowStartMs && now <= probeWindowEndMs;
}

async function resolveBestPlayableSenateCandidate(
  session: CommitteeIntelSessionRow,
  candidates: SenateArchiveEventRecord[],
  options: { minScore: number; maxAttempts: number },
): Promise<CommitteeIntelOfficialSource | null> {
  const ranked = candidates
    .map((candidate) => ({
      candidate,
      score: scoreOfficialSourceCandidate(session, candidate.title, candidate.dateKey),
    }))
    .filter((candidate) => candidate.score >= options.minScore)
    .sort((left, right) => right.score - left.score || left.candidate.officialPageUrl.localeCompare(right.candidate.officialPageUrl));

  for (const { candidate } of ranked.slice(0, Math.max(options.maxAttempts, 1))) {
    try {
      const videoStreamUrl = await decodeSenatePlayerStreamUrl(candidate.officialPageUrl);
      if (videoStreamUrl) {
        return buildSenateOfficialSource(candidate, videoStreamUrl);
      }
    } catch {
      continue;
    }
  }

  return null;
}

async function resolveSenateOfficialSource(session: CommitteeIntelSessionRow): Promise<CommitteeIntelOfficialSource | null> {
  const explicitPlayerUrl = extractSenateVideoPlayerUrl(session.videoUrl) ?? extractSenateVideoPlayerUrl(session.transcriptSourceUrl);
  if (explicitPlayerUrl) {
    const videoStreamUrl = await decodeSenatePlayerStreamUrl(explicitPlayerUrl);
    if (!videoStreamUrl) return null;
    return buildSenateOfficialSource({
      dateKey: formatTexasDateKey(session.hearingDate),
      title: session.committee,
      officialPageUrl: explicitPlayerUrl,
      sourceId: new URL(explicitPlayerUrl).searchParams.get("vid") ?? hashValue(explicitPlayerUrl),
    }, videoStreamUrl);
  }

  const { sessionNumber } = resolveTexasLegislativeSessionInfo(session);
  const archiveHtml = await fetchTextResponse(`https://senate.texas.gov/av-archive.php?sess=${sessionNumber}&lang=en`);
  const archiveCandidates = parseSenateArchiveEvents(archiveHtml);
  const archiveSource = await resolveBestPlayableSenateCandidate(session, archiveCandidates, {
    minScore: 70,
    maxAttempts: 6,
  });
  if (archiveSource) {
    return archiveSource;
  }

  if (!shouldProbeSenateLiveSource(session)) {
    return null;
  }

  const liveResponses = await Promise.allSettled([
    fetchTextResponse("https://senate.texas.gov/av-live.php"),
    fetchTextResponse("https://senate.texas.gov/av-live.php?lang=en"),
  ]);
  const liveCandidates = liveResponses
    .filter((response): response is PromiseFulfilledResult<string> => response.status === "fulfilled")
    .flatMap((response) => parseSenateArchiveEvents(response.value));

  return resolveBestPlayableSenateCandidate(session, liveCandidates, {
    minScore: 55,
    maxAttempts: 8,
  });
}

async function resolveOfficialCommitteeSource(session: CommitteeIntelSessionRow): Promise<CommitteeIntelOfficialSource | null> {
  const explicitVideoUrl = cleanUrl(session.videoUrl) ?? cleanUrl(session.transcriptSourceUrl);
  if (explicitVideoUrl && isHlsUrl(explicitVideoUrl)) {
    return {
      sourceId: hashValue(explicitVideoUrl),
      chamber: normalizeText(session.chamber).includes("house") ? "House" : "Senate",
      sourceLabel: session.title,
      officialPageUrl: explicitVideoUrl,
      videoStreamUrl: explicitVideoUrl,
      transcriptUrl: null,
      transcriptFormat: null,
      eventDateKey: formatTexasDateKey(session.hearingDate),
      metadata: {},
    };
  }

  const normalizedChamber = normalizeText(session.chamber);
  if (normalizedChamber.includes("house")) {
    return resolveHouseOfficialSource(session);
  }
  if (normalizedChamber.includes("senate")) {
    return resolveSenateOfficialSource(session);
  }
  if (normalizedChamber.includes("joint")) {
    return await resolveHouseOfficialSource(session) ?? await resolveSenateOfficialSource(session);
  }
  return null;
}

async function resolveTranscriptSyncSource(session: CommitteeIntelSessionRow): Promise<CommitteeIntelResolvedSyncSource> {
  if (session.transcriptSourceType === "manual") {
    throw new Error("This session does not have an automatic transcript source configured");
  }

  if (session.transcriptSourceType !== "official") {
    const sourceUrl = resolveTranscriptSourceUrl(session);
    if (!sourceUrl) {
      throw new Error("This session does not have an automatic transcript feed configured");
    }

    return {
      sourceType: session.transcriptSourceType,
      sourceMode: "feed",
      sourceUrl,
      sourceLabel: session.title,
      resolvedFrom: sourceUrl,
      feedType: session.transcriptSourceType,
      officialSource: null,
    };
  }

  const explicitFeedUrl = cleanUrl(session.transcriptSourceUrl);
  const explicitFeedType = inferTranscriptFeedTypeFromUrl(explicitFeedUrl);
  if (explicitFeedUrl && explicitFeedType) {
    return {
      sourceType: "official",
      sourceMode: "feed",
      sourceUrl: explicitFeedUrl,
      sourceLabel: session.title,
      resolvedFrom: explicitFeedUrl,
      feedType: explicitFeedType,
      officialSource: null,
    };
  }

  const officialSource = await resolveOfficialCommitteeSource(session);
  if (!officialSource) {
    throw new Error(`No official ${session.chamber.toLowerCase()} committee source is available for ${session.committee} yet`);
  }

  if (officialSource.transcriptUrl && officialSource.transcriptFormat) {
    return {
      sourceType: "official",
      sourceMode: "feed",
      sourceUrl: officialSource.transcriptUrl,
      sourceLabel: officialSource.sourceLabel,
      resolvedFrom: officialSource.officialPageUrl ?? officialSource.transcriptUrl,
      feedType: officialSource.transcriptFormat,
      officialSource,
    };
  }

  if (officialSource.videoStreamUrl) {
    return {
      sourceType: "official",
      sourceMode: "audio_transcription",
      sourceUrl: officialSource.videoStreamUrl,
      sourceLabel: officialSource.sourceLabel,
      resolvedFrom: officialSource.officialPageUrl ?? officialSource.videoStreamUrl,
      feedType: null,
      officialSource,
    };
  }

  throw new Error(`Official source resolution succeeded for ${session.committee}, but no transcript or video stream is available yet`);
}

function isRetryableOfficialSourceError(
  session: CommitteeIntelSessionRow,
  message: string,
): boolean {
  if (session.transcriptSourceType !== "official") {
    return false;
  }

  if (/No official .* committee source is available .* yet/i.test(message)) {
    return true;
  }

  if (/Official source resolution succeeded .* but no transcript or video stream is available yet/i.test(message)) {
    return true;
  }

  if (/Transcript feed request failed with status (404|429|500|502|503|504)/i.test(message)) {
    return true;
  }

  return false;
}

function classifyOfficialSourceWaitReason(message: string): string {
  if (/No official .* committee source is available .* yet/i.test(message)) {
    return "source_not_published";
  }

  if (/Official source resolution succeeded .* but no transcript or video stream is available yet/i.test(message)) {
    return "media_not_live";
  }

  const statusMatch = message.match(/Transcript feed request failed with status (\d{3})/i);
  if (statusMatch) {
    return `feed_http_${statusMatch[1]}`;
  }

  return "official_source_pending";
}

function parseCursorSecond(value: string | null | undefined): number {
  const cleaned = value?.trim();
  if (!cleaned) return 0;
  const match = cleaned.match(/^(\d+)/);
  if (!match) return 0;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function buildOfficialTranscriptionPrompt(
  session: CommitteeIntelSessionRow,
  officialSource: CommitteeIntelOfficialSource,
): string {
  const hints = cleanList(session.focusTopicsJson).slice(0, 5);
  return [
    `Texas ${officialSource.chamber} committee hearing transcription.`,
    `Committee: ${session.committee}.`,
    hints.length > 0 ? `Priority topics: ${hints.join(", ")}.` : null,
    "Keep legislative acronyms, witness names, and agency names verbatim when they are intelligible.",
  ].filter((value): value is string => Boolean(value)).join(" ");
}

async function extractAudioClipFromStream(
  streamUrl: string,
  startSecond: number,
  durationSeconds: number,
): Promise<{ filePath: string; cleanup: () => Promise<void> }> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "committee-intel-"));
  const filePath = path.join(tempDir, `clip-${Date.now()}.mp3`);
  const args = [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    String(Math.max(0, startSecond)),
    "-i",
    streamUrl,
    "-t",
    String(Math.max(30, durationSeconds)),
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-b:a",
    "32k",
    filePath,
  ];

  try {
    await execFileAsync(FFMPEG_BINARY, args, {
      timeout: OFFICIAL_TRANSCRIPTION_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 2 * 1024 * 1024,
    });

    const info = await stat(filePath);
    if (info.size < 1024) {
      throw new Error("ffmpeg produced an empty audio clip");
    }

    return {
      filePath,
      cleanup: async () => {
        await rm(tempDir, { recursive: true, force: true });
      },
    };
  } catch (error: any) {
    await rm(tempDir, { recursive: true, force: true });
    throw new Error(error?.message ?? "ffmpeg audio extraction failed");
  }
}

async function transcribeAudioFile(
  filePath: string,
  prompt: string,
): Promise<CommitteeIntelAudioTranscriptionResult> {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("OPENAI_API_KEY is not configured for official video transcription");
  }

  const buffer = await readFile(filePath);
  const formData = new FormData();
  formData.append("file", new File([buffer], path.basename(filePath), { type: "audio/mpeg" }));
  formData.append("model", "whisper-1");
  formData.append("language", "en");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "segment");
  if (prompt.trim()) {
    formData.append("prompt", prompt.trim());
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Audio transcription failed with status ${response.status}: ${body.slice(0, 300)}`);
  }

  const data = await response.json() as {
    text?: string;
    segments?: Array<{ start?: number; end?: number; text?: string }>;
  };

  return {
    text: typeof data.text === "string" ? data.text : "",
    segments: Array.isArray(data.segments)
      ? data.segments
          .map((segment) => ({
            start: Number(segment.start ?? 0),
            end: Number(segment.end ?? segment.start ?? 0),
            text: typeof segment.text === "string" ? segment.text : "",
          }))
          .filter((segment) => Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.text.trim().length > 0)
      : [],
  };
}

async function buildOfficialTranscriptEntries(
  session: CommitteeIntelSessionRow,
  officialSource: CommitteeIntelOfficialSource,
): Promise<{ entries: NormalizedTranscriptFeedEntry[]; cursor: string | null }> {
  if (!officialSource.videoStreamUrl) {
    throw new Error(`Official source for ${session.committee} does not expose a playable video stream`);
  }

  const priorCursorSecond = parseCursorSecond(session.lastAutoIngestCursor);
  const clipStartSecond = Math.max(0, priorCursorSecond - OFFICIAL_TRANSCRIPTION_OVERLAP_SECONDS);
  const extractedAudio = await extractAudioClipFromStream(
    officialSource.videoStreamUrl,
    clipStartSecond,
    OFFICIAL_TRANSCRIPTION_CLIP_SECONDS,
  );

  try {
    const transcription = await transcribeAudioFile(
      extractedAudio.filePath,
      buildOfficialTranscriptionPrompt(session, officialSource),
    );

    const metadataBase = {
      sourceType: "official",
      sourceId: officialSource.sourceId,
      officialPageUrl: officialSource.officialPageUrl,
      videoStreamUrl: officialSource.videoStreamUrl,
      sourceLabel: officialSource.sourceLabel,
      ...officialSource.metadata,
    } satisfies Record<string, unknown>;

    const entries = transcription.segments.length > 0
      ? transcription.segments
          .map((segment, index) => {
            const startedAtSecond = clipStartSecond + Math.max(0, Math.floor(segment.start));
            const endedAtSecond = clipStartSecond + Math.max(Math.floor(segment.end), Math.floor(segment.start));
            return buildFeedEntry(session, index, {
              cursorValue: String(startedAtSecond),
              startedAtSecond,
              endedAtSecond,
              transcriptText: segment.text,
              metadata: metadataBase,
            });
          })
          .filter((entry): entry is NormalizedTranscriptFeedEntry => Boolean(entry))
      : (() => {
          const fallback = buildFeedEntry(session, clipStartSecond, {
            cursorValue: String(clipStartSecond),
            startedAtSecond: clipStartSecond,
            endedAtSecond: clipStartSecond + OFFICIAL_TRANSCRIPTION_CLIP_SECONDS,
            transcriptText: transcription.text,
            metadata: metadataBase,
          });
          return fallback ? [fallback] : [];
        })();

    const lastEntry = entries.at(-1) ?? null;
    const lastEntryCursorSecond = lastEntry
      ? (lastEntry.endedAtSecond ?? lastEntry.startedAtSecond ?? clipStartSecond)
      : clipStartSecond;
    const minimumProgressSecond = clipStartSecond + Math.max(30, OFFICIAL_TRANSCRIPTION_CLIP_SECONDS - OFFICIAL_TRANSCRIPTION_OVERLAP_SECONDS);
    const cursor = String(Math.max(lastEntryCursorSecond, minimumProgressSecond, priorCursorSecond));

    return { entries, cursor };
  } finally {
    await extractedAudio.cleanup();
  }
}

async function applyTranscriptEntries(
  session: CommitteeIntelSessionRow,
  parsedEntries: NormalizedTranscriptFeedEntry[],
): Promise<CommitteeIntelTranscriptUpsertResult> {
  await mergeDuplicateFeedSegments(session);
  const existingSegments = await loadSessionSegments(session.id);
  const existingByKey = new Map(existingSegments.map((segment) => [buildStoredSegmentDedupKey(segment), segment]));
  const seenParsedKeys = new Set<string>();
  const requests: AddCommitteeIntelSegmentRequest[] = [];
  let updatedSegments = 0;
  let duplicateSegments = 0;

  for (const entry of parsedEntries) {
    const dedupKey = buildFeedEntryDedupKey(session.id, entry);
    if (seenParsedKeys.has(dedupKey)) {
      duplicateSegments += 1;
      continue;
    }
    seenParsedKeys.add(dedupKey);

    const request = {
      capturedAt: entry.capturedAt,
      startedAtSecond: entry.startedAtSecond,
      endedAtSecond: entry.endedAtSecond,
      speakerName: entry.speakerName ?? undefined,
      speakerRole: entry.speakerRole,
      affiliation: entry.affiliation ?? undefined,
      transcriptText: entry.transcriptText,
      invited: entry.invited,
      metadata: entry.metadata,
    } satisfies AddCommitteeIntelSegmentRequest;

    const existingSegment = existingByKey.get(dedupKey);
    if (!existingSegment) {
      requests.push(request);
      continue;
    }

    if (buildStoredSegmentExternalKey(existingSegment) !== entry.externalKey) {
      await updateCommitteeIntelSegment(session, existingSegment, request);
      updatedSegments += 1;
    } else {
      duplicateSegments += 1;
    }
  }

  await insertCommitteeIntelSegments(session, requests);

  return {
    ingestedSegments: requests.length,
    updatedSegments,
    duplicateSegments,
  };
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(senator|sen|representative|rep|chairman|chairwoman|chair|dr|mr|mrs|ms)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanList(values: string[] | null | undefined): string[] {
  const next = new Set<string>();
  for (const value of values ?? []) {
    const cleaned = value.trim();
    if (!cleaned) continue;
    next.add(cleaned);
  }
  return Array.from(next);
}

function slugifyIssue(value: string): string {
  return normalizeText(value).replace(/\s+/g, "_").slice(0, 64) || "general";
}

function labelFromTag(tag: string): string {
  return tag
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toIsoString(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getNextAutoIngestWindow(session: CommitteeIntelSessionRow): {
  nextEligibleAutoIngestAt: string | null;
  nextEligibleAutoIngestInSeconds: number | null;
} {
  if (!session.autoIngestEnabled) {
    return {
      nextEligibleAutoIngestAt: null,
      nextEligibleAutoIngestInSeconds: null,
    };
  }

  const now = Date.now();
  const intervalMs = Math.max(session.autoIngestIntervalSeconds, 30) * 1000;
  const lastIngestedAt = toDate(session.lastAutoIngestedAt);

  if (!lastIngestedAt) {
    return {
      nextEligibleAutoIngestAt: new Date(now).toISOString(),
      nextEligibleAutoIngestInSeconds: 0,
    };
  }

  const nextEligibleMs = lastIngestedAt.getTime() + intervalMs;
  const remainingMs = Math.max(0, nextEligibleMs - now);
  return {
    nextEligibleAutoIngestAt: new Date(nextEligibleMs).toISOString(),
    nextEligibleAutoIngestInSeconds: Math.ceil(remainingMs / 1000),
  };
}

function formatTimestampLabel(seconds: number | null, capturedAt: Date | string | null): string {
  if (seconds !== null && seconds !== undefined) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const date = toDate(capturedAt);
  if (!date) return "Unknown";
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function buildIssueLabelMap(session: CommitteeIntelSessionRow): Map<string, string> {
  const labels = new Map<string, string>();
  for (const item of ISSUE_CATALOG) {
    labels.set(item.tag, item.label);
  }
  for (const topic of cleanList(session.focusTopicsJson)) {
    labels.set(slugifyIssue(topic), topic);
  }
  return labels;
}

function matchesFocusTopic(normalizedTranscript: string, topic: string): boolean {
  const normalizedTopic = normalizeText(topic);
  if (!normalizedTopic) return false;
  if (normalizedTranscript.includes(normalizedTopic)) return true;
  const tokens = normalizedTopic.split(" ").filter((token) => token.length >= 5);
  if (tokens.length < 2) return false;
  const matchedTokens = tokens.filter((token) => normalizedTranscript.includes(token));
  return matchedTokens.length >= Math.min(2, tokens.length);
}

function detectIssueTags(transcriptText: string, focusTopics: string[]): string[] {
  const normalizedTranscript = normalizeText(transcriptText);
  const matched = new Set<string>();

  for (const item of ISSUE_CATALOG) {
    if (item.patterns.some((pattern) => pattern.test(transcriptText))) {
      matched.add(item.tag);
    }
  }

  for (const topic of cleanList(focusTopics)) {
    if (matchesFocusTopic(normalizedTranscript, topic)) {
      matched.add(slugifyIssue(topic));
    }
  }

  return Array.from(matched);
}

function determineSpeakerRole(
  currentRole: CommitteeIntelSpeakerRole | undefined,
  speakerName: string | null,
  affiliation: string | null,
  transcriptText: string,
): CommitteeIntelSpeakerRole {
  if (currentRole && currentRole !== "unknown") return currentRole;

  const rawSpeakerName = (speakerName ?? "").toLowerCase();
  const normalizedName = normalizeText(speakerName);
  const normalizedAffiliation = normalizeText(affiliation);
  const normalizedTranscript = normalizeText(transcriptText);

  if (normalizedName.includes("chair") || normalizedTranscript.includes("chair recognizes")) return "chair";
  if (/^(sen\.?|senator|rep\.?|representative)\b/i.test(rawSpeakerName) || normalizedTranscript.includes("senator") || normalizedTranscript.includes("representative")) return "member";
  if (/^commissioner\b/i.test(rawSpeakerName)) return "agency";
  if (AGENCY_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "agency";
  if (normalizedTranscript.includes("invited testimony") || normalizedAffiliation.includes("invited")) return "invited_witness";
  if (normalizedTranscript.includes("public testimony") || normalizedTranscript.includes("public witness")) return "public_witness";
  if (normalizedAffiliation.includes("staff") || normalizedTranscript.includes("committee staff")) return "staff";
  if (speakerName && affiliation) return "public_witness";
  return "unknown";
}

function determinePosition(transcriptText: string, speakerRole: CommitteeIntelSpeakerRole): CommitteeIntelPosition {
  const normalized = normalizeText(transcriptText);
  const looksLikeQuestion = /\?|^(can|could|would|how|why|what|when|where|who|is|are|do|does|did)\b/i.test(transcriptText.trim());

  if ((speakerRole === "chair" || speakerRole === "member") && looksLikeQuestion) return "questioning";
  if (/\boppose\b|\bobject\b|\bconcern(ed|ing)?\b|\brisks?\b|\bvulnerab/i.test(normalized)) return "oppose";
  if (/\bsupport\b|\bback\b|\bendorse\b|\bfavor\b|\brecommend\b|\bpromote\b/i.test(normalized)) return "support";
  if ((speakerRole === "chair" || speakerRole === "member") && /\bhow\b|\bwhy\b|\bwhat\b/i.test(normalized)) return "questioning";
  if (/\bupdate\b|\bbrief(ed|ing)?\b|\boverview\b|\bresponded\b|\bstated\b|\breported\b/i.test(normalized) || speakerRole === "agency") return "neutral";
  if (speakerRole === "chair" || speakerRole === "member") return "questioning";
  return "monitoring";
}

function scoreImportance(
  transcriptText: string,
  speakerRole: CommitteeIntelSpeakerRole,
  issueTags: string[],
  position: CommitteeIntelPosition,
  invited: boolean,
): number {
  let score = 20;
  score += issueTags.length * 12;
  if (speakerRole === "chair" || speakerRole === "member") score += 12;
  if (speakerRole === "agency" || invited) score += 8;
  if (position === "support" || position === "oppose" || position === "questioning") score += 10;
  if (transcriptText.trim().length > 240) score += 8;
  if (/\bcritical\b|\burgent\b|\brecommend\b|\bsecurity\b|\bvulnerab/i.test(transcriptText)) score += 8;
  return clamp(score, 10, 100);
}

function summarizeSegment(
  speakerName: string | null,
  affiliation: string | null,
  issueTags: string[],
  position: CommitteeIntelPosition,
  issueLabels: Map<string, string>,
): string {
  const speakerLabel = speakerName?.trim() || affiliation?.trim() || "Speaker";
  const issueLabel = issueTags.length > 0
    ? issueTags.slice(0, 2).map((tag) => issueLabels.get(tag) ?? labelFromTag(tag)).join(", ")
    : "general hearing discussion";

  if (position === "support") return `${speakerLabel} voiced support on ${issueLabel}.`;
  if (position === "oppose") return `${speakerLabel} raised concerns about ${issueLabel}.`;
  if (position === "questioning") return `${speakerLabel} pressed witnesses on ${issueLabel}.`;
  if (position === "neutral") return `${speakerLabel} provided updates on ${issueLabel}.`;
  return `${speakerLabel} spoke on ${issueLabel}.`;
}

function detectInvitedWitness(transcriptText: string, speakerRole: CommitteeIntelSpeakerRole, invited: boolean | null | undefined): boolean {
  if (invited === true) return true;
  if (speakerRole === "invited_witness") return true;
  return /\binvited testimony\b|\binvited witness\b/i.test(transcriptText);
}

function resolveEntityType(
  speakerRole: CommitteeIntelSpeakerRole,
  speakerName: string | null,
  affiliation: string | null,
  committeeMemberMap: Map<string, CommitteeMemberLookupEntry>,
): CommitteeIntelEntityType {
  const rawSpeakerName = (speakerName ?? "").toLowerCase();
  const normalizedName = normalizeText(speakerName);
  const normalizedAffiliation = normalizeText(affiliation);

  if (committeeMemberMap.has(normalizedName) || speakerRole === "chair" || speakerRole === "member" || /^(sen\.?|senator|rep\.?|representative)\b/i.test(rawSpeakerName)) return "legislator";
  if (speakerRole === "agency" || AGENCY_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "agency";
  if (speakerRole === "staff") return "staff";
  if (speakerRole === "invited_witness" || speakerRole === "public_witness" || (speakerName && affiliation)) return "witness";
  if (ORGANIZATION_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "organization";
  return "unknown";
}

function selectEntityName(segment: CommitteeIntelSegmentRow, fallbackCommittee: string): string | null {
  const name = segment.speakerName?.trim();
  if (name) return name;
  const affiliation = segment.affiliation?.trim();
  if (affiliation) return affiliation;
  return fallbackCommittee || null;
}

function buildStakeholderLookups(rows: StakeholderLookupEntry[]) {
  const byName = new Map<string, StakeholderLookupEntry>();
  const byOrganization = new Map<string, StakeholderLookupEntry>();

  for (const row of rows) {
    const normalizedName = normalizeText(row.name);
    if (normalizedName && !byName.has(normalizedName)) byName.set(normalizedName, row);

    const normalizedOrganization = normalizeText(row.organization);
    if (normalizedOrganization && !byOrganization.has(normalizedOrganization)) byOrganization.set(normalizedOrganization, row);
  }

  return { byName, byOrganization };
}

function resolveStakeholderId(
  entityName: string | null,
  affiliation: string | null,
  committeeMemberMap: Map<string, CommitteeMemberLookupEntry>,
  stakeholderByName: Map<string, StakeholderLookupEntry>,
  stakeholderByOrganization: Map<string, StakeholderLookupEntry>,
): number | null {
  const normalizedName = normalizeText(entityName);
  const normalizedAffiliation = normalizeText(affiliation);

  if (normalizedName && committeeMemberMap.has(normalizedName)) {
    return committeeMemberMap.get(normalizedName)?.stakeholderId ?? null;
  }
  if (normalizedName && stakeholderByName.has(normalizedName)) {
    return stakeholderByName.get(normalizedName)?.id ?? null;
  }
  if (normalizedAffiliation && stakeholderByOrganization.has(normalizedAffiliation)) {
    return stakeholderByOrganization.get(normalizedAffiliation)?.id ?? null;
  }
  return null;
}

function buildEmptyAnalysis(session: CommitteeIntelSessionRow, totalSegments = 0, totalSignals = 0): CommitteeIntelAnalysis {
  return {
    analyzedAt: session.lastAnalyzedAt ? toIsoString(session.lastAnalyzedAt) : null,
    summary: totalSegments > 0
      ? `Tracking ${totalSegments} transcript segments for ${session.committee}, but no issue-level signals have been extracted yet.`
      : `Committee intelligence is ready for ${session.committee}. Add transcript or caption segments to begin live analysis.`,
    totalSegments,
    totalSignals,
    trackedEntities: 0,
    invitedWitnessCount: 0,
    issueCoverage: [],
    keyMoments: [],
    electedFocus: [],
    activeWitnesses: [],
    witnessRankings: [],
    postHearingRecap: null,
    positionMap: [],
  };
}

function parseStoredAnalysis(session: CommitteeIntelSessionRow, segments: CommitteeIntelSegmentRow[], signals: CommitteeIntelSignalRow[]): CommitteeIntelAnalysis {
  const raw = session.analyticsJson as Partial<CommitteeIntelAnalysis> | null;
  if (!raw || typeof raw.summary !== "string") {
    return buildEmptyAnalysis(session, segments.length, signals.length);
  }

  return {
    analyzedAt: typeof raw.analyzedAt === "string" ? raw.analyzedAt : null,
    summary: raw.summary,
    totalSegments: typeof raw.totalSegments === "number" ? raw.totalSegments : segments.length,
    totalSignals: typeof raw.totalSignals === "number" ? raw.totalSignals : signals.length,
    trackedEntities: typeof raw.trackedEntities === "number" ? raw.trackedEntities : 0,
    invitedWitnessCount: typeof raw.invitedWitnessCount === "number" ? raw.invitedWitnessCount : 0,
    issueCoverage: Array.isArray(raw.issueCoverage) ? raw.issueCoverage as CommitteeIntelIssueSummary[] : [],
    keyMoments: Array.isArray(raw.keyMoments) ? raw.keyMoments as CommitteeIntelMoment[] : [],
    electedFocus: Array.isArray(raw.electedFocus) ? raw.electedFocus as CommitteeIntelEntitySummary[] : [],
    activeWitnesses: Array.isArray(raw.activeWitnesses) ? raw.activeWitnesses as CommitteeIntelEntitySummary[] : [],
    witnessRankings: Array.isArray(raw.witnessRankings) ? raw.witnessRankings as CommitteeIntelWitnessRanking[] : [],
    postHearingRecap:
      raw.postHearingRecap && typeof raw.postHearingRecap === "object"
        ? raw.postHearingRecap as CommitteeIntelPostHearingRecap
        : null,
    positionMap: Array.isArray(raw.positionMap) ? raw.positionMap as CommitteeIntelPositionRow[] : [],
  };
}

function buildAnalysisSummary(
  session: CommitteeIntelSessionRow,
  issueCoverage: CommitteeIntelIssueSummary[],
  electedFocus: CommitteeIntelEntitySummary[],
  activeWitnesses: CommitteeIntelEntitySummary[],
  totalSegments: number,
): string {
  if (totalSegments === 0) {
    return `Committee intelligence is standing by for ${session.committee}. No live transcript segments have been ingested yet.`;
  }

  const issueText = issueCoverage.length > 0
    ? issueCoverage.slice(0, 3).map((issue) => `${issue.label} (${issue.mentionCount})`).join(", ")
    : "no dominant issue cluster yet";

  const electedText = electedFocus.length > 0
    ? `Committee-member pressure is coming from ${electedFocus.slice(0, 2).map((entry) => entry.entityName).join(" and ")}.`
    : "No committee-member questioning has been isolated yet.";

  const witnessText = activeWitnesses.length > 0
    ? `Active witnesses include ${activeWitnesses.slice(0, 3).map((entry) => entry.entityName).join(", ")}.`
    : "No witness or agency bloc has been isolated yet.";

  return `Tracking ${totalSegments} transcript segments for ${session.committee}. Most active issues: ${issueText}. ${electedText} ${witnessText}`;
}

function buildRecommendations(
  issue: string,
  supporters: CommitteeIntelPositionRow[],
  opponents: CommitteeIntelPositionRow[],
  electedFocus: CommitteeIntelEntitySummary[],
  activeWitnesses: CommitteeIntelEntitySummary[],
  hearingDate: string | null,
): string[] {
  const recommendations: string[] = [];

  if (supporters.length === 0 && opponents.length === 0) {
    recommendations.push(`No direct signals are tied to ${issue} yet. Add more transcript segments or tighten the session focus topics.`);
  }
  if (opponents.length > supporters.length) {
    recommendations.push(`Opposition is stronger than support on ${issue}. Prepare counter-messaging and targeted member follow-up before the next committee touchpoint.`);
  }
  if (supporters.length >= opponents.length && supporters.length > 0) {
    recommendations.push(`Support is building around ${issue}. Identify the most credible supportive witnesses and reinforce their record in follow-up materials.`);
  }
  if (electedFocus.length > 0) {
    recommendations.push(`Brief ${electedFocus.slice(0, 2).map((entry) => entry.entityName).join(" and ")} directly on ${issue}; they are already signaling active engagement.`);
  }
  if (activeWitnesses.some((entry) => entry.invited)) {
    recommendations.push(`Invited witnesses are shaping the record on ${issue}. Prioritize outreach to those entities before written follow-up closes.`);
  }
  if (hearingDate) {
    const hearing = new Date(hearingDate);
    const diffHours = (hearing.getTime() - Date.now()) / 3_600_000;
    if (diffHours >= -6 && diffHours <= 36) {
      recommendations.push(`Keep live transcript ingestion running through the hearing window so member questioning on ${issue} is captured in real time.`);
    }
  }

  return recommendations.slice(0, 4);
}

function getDominantPosition(entry: CommitteeIntelEntitySummary): CommitteeIntelPosition {
  return entry.positions[0]?.position ?? "unknown";
}

function buildWitnessRankings(
  activeWitnesses: CommitteeIntelEntitySummary[],
  keyMoments: CommitteeIntelMoment[],
): CommitteeIntelWitnessRanking[] {
  const keyMomentCounts = new Map<string, number>();
  for (const moment of keyMoments) {
    const key = normalizeText(moment.speakerName);
    if (!key) continue;
    keyMomentCounts.set(key, (keyMomentCounts.get(key) ?? 0) + 1);
  }

  return activeWitnesses
    .map((entry) => {
      const issueBreadth = entry.positions.length;
      const keyMomentCount = keyMomentCounts.get(normalizeText(entry.entityName)) ?? 0;
      const dominantPosition = getDominantPosition(entry);
      const score = clamp(
        entry.mentionCount * 12 +
          issueBreadth * 8 +
          keyMomentCount * 10 +
          (entry.invited ? 15 : 0) +
          (entry.entityType === "agency" ? 6 : 0) +
          (dominantPosition !== "monitoring" && dominantPosition !== "unknown" ? 8 : 0),
        0,
        100,
      );

      const summaryParts = [
        `${entry.entityName} appeared ${entry.mentionCount} time${entry.mentionCount === 1 ? "" : "s"}`,
        entry.primaryIssues.length > 0 ? `across ${entry.primaryIssues.slice(0, 2).join(" and ")}` : undefined,
        entry.invited ? "as invited testimony" : undefined,
      ].filter(Boolean);

      return {
        rank: 0,
        entityName: entry.entityName,
        entityType: entry.entityType,
        stakeholderId: entry.stakeholderId,
        affiliation: entry.affiliation,
        invited: entry.invited,
        score,
        dominantPosition,
        mentionCount: entry.mentionCount,
        issueBreadth,
        keyMomentCount,
        primaryIssues: entry.primaryIssues,
        summary: `${summaryParts.join(" ")}.`,
      } satisfies CommitteeIntelWitnessRanking;
    })
    .sort((left, right) => right.score - left.score || right.mentionCount - left.mentionCount)
    .slice(0, 10)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function buildMemberPressurePoints(electedFocus: CommitteeIntelEntitySummary[]): string[] {
  return electedFocus.slice(0, 5).map((entry) => {
    const topIssue = entry.positions[0]?.label ?? "the central issues";
    const topPosition = getDominantPosition(entry).replace(/_/g, " ");
    return `${entry.entityName} concentrated on ${topIssue} and is primarily ${topPosition}.`;
  });
}

function buildAgencyCommitments(segments: CommitteeIntelSegmentRow[]): string[] {
  return segments
    .filter((segment) =>
      (segment.speakerRole === "agency" || segment.invited) &&
      /\b(will|plan to|committed|recommend|working on|next step|we are going to|intend to)\b/i.test(segment.transcriptText),
    )
    .sort((left, right) => right.importance - left.importance)
    .slice(0, 5)
    .map((segment) => `${segment.speakerName || segment.affiliation || "Witness"}: ${segment.summary ?? segment.transcriptText.slice(0, 180)}`);
}

function buildPostHearingRecap(
  session: CommitteeIntelSessionRow,
  issueCoverage: CommitteeIntelIssueSummary[],
  electedFocus: CommitteeIntelEntitySummary[],
  witnessRankings: CommitteeIntelWitnessRanking[],
  segments: CommitteeIntelSegmentRow[],
): CommitteeIntelPostHearingRecap | null {
  if (segments.length === 0) return null;

  const topIssues = issueCoverage.slice(0, 4);
  const issueLabels = topIssues.map((issue) => issue.label);
  const headline = issueLabels.length > 0
    ? `${session.committee} recap: ${issueLabels.join(", ")} dominated the hearing.`
    : `${session.committee} recap: testimony centered on the committee's interim agenda.`;
  const overview = [
    `The session generated ${segments.length} tracked transcript segments and ${witnessRankings.length} ranked witnesses or agencies.`,
    topIssues.length > 0
      ? `Primary areas of focus were ${topIssues.map((issue) => `${issue.label} (${issue.mentionCount} mentions)`).join(", ")}.`
      : `No single issue cluster dominated the hearing record.`,
  ].join(" ");

  const issueHighlights = topIssues.map((issue) => {
    const entityText = issue.keyEntities.length > 0 ? ` Key voices: ${issue.keyEntities.join(", ")}.` : "";
    return `${issue.label}: ${issue.mentionCount} mentions, ${issue.supportCount} support, ${issue.opposeCount} oppose, ${issue.questioningCount} questioning.${entityText}`;
  });

  const followUpActions = [
    witnessRankings.length > 0
      ? `Follow up with ${witnessRankings.slice(0, 2).map((entry) => entry.entityName).join(" and ")} while the hearing record is still fresh.`
      : null,
    electedFocus.length > 0
      ? `Prepare a member-specific response for ${electedFocus.slice(0, 2).map((entry) => entry.entityName).join(" and ")} based on their questioning.`
      : null,
    topIssues.length > 0
      ? `Build a short readout on ${topIssues[0].label} for client distribution after testimony closes.`
      : null,
  ].filter((value): value is string => Boolean(value));

  return {
    generatedAt: new Date().toISOString(),
    headline,
    overview,
    issueHighlights,
    memberPressurePoints: buildMemberPressurePoints(electedFocus),
    witnessLeaderboard: witnessRankings.slice(0, 5),
    agencyCommitments: buildAgencyCommitments(segments),
    followUpActions,
  };
}

async function loadSessionCore(sessionId: number): Promise<{ session: CommitteeIntelSessionRow; hearing: HearingRow | null } | null> {
  const [row] = await policyIntelDb
    .select({
      session: committeeIntelSessions,
      hearing: hearingEvents,
    })
    .from(committeeIntelSessions)
    .leftJoin(hearingEvents, eq(hearingEvents.id, committeeIntelSessions.hearingId))
    .where(eq(committeeIntelSessions.id, sessionId));

  if (!row) return null;
  return { session: row.session, hearing: row.hearing ?? null };
}

async function loadSessionSegments(sessionId: number): Promise<CommitteeIntelSegmentRow[]> {
  return policyIntelDb
    .select()
    .from(committeeIntelSegments)
    .where(eq(committeeIntelSegments.sessionId, sessionId))
    .orderBy(asc(committeeIntelSegments.segmentIndex), asc(committeeIntelSegments.createdAt));
}

async function loadSessionSignals(sessionId: number): Promise<CommitteeIntelSignalRow[]> {
  return policyIntelDb
    .select()
    .from(committeeIntelSignals)
    .where(eq(committeeIntelSignals.sessionId, sessionId))
    .orderBy(desc(committeeIntelSignals.createdAt), asc(committeeIntelSignals.id));
}

async function loadSessionDetail(sessionId: number): Promise<CommitteeIntelSessionDetail | null> {
  const core = await loadSessionCore(sessionId);
  if (!core) return null;

  const [segments, signals] = await Promise.all([
    loadSessionSegments(sessionId),
    loadSessionSignals(sessionId),
  ]);

  return {
    session: core.session,
    hearing: core.hearing,
    segments,
    signals,
    analysis: parseStoredAnalysis(core.session, segments, signals),
  };
}

async function loadStakeholderContext(session: CommitteeIntelSessionRow) {
  const [stakeholderRows, committeeRows] = await Promise.all([
    policyIntelDb
      .select({
        id: stakeholders.id,
        name: stakeholders.name,
        type: stakeholders.type,
        organization: stakeholders.organization,
        party: stakeholders.party,
        chamber: stakeholders.chamber,
        title: stakeholders.title,
      })
      .from(stakeholders)
      .where(eq(stakeholders.workspaceId, session.workspaceId)),
    policyIntelDb
      .select({
        stakeholderId: committeeMembers.stakeholderId,
        role: committeeMembers.role,
        name: stakeholders.name,
        party: stakeholders.party,
        chamber: stakeholders.chamber,
      })
      .from(committeeMembers)
      .innerJoin(stakeholders, eq(stakeholders.id, committeeMembers.stakeholderId))
      .where(and(
        ilike(committeeMembers.committeeName, session.committee),
        eq(committeeMembers.chamber, session.chamber),
      )),
  ]);

  const { byName, byOrganization } = buildStakeholderLookups(stakeholderRows);
  const committeeMemberMap = new Map<string, CommitteeMemberLookupEntry>();

  for (const row of committeeRows) {
    committeeMemberMap.set(normalizeText(row.name), row);
  }

  return {
    stakeholderRows,
    stakeholderByName: byName,
    stakeholderByOrganization: byOrganization,
    committeeMemberMap,
  };
}

function deriveSegment(
  segment: CommitteeIntelSegmentRow,
  session: CommitteeIntelSessionRow,
): Pick<CommitteeIntelSegmentRow, "speakerRole" | "summary" | "issueTagsJson" | "position" | "importance" | "invited" | "metadataJson"> {
  const issueLabels = buildIssueLabelMap(session);
  const speakerRole = determineSpeakerRole(segment.speakerRole, segment.speakerName, segment.affiliation, segment.transcriptText);
  const issueTagsJson = detectIssueTags(segment.transcriptText, session.focusTopicsJson);
  const position = determinePosition(segment.transcriptText, speakerRole);
  const invited = detectInvitedWitness(segment.transcriptText, speakerRole, segment.invited);
  const importance = scoreImportance(segment.transcriptText, speakerRole, issueTagsJson, position, invited);
  const summary = summarizeSegment(segment.speakerName, segment.affiliation, issueTagsJson, position, issueLabels);
  const metadataJson = {
    ...(segment.metadataJson ?? {}),
    wordCount: normalizeText(segment.transcriptText).split(" ").filter(Boolean).length,
  } as Record<string, unknown>;

  return {
    speakerRole,
    summary,
    issueTagsJson,
    position,
    importance,
    invited,
    metadataJson,
  };
}

function buildStoredSegmentExternalKey(segment: CommitteeIntelSegmentRow): string {
  const metadata = getMetadataRecord(segment.metadataJson);
  const metadataKey = typeof metadata.externalKey === "string" ? metadata.externalKey : null;
  if (metadataKey) return metadataKey;

  return buildTranscriptExternalKey([
    segment.sessionId,
    segment.segmentIndex,
    segment.startedAtSecond,
    segment.endedAtSecond,
    segment.speakerName,
    segment.affiliation,
    segment.transcriptText,
  ]);
}

function buildStoredSegmentDedupKey(segment: CommitteeIntelSegmentRow): string {
  const metadata = getMetadataRecord(segment.metadataJson);
  const storedKey = typeof metadata.dedupKey === "string" ? metadata.dedupKey.trim() : "";
  if (storedKey) return storedKey;

  return buildTranscriptFeedIdentityKey(
    segment.sessionId,
    typeof metadata.sourceType === "string" ? metadata.sourceType : null,
    typeof metadata.feedCursor === "string" ? metadata.feedCursor : null,
    typeof metadata.sourceId === "string" || typeof metadata.sourceId === "number" ? metadata.sourceId : null,
  ) ?? buildStoredSegmentExternalKey(segment);
}

function buildStoredSegmentFeedIdentity(segment: CommitteeIntelSegmentRow): string | null {
  const metadata = getMetadataRecord(segment.metadataJson);
  return buildTranscriptFeedIdentityKey(
    segment.sessionId,
    typeof metadata.sourceType === "string" ? metadata.sourceType : null,
    typeof metadata.feedCursor === "string" ? metadata.feedCursor : null,
    typeof metadata.sourceId === "string" || typeof metadata.sourceId === "number" ? metadata.sourceId : null,
  );
}

async function getNextSegmentIndex(sessionId: number): Promise<number> {
  const [lastSegment] = await policyIntelDb
    .select({ segmentIndex: committeeIntelSegments.segmentIndex })
    .from(committeeIntelSegments)
    .where(eq(committeeIntelSegments.sessionId, sessionId))
    .orderBy(desc(committeeIntelSegments.segmentIndex))
    .limit(1);

  return (lastSegment?.segmentIndex ?? -1) + 1;
}

function buildCommitteeIntelSegmentValues(
  session: CommitteeIntelSessionRow,
  segmentIndex: number,
  request: AddCommitteeIntelSegmentRequest,
  current?: Pick<CommitteeIntelSegmentRow, "id" | "createdAt">,
) {
  const capturedAt = toDate(request.capturedAt) ?? new Date();
  const createdAt = current?.createdAt ? toDate(current.createdAt) ?? new Date() : new Date();
  const baseSegment = {
    id: current?.id ?? 0,
    sessionId: session.id,
    segmentIndex,
    capturedAt,
    startedAtSecond: request.startedAtSecond ?? null,
    endedAtSecond: request.endedAtSecond ?? null,
    speakerName: request.speakerName?.trim() || null,
    speakerRole: request.speakerRole ?? "unknown",
    affiliation: request.affiliation?.trim() || null,
    transcriptText: request.transcriptText.trim(),
    summary: null,
    issueTagsJson: [],
    position: "unknown" as CommitteeIntelPosition,
    importance: 0,
    invited: request.invited ?? false,
    metadataJson: request.metadata ?? {},
    createdAt,
  } as CommitteeIntelSegmentRow;

  const derived = deriveSegment(baseSegment, session);
  return {
    sessionId: session.id,
    segmentIndex: baseSegment.segmentIndex,
    capturedAt,
    startedAtSecond: baseSegment.startedAtSecond,
    endedAtSecond: baseSegment.endedAtSecond,
    speakerName: baseSegment.speakerName,
    speakerRole: derived.speakerRole,
    affiliation: baseSegment.affiliation,
    transcriptText: baseSegment.transcriptText,
    summary: derived.summary,
    issueTagsJson: derived.issueTagsJson,
    position: derived.position,
    importance: derived.importance,
    invited: derived.invited,
    metadataJson: derived.metadataJson,
  };
}

async function insertCommitteeIntelSegments(
  session: CommitteeIntelSessionRow,
  requests: AddCommitteeIntelSegmentRequest[],
): Promise<CommitteeIntelSegmentRow[]> {
  if (requests.length === 0) return [];

  const startingIndex = await getNextSegmentIndex(session.id);
  const rows = requests.map((request, requestIndex) =>
    buildCommitteeIntelSegmentValues(session, startingIndex + requestIndex, request),
  );
  const inserted: CommitteeIntelSegmentRow[] = [];
  const batchSize = 250;

  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const created = await policyIntelDb.insert(committeeIntelSegments).values(batch).returning();
    inserted.push(...created);
  }

  return inserted;
}

async function updateCommitteeIntelSegment(
  session: CommitteeIntelSessionRow,
  segment: CommitteeIntelSegmentRow,
  request: AddCommitteeIntelSegmentRequest,
): Promise<CommitteeIntelSegmentRow> {
  const values = buildCommitteeIntelSegmentValues(
    session,
    segment.segmentIndex,
    request,
    { id: segment.id, createdAt: segment.createdAt },
  );

  const [updated] = await policyIntelDb
    .update(committeeIntelSegments)
    .set({
      capturedAt: values.capturedAt,
      startedAtSecond: values.startedAtSecond,
      endedAtSecond: values.endedAtSecond,
      speakerName: values.speakerName,
      speakerRole: values.speakerRole,
      affiliation: values.affiliation,
      transcriptText: values.transcriptText,
      summary: values.summary,
      issueTagsJson: values.issueTagsJson,
      position: values.position,
      importance: values.importance,
      invited: values.invited,
      metadataJson: values.metadataJson,
    })
    .where(eq(committeeIntelSegments.id, segment.id))
    .returning();

  return updated ?? { ...segment, ...values };
}

async function mergeDuplicateFeedSegments(session: CommitteeIntelSessionRow): Promise<void> {
  const segments = await loadSessionSegments(session.id);
  const grouped = new Map<string, CommitteeIntelSegmentRow[]>();

  for (const segment of segments) {
    const identityKey = buildStoredSegmentFeedIdentity(segment);
    if (!identityKey) continue;

    const current = grouped.get(identityKey) ?? [];
    current.push(segment);
    grouped.set(identityKey, current);
  }

  for (const group of grouped.values()) {
    if (group.length < 2) continue;

    const orderedByIndex = [...group].sort((left, right) => left.segmentIndex - right.segmentIndex || left.id - right.id);
    const orderedByFreshness = [...group].sort((left, right) => {
      const rightTime = toDate(right.createdAt)?.getTime() ?? 0;
      const leftTime = toDate(left.createdAt)?.getTime() ?? 0;
      return rightTime - leftTime || right.id - left.id;
    });

    const keeper = orderedByIndex[0];
    const canonical = orderedByFreshness[0];
    if (canonical.id !== keeper.id) {
      await updateCommitteeIntelSegment(session, keeper, {
        capturedAt: toIsoString(canonical.capturedAt) ?? undefined,
        startedAtSecond: canonical.startedAtSecond,
        endedAtSecond: canonical.endedAtSecond,
        speakerName: canonical.speakerName ?? undefined,
        speakerRole: canonical.speakerRole,
        affiliation: canonical.affiliation ?? undefined,
        transcriptText: canonical.transcriptText,
        invited: canonical.invited,
        metadata: getMetadataRecord(canonical.metadataJson),
      });
    }

    const duplicateIds = group
      .filter((segment) => segment.id !== keeper.id)
      .map((segment) => segment.id);

    if (duplicateIds.length === 0) continue;

    await policyIntelDb
      .delete(committeeIntelSignals)
      .where(and(
        eq(committeeIntelSignals.sessionId, session.id),
        inArray(committeeIntelSignals.segmentId, duplicateIds),
      ));

    await policyIntelDb
      .delete(committeeIntelSegments)
      .where(inArray(committeeIntelSegments.id, duplicateIds));
  }
}

function buildAnalysis(
  session: CommitteeIntelSessionRow,
  segments: CommitteeIntelSegmentRow[],
  signals: CommitteeIntelSignalRow[],
  committeeMemberMap: Map<string, CommitteeMemberLookupEntry>,
): CommitteeIntelAnalysis {
  if (segments.length === 0) {
    return buildEmptyAnalysis(session, 0, 0);
  }

  const issueLabels = buildIssueLabelMap(session);
  const segmentById = new Map<number, CommitteeIntelSegmentRow>(segments.map((segment) => [segment.id, segment]));

  const issueMap = new Map<string, CommitteeIntelIssueSummary>();
  for (const signal of signals) {
    const current = issueMap.get(signal.issueTag) ?? {
      issueTag: signal.issueTag,
      label: issueLabels.get(signal.issueTag) ?? labelFromTag(signal.issueTag),
      mentionCount: 0,
      supportCount: 0,
      opposeCount: 0,
      questioningCount: 0,
      neutralCount: 0,
      keyEntities: [],
    };

    current.mentionCount += 1;
    if (signal.position === "support") current.supportCount += 1;
    else if (signal.position === "oppose") current.opposeCount += 1;
    else if (signal.position === "questioning") current.questioningCount += 1;
    else current.neutralCount += 1;

    if (!current.keyEntities.includes(signal.entityName)) {
      current.keyEntities.push(signal.entityName);
    }

    issueMap.set(signal.issueTag, current);
  }

  const issueCoverage = Array.from(issueMap.values())
    .map((issue) => ({ ...issue, keyEntities: issue.keyEntities.slice(0, 4) }))
    .sort((left, right) => right.mentionCount - left.mentionCount);

  const keyMoments = segments
    .filter((segment) => segment.importance >= 35)
    .sort((left, right) => right.importance - left.importance || left.segmentIndex - right.segmentIndex)
    .slice(0, 12)
    .map<CommitteeIntelMoment>((segment) => ({
      segmentId: segment.id,
      timestampLabel: formatTimestampLabel(segment.startedAtSecond, segment.capturedAt),
      timestampSecond: segment.startedAtSecond ?? null,
      speakerName: segment.speakerName,
      speakerRole: segment.speakerRole,
      summary: segment.summary ?? summarizeSegment(segment.speakerName, segment.affiliation, segment.issueTagsJson, segment.position, issueLabels),
      importance: segment.importance,
      position: segment.position,
      issueTags: segment.issueTagsJson,
    }));

  const entityMap = new Map<string, {
    entityName: string;
    entityType: CommitteeIntelEntityType;
    stakeholderId: number | null;
    affiliation: string | null;
    mentionCount: number;
    invited: boolean;
    positions: Map<string, { issueTag: string; label: string; counts: Record<CommitteeIntelPosition, number>; mentionCount: number; confidenceTotal: number; confidenceMax: number }>;
  }>();

  for (const signal of signals) {
    const normalizedName = normalizeText(signal.entityName);
    const key = `${normalizedName}|${signal.entityType}|${normalizeText(signal.affiliation)}`;
    const segment = signal.segmentId ? segmentById.get(signal.segmentId) ?? null : null;
    const current = entityMap.get(key) ?? {
      entityName: signal.entityName,
      entityType: signal.entityType,
      stakeholderId: signal.stakeholderId ?? null,
      affiliation: signal.affiliation ?? null,
      mentionCount: 0,
      invited: segment?.invited ?? false,
      positions: new Map(),
    };

    current.mentionCount += 1;
    current.invited = current.invited || Boolean(segment?.invited);
    if (current.stakeholderId === null && signal.stakeholderId !== null) {
      current.stakeholderId = signal.stakeholderId;
    }

    const issueEntry = current.positions.get(signal.issueTag) ?? {
      issueTag: signal.issueTag,
      label: issueLabels.get(signal.issueTag) ?? labelFromTag(signal.issueTag),
      counts: {
        support: 0,
        oppose: 0,
        questioning: 0,
        neutral: 0,
        monitoring: 0,
        unknown: 0,
      },
      mentionCount: 0,
      confidenceTotal: 0,
      confidenceMax: 0,
    };

    issueEntry.counts[signal.position] += 1;
    issueEntry.mentionCount += 1;
    issueEntry.confidenceTotal += signal.confidence;
    issueEntry.confidenceMax = Math.max(issueEntry.confidenceMax, signal.confidence);
    current.positions.set(signal.issueTag, issueEntry);
    entityMap.set(key, current);
  }

  const toEntitySummary = (entry: typeof entityMap extends Map<any, infer U> ? U : never): CommitteeIntelEntitySummary => {
    const positions = Array.from(entry.positions.values())
      .map<CommitteeIntelEntityPosition>((positionEntry) => {
        const ordered = Object.entries(positionEntry.counts).sort((left, right) => right[1] - left[1]);
        return {
          issueTag: positionEntry.issueTag,
          label: positionEntry.label,
          position: ordered[0]?.[0] as CommitteeIntelPosition ?? "unknown",
          confidence: Number((positionEntry.confidenceTotal / Math.max(positionEntry.mentionCount, 1)).toFixed(2)),
          mentionCount: positionEntry.mentionCount,
        };
      })
      .sort((left, right) => right.mentionCount - left.mentionCount);

    return {
      entityName: entry.entityName,
      entityType: entry.entityType,
      stakeholderId: entry.stakeholderId,
      affiliation: entry.affiliation,
      mentionCount: entry.mentionCount,
      invited: entry.invited,
      primaryIssues: positions.slice(0, 3).map((position) => position.label),
      positions,
    };
  };

  const entitySummaries = Array.from(entityMap.values())
    .map(toEntitySummary)
    .sort((left, right) => right.mentionCount - left.mentionCount);

  const electedFocus = entitySummaries
    .filter((entry) => entry.entityType === "legislator" || committeeMemberMap.has(normalizeText(entry.entityName)))
    .slice(0, 10);

  const activeWitnesses = entitySummaries
    .filter((entry) => entry.entityType !== "legislator")
    .slice(0, 10);

  const witnessRankings = buildWitnessRankings(activeWitnesses, keyMoments);
  const postHearingRecap = buildPostHearingRecap(session, issueCoverage, electedFocus, witnessRankings, segments);

  const positionMap = entitySummaries
    .flatMap<CommitteeIntelPositionRow>((entry) => entry.positions.map((position) => ({
      entityName: entry.entityName,
      entityType: entry.entityType,
      stakeholderId: entry.stakeholderId,
      affiliation: entry.affiliation,
      issueTag: position.issueTag,
      label: position.label,
      position: position.position,
      confidence: position.confidence,
      mentionCount: position.mentionCount,
      invited: entry.invited,
    })))
    .sort((left, right) => right.mentionCount - left.mentionCount)
    .slice(0, 40);

  return {
    analyzedAt: new Date().toISOString(),
    summary: buildAnalysisSummary(session, issueCoverage, electedFocus, activeWitnesses, segments.length),
    totalSegments: segments.length,
    totalSignals: signals.length,
    trackedEntities: entitySummaries.length,
    invitedWitnessCount: activeWitnesses.filter((entry) => entry.invited).length,
    issueCoverage,
    keyMoments,
    electedFocus,
    activeWitnesses,
    witnessRankings,
    postHearingRecap,
    positionMap,
  };
}

export async function listCommitteeIntelSessions(filters?: {
  workspaceId?: number;
  hearingId?: number;
  status?: CommitteeIntelSessionRow["status"];
  from?: string;
}): Promise<CommitteeIntelSessionRow[]> {
  const conditions = [];
  if (filters?.workspaceId) conditions.push(eq(committeeIntelSessions.workspaceId, filters.workspaceId));
  if (filters?.hearingId) conditions.push(eq(committeeIntelSessions.hearingId, filters.hearingId));
  if (filters?.status) conditions.push(eq(committeeIntelSessions.status, filters.status));
  if (filters?.from) {
    const fromDate = toDate(filters.from);
    if (fromDate) conditions.push(gte(committeeIntelSessions.hearingDate, fromDate));
  }

  return policyIntelDb
    .select()
    .from(committeeIntelSessions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(committeeIntelSessions.hearingDate), asc(committeeIntelSessions.id));
}

export async function createCommitteeIntelSessionFromHearing(
  request: CreateCommitteeIntelSessionRequest,
): Promise<CommitteeIntelSessionDetail> {
  const [hearingRow] = await policyIntelDb
    .select({
      hearing: hearingEvents,
      agendaUrl: sourceDocuments.sourceUrl,
    })
    .from(hearingEvents)
    .leftJoin(sourceDocuments, eq(sourceDocuments.id, hearingEvents.sourceDocumentId))
    .where(eq(hearingEvents.id, request.hearingId));

  if (!hearingRow) {
    throw new Error(`Hearing ${request.hearingId} not found`);
  }

  const [existing] = await policyIntelDb
    .select({ id: committeeIntelSessions.id })
    .from(committeeIntelSessions)
    .where(and(
      eq(committeeIntelSessions.workspaceId, request.workspaceId),
      eq(committeeIntelSessions.hearingId, request.hearingId),
    ));

  if (existing) {
    return updateCommitteeIntelSession(existing.id, {
      title: request.title,
      focusTopics: request.focusTopics,
      interimCharges: request.interimCharges,
      clientContext: request.clientContext,
      monitoringNotes: request.monitoringNotes,
      videoUrl: request.videoUrl,
      agendaUrl: request.agendaUrl ?? hearingRow.agendaUrl ?? null,
      transcriptSourceType: request.transcriptSourceType,
      transcriptSourceUrl: request.transcriptSourceUrl,
      autoIngestEnabled: request.autoIngestEnabled,
      autoIngestIntervalSeconds: request.autoIngestIntervalSeconds,
      status: request.status,
    });
  }

  const transcriptSourceType = request.transcriptSourceType ?? "manual";
  const transcriptSourceUrl = resolveCandidateTranscriptSourceUrl(
    transcriptSourceType,
    request.transcriptSourceUrl,
    request.videoUrl,
  );
  const autoIngestEnabled = Boolean(request.autoIngestEnabled);
  const autoIngestIntervalSeconds = clamp(request.autoIngestIntervalSeconds ?? 120, 30, 3600);
  const autoIngestStatus = resolveAutoIngestStatus(transcriptSourceType, transcriptSourceUrl, autoIngestEnabled, "idle");

  const [created] = await policyIntelDb
    .insert(committeeIntelSessions)
    .values({
      workspaceId: request.workspaceId,
      hearingId: hearingRow.hearing.id,
      title: request.title?.trim() || `${hearingRow.hearing.committee} Committee Intelligence`,
      committee: hearingRow.hearing.committee,
      chamber: hearingRow.hearing.chamber,
      hearingDate: hearingRow.hearing.hearingDate,
      status: request.status ?? "planned",
      agendaUrl: request.agendaUrl ?? hearingRow.agendaUrl ?? null,
      videoUrl: request.videoUrl ?? null,
      transcriptSourceType,
      transcriptSourceUrl,
      autoIngestEnabled,
      autoIngestIntervalSeconds,
      autoIngestStatus,
      focusTopicsJson: cleanList(request.focusTopics),
      interimChargesJson: cleanList(request.interimCharges),
      clientContext: request.clientContext?.trim() || null,
      monitoringNotes: request.monitoringNotes?.trim() || null,
      analyticsJson: {},
    })
    .returning();

  return refreshCommitteeIntelSession(created.id);
}

export async function getCommitteeIntelSession(sessionId: number): Promise<CommitteeIntelSessionDetail | null> {
  return loadSessionDetail(sessionId);
}

export async function deleteCommitteeIntelSession(
  sessionId: number,
): Promise<{ ok: true; sessionId: number }> {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }

  await policyIntelDb
    .delete(committeeIntelSessions)
    .where(eq(committeeIntelSessions.id, sessionId));

  return { ok: true, sessionId };
}

export async function resetCommitteeIntelSession(
  sessionId: number,
): Promise<{ detail: CommitteeIntelSessionDetail; reset: CommitteeIntelResetResult }> {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }

  const [segments, signals] = await Promise.all([
    loadSessionSegments(sessionId),
    loadSessionSignals(sessionId),
  ]);

  await policyIntelDb
    .delete(committeeIntelSignals)
    .where(eq(committeeIntelSignals.sessionId, sessionId));

  await policyIntelDb
    .delete(committeeIntelSegments)
    .where(eq(committeeIntelSegments.sessionId, sessionId));

  await policyIntelDb
    .update(committeeIntelSessions)
    .set({
      status: "planned",
      autoIngestStatus: resolveAutoIngestStatus(
        core.session.transcriptSourceType,
        resolveTranscriptSourceUrl(core.session),
        core.session.autoIngestEnabled,
        "idle",
      ),
      autoIngestError: null,
      lastAutoIngestedAt: null,
      lastAutoIngestCursor: null,
      liveSummary: null,
      analyticsJson: {},
      lastAnalyzedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(committeeIntelSessions.id, sessionId));

  const detail = await refreshCommitteeIntelSession(sessionId);
  return {
    detail,
    reset: {
      sessionId,
      clearedSegments: segments.length,
      clearedSignals: signals.length,
      resetAt: new Date().toISOString(),
    },
  };
}

export async function rebuildCommitteeIntelSession(
  sessionId: number,
): Promise<CommitteeIntelRebuildResult> {
  const reset = await resetCommitteeIntelSession(sessionId);
  const synced = await syncCommitteeIntelTranscriptFeed(sessionId);
  return {
    detail: synced.detail,
    reset: reset.reset,
    sync: synced.sync,
  };
}

export async function updateCommitteeIntelSession(
  sessionId: number,
  patch: UpdateCommitteeIntelSessionRequest,
): Promise<CommitteeIntelSessionDetail> {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }

  const nextTranscriptSourceType = patch.transcriptSourceType ?? core.session.transcriptSourceType;
  const nextVideoUrl = patch.videoUrl === undefined ? core.session.videoUrl : patch.videoUrl;
  const nextTranscriptSourceUrl =
    patch.transcriptSourceUrl === undefined
      ? core.session.transcriptSourceUrl
      : resolveCandidateTranscriptSourceUrl(nextTranscriptSourceType, patch.transcriptSourceUrl, nextVideoUrl);
  const nextAutoIngestEnabled = patch.autoIngestEnabled ?? core.session.autoIngestEnabled;
  const nextAutoIngestIntervalSeconds = clamp(
    patch.autoIngestIntervalSeconds ?? core.session.autoIngestIntervalSeconds,
    30,
    3600,
  );
  const nextAutoIngestStatus = resolveAutoIngestStatus(
    nextTranscriptSourceType,
    nextTranscriptSourceUrl,
    nextAutoIngestEnabled,
    core.session.autoIngestStatus,
  );

  await policyIntelDb
    .update(committeeIntelSessions)
    .set({
      title: patch.title?.trim() || core.session.title,
      status: patch.status ?? core.session.status,
      agendaUrl: patch.agendaUrl === undefined ? core.session.agendaUrl : patch.agendaUrl,
      videoUrl: nextVideoUrl,
      transcriptSourceType: nextTranscriptSourceType,
      transcriptSourceUrl: nextTranscriptSourceUrl,
      autoIngestEnabled: nextAutoIngestEnabled,
      autoIngestIntervalSeconds: nextAutoIngestIntervalSeconds,
      autoIngestStatus: nextAutoIngestStatus,
      autoIngestError: nextAutoIngestStatus === "error" ? core.session.autoIngestError : null,
      focusTopicsJson: patch.focusTopics ? cleanList(patch.focusTopics) : core.session.focusTopicsJson,
      interimChargesJson: patch.interimCharges ? cleanList(patch.interimCharges) : core.session.interimChargesJson,
      clientContext: patch.clientContext === undefined ? core.session.clientContext : patch.clientContext,
      monitoringNotes: patch.monitoringNotes === undefined ? core.session.monitoringNotes : patch.monitoringNotes,
      liveSummary: patch.liveSummary === undefined ? core.session.liveSummary : patch.liveSummary,
      updatedAt: new Date(),
    })
    .where(eq(committeeIntelSessions.id, sessionId));

  return refreshCommitteeIntelSession(sessionId);
}

export async function addCommitteeIntelSegment(
  sessionId: number,
  request: AddCommitteeIntelSegmentRequest,
): Promise<CommitteeIntelSessionDetail> {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }

  const transcriptText = request.transcriptText.trim();
  if (!transcriptText) {
    throw new Error("transcriptText is required");
  }

  await insertCommitteeIntelSegments(core.session, [{
    ...request,
    transcriptText,
  }]);

  if (core.session.status === "planned") {
    await policyIntelDb
      .update(committeeIntelSessions)
      .set({
        status: "monitoring",
        updatedAt: new Date(),
      })
      .where(eq(committeeIntelSessions.id, sessionId));
  }

  return refreshCommitteeIntelSession(sessionId);
}

export async function syncCommitteeIntelTranscriptFeed(
  sessionId: number,
): Promise<{ detail: CommitteeIntelSessionDetail; sync: CommitteeIntelTranscriptSyncResult }> {
  const attemptStartedAt = new Date();
  const attemptedAt = attemptStartedAt.toISOString();
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }

  if (core.session.transcriptSourceType === "manual") {
    const message = "This session does not have an automatic transcript source configured";
    await policyIntelDb
      .update(committeeIntelSessions)
      .set({
        autoIngestStatus: core.session.autoIngestEnabled ? "error" : "idle",
        autoIngestError: message,
        updatedAt: new Date(),
      })
      .where(eq(committeeIntelSessions.id, sessionId));
    throw new Error(message);
  }

  await policyIntelDb
    .update(committeeIntelSessions)
    .set({
      autoIngestStatus: "syncing",
      autoIngestError: null,
      updatedAt: new Date(),
    })
    .where(eq(committeeIntelSessions.id, sessionId));

  try {
    let resolvedSource: CommitteeIntelResolvedSyncSource | null = null;
    let parsedEntries: NormalizedTranscriptFeedEntry[] = [];
    let cursor = core.session.lastAutoIngestCursor ?? null;

    resolvedSource = await resolveTranscriptSyncSource(core.session);

    if (resolvedSource.sourceMode === "feed") {
      if (!resolvedSource.sourceUrl || !resolvedSource.feedType) {
        throw new Error("Resolved transcript feed is missing a fetchable URL");
      }

      const response = await fetch(resolvedSource.sourceUrl, {
        headers: {
          Accept: "text/vtt,application/json,text/plain;q=0.9,*/*;q=0.5",
        },
      });

      if (!response.ok) {
        throw new Error(`Transcript feed request failed with status ${response.status}`);
      }

      const content = await response.text();
      parsedEntries = parseTranscriptFeed(content, resolvedSource.feedType, core.session);
      cursor = parsedEntries.at(-1)?.cursorValue ?? cursor;
    } else {
      if (!resolvedSource.officialSource) {
        throw new Error("Official source resolution did not return a playable source");
      }

      const transcription = await buildOfficialTranscriptEntries(core.session, resolvedSource.officialSource);
      parsedEntries = transcription.entries;
      cursor = transcription.cursor ?? cursor;
    }

    const upsertResult = await applyTranscriptEntries(core.session, parsedEntries);
    const persistedVideoUrl = core.session.videoUrl
      ?? cleanUrl(resolvedSource.officialSource?.officialPageUrl)
      ?? cleanUrl(resolvedSource.officialSource?.videoStreamUrl)
      ?? null;
    const persistedTranscriptSourceUrl = core.session.transcriptSourceType === "official"
      ? core.session.transcriptSourceUrl ?? cleanUrl(resolvedSource.officialSource?.transcriptUrl) ?? null
      : core.session.transcriptSourceUrl;

    await policyIntelDb
      .update(committeeIntelSessions)
      .set({
        status: core.session.status === "planned" && (upsertResult.ingestedSegments > 0 || upsertResult.updatedSegments > 0) ? "monitoring" : core.session.status,
        videoUrl: persistedVideoUrl,
        transcriptSourceUrl: persistedTranscriptSourceUrl,
        autoIngestStatus: resolveAutoIngestStatus(core.session.transcriptSourceType, resolvedSource.sourceUrl, core.session.autoIngestEnabled, "ready"),
        autoIngestError: null,
        lastAutoIngestedAt: new Date(),
        lastAutoIngestCursor: cursor,
        updatedAt: new Date(),
      })
      .where(eq(committeeIntelSessions.id, sessionId));

    const detail = await refreshCommitteeIntelSession(sessionId);
    const completedAtDate = new Date();
    const completedAt = completedAtDate.toISOString();
    const durationMs = completedAtDate.getTime() - attemptStartedAt.getTime();
    const nextWindow = getNextAutoIngestWindow(detail.session);
    return {
      detail,
      sync: {
        sessionId,
        sourceType: resolvedSource.sourceType,
        sourceMode: resolvedSource.sourceMode,
        sourceUrl: resolvedSource.sourceUrl,
        sourceLabel: resolvedSource.sourceLabel,
        resolvedFrom: resolvedSource.resolvedFrom,
        fetchedAt: new Date().toISOString(),
        totalParsed: parsedEntries.length,
        ingestedSegments: upsertResult.ingestedSegments,
        updatedSegments: upsertResult.updatedSegments,
        duplicateSegments: upsertResult.duplicateSegments,
        cursor,
        status: detail.session.autoIngestStatus,
        outcome: "synced",
        retryable: false,
        waitReason: null,
        attemptedAt,
        completedAt,
        durationMs,
        nextEligibleAutoIngestAt: nextWindow.nextEligibleAutoIngestAt,
        nextEligibleAutoIngestInSeconds: nextWindow.nextEligibleAutoIngestInSeconds,
      },
    };
  } catch (error: any) {
    const message = safeErrorMessage(error, "Transcript synchronization failed");

    if (isRetryableOfficialSourceError(core.session, message)) {
      const fallbackSourceUrl = resolveTranscriptSourceUrl(core.session);
      const nextAutoIngestStatus = resolveAutoIngestStatus(
        core.session.transcriptSourceType,
        fallbackSourceUrl,
        core.session.autoIngestEnabled,
        "ready",
      );

      await policyIntelDb
        .update(committeeIntelSessions)
        .set({
          autoIngestStatus: nextAutoIngestStatus,
          autoIngestError: null,
          lastAutoIngestedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(committeeIntelSessions.id, sessionId));

      const detail = await refreshCommitteeIntelSession(sessionId);
      const completedAtDate = new Date();
      const completedAt = completedAtDate.toISOString();
      const durationMs = completedAtDate.getTime() - attemptStartedAt.getTime();
      const nextWindow = getNextAutoIngestWindow(detail.session);
      return {
        detail,
        sync: {
          sessionId,
          sourceType: core.session.transcriptSourceType,
          sourceMode: "audio_transcription",
          sourceUrl: fallbackSourceUrl,
          sourceLabel: core.session.title,
          resolvedFrom: fallbackSourceUrl,
          fetchedAt: new Date().toISOString(),
          totalParsed: 0,
          ingestedSegments: 0,
          updatedSegments: 0,
          duplicateSegments: 0,
          cursor: core.session.lastAutoIngestCursor ?? null,
          status: detail.session.autoIngestStatus,
          outcome: "waiting_source",
          retryable: true,
          waitReason: classifyOfficialSourceWaitReason(message),
          attemptedAt,
          completedAt,
          durationMs,
          nextEligibleAutoIngestAt: nextWindow.nextEligibleAutoIngestAt,
          nextEligibleAutoIngestInSeconds: nextWindow.nextEligibleAutoIngestInSeconds,
          error: message,
        },
      };
    }

    await policyIntelDb
      .update(committeeIntelSessions)
      .set({
        autoIngestStatus: "error",
        autoIngestError: message,
        updatedAt: new Date(),
      })
      .where(eq(committeeIntelSessions.id, sessionId));
    throw new Error(message);
  }
}

export async function syncCommitteeIntelAutoIngestSessions(): Promise<Record<string, unknown>> {
  const startedAtDate = new Date();
  const rows = await policyIntelDb
    .select()
    .from(committeeIntelSessions)
    .where(eq(committeeIntelSessions.autoIngestEnabled, true))
    .orderBy(asc(committeeIntelSessions.hearingDate), asc(committeeIntelSessions.id));

  let sessionsSynced = 0;
  let sessionsWaiting = 0;
  let sessionsErrored = 0;
  let sessionsWithChanges = 0;
  let ingestedSegments = 0;
  let updatedSegments = 0;
  let sessionsSkipped = 0;
  const waitReasonCounts: Record<string, number> = {};
  const errors: string[] = [];

  for (const session of rows) {
    if (session.status === "completed") {
      sessionsSkipped += 1;
      continue;
    }

    const lastSync = toDate(session.lastAutoIngestedAt);
    const intervalMs = Math.max(session.autoIngestIntervalSeconds, 30) * 1000;
    if (lastSync && Date.now() - lastSync.getTime() < intervalMs) {
      sessionsSkipped += 1;
      continue;
    }

    try {
      const result = await syncCommitteeIntelTranscriptFeed(session.id);
      if (result.sync.outcome === "waiting_source") {
        sessionsWaiting += 1;
        const waitReason = result.sync.waitReason ?? "unknown";
        waitReasonCounts[waitReason] = (waitReasonCounts[waitReason] ?? 0) + 1;
        continue;
      }

      sessionsSynced += 1;
      ingestedSegments += result.sync.ingestedSegments;
      updatedSegments += result.sync.updatedSegments;
      if (result.sync.ingestedSegments > 0 || result.sync.updatedSegments > 0) {
        sessionsWithChanges += 1;
      }
    } catch (error: any) {
      sessionsErrored += 1;
      errors.push(`session ${session.id}: ${safeErrorMessage(error, "sync failed")}`);
    }
  }

  const completedAtDate = new Date();

  return {
    startedAt: startedAtDate.toISOString(),
    completedAt: completedAtDate.toISOString(),
    durationMs: completedAtDate.getTime() - startedAtDate.getTime(),
    sessionsChecked: rows.length,
    sessionsSynced,
    sessionsWaiting,
    sessionsErrored,
    sessionsWithChanges,
    sessionsSkipped,
    ingestedSegments,
    updatedSegments,
    waitReasonCounts,
    errors: errors.length,
    errorMessages: errors.slice(0, 10),
  };
}

export async function generateCommitteeIntelPostHearingRecap(
  sessionId: number,
): Promise<CommitteeIntelPostHearingRecap> {
  const detail = await refreshCommitteeIntelSession(sessionId);
  if (detail.analysis.postHearingRecap) {
    return detail.analysis.postHearingRecap;
  }

  return {
    generatedAt: new Date().toISOString(),
    headline: `${detail.session.committee} recap is not ready yet.`,
    overview: "No transcript segments have been ingested for this session yet.",
    issueHighlights: [],
    memberPressurePoints: [],
    witnessLeaderboard: [],
    agencyCommitments: [],
    followUpActions: ["Enable automatic transcript ingestion or add transcript segments before generating a recap."],
  };
}

export async function refreshCommitteeIntelSession(sessionId: number): Promise<CommitteeIntelSessionDetail> {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }

  const { committeeMemberMap, stakeholderByName, stakeholderByOrganization } = await loadStakeholderContext(core.session);
  const rawSegments = await loadSessionSegments(sessionId);

  const updatedSegments = await Promise.all(rawSegments.map(async (segment) => {
    const derived = deriveSegment(segment, core.session);
    const [updated] = await policyIntelDb
      .update(committeeIntelSegments)
      .set({
        speakerRole: derived.speakerRole,
        summary: derived.summary,
        issueTagsJson: derived.issueTagsJson,
        position: derived.position,
        importance: derived.importance,
        invited: derived.invited,
        metadataJson: derived.metadataJson,
      })
      .where(eq(committeeIntelSegments.id, segment.id))
      .returning();
    return updated ?? { ...segment, ...derived };
  }));

  await policyIntelDb.delete(committeeIntelSignals).where(eq(committeeIntelSignals.sessionId, sessionId));

  const signalPayloads = updatedSegments.flatMap((segment) => {
    const entityName = selectEntityName(segment, core.session.committee);
    if (!entityName || segment.issueTagsJson.length === 0) return [];

    const entityType = resolveEntityType(segment.speakerRole, segment.speakerName, segment.affiliation, committeeMemberMap);
    const stakeholderId = resolveStakeholderId(
      entityName,
      segment.affiliation,
      committeeMemberMap,
      stakeholderByName,
      stakeholderByOrganization,
    );
    const evidenceQuote = segment.transcriptText.replace(/\s+/g, " ").trim().slice(0, 320);
    const confidence = Number(Math.min(0.95, 0.45 + segment.importance / 120).toFixed(2));

    return segment.issueTagsJson.map((issueTag) => ({
      sessionId,
      segmentId: segment.id,
      stakeholderId,
      entityName,
      entityType,
      affiliation: segment.affiliation,
      issueTag,
      position: segment.position,
      confidence,
      evidenceQuote,
      sourceKind: "transcript",
    }));
  });

  const insertedSignals = signalPayloads.length > 0
    ? await policyIntelDb.insert(committeeIntelSignals).values(signalPayloads).returning()
    : [];

  const analysis = buildAnalysis(core.session, updatedSegments, insertedSignals, committeeMemberMap);

  const [updatedSession] = await policyIntelDb
    .update(committeeIntelSessions)
    .set({
      liveSummary: analysis.summary,
      analyticsJson: analysis as unknown as Record<string, unknown>,
      lastAnalyzedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(committeeIntelSessions.id, sessionId))
    .returning();

  return {
    session: updatedSession,
    hearing: core.hearing,
    segments: updatedSegments,
    signals: insertedSignals,
    analysis,
  };
}

export async function generateCommitteeIntelFocusedBrief(
  sessionId: number,
  issue: string,
): Promise<CommitteeIntelFocusedBrief> {
  const detail = await refreshCommitteeIntelSession(sessionId);
  const normalizedIssue = normalizeText(issue);
  const matchedIssues = detail.analysis.issueCoverage.filter((item) => {
    const normalizedLabel = normalizeText(item.label);
    return normalizedLabel.includes(normalizedIssue) || item.issueTag.includes(slugifyIssue(issue));
  });
  const matchedIssueTags = matchedIssues.length > 0
    ? matchedIssues.map((item) => item.issueTag)
    : detail.analysis.issueCoverage.slice(0, 1).map((item) => item.issueTag);

  const topMoments = detail.analysis.keyMoments
    .filter((moment) => moment.issueTags.some((tag) => matchedIssueTags.includes(tag)))
    .slice(0, 6);

  const relevantPositions = detail.analysis.positionMap.filter((row) => matchedIssueTags.includes(row.issueTag));
  const supporters = relevantPositions.filter((row) => row.position === "support").slice(0, 8);
  const opponents = relevantPositions.filter((row) => row.position === "oppose" || row.position === "questioning").slice(0, 8);
  const electedFocus = detail.analysis.electedFocus
    .filter((entry) => entry.positions.some((position) => matchedIssueTags.includes(position.issueTag)))
    .slice(0, 6);
  const activeWitnesses = detail.analysis.activeWitnesses
    .filter((entry) => entry.positions.some((position) => matchedIssueTags.includes(position.issueTag)))
    .slice(0, 6);

  const issueLabel = matchedIssues[0]?.label ?? issue;
  const summaryParts = [
    `${detail.session.committee} is tracking ${issueLabel}.`,
    supporters.length > 0
      ? `Support signals are led by ${supporters.slice(0, 3).map((row) => row.entityName).join(", ")}.`
      : `No clear support bloc has surfaced yet.`,
    opponents.length > 0
      ? `Concern or resistance is coming from ${opponents.slice(0, 3).map((row) => row.entityName).join(", ")}.`
      : `No direct opposition or skeptical questioning has been isolated yet.`,
    electedFocus.length > 0
      ? `${electedFocus.slice(0, 2).map((entry) => entry.entityName).join(" and ")} are the committee members most engaged on this issue.`
      : `Member questioning on this issue has not been isolated yet.`,
  ];

  return {
    issue: issueLabel,
    matchedIssueTags,
    summary: summaryParts.join(" "),
    topMoments,
    supporters,
    opponents,
    electedFocus,
    activeWitnesses,
    recommendations: buildRecommendations(
      issueLabel,
      supporters,
      opponents,
      electedFocus,
      activeWitnesses,
      toIsoString(detail.session.hearingDate),
    ),
  };
}