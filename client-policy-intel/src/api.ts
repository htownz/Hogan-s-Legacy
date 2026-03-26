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

  // Source documents
  getSourceDocuments: () => apiFetch<SourceDocument[]>("/source-documents"),

  // Digest
  getDigest: (workspaceId: number, week?: string) =>
    apiFetch<Digest>(`/workspaces/${workspaceId}/digest${week ? `?week=${week}` : ""}`),

  // Stakeholders
  getStakeholders: () => apiFetch<Stakeholder[]>("/stakeholders"),
  getStakeholder: (id: number) => apiFetch<StakeholderDetail>(`/stakeholders/${id}`),

  // Deliverables
  getDeliverables: () => apiFetch<Deliverable[]>("/deliverables"),

  // Jobs
  runTloRss: () => apiFetch<unknown>("/jobs/run-tlo-rss", { method: "POST" }),
  runLocalFeeds: () => apiFetch<unknown>("/jobs/run-local-feeds", { method: "POST" }),
  runMatchExisting: () => apiFetch<unknown>("/jobs/match-existing", { method: "POST" }),
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
  title: string;
  summary: string | null;
  whyItMatters: string | null;
  status: string;
  relevanceScore: number;
  reasonsJson: EvaluatorBreakdown[];
  reviewerNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
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
  type: string;
  name: string;
  title: string | null;
  organization: string | null;
  jurisdiction: string | null;
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
