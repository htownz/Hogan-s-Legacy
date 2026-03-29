/**
 * LegiScan Connector — Texas Legislature Bills via LegiScan API
 *
 * Fetches Texas legislative bills from the LegiScan API and normalises
 * each bill into a PolicyIntelSourceDocument insert payload.
 *
 * Supports two modes:
 *  1. Full master-list ingest — fetches every bill in the current session
 *  2. Recent-only ingest — fetches bills changed in the last N days
 *
 * No side effects: this module only fetches + normalises.
 * Persistence is handled by the calling job (run-legiscan.ts).
 */
import axios from "axios";
import type { InsertPolicyIntelSourceDocument } from "@shared/schema-policy-intel";

// ── Types ────────────────────────────────────────────────────────────────────

export interface LegiscanBill {
  billId: number;
  billNumber: string;
  title: string;
  description: string;
  status: string;
  chamber: string;
  sponsors: Array<{ name: string; role: string; party: string }>;
  subjects: Array<{ subject_id: number; subject_name: string }>;
  url: string;
  stateLink: string;
  lastAction: { date: string; action: string; chamber: string } | null;
  statusDate: string;
  lastActionDate: string;
  history: Array<{ date: string; action: string; chamber: string }>;
  sessionId: number;
  sessionName: string;
}

export interface LegiscanFetchResult {
  sessionId: number;
  sessionName: string;
  totalInMaster: number;
  fetched: number;
  bills: LegiscanBill[];
  documents: InsertPolicyIntelSourceDocument[];
  errors: Array<{ billId: number; error: string }>;
}

// ── Constants ────────────────────────────────────────────────────────────────

const BASE_URL = "https://api.legiscan.com/";
const DEFAULT_DETAIL_CONCURRENCY = 6;
const MAX_DETAIL_CONCURRENCY = 12;

// ── Helpers ──────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env.LEGISCAN_API_KEY;
  if (!key) throw new Error("LEGISCAN_API_KEY is not set");
  return key;
}

function resolveDetailConcurrency(requested?: number): number {
  const raw =
    requested ??
    Number.parseInt(process.env.LEGISCAN_DETAIL_CONCURRENCY ?? `${DEFAULT_DETAIL_CONCURRENCY}`, 10);

  if (!Number.isFinite(raw) || raw < 1) {
    return DEFAULT_DETAIL_CONCURRENCY;
  }

  return Math.max(1, Math.min(MAX_DETAIL_CONCURRENCY, Math.floor(raw)));
}

// ── Fetch session ────────────────────────────────────────────────────────────

async function getCurrentTexasSession(
  apiKey: string,
): Promise<{ sessionId: number; sessionName: string }> {
  const res = await axios.get(BASE_URL, {
    params: { key: apiKey, op: "getSessionList", state: "TX" },
    timeout: 30_000,
  });

  const sessions = res.data?.sessions;
  if (!sessions || sessions.length === 0) {
    throw new Error("No Texas sessions returned from LegiScan");
  }

  const current = sessions.find((s: any) => s.current === 1) ?? sessions[0];
  return {
    sessionId: current.session_id,
    sessionName: current.session_name,
  };
}

// ── Fetch master list ────────────────────────────────────────────────────────

interface MasterListEntry {
  bill_id: number;
  number: string;
  title: string;
  description: string;
  status: string;
  status_date: string;
  last_action_date: string;
  url: string;
}

async function fetchMasterList(
  apiKey: string,
  sessionId: number,
): Promise<MasterListEntry[]> {
  const res = await axios.get(BASE_URL, {
    params: { key: apiKey, op: "getMasterList", id: sessionId },
    timeout: 60_000,
  });

  const raw = res.data?.masterlist;
  if (!raw) throw new Error("Empty master list response");

  // Master list is an object keyed by index; convert to array
  const entries: MasterListEntry[] = [];
  for (const key of Object.keys(raw)) {
    const entry = raw[key];
    if (entry?.bill_id) entries.push(entry);
  }

  return entries;
}

// ── Fetch bill detail ────────────────────────────────────────────────────────

async function fetchBillDetail(
  apiKey: string,
  billId: number,
): Promise<LegiscanBill | null> {
  const res = await axios.get(BASE_URL, {
    params: { key: apiKey, op: "getBill", id: billId },
    timeout: 30_000,
  });

  const bill = res.data?.bill;
  if (!bill) return null;

  const lastAction =
    bill.history?.length > 0
      ? bill.history[bill.history.length - 1]
      : null;

  return {
    billId: bill.bill_id,
    billNumber: bill.bill_number ?? "",
    title: bill.title ?? "",
    description: bill.description ?? "",
    status: bill.status_text ?? bill.status?.toString() ?? "Unknown",
    chamber: bill.body_name ?? "Unknown",
    sponsors: (bill.sponsors ?? []).map((s: any) => ({
      name: s.name ?? "Unknown",
      role: s.role ?? "Sponsor",
      party: s.party ?? "Unknown",
    })),
    subjects: bill.subjects ?? [],
    url: bill.url ?? "",
    stateLink: bill.state_link ?? "",
    lastAction: lastAction
      ? { date: lastAction.date, action: lastAction.action, chamber: lastAction.chamber }
      : null,
    statusDate: bill.status_date ?? "",
    lastActionDate: bill.last_action_date ?? "",
    history: (bill.history ?? []).map((h: any) => ({
      date: h.date,
      action: h.action,
      chamber: h.chamber ?? "",
    })),
    sessionId: bill.session_id ?? 0,
    sessionName: bill.session?.session_name ?? "",
  };
}

