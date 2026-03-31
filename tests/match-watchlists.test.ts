/**
 * Match-Watchlists Engine — Unit Tests
 *
 * Tests the deterministic document-to-watchlist matching across
 * all 4 dimensions: bill_id, keyword, committee, agency.
 */
import { describe, it, expect } from "vitest";
import { matchDocumentToAllWatchlists, type WatchlistMatch } from "../server/policy-intel/engine/match-watchlists";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    workspaceId: 1,
    title: overrides.title as string ?? "HB 14 — Highway Funding Act",
    summary: overrides.summary as string ?? null,
    normalizedText: overrides.normalizedText as string ?? null,
    sourceType: "legiscan" as const,
    externalId: null,
    url: null,
    publishedAt: null,
    rawPayload: overrides.rawPayload ?? {},
    checksum: null,
    createdAt: new Date(),
    lastScoredAt: null,
    aiSummary: null,
  } as any;
}

function makeWatchlist(rulesJson: Record<string, unknown>, overrides: Record<string, unknown> = {}) {
  return {
    id: overrides.id as number ?? 1,
    workspaceId: 1,
    name: overrides.name as string ?? "Test Watchlist",
    description: null,
    isActive: true,
    rulesJson,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("matchDocumentToAllWatchlists", () => {
  describe("Bill ID Matching", () => {
    it("matches exact bill ID in title", () => {
      const doc = makeDoc({ title: "HB 14 — Highway Funding Act" });
      const wl = makeWatchlist({ billIds: ["HB 14"], keywords: [] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
      expect(results[0].reasons.some((r) => r.dimension === "bill_id")).toBe(true);
    });

    it("matches bill ID in normalizedText", () => {
      const doc = makeDoc({
        title: "Transportation Committee Hearing",
        normalizedText: "Discussion of HB 14 regarding highway funding",
      });
      const wl = makeWatchlist({ billIds: ["HB 14"], keywords: [] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });

    it("matches bill ID from rawPayload.billId", () => {
      const doc = makeDoc({
        title: "Committee Hearing on Highway Issues",
        rawPayload: { billId: "HB 14" },
      });
      const wl = makeWatchlist({ billIds: ["HB 14"], keywords: [] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });

    it("is case-insensitive for bill ID matching", () => {
      const doc = makeDoc({ title: "hb 14 transportation funding" });
      const wl = makeWatchlist({ billIds: ["HB 14"], keywords: [] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });

    it("matches bill prefix (HB prefix catches any HB)", () => {
      const doc = makeDoc({ title: "HB 999 — Education Reform" });
      const wl = makeWatchlist({ billPrefixes: ["HB"], keywords: [] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });

    it("does NOT match when bill ID differs", () => {
      const doc = makeDoc({ title: "SB 100 — Tax Reform" });
      const wl = makeWatchlist({ billIds: ["HB 14"], keywords: [] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(0);
    });
  });

  describe("Keyword Matching", () => {
    it("matches long keywords via substring (case-insensitive)", () => {
      const doc = makeDoc({ title: "Transportation funding review" });
      const wl = makeWatchlist({ keywords: ["transportation"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
      expect(results[0].reasons[0].dimension).toBe("keyword");
    });

    it("matches short keywords with word boundary", () => {
      const doc = makeDoc({ title: "TEA announces new education policy" });
      const wl = makeWatchlist({ keywords: ["TEA"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });

    it("short keywords do NOT match inside other words", () => {
      const doc = makeDoc({ title: "The teacher announced new steam policies" });
      const wl = makeWatchlist({ keywords: ["TEA"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      // "TEA" should not match "teacher" or "steam" with word boundary
      expect(results).toHaveLength(0);
    });

    it("matches multiple keywords simultaneously", () => {
      const doc = makeDoc({ title: "Transportation and education funding reform" });
      const wl = makeWatchlist({ keywords: ["transportation", "education", "funding"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
      const keywordReasons = results[0].reasons.filter((r) => r.dimension === "keyword");
      expect(keywordReasons).toHaveLength(3);
    });
  });

  describe("Committee Matching", () => {
    it("matches committee name in title", () => {
      const doc = makeDoc({ title: "Finance Committee hearing on budget" });
      const wl = makeWatchlist({ committees: ["Finance"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
      expect(results[0].reasons[0].dimension).toBe("committee");
    });

    it("matches committee from rawPayload.committee", () => {
      const doc = makeDoc({
        title: "Committee hearing",
        rawPayload: { committee: "Transportation" },
      });
      const wl = makeWatchlist({ committees: ["Transportation"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });

    it("is case-insensitive for committee matching", () => {
      const doc = makeDoc({ title: "FINANCE COMMITTEE hearing" });
      const wl = makeWatchlist({ committees: ["finance"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });
  });

  describe("Agency Matching", () => {
    it("matches short agency acronyms case-sensitively", () => {
      const doc = makeDoc({ title: "TxDOT releases highway plan" });
      const wl = makeWatchlist({ agencies: ["TxDOT"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
      expect(results[0].reasons[0].dimension).toBe("agency");
    });

    it("matches long agency names case-insensitively", () => {
      const doc = makeDoc({ title: "Texas Department of Transportation issues guidance" });
      const wl = makeWatchlist({ agencies: ["Texas Department of Transportation"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });
  });

  describe("Multi-dimension Matching", () => {
    it("captures matches across multiple dimensions", () => {
      const doc = makeDoc({
        title: "HB 14 — TxDOT Transportation Funding Act",
        normalizedText: "Finance Committee markup of highway infrastructure bill",
      });
      const wl = makeWatchlist({
        billIds: ["HB 14"],
        keywords: ["transportation", "highway"],
        committees: ["Finance"],
        agencies: ["TxDOT"],
      });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
      const dims = new Set(results[0].reasons.map((r) => r.dimension));
      expect(dims.has("bill_id")).toBe(true);
      expect(dims.has("keyword")).toBe(true);
      expect(dims.has("committee")).toBe(true);
      expect(dims.has("agency")).toBe(true);
    });

    it("matches against multiple watchlists independently", () => {
      const doc = makeDoc({ title: "HB 14 transportation hearing at TxDOT" });
      const wl1 = makeWatchlist({ billIds: ["HB 14"], keywords: [] }, { id: 1, name: "Bills" });
      const wl2 = makeWatchlist({ keywords: ["transportation"] }, { id: 2, name: "Keywords" });
      const wl3 = makeWatchlist({ keywords: ["education"] }, { id: 3, name: "No Match" });
      const results = matchDocumentToAllWatchlists(doc, [wl1, wl2, wl3]);
      expect(results).toHaveLength(2);
    });
  });

  describe("Edge Cases", () => {
    it("skips inactive watchlists", () => {
      const doc = makeDoc({ title: "HB 14 highway funding" });
      const wl = makeWatchlist({ billIds: ["HB 14"] }, { isActive: false });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(0);
    });

    it("returns empty array for empty rules", () => {
      const doc = makeDoc({ title: "Generic document" });
      const wl = makeWatchlist({});
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(0);
    });

    it("returns empty array for no watchlists", () => {
      const doc = makeDoc({ title: "Some document" });
      const results = matchDocumentToAllWatchlists(doc, []);
      expect(results).toHaveLength(0);
    });

    it("handles null normalizedText gracefully", () => {
      const doc = makeDoc({ title: "HB 14", normalizedText: null });
      const wl = makeWatchlist({ billIds: ["HB 14"] });
      const results = matchDocumentToAllWatchlists(doc, [wl]);
      expect(results).toHaveLength(1);
    });
  });
});
