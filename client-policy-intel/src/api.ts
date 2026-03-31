const BASE = "/api/intel";

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json();
}

export const api = {
  // Health
  health: () => apiFetch<{ ok: boolean }>("/health"),

  // Matters
  getMatters: () => apiFetch<Matter[]>("/matters"),
  getMatter: (id: number) => apiFetch<Matter>(`/matters/${id}`),
  getMatterAlerts: (id: number) => apiFetch<Alert[]>(`/matters/${id}/alerts`),
  getMatterActivities: (id: number) => apiFetch<Activity[]>(`/matters/${id}/activities`),
  getMatterBriefs: (id: number) => apiFetch<Deliverable[]>(`/matters/${id}/briefs`),
  getMatterStakeholders: (id: number) => apiFetch<Stakeholder[]>(`/matters/${id}/stakeholders`),

  // Alerts
  getAlerts: (params?: { page?: number; limit?: number; status?: string; watchlistId?: number; minScore?: number; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.status && params.status !== "all") q.set("status", params.status);
    if (params?.watchlistId) q.set("watchlistId", String(params.watchlistId));
    if (params?.minScore !== undefined) q.set("minScore", String(params.minScore));
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return apiFetch<PaginatedResponse<Alert>>(`/alerts${qs ? `?${qs}` : ""}`);
  },
  patchAlert: (id: number, body: { status?: string; reviewerNote?: string }) =>
    apiFetch<Alert>(`/alerts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  getAlert: (id: number) => apiFetch<AlertDetail>(`/alerts/${id}`),
  createIssueRoomFromAlert: (id: number, body?: { matterId?: number; title?: string; issueType?: string; summary?: string }) =>
    apiFetch<{ issueRoom: IssueRoom; alert: Alert }>(`/alerts/${id}/create-issue-room`, { method: "POST", body: JSON.stringify(body ?? {}) }),

  // Issue rooms
  getIssueRooms: (workspaceId?: number) => apiFetch<{ data: IssueRoom[] }>(`/issue-rooms${workspaceId ? `?workspaceId=${workspaceId}` : ""}`).then(r => r.data),
  getIssueRoom: (id: number) => apiFetch<IssueRoomDetail>(`/issue-rooms/${id}`),
  getIssueRoomAlerts: (id: number) => apiFetch<Alert[]>(`/issue-rooms/${id}/alerts`),
  updateIssueRoom: (
    id: number,
    body: { title?: string; summary?: string; status?: string; recommendedPath?: string; issueType?: string; jurisdiction?: string },
  ) => apiFetch<IssueRoom>(`/issue-rooms/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  createIssueRoomUpdate: (id: number, body: { title: string; body: string; updateType?: string }) =>
    apiFetch<unknown>(`/issue-rooms/${id}/updates`, { method: "POST", body: JSON.stringify(body) }),
  createIssueRoomStrategyOption: (
    id: number,
    body: {
      label: string;
      description?: string;
      prosJson?: string[];
      consJson?: string[];
      politicalFeasibility?: string;
      legalDurability?: string;
      implementationComplexity?: string;
      recommendationRank?: number;
    },
  ) => apiFetch<unknown>(`/issue-rooms/${id}/strategy-options`, { method: "POST", body: JSON.stringify(body) }),
  createIssueRoomTask: (
    id: number,
    body: { title: string; description?: string; status?: string; priority?: string; assignee?: string; dueDate?: string },
  ) => apiFetch<unknown>(`/issue-rooms/${id}/tasks`, { method: "POST", body: JSON.stringify(body) }),
  updateIssueRoomTask: (
    issueRoomId: number,
    taskId: number,
    body: { status?: string; priority?: string; assignee?: string; dueDate?: string | null; completedAt?: string | null },
  ) => apiFetch<unknown>(`/issue-rooms/${issueRoomId}/tasks/${taskId}`, { method: "PATCH", body: JSON.stringify(body) }),
  createIssueRoomStakeholder: (
    id: number,
    body: {
      type: string;
      name: string;
      title?: string;
      organization?: string;
      jurisdiction?: string;
      tagsJson?: string[];
      sourceSummary?: string;
    },
  ) => apiFetch<unknown>(`/issue-rooms/${id}/stakeholders`, { method: "POST", body: JSON.stringify(body) }),

  // Source documents
  getSourceDocuments: (params?: { page?: number; limit?: number; sourceType?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.sourceType) q.set("sourceType", params.sourceType);
    if (params?.search) q.set("search", params.search);
    const qs = q.toString();
    return apiFetch<PaginatedResponse<SourceDocument>>(`/source-documents${qs ? `?${qs}` : ""}`);
  },

  // Dashboard
  getDashboardStats: () => apiFetch<DashboardStats>("/dashboard/stats"),
  getDashboardKpis: () => apiFetch<DashboardKpis>("/dashboard/kpis"),
  getDashboardAnalytics: () => apiFetch<DashboardAnalytics>("/dashboard/analytics"),

  // Champion / Challenger
  getChampionStatus: () => apiFetch<ChampionStatus>("/champion/status"),
  getChampionHistory: (limit?: number) =>
    apiFetch<ChampionSnapshot[]>(`/champion/history${limit ? `?limit=${limit}` : ""}`),
  triggerRetrain: () =>
    apiFetch<RetrainResult>("/champion/retrain", { method: "POST" }),

  // Digest
  getDigest: (workspaceId: number, week?: string) =>
    apiFetch<Digest>(`/workspaces/${workspaceId}/digest${week ? `?week=${week}` : ""}`),

  // Watchlists
  getWatchlists: () => apiFetch<{ data: Watchlist[] }>("/watchlists").then(r => r.data),
  getWatchlist: (id: number) => apiFetch<Watchlist>(`/watchlists/${id}`),
  getWatchlistAlerts: (id: number, params?: { page?: number; limit?: number; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.status && params.status !== "all") q.set("status", params.status);
    const qs = q.toString();
    return apiFetch<PaginatedResponse<Alert>>(`/watchlists/${id}/alerts${qs ? `?${qs}` : ""}`);
  },
  createWatchlist: (body: { workspaceId: number; name: string; topic?: string; description?: string }) =>
    apiFetch<Watchlist>("/watchlists", { method: "POST", body: JSON.stringify(body) }),

  // Stakeholders
  getStakeholders: () => apiFetch<Stakeholder[]>("/stakeholders"),
  getStakeholder: (id: number) => apiFetch<StakeholderDetail>(`/stakeholders/${id}`),
  addObservation: (stakeholderId: number, body: { observationText: string; confidence?: string; sourceDocumentId?: number; matterId?: number }) =>
    apiFetch<unknown>(`/stakeholders/${stakeholderId}/observations`, { method: "POST", body: JSON.stringify(body) }),

  // TEC
  searchTec: (searchTerm: string) => apiFetch<TecSearchResult>("/jobs/fetch-tec", { method: "POST", body: JSON.stringify({ searchTerm }) }),
  importTec: (body: { searchTerm: string; workspaceId: number; matterId?: number }) =>
    apiFetch<TecImportResult>("/jobs/run-tec-import", { method: "POST", body: JSON.stringify(body) }),

  // Deliverables
  getDeliverables: () => apiFetch<{ data: Deliverable[] }>("/deliverables").then(r => r.data),

  // Jobs
  runTloRss: () => apiFetch<unknown>("/jobs/run-tlo-rss", { method: "POST" }),
  runLocalFeeds: () => apiFetch<unknown>("/jobs/run-local-feeds", { method: "POST" }),
  runMatchExisting: () => apiFetch<unknown>("/jobs/match-existing", { method: "POST" }),
  runLegiscan: (body?: { mode?: "recent" | "full" | "backfill"; sinceDays?: number; limit?: number; sessionId?: number; detailConcurrency?: number }) =>
    apiFetch<unknown>("/jobs/run-legiscan", { method: "POST", body: JSON.stringify(body ?? {}) }),

  // Scheduler
  getSchedulerStatus: () => apiFetch<SchedulerStatus>("/scheduler/status"),
  getSchedulerHistory: () => apiFetch<JobRunRecord[]>("/scheduler/history"),
  triggerScheduledJob: (jobName: string) => apiFetch<JobRunRecord>(`/scheduler/trigger/${jobName}`, { method: "POST" }),

  // Brief generation
  generateBrief: (body: {
    workspaceId: number;
    sourceDocumentIds: number[];
    watchlistId?: number;
    matterId?: number;
    title?: string;
  }) => apiFetch<BriefGenerationResult>("/briefs/generate", { method: "POST", body: JSON.stringify(body) }),
  getBriefs: () => apiFetch<Brief[]>("/briefs"),

  // Bulk triage
  bulkTriage: (body: { suppressBelow?: number; promoteAbove?: number; dryRun?: boolean }) =>
    apiFetch<BulkTriageResult>("/alerts/bulk-triage", { method: "POST", body: JSON.stringify(body) }),

  // Watchlist PATCH
  patchWatchlist: (id: number, body: { name?: string; topic?: string; description?: string; rulesJson?: unknown; isActive?: boolean }) =>
    apiFetch<Watchlist>(`/watchlists/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  // Legislator import
  importLegislators: (body: { workspaceId: number }) =>
    apiFetch<LegislatorImportResult>("/stakeholders/import-legislators", { method: "POST", body: JSON.stringify(body) }),

  // Slack test
  testSlack: () =>
    apiFetch<{ sent: boolean; message: string }>("/notifications/test-slack", { method: "POST", body: JSON.stringify({}) }),

  // Hearings & Calendar
  getHearings: (params?: { from?: string; to?: string; chamber?: string; committee?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    if (params?.chamber) q.set("chamber", params.chamber);
    if (params?.committee) q.set("committee", params.committee);
    const qs = q.toString();
    return apiFetch<HearingEvent[]>(`/hearings${qs ? `?${qs}` : ""}`);
  },
  getThisWeekHearings: () => apiFetch<ThisWeekResponse>("/hearings/this-week"),
  getHearing: (id: number) => apiFetch<HearingEvent>(`/hearings/${id}`),
  syncHearings: () => apiFetch<{ totalDocs: number; created: number; skipped: number }>("/hearings/sync", { method: "POST" }),

  // Committee Members
  getCommitteeMembers: (params?: { stakeholderId?: number; committee?: string; chamber?: string }) => {
    const q = new URLSearchParams();
    if (params?.stakeholderId) q.set("stakeholderId", String(params.stakeholderId));
    if (params?.committee) q.set("committee", params.committee);
    if (params?.chamber) q.set("chamber", params.chamber);
    const qs = q.toString();
    return apiFetch<CommitteeMember[]>(`/committee-members${qs ? `?${qs}` : ""}`);
  },

  // Meeting Notes
  getMeetingNotes: (stakeholderId: number) => apiFetch<MeetingNote[]>(`/stakeholders/${stakeholderId}/meeting-notes`),
  addMeetingNote: (stakeholderId: number, body: { noteText: string; meetingDate?: string; contactMethod?: string; matterId?: number }) =>
    apiFetch<MeetingNote>(`/stakeholders/${stakeholderId}/meeting-notes`, { method: "POST", body: JSON.stringify(body) }),

  // Enhanced stakeholder
  getStakeholderFull: (id: number) => apiFetch<StakeholderFull>(`/stakeholders/${id}/full`),

  // Bill stakeholder query
  getStakeholdersForBill: (billId: string) => apiFetch<BillStakeholderResult>(`/stakeholders/for-bill/${encodeURIComponent(billId)}`),

  // ── Client Deliverables ─────────────────────────────────────────────────
  generateClientAlert: (body: {
    issueRoomId: number;
    workspaceId: number;
    matterId?: number;
    recipientName?: string;
    firmName?: string;
  }) => apiFetch<DeliverableResult>("/deliverables/generate-client-alert", { method: "POST", body: JSON.stringify(body) }),

  generateWeeklyReport: (body: {
    workspaceId: number;
    matterId?: number;
    week?: string;
    recipientName?: string;
    firmName?: string;
  }) => apiFetch<DeliverableResult>("/deliverables/generate-weekly-report", { method: "POST", body: JSON.stringify(body) }),

  generateHearingMemo: (body: {
    hearingId: number;
    workspaceId: number;
    matterId?: number;
    recipientName?: string;
    firmName?: string;
  }) => apiFetch<DeliverableResult>("/deliverables/generate-hearing-memo", { method: "POST", body: JSON.stringify(body) }),
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface Matter {
  id: number;
  workspaceId: number;
  slug: string;
  name: string;
  clientName: string | null;
  practiceArea: string | null;
  jurisdictionScope: string;
  status: string;
  description: string | null;
  tagsJson: string[];
  createdAt: string;
}

export interface Alert {
  id: number;
  workspaceId: number;
  watchlistId: number | null;
  sourceDocumentId: number | null;
  issueRoomId: number | null;
  title: string;
  summary: string | null;
  whyItMatters: string | null;
  status: string;
  relevanceScore: number;
  confidenceScore: number;
  reasonsJson: EvaluatorBreakdown[];
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface AlertDetail {
  alert: Alert;
  sourceDocument: SourceDocument | null;
  watchlist: Watchlist | null;
  issueRoom: IssueRoom | null;
}

export interface IssueRoom {
  id: number;
  workspaceId: number;
  matterId: number | null;
  slug: string;
  title: string;
  issueType: string | null;
  jurisdiction: string;
  status: string;
  summary: string | null;
  recommendedPath: string | null;
  relatedBillIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueRoomDetail {
  issueRoom: IssueRoom;
  sourceDocuments: SourceDocument[];
  sourceLinks: Array<{
    id: number;
    issueRoomId: number;
    sourceDocumentId: number;
    relationshipType: string;
    createdAt: string;
  }>;
  updates: Array<{
    id: number;
    issueRoomId: number;
    title: string;
    body: string;
    updateType: string;
    createdAt: string;
    updatedAt: string;
  }>;
  strategyOptions: Array<{
    id: number;
    issueRoomId: number;
    label: string;
    description: string | null;
    prosJson: string[];
    consJson: string[];
    politicalFeasibility: string | null;
    legalDurability: string | null;
    implementationComplexity: string | null;
    recommendationRank: number;
  }>;
  tasks: Array<{
    id: number;
    issueRoomId: number;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignee: string | null;
    dueDate: string | null;
    completedAt: string | null;
  }>;
  stakeholders: Stakeholder[];
}

export interface EvaluatorBreakdown {
  evaluator: string;
  evaluatorScore: number;
  maxScore: number;
  rationale: string;
}

export interface Activity {
  id: number;
  workspaceId: number;
  matterId: number | null;
  alertId: number | null;
  type: string;
  summary: string;
  detailText: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface SourceDocument {
  id: number;
  sourceType: string;
  publisher: string;
  sourceUrl: string;
  title: string;
  summary: string | null;
  publishedAt: string | null;
  fetchedAt: string;
  tagsJson: string[];
}

export interface Stakeholder {
  id: number;
  workspaceId: number;
  issueRoomId: number | null;
  type: string;
  name: string;
  title: string | null;
  organization: string | null;
  jurisdiction: string | null;
  tagsJson?: string[];
  sourceSummary?: string | null;
}

export interface StakeholderDetail extends Stakeholder {
  observations: Array<{
    id: number;
    observationText: string;
    confidence: string;
    createdAt: string;
  }>;
}

export interface Deliverable {
  id: number;
  workspaceId: number;
  matterId: number | null;
  type: string;
  title: string;
  bodyMarkdown: string | null;
  generatedBy: string;
  createdAt: string;
}

export interface DeliverableResult {
  deliverableId: number;
  type: string;
  title: string;
  bodyMarkdown: string;
  generatedBy: string;
}

export interface Watchlist {
  id: number;
  workspaceId: number;
  name: string;
  description: string | null;
  topic: string | null;
  isActive: boolean;
  rulesJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Digest {
  workspace: number;
  period: { start: string; end: string; week: string };
  summary: {
    totalAlerts: number;
    highPriority: number;
    pendingReview: number;
    reviewed: number;
    activitiesLogged: number;
  };
  sections: Array<{
    watchlist: string;
    alertCount: number;
    highPriority: number;
    alerts: Array<{ id: number; title: string; score: number; status: string; whyItMatters: string | null }>;
  }>;
  recentActivities: Array<{ id: number; type: string; summary: string; matterId: number | null; createdAt: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardStats {
  totalAlerts: number;
  pendingReview: number;
  highPriority: number;
  totalDocuments: number;
  activeMatters: number;
  activeWatchlists: number;
  recentAlerts: Alert[];
  recentDocuments: SourceDocument[];
  alertsByWatchlist: Array<{ watchlistId: number | null; watchlistName: string; count: number }>;
  alertsByStatus: Array<{ status: string; count: number }>;
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

export interface BriefGenerationResult {
  briefId: number;
  deliverableId: number;
  title: string;
  bodyMarkdown: string;
  citations: Array<{
    sourceDocumentId: number;
    title: string;
    publisher: string;
    sourceUrl: string;
    accessedAt: string;
  }>;
  generatedBy: string;
}

export interface Brief {
  id: number;
  workspaceId: number;
  watchlistId: number | null;
  title: string;
  status: string;
  briefText: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TecSearchResult {
  filers: Array<{ filerId: string; filerName: string; filerType: string; sourceUrl: string }>;
  lobbyists: Array<{ name: string; registrationId: string; clients: string[]; sourceUrl: string }>;
  errors: string[];
}

export interface TecImportResult {
  mode: string;
  searchTerms: string[];
  stakeholdersCreated: number;
  stakeholdersExisting: number;
  sourceDocsInserted: number;
  sourceDocsSkipped: number;
  observationsCreated: number;
  errors: string[];
}

// ── Dashboard KPIs ───────────────────────────────────────────────────────────

export interface SparklinePoint {
  t: number;
  alertsCreated: number;
  docsProcessed: number;
  pipelineRuns: number;
  escalations: number;
  avgScore: number;
  httpRequests: number;
}

export interface DashboardKpis {
  uptime: number;
  kpis: {
    totalAlerts: number;
    pendingReview: number;
    highPriority: number;
    pipelineRuns: number;
    alertsCreated: number;
    docsProcessed: number;
    docsMatched: number;
    matchRate: number;
    escalations: number;
    watches: number;
    archives: number;
    alertsSkipped: number;
  };
  pipeline: {
    avgScore: number;
    avgConfidence: number;
    avgDurationMs: number;
    totalRuns: number;
  };
  regime: string;
  agents: Array<{ agent: string; count: number; sum: number; mean: number }>;
  sparklines: SparklinePoint[];
}

// ── Champion / Challenger types ─────────────────────────────────────────────

export interface ChampionStatus {
  generation: number;
  weights: Record<string, number>;
  escalateThreshold: number;
  archiveThreshold: number;
  accuracy: number;
  feedbackCount: number;
  promotedAt: string;
  isDefault: boolean;
}

export interface ChampionSnapshot {
  generation: number;
  weights: Record<string, number>;
  escalateThreshold: number;
  archiveThreshold: number;
  accuracy: number;
  feedbackCount: number;
  promotedAt: string;
  metadata: Record<string, unknown>;
}

export interface RetrainResult {
  promoted: boolean;
  championAccuracy: number;
  challengerAccuracy: number;
  newGeneration: number | null;
  trainSize: number;
  holdoutSize: number;
  challengerWeights: Record<string, number>;
  challengerThresholds: { escalate: number; archive: number };
}

export interface BulkTriageResult {
  suppressed: number;
  promoted: number;
  suppressBelow: number;
  promoteAbove: number;
  dryRun?: boolean;
  wouldSuppress?: number;
  wouldPromote?: number;
}

export interface LegislatorImportResult {
  sessionId: number;
  sessionName: string;
  totalPeople: number;
  created: number;
  existing: number;
}

export interface DashboardAnalytics {
  scoreDistribution: Array<{ bucket: string; count: number }>;
  sourceTypeBreakdown: Array<{ source_type: string; count: number }>;
  dailyAlertVolume: Array<{ day: string; count: number }>;
}

// ── Hearing & Calendar types ─────────────────────────────────────────────────

export interface HearingEvent {
  id: number;
  workspaceId: number;
  sourceDocumentId: number | null;
  committee: string;
  chamber: string;
  hearingDate: string;
  timeDescription: string | null;
  location: string | null;
  description: string | null;
  relatedBillIds: string[];
  status: string;
  externalId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ThisWeekResponse {
  weekStart: string;
  weekEnd: string;
  hearings: HearingEvent[];
}

export interface CommitteeMember {
  id: number;
  stakeholderId: number;
  committeeName: string;
  chamber: string;
  role: string;
  sessionId: number | null;
  stakeholderName: string | null;
  stakeholderParty: string | null;
  stakeholderDistrict: string | null;
}

export interface MeetingNote {
  id: number;
  stakeholderId: number;
  matterId: number | null;
  noteText: string;
  meetingDate: string | null;
  contactMethod: string | null;
  createdAt: string;
}

export interface StakeholderFull extends Stakeholder {
  party: string | null;
  chamber: string | null;
  district: string | null;
  email: string | null;
  phone: string | null;
  officeAddress: string | null;
  photoUrl: string | null;
  legiscanPeopleId: number | null;
  observations: Array<{
    id: number;
    observationText: string;
    confidence: string;
    createdAt: string;
  }>;
  committees: CommitteeMember[];
  meetingNotes: MeetingNote[];
}

export interface BillStakeholderResult {
  billId: string;
  committees: string[];
  committeeMembers: Array<{
    committeeMemberId: number;
    committeeName: string;
    role: string;
    stakeholderId: number;
    name: string;
    party: string | null;
    chamber: string | null;
    district: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
  }>;
  relatedStakeholders: Array<{
    stakeholderId: number;
    name: string;
    party: string | null;
    chamber: string | null;
    district: string | null;
    title: string | null;
    email: string | null;
    phone: string | null;
    observationText: string;
  }>;
}
