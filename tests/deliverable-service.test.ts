/**
 * Tests for Deliverable Service — generateClientAlert.
 *
 * Validates issue-room → client-alert flow with mocked DB.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ── DB mock (must be before imports) ─────────────────────────────────────────

// Queue of return values for sequential DB calls
let dbCallQueue: any[] = [];

function createChainableQuery(): any {
  const query: any = {
    where: (..._args: any[]) => {
      const val = dbCallQueue.shift() ?? [];
      return createTerminalQuery(val);
    },
    orderBy: (..._args: any[]) => {
      const val = dbCallQueue.shift() ?? [];
      return createTerminalQuery(val);
    },
  };
  return query;
}

function createTerminalQuery(resolveValue: any): any {
  return {
    orderBy: (..._args: any[]) => createTerminalQuery(dbCallQueue.shift() ?? resolveValue),
    limit: (..._args: any[]) => createTerminalQuery(resolveValue),
    then: (resolve: any, reject?: any) => Promise.resolve(resolveValue).then(resolve, reject),
  };
}

const mockInsertReturning = vi.fn();
const mockInsertValues = vi.fn().mockReturnValue({ returning: mockInsertReturning });
const mockInsert = vi.fn().mockReturnValue({ values: mockInsertValues });

vi.mock("../server/policy-intel/db", () => ({
  policyIntelDb: {
    select: () => ({
      from: () => createChainableQuery(),
    }),
    insert: (...args: any[]) => mockInsert(...args),
  },
  queryClient: { unsafe: vi.fn() },
}));

const mockRefreshCommitteeIntelSession = vi.fn();

vi.mock("../server/policy-intel/services/committee-intel-service", () => ({
  refreshCommitteeIntelSession: (...args: any[]) => mockRefreshCommitteeIntelSession(...args),
}));

// ── Import (after mocks) ────────────────────────────────────────────────────

import {
  generateClientAlert,
  generateHearingMemo,
} from "../server/policy-intel/services/deliverable-service";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeRoom(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    title: "HB 100 — Highway Funding",
    summary: "Increases highway funding allocation by 15%",
    status: "active",
    urgency: "high",
    workspaceId: 1,
    watchlistId: 1,
    ...overrides,
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  dbCallQueue = [];
});

describe("generateClientAlert", () => {
  it("throws when issue room is not found", async () => {
    // First DB call (issueRooms select) returns empty
    dbCallQueue = [[]];

    await expect(
      generateClientAlert({
        issueRoomId: 999,
        workspaceId: 1,
      }),
    ).rejects.toThrow("not found");
  });

  it("generates a client alert from an issue room", async () => {
    const room = makeRoom();

    // DB call sequence for generateClientAlert:
    // where() calls consume from queue; orderBy() after where() also consumes
    // 1. issueRooms .where() → [room]
    // 2. issueRoomSourceDocuments .where() → [] (no links)
    // 3. issueRoomUpdates .where() → value, then .orderBy() consumes next
    // 4. issueRoomStrategyOptions .where() → value, then .orderBy() consumes next
    dbCallQueue = [
      [room],   // issueRooms .where()
      [],       // issueRoomSourceDocuments .where()
      [],       // issueRoomUpdates .where() → terminal, then .orderBy() takes next
      [],       // issueRoomUpdates .orderBy()
      [],       // issueRoomStrategyOptions .where() → terminal, then .orderBy() takes next
      [],       // issueRoomStrategyOptions .orderBy()
    ];

    // Insert deliverable
    mockInsertReturning.mockResolvedValueOnce([{ id: 77 }]);

    const result = await generateClientAlert({
      issueRoomId: 1,
      workspaceId: 1,
      recipientName: "Client Corp",
      firmName: "Hogan Associates",
    });

    expect(result.deliverableId).toBe(77);
    expect(result.type).toBe("client_alert");
    expect(result.generatedBy).toBe("template");
    expect(result.bodyMarkdown).toContain("HB 100");
    expect(mockInsert).toHaveBeenCalled();
  });
});

describe("generateHearingMemo", () => {
  it("prefers transcript-backed committee intel when a linked session exists", async () => {
    const hearing = {
      id: 10,
      workspaceId: 43,
      sourceDocumentId: 501,
      committee: "State Affairs",
      chamber: "House",
      hearingDate: "2026-04-10T15:00:00.000Z",
      timeDescription: "3:00 PM",
      location: "E2.036",
      description: "Committee hearing on grid reliability and testimony.",
      relatedBillIds: [],
      status: "scheduled",
    };

    const sourceDocument = {
      id: 501,
      title: "State Affairs agenda",
      publisher: "Texas House",
      sourceUrl: "https://example.com/agenda",
      summary: "Agenda for the hearing",
    };

    dbCallQueue = [
      [hearing],      // hearingEvents .where()
      [{ id: 77 }],   // committeeIntelSessions .where()
      [sourceDocument], // sourceDocuments .where()
      [],             // committeeMembers .where()
      [],             // alerts .where()
      [],             // alerts .orderBy()
    ];

    mockRefreshCommitteeIntelSession.mockResolvedValueOnce({
      session: {
        id: 77,
        title: "State Affairs Committee Intelligence",
        status: "monitoring",
        lastAnalyzedAt: "2026-04-10T18:00:00.000Z",
        autoIngestError: null,
      },
      analysis: {
        summary: "Witness testimony centered on grid reliability and emergency readiness.",
        totalSegments: 12,
        totalSignals: 8,
        trackedEntities: 5,
        issueCoverage: [
          {
            issueTag: "grid_reliability",
            label: "Grid Reliability",
            mentionCount: 6,
            supportCount: 2,
            opposeCount: 1,
            questioningCount: 3,
            neutralCount: 0,
            keyEntities: ["PUCT", "ERCOT"],
          },
        ],
        keyMoments: [],
        witnessRankings: [],
        electedFocus: [],
        activeWitnesses: [],
        postHearingRecap: null,
      },
    });

    mockInsertReturning.mockResolvedValueOnce([{ id: 88 }]);

    const result = await generateHearingMemo({
      hearingId: 10,
      workspaceId: 43,
      recipientName: "Client",
    });

    expect(mockRefreshCommitteeIntelSession).toHaveBeenCalledWith(77);
    expect(result.deliverableId).toBe(88);
    expect(result.generatedBy).toBe("committee_intel");
    expect(result.transcriptBacked).toBe(true);
    expect(result.sourceQuality).toBe("mixed_source");
    expect(result.committeeSessionId).toBe(77);
    expect(result.bodyMarkdown).toContain("Committee Intelligence Snapshot");
    expect(result.bodyMarkdown).toContain("Grid Reliability");
  });
});
