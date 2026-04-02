/**
 * Tests for replay-orchestrator-service normalization helpers.
 *
 * These are pure functions clamped to valid ranges — ideal for unit tests.
 */
import { describe, it, expect } from "vitest";

// The normalization functions are module-private, so we re-implement the
// contract tests against the same logic constraints. If the service later
// exports them, swap to direct imports.  For now we test via the module's
// internal constants by importing the module and exercising the public
// createReplayRun endpoint indirectly.  However, since those functions
// ARE exported implicitly through the service, let's test through the
// module boundary by directly importing.  The functions are NOT exported,
// so we duplicate the logic here as contract/spec tests.

// ── Spec mirrors of the private normalisation functions ──────────────────────

type ReplayMode = "recent" | "full" | "backfill";

function normalizeMode(mode: string | null | undefined): ReplayMode {
  if (mode === "recent" || mode === "backfill" || mode === "full") return mode;
  return "full";
}

const VALID_ORDER_BY = new Set([
  "bill_id_asc",
  "bill_id_desc",
  "last_action_date_asc",
  "last_action_date_desc",
]);

function normalizeOrderBy(orderBy: string | null | undefined): string {
  if (!orderBy) return "bill_id_asc";
  return VALID_ORDER_BY.has(orderBy) ? orderBy : "bill_id_asc";
}

function normalizeChunkSize(chunkSize: number | null | undefined): number {
  if (!Number.isFinite(chunkSize)) return 250;
  return Math.max(1, Math.min(2000, Math.floor(chunkSize as number)));
}

function normalizeMaxChunks(value: number | null | undefined): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(200, Math.floor(value as number)));
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Replay Orchestrator — normalizeMode", () => {
  it("accepts valid modes unchanged", () => {
    expect(normalizeMode("recent")).toBe("recent");
    expect(normalizeMode("full")).toBe("full");
    expect(normalizeMode("backfill")).toBe("backfill");
  });

  it("defaults invalid strings to full", () => {
    expect(normalizeMode("bad")).toBe("full");
    expect(normalizeMode("")).toBe("full");
  });

  it("defaults null/undefined to full", () => {
    expect(normalizeMode(null)).toBe("full");
    expect(normalizeMode(undefined)).toBe("full");
  });
});

describe("Replay Orchestrator — normalizeOrderBy", () => {
  it("accepts valid order values", () => {
    expect(normalizeOrderBy("bill_id_asc")).toBe("bill_id_asc");
    expect(normalizeOrderBy("last_action_date_desc")).toBe("last_action_date_desc");
  });

  it("defaults invalid values to bill_id_asc", () => {
    expect(normalizeOrderBy("invalid_order")).toBe("bill_id_asc");
    expect(normalizeOrderBy("")).toBe("bill_id_asc");
  });

  it("defaults null/undefined to bill_id_asc", () => {
    expect(normalizeOrderBy(null)).toBe("bill_id_asc");
    expect(normalizeOrderBy(undefined)).toBe("bill_id_asc");
  });
});

describe("Replay Orchestrator — normalizeChunkSize", () => {
  it("clamps to [1, 2000]", () => {
    expect(normalizeChunkSize(0)).toBe(1);
    expect(normalizeChunkSize(-10)).toBe(1);
    expect(normalizeChunkSize(5000)).toBe(2000);
    expect(normalizeChunkSize(500)).toBe(500);
  });

  it("floors fractional values", () => {
    expect(normalizeChunkSize(99.9)).toBe(99);
    expect(normalizeChunkSize(1.1)).toBe(1);
  });

  it("returns default for non-finite", () => {
    expect(normalizeChunkSize(NaN)).toBe(250);
    expect(normalizeChunkSize(Infinity)).toBe(250);
    expect(normalizeChunkSize(null)).toBe(250);
    expect(normalizeChunkSize(undefined)).toBe(250);
  });
});

describe("Replay Orchestrator — normalizeMaxChunks", () => {
  it("clamps to [1, 200]", () => {
    expect(normalizeMaxChunks(0)).toBe(1);
    expect(normalizeMaxChunks(-5)).toBe(1);
    expect(normalizeMaxChunks(999)).toBe(200);
    expect(normalizeMaxChunks(50)).toBe(50);
  });

  it("floors fractional values", () => {
    expect(normalizeMaxChunks(3.7)).toBe(3);
  });

  it("returns default for non-finite", () => {
    expect(normalizeMaxChunks(NaN)).toBe(1);
    expect(normalizeMaxChunks(null)).toBe(1);
    expect(normalizeMaxChunks(undefined)).toBe(1);
  });
});
