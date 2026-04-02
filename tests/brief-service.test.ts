/**
 * Tests for Brief Service and build-brief engine.
 *
 * Covers:
 *  - buildCitations (pure, no DB)
 *  - determineProcedure (pure, no DB)
 *  - generateBrief input validation
 *  - generateBrief end-to-end with mocked DB
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock (must be before imports) ─────────────────────────────────────────

const mockSelectWhere = vi.fn();
const mockSelectFrom = vi.fn().mockReturnValue({ where: mockSelectWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockSelectFrom });

const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

vi.mock("../server/policy-intel/db", () => ({
  policyIntelDb: {
    select: (...args: any[]) => mockSelect(...args),
    insert: (...args: any[]) => mockInsert(...args),
  },
  queryClient: { unsafe: vi.fn() },
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import {
  buildCitations,
  determineProcedure,
  type SourcePack,
  type SourcePackEntry,
} from "../server/policy-intel/engine/build-brief";
import { generateBrief } from "../server/policy-intel/services/brief-service";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(overrides: Partial<SourcePackEntry> = {}): SourcePackEntry {
  return {
    id: 1,
    title: "HB 100 - Transportation Funding",
    summary: "Increases state highway funding by 15%",
    normalizedText: "Full text of the bill...",
    sourceUrl: "https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=HB100",
    sourceType: "texas_legislation",
    publisher: "Texas Legislature Online",
    publishedAt: new Date("2025-03-15"),
    ...overrides,
  };
}

function makePack(entries?: SourcePackEntry[]): SourcePack {
  const e = entries ?? [makeEntry()];
  return {
    entries: e,
    combinedText: e.map((x) => x.normalizedText ?? x.summary ?? "").join("\n---\n"),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildCitations", () => {
  it("maps pack entries to citations", () => {
    const pack = makePack([makeEntry({ id: 7, title: "SB 42" })]);
    const cites = buildCitations(pack);

    expect(cites).toHaveLength(1);
    expect(cites[0].sourceDocumentId).toBe(7);
    expect(cites[0].title).toBe("SB 42");
    expect(cites[0].accessedAt).toBeTruthy();
  });

  it("preserves publisher and URL", () => {
    const pack = makePack([
      makeEntry({ publisher: "TLO", sourceUrl: "https://example.com" }),
    ]);
    const cites = buildCitations(pack);
    expect(cites[0].publisher).toBe("TLO");
    expect(cites[0].sourceUrl).toBe("https://example.com");
  });
});

describe("determineProcedure", () => {
  it("returns committee hearing note for texas_legislation hearing entry", () => {
    const entries = [makeEntry({ sourceType: "texas_legislation", title: "Committee Hearing on HB 100" })];
    expect(determineProcedure(entries)).toContain("testimony window");
  });

  it("returns filed note for texas_legislation without hearing", () => {
    const entries = [makeEntry({ sourceType: "texas_legislation", title: "HB 100" })];
    expect(determineProcedure(entries)).toContain("awaiting committee");
  });

  it("returns regulation note for texas_regulation", () => {
    const entries = [makeEntry({ sourceType: "texas_regulation" })];
    expect(determineProcedure(entries)).toContain("comment period");
  });

  it("returns federal note for federal_legislation", () => {
    const entries = [makeEntry({ sourceType: "federal_legislation" })];
    expect(determineProcedure(entries)).toContain("Federal");
  });

  it("returns generic note for unknown types", () => {
    const entries = [makeEntry({ sourceType: "other" })];
    expect(determineProcedure(entries)).toContain("review for applicability");
  });
});

describe("generateBrief", () => {
  it("rejects empty sourceDocumentIds", async () => {
    await expect(
      generateBrief({
        workspaceId: 1,
        sourceDocumentIds: [],
      }),
    ).rejects.toThrow("sourceDocumentIds");
  });

  it("generates template brief and stores in DB", async () => {
    // Mock buildSourcePack's DB call (select from sourceDocuments)
    const fakeDoc = {
      id: 10,
      title: "HB 200",
      summary: "Test summary",
      normalizedText: "Normalized body text",
      sourceUrl: "https://example.com/hb200",
      sourceType: "texas_legislation",
      publisher: "TLO",
      publishedAt: new Date("2025-06-01"),
    };
    mockSelectWhere.mockResolvedValue([fakeDoc]);

    // Mock insert for briefs table
    mockInsertReturning
      .mockResolvedValueOnce([{ id: 42 }])   // briefs insert
      .mockResolvedValueOnce([{ id: 99 }]);   // deliverables insert

    const result = await generateBrief({
      workspaceId: 1,
      sourceDocumentIds: [10],
      title: "Test Brief",
    });

    expect(result.briefId).toBe(42);
    expect(result.deliverableId).toBe(99);
    expect(result.title).toBe("Test Brief");
    expect(result.generatedBy).toBe("template");
    expect(result.bodyMarkdown).toContain("# Test Brief");
    expect(result.bodyMarkdown).toContain("What Changed");
    expect(result.bodyMarkdown).toContain("Sources");
    expect(result.citations).toHaveLength(1);
    expect(result.citations[0].sourceDocumentId).toBe(10);
  });

  it("auto-generates title from single source doc", async () => {
    const fakeDoc = {
      id: 5,
      title: "SB 99 Analysis",
      summary: "A bill",
      normalizedText: null,
      sourceUrl: "https://example.com/sb99",
      sourceType: "texas_legislation",
      publisher: "TLO",
      publishedAt: null,
    };
    mockSelectWhere.mockResolvedValue([fakeDoc]);
    mockInsertReturning
      .mockResolvedValueOnce([{ id: 1 }])
      .mockResolvedValueOnce([{ id: 2 }]);

    const result = await generateBrief({
      workspaceId: 1,
      sourceDocumentIds: [5],
    });

    expect(result.title).toContain("SB 99 Analysis");
  });
});
