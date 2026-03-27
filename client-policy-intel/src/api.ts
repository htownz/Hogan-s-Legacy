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
  getAlerts: () => apiFetch<Alert[]>("/alerts"),
  patchAlert: (id: number, body: { status?: string; reviewerNote?: string }) =>
    apiFetch<Alert>(`/alerts/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  createIssueRoomFromAlert: (id: number, body?: { matterId?: number; title?: string; issueType?: string; summary?: string }) =>
    apiFetch<{ issueRoom: IssueRoom; alert: Alert }>(`/alerts/${id}/create-issue-room`, { method: "POST", body: JSON.stringify(body ?? {}) }),

  // Issue rooms
  getIssueRooms: (workspaceId?: number) => apiFetch<IssueRoom[]>(`/issue-rooms${workspaceId ? `?workspaceId=${workspaceId}` : ""}`),
  getIssueRoom: (id: number) => apiFetch<IssueRoomDetail>(`/issue-rooms/${id}`),
  getIssueRoomAlerts: (id: number) => apiFetch<Alert[]>(`/issue-rooms/${id}/alerts`),
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
  getSourceDocuments: () => apiFetch<SourceDocument[]>("/source-documents"),

  // Digest
  getDigest: (workspaceId: number, week?: string) =>
    apiFetch<Digest>(`/workspaces/${workspaceId}/digest${week ? `?week=${week}` : ""}`),

  // Watchlists
  getWatchlists: () => apiFetch<Watchlist[]>("/watchlists"),
  getWatchlist: (id: number) => apiFetch<Watchlist>(`/watchlists/${id}`),
  createWatchlist: (body: { workspaceId: number; name: string; topic?: string; description?: string }) =>
    apiFetch<Watchlist>("/watchlists", { method: "POST", body: JSON.stringify(body) }),

  // Stakeholders
  getStakeholders: () => apiFetch<Stakeholder[]>("/stakeholders"),
  getStakeholder: (id: number) => apiFetch<StakeholderDetail>(`/stakeholders/${id}`),

  // Deliverables
  getDeliverables: () => apiFetch<Deliverable[]>("/deliverables"),

  // Jobs
  runTloRss: () => apiFetch<unknown>("/jobs/run-tlo-rss", { method: "POST" }),
  runLocalFeeds: () => apiFetch<unknown>("/jobs/run-local-feeds", { method: "POST" }),
  runMatchExisting: () => apiFetch<unknown>("/jobs/match-existing", { method: "POST" }),
  runLegiscan: (body?: { mode?: "recent" | "full"; sinceDays?: number; limit?: number }) =>
    apiFetch<unknown>("/jobs/run-legiscan", { method: "POST", body: JSON.stringify(body ?? {}) }),
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
