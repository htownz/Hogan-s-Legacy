/**
 * Watchlist Matching Engine — deterministic, no LLM.
 *
 * Priority order:
 *  1. Bill identifier match   (e.g. "HB 14" in title / normalizedText)
 *  2. Keyword / phrase match  (case-insensitive, word-boundary aware)
 *  3. Committee name match    (from rawPayload.committee or normalizedText)
 *  4. Agency acronym match    (case-sensitive for short acronyms like TEA/TxDOT)
 *
 * Each dimension fires independently; the combined set of "hit reasons" becomes
 * the alert's reasonsJson.
 */
import type { PolicyIntelSourceDocument, PolicyIntelWatchlist } from "@shared/schema-policy-intel";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MatchReason {
  dimension: "bill_id" | "keyword" | "committee" | "agency";
  /** The rule value that triggered the match */
  rule: string;
  /** Short snippet from the document where the match occurred */
  excerpt: string;
}

export interface WatchlistMatch {
  watchlist: PolicyIntelWatchlist;
  reasons: MatchReason[];
}

// ── Rules helpers ────────────────────────────────────────────────────────────

interface ParsedRules {
  keywords: string[];
  committees: string[];
  agencies: string[];
  billPrefixes: string[];
  billIds: string[];
}

const BILL_ID_RE = /\b([HS][BJR]R?\s*\d+)\b/i;

function parseRules(rulesJson: Record<string, unknown>): ParsedRules {
  const toArr = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  return {
    keywords: toArr(rulesJson.keywords),
    committees: toArr(rulesJson.committees),
    agencies: toArr(rulesJson.agencies),
    billPrefixes: toArr(rulesJson.billPrefixes),
    billIds: toArr(rulesJson.billIds),
  };
}

// ── Matching functions ───────────────────────────────────────────────────────

function excerpt(text: string, term: string, radius = 60): string {
  const idx = text.toLowerCase().indexOf(term.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + term.length + radius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < text.length ? "..." : "";
  return prefix + text.slice(start, end) + suffix;
}

function matchBillIds(
  doc: PolicyIntelSourceDocument,
  rules: ParsedRules,
): MatchReason[] {
  const reasons: MatchReason[] = [];
  const corpus = `${doc.title}\n${doc.normalizedText ?? ""}`;

  // Check rawPayload.billId first (pre-extracted by connector)
  const billId =
    typeof (doc.rawPayload as Record<string, unknown>)?.billId === "string"
      ? ((doc.rawPayload as Record<string, unknown>).billId as string)
      : null;

  const extractedBillId = billId ?? extractBillIdFromText(corpus);

  // 1a. Exact bill ID match (e.g. "HB 5", "SB 14") — highest priority
  if (extractedBillId && rules.billIds.length > 0) {
    const normalised = extractedBillId.toUpperCase().replace(/\s+/g, " ").trim();
    for (const targetId of rules.billIds) {
      const normalTarget = targetId.toUpperCase().replace(/\s+/g, " ").trim();
      if (normalised === normalTarget) {
        reasons.push({
          dimension: "bill_id",
          rule: targetId,
          excerpt: excerpt(corpus, extractedBillId),
        });
      }
    }
  }

  // 1b. Bill prefix match (e.g. any "HB" / "SB") — broader fallback
  if (extractedBillId && rules.billPrefixes.length > 0 && reasons.length === 0) {
    const upper = extractedBillId.toUpperCase().replace(/\s+/g, "");
    const prefixMatch = rules.billPrefixes.some((p) => upper.startsWith(p));
    if (prefixMatch) {
      reasons.push({
        dimension: "bill_id",
        rule: extractedBillId,
        excerpt: excerpt(corpus, extractedBillId),
      });
    }
  }

  return reasons;
}

function matchKeywords(
  doc: PolicyIntelSourceDocument,
  rules: ParsedRules,
): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (rules.keywords.length === 0) return reasons;

  const corpus = `${doc.title}\n${doc.normalizedText ?? ""}`.toLowerCase();

  for (const kw of rules.keywords) {
    const lower = kw.toLowerCase();
    // Use word boundary check for short keywords (<=4 chars) to avoid false positives
    if (kw.length <= 4) {
      const re = new RegExp(`\\b${escapeRegex(lower)}\\b`, "i");
      if (re.test(corpus)) {
        reasons.push({
          dimension: "keyword",
          rule: kw,
          excerpt: excerpt(corpus, lower),
        });
      }
    } else if (corpus.includes(lower)) {
      reasons.push({
        dimension: "keyword",
        rule: kw,
        excerpt: excerpt(corpus, lower),
      });
    }
  }

  return reasons;
}