// ── Normalise to source document ─────────────────────────────────────────────

export function normaliseToSourceDocument(
  bill: LegiscanBill,
): InsertPolicyIntelSourceDocument {
  const externalId = `legiscan:${bill.billId}`;

  // Build rich normalised text for full-text watchlist matching
  const normalizedParts = [
    bill.billNumber,
    bill.title,
    bill.description,
    bill.status,
    bill.chamber,
    ...bill.sponsors.map((s) => `${s.name} (${s.party})`),
    ...bill.subjects.map((s) => s.subject_name),
    bill.lastAction ? `${bill.lastAction.date}: ${bill.lastAction.action}` : "",
  ].filter(Boolean);
  const normalizedText = normalizedParts.join("\n");

  // Tags — bill number, chamber, status, subjects, sponsor parties
  const tags: string[] = [
    bill.billNumber.replace(/\s+/g, "_").toUpperCase(),
    `chamber:${bill.chamber.toLowerCase()}`,
    `status:${bill.status.toLowerCase().replace(/\s+/g, "_")}`,
  ];
  for (const sub of bill.subjects) {
    tags.push(`subject:${sub.subject_name.toLowerCase().replace(/\s+/g, "_")}`);
  }

  const sourceUrl = bill.stateLink || bill.url || `https://legiscan.com/TX/bill/${bill.billNumber}`;

  return {
    sourceType: "texas_legislation",
    publisher: "LegiScan / Texas Legislature",
    sourceUrl,
    externalId,
    title: `${bill.billNumber} — ${bill.title}`.slice(0, 500),
    summary: bill.description?.slice(0, 1000) || null,
    publishedAt: bill.statusDate ? new Date(bill.statusDate) : null,
    normalizedText,
    rawPayload: {
      legiscanBillId: bill.billId,
      billNumber: bill.billNumber,
      chamber: bill.chamber,
      status: bill.status,
      sponsors: bill.sponsors,
      subjects: bill.subjects,
      lastAction: bill.lastAction,
      history: bill.history.slice(-10), // keep last 10 actions
      sessionId: bill.sessionId,
    },
    tagsJson: tags,
    checksum: null, // computed by source-document-service
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

export interface FetchOptions {
  /** Max bills to fetch details for (default: all) */
  limit?: number;
  /** Only fetch bills with last_action_date >= this (YYYY-MM-DD) */
  since?: string;
  /** Specific LegiScan session ID (default: current session) */
  sessionId?: number;
  /** Number of parallel detail requests (default: env or 6) */
  detailConcurrency?: number;
}

/**
 * Fetch Texas bills from LegiScan and return normalised source documents.
 *
 * By default fetches details for every bill in the current session.
 * Use `since` to limit to recently-changed bills (recommended for scheduled runs).
 * Use `limit` for testing.
 */
export async function fetchLegiscanBills(
  opts: FetchOptions = {},
): Promise<LegiscanFetchResult> {
  const apiKey = getApiKey();

  let sessionId: number;
  let sessionName: string;

  if (opts.sessionId) {
    // Use the explicitly requested session
    sessionId = opts.sessionId;
    // Fetch session list to resolve the name
    const res = await axios.get(BASE_URL, {
      params: { key: apiKey, op: "getSessionList", state: "TX" },
      timeout: 30_000,
    });
    const match = (res.data?.sessions ?? []).find((s: any) => s.session_id === sessionId);
    sessionName = match?.session_name ?? `Session ${sessionId}`;
  } else {
    const current = await getCurrentTexasSession(apiKey);
    sessionId = current.sessionId;
    sessionName = current.sessionName;
  }

  const masterList = await fetchMasterList(apiKey, sessionId);

  // Filter by recency if `since` is provided
  let candidates = masterList;
  if (opts.since) {
    candidates = masterList.filter((e) => e.last_action_date >= opts.since!);
  }

  // Apply limit
  if (opts.limit && opts.limit > 0) {
    candidates = candidates.slice(0, opts.limit);
  }

  const result: LegiscanFetchResult = {
    sessionId,
    sessionName,
    totalInMaster: masterList.length,
    fetched: 0,
    bills: [],
    documents: [],
    errors: [],
  };

  const detailConcurrency = Math.min(resolveDetailConcurrency(opts.detailConcurrency), candidates.length || 1);
  let nextIndex = 0;

  // Controlled parallelism drastically cuts ingest time without flooding the API.
  const workers = Array.from({ length: detailConcurrency }, async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= candidates.length) {
        return;
      }

      const entry = candidates[currentIndex];

      try {
        const bill = await fetchBillDetail(apiKey, entry.bill_id);
        if (!bill) {
          result.errors.push({ billId: entry.bill_id, error: "No detail returned" });
          continue;
        }

        result.bills.push(bill);
        result.documents.push(normaliseToSourceDocument(bill));
        result.fetched++;
      } catch (err: any) {
        result.errors.push({
          billId: entry.bill_id,
          error: err?.message ?? String(err),
        });
      }
    }
  });

  await Promise.all(workers);

  return result;
}
