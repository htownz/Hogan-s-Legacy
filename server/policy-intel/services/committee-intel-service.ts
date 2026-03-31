import { and, asc, desc, eq, gte, ilike } from "drizzle-orm";
import { policyIntelDb } from "../db";
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

  const normalizedName = normalizeText(speakerName);
  const normalizedAffiliation = normalizeText(affiliation);
  const normalizedTranscript = normalizeText(transcriptText);

  if (normalizedName.includes("chair") || normalizedTranscript.includes("chair recognizes")) return "chair";
  if (normalizedName.includes("senator") || normalizedName.includes("representative")) return "member";
  if (AGENCY_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "agency";
  if (normalizedTranscript.includes("invited testimony") || normalizedAffiliation.includes("invited")) return "invited_witness";
  if (normalizedTranscript.includes("public testimony") || normalizedTranscript.includes("public witness")) return "public_witness";
  if (normalizedAffiliation.includes("staff") || normalizedTranscript.includes("committee staff")) return "staff";
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
  const normalizedName = normalizeText(speakerName);
  const normalizedAffiliation = normalizeText(affiliation);

  if (committeeMemberMap.has(normalizedName) || speakerRole === "chair" || speakerRole === "member") return "legislator";
  if (speakerRole === "agency" || AGENCY_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "agency";
  if (speakerRole === "staff") return "staff";
  if (speakerRole === "invited_witness" || speakerRole === "public_witness") return "witness";
  if (ORGANIZATION_HINTS.some((hint) => normalizedAffiliation.includes(hint))) return "organization";
  if (speakerName && affiliation) return "witness";
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
      status: request.status,
    });
  }

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

export async function updateCommitteeIntelSession(
  sessionId: number,
  patch: UpdateCommitteeIntelSessionRequest,
): Promise<CommitteeIntelSessionDetail> {
  const core = await loadSessionCore(sessionId);
  if (!core) {
    throw new Error(`Committee intelligence session ${sessionId} not found`);
  }

  await policyIntelDb
    .update(committeeIntelSessions)
    .set({
      title: patch.title?.trim() || core.session.title,
      status: patch.status ?? core.session.status,
      agendaUrl: patch.agendaUrl === undefined ? core.session.agendaUrl : patch.agendaUrl,
      videoUrl: patch.videoUrl === undefined ? core.session.videoUrl : patch.videoUrl,
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

  const [lastSegment] = await policyIntelDb
    .select({ segmentIndex: committeeIntelSegments.segmentIndex })
    .from(committeeIntelSegments)
    .where(eq(committeeIntelSegments.sessionId, sessionId))
    .orderBy(desc(committeeIntelSegments.segmentIndex))
    .limit(1);

  const capturedAt = toDate(request.capturedAt) ?? new Date();
  const baseSegment = {
    id: 0,
    sessionId,
    segmentIndex: (lastSegment?.segmentIndex ?? -1) + 1,
    capturedAt,
    startedAtSecond: request.startedAtSecond ?? null,
    endedAtSecond: request.endedAtSecond ?? null,
    speakerName: request.speakerName?.trim() || null,
    speakerRole: request.speakerRole ?? "unknown",
    affiliation: request.affiliation?.trim() || null,
    transcriptText,
    summary: null,
    issueTagsJson: [],
    position: "unknown" as CommitteeIntelPosition,
    importance: 0,
    invited: request.invited ?? false,
    metadataJson: request.metadata ?? {},
    createdAt: new Date(),
  } as CommitteeIntelSegmentRow;

  const derived = deriveSegment(baseSegment, core.session);
  await policyIntelDb.insert(committeeIntelSegments).values({
    sessionId,
    segmentIndex: baseSegment.segmentIndex,
    capturedAt,
    startedAtSecond: baseSegment.startedAtSecond,
    endedAtSecond: baseSegment.endedAtSecond,
    speakerName: baseSegment.speakerName,
    speakerRole: derived.speakerRole,
    affiliation: baseSegment.affiliation,
    transcriptText,
    summary: derived.summary,
    issueTagsJson: derived.issueTagsJson,
    position: derived.position,
    importance: derived.importance,
    invited: derived.invited,
    metadataJson: derived.metadataJson,
  });

  return refreshCommitteeIntelSession(sessionId);
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