function matchCommittees(
  doc: PolicyIntelSourceDocument,
  rules: ParsedRules,
): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (rules.committees.length === 0) return reasons;

  const corpus = `${doc.title}\n${doc.normalizedText ?? ""}`;
  // Also check rawPayload.committee
  const rawCommittee =
    typeof (doc.rawPayload as Record<string, unknown>)?.committee === "string"
      ? ((doc.rawPayload as Record<string, unknown>).committee as string)
      : null;
  const fullCorpus = rawCommittee ? `${corpus}\n${rawCommittee}` : corpus;
  const lower = fullCorpus.toLowerCase();

  for (const committee of rules.committees) {
    if (lower.includes(committee.toLowerCase())) {
      reasons.push({
        dimension: "committee",
        rule: committee,
        excerpt: excerpt(fullCorpus, committee),
      });
    }
  }

  return reasons;
}

function matchAgencies(
  doc: PolicyIntelSourceDocument,
  rules: ParsedRules,
): MatchReason[] {
  const reasons: MatchReason[] = [];
  if (rules.agencies.length === 0) return reasons;

  const corpus = `${doc.title}\n${doc.normalizedText ?? ""}`;

  for (const agency of rules.agencies) {
    // Case-sensitive for short acronyms (<=5 chars), case-insensitive otherwise
    if (agency.length <= 5) {
      const re = new RegExp(`\\b${escapeRegex(agency)}\\b`);
      if (re.test(corpus)) {
        reasons.push({
          dimension: "agency",
          rule: agency,
          excerpt: excerpt(corpus, agency),
        });
      }
    } else if (corpus.toLowerCase().includes(agency.toLowerCase())) {
      reasons.push({
        dimension: "agency",
        rule: agency,
        excerpt: excerpt(corpus, agency),
      });
    }
  }

  return reasons;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractBillIdFromText(text: string): string | null {
  const match = text.match(BILL_ID_RE);
  if (!match) return null;
  return match[1].replace(/([HS][BJR]R?)\s*(\d+)/i, "$1 $2").toUpperCase();
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Match a single document against a single watchlist.
 * Returns null if no dimensions matched.
 */
export function matchDocumentToWatchlist(
  doc: PolicyIntelSourceDocument,
  watchlist: PolicyIntelWatchlist,
): WatchlistMatch | null {
  const rules = parseRules(watchlist.rulesJson as Record<string, unknown>);

  const reasons: MatchReason[] = [
    ...matchBillIds(doc, rules),
    ...matchKeywords(doc, rules),
    ...matchCommittees(doc, rules),
    ...matchAgencies(doc, rules),
  ];

  if (reasons.length === 0) return null;

  return { watchlist, reasons };
}

/**
 * Match a single document against all provided watchlists.
 * Returns only watchlists that had at least one hit.
 */
export function matchDocumentToAllWatchlists(
  doc: PolicyIntelSourceDocument,
  watchlists: PolicyIntelWatchlist[],
): WatchlistMatch[] {
  const matches: WatchlistMatch[] = [];
  for (const wl of watchlists) {
    if (!wl.isActive) continue;
    const match = matchDocumentToWatchlist(doc, wl);
    if (match) matches.push(match);
  }
  return matches;
}
