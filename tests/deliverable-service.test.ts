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

// ── Import (after mocks) ────────────────────────────────────────────────────

import { generateClientAlert } from "../server/policy-intel/services/deliverable-service";

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
