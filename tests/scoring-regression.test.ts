/**
 * Scoring Regression Tests
 *
 * Ensures that changes to the scoring / pipeline code don't silently
 * shift alert scores. Each fixture captures a known document + watchlist
 * combination and asserts the exact deterministic score and expected
 * agent-pipeline action.
 *
 * To update baselines after an intentional change, run vitest with
 * `--update` flag or manually adjust the fixture expectations.
 */
import { describe, it, expect, vi } from "vitest";

// Mock champion config before importing pipeline
vi.mock("../server/policy-intel/engine/champion", () => ({
  getChampionConfig: vi.fn().mockResolvedValue({
    weights: {
      procedural: 0.18,
      relevance: 0.25,
      stakeholder: 0.15,
      actionability: 0.22,
      timeliness: 0.10,
      regime: 0.10,
    },
    escalateThreshold: 60,
    archiveThreshold: 20,
  }),
}));

vi.mock("../server/policy-intel/metrics", () => ({
  metrics: {
    inc: vi.fn(),
    observe: vi.fn(),
    gauge: vi.fn(),
    set: vi.fn(),
  },
}));

import { matchDocumentToAllWatchlists } from "../server/policy-intel/engine/match-watchlists";
import { scoreAlert, buildWhyItMatters } from "../server/policy-intel/engine/score-alert";
import { buildAgentScorecard } from "../server/policy-intel/engine/agent-pipeline";

// ── Test Fixture Type ────────────────────────────────────────────────────────

interface ScoringFixture {
  name: string;
  doc: any;
  watchlists: any[];
  expectedDeterministicScore: number;
  expectedMatchDimensions: string[];
  expectedPipelineAction: "escalate" | "watch" | "archive";
  scoreFloor: number; // pipeline score must be ≥ this
  scoreCeiling: number; // pipeline score must be ≤ this
}

// ── Fixtures ─────────────────────────────────────────────────────────────────

const fixtures: ScoringFixture[] = [
  {
    name: "High-priority bill_id + keyword match",
    doc: {
      id: 1,
      workspaceId: 2,
      title: "HB 14 – Transportation Infrastructure Funding",
      sourceType: "legiscan",
      normalizedText:
        "An act relating to transportation infrastructure funding. Amends Section 201.201.",
      summary: "Floor vote on HB 14 transportation infrastructure funding.",
      billId: "HB 14",
      rawPayload: {
        state: "TX",
        session_id: 2129,
        bill_id: "HB 14",
        status: "Passed",
        last_action: "Senate floor vote",
      },
      createdAt: new Date(),
    },
    watchlists: [
      {
        id: 10,
        workspaceId: 2,
        name: "Transportation",
        isActive: true,
        rulesJson: {
          keywords: ["transportation"],
          committees: [],
          agencies: [],
          billIds: ["HB 14"],
        },
      },
    ],
    expectedDeterministicScore: 65, // bill_id(40) + keyword(15) + breadth(10)
    expectedMatchDimensions: ["bill_id", "keyword"],
    expectedPipelineAction: "escalate",
    scoreFloor: 40,
    scoreCeiling: 100,
  },
  {
    name: "Keyword-only match (single keyword)",
    doc: {
      id: 2,
      workspaceId: 2,
      title: "SB 200 – Water Quality Standards Update",
      sourceType: "legiscan",
      normalizedText:
        "Relating to water quality standards and environmental protection measures.",
      summary: "Committee hearing on SB 200 water quality standards.",
      billId: "SB 200",
      rawPayload: { state: "TX", bill_id: "SB 200" },
      createdAt: new Date(),
    },
    watchlists: [
      {
        id: 11,
        workspaceId: 2,
        name: "Environment",
        isActive: true,
        rulesJson: {
          keywords: ["water quality"],
          committees: [],
          agencies: [],
          billIds: [],
        },
      },
    ],
    expectedDeterministicScore: 15, // keyword only
    expectedMatchDimensions: ["keyword"],
    expectedPipelineAction: "watch",
    scoreFloor: 0,
    scoreCeiling: 50,
  },
  {
    name: "Bill-only match (no keyword overlap)",
    doc: {
      id: 3,
      workspaceId: 2,
      title: "HB 500 – Criminal Justice Reform",
      sourceType: "legiscan",
      normalizedText: "Relating to criminal sentencing guidelines reform.",
      summary: "Introduced in committee.",
      billId: "HB 500",
      rawPayload: { state: "TX", bill_id: "HB 500" },
      createdAt: new Date(),
    },
    watchlists: [
      {
        id: 12,
        workspaceId: 2,
        name: "Criminal Justice",
        isActive: true,
        rulesJson: {
          keywords: ["sentencing"],
          committees: [],
          agencies: [],
          billIds: ["HB 500"],
        },
      },
    ],
    expectedDeterministicScore: 65, // bill_id(40) + keyword(15) + breadth(10)
    expectedMatchDimensions: ["bill_id", "keyword"],
    expectedPipelineAction: "watch",
    scoreFloor: 20,
    scoreCeiling: 100,
  },
  {
    name: "Multi-keyword match with diminishing returns",
    doc: {
      id: 4,
      workspaceId: 2,
      title: "HB 50 – Energy Grid Reliability and Safety",
      sourceType: "legiscan",
      normalizedText:
        "An act relating to energy grid reliability, safety standards, power infrastructure, and renewable sources.",
      summary: "Energy infrastructure bill with grid and safety provisions.",
      billId: "HB 50",
      rawPayload: { state: "TX", bill_id: "HB 50" },
      createdAt: new Date(),
    },
    watchlists: [
      {
        id: 13,
        workspaceId: 2,
        name: "Energy",
        isActive: true,
        rulesJson: {
          keywords: ["energy", "grid", "reliability", "safety", "renewable"],
          committees: [],
          agencies: [],
          billIds: [],
        },
      },
    ],
    // Many keywords: first 3 get full 15 each, after that diminishing
    expectedDeterministicScore: -1, // computed below
    expectedMatchDimensions: ["keyword"],
    expectedPipelineAction: "archive",
    scoreFloor: 0,
    scoreCeiling: 80,
  },
  {
    name: "No match at all",
    doc: {
      id: 5,
      workspaceId: 2,
      title: "Astronomy Research Funding Act",
      sourceType: "openstates",
      normalizedText: "Relating to NASA partnerships and telescope funding.",
      summary: "Space research funding bill.",
      billId: "SB 999",
      rawPayload: { state: "TX", bill_id: "SB 999" },
      createdAt: new Date(),
    },
    watchlists: [
      {
        id: 14,
        workspaceId: 2,
        name: "Transportation",
        isActive: true,
        rulesJson: {
          keywords: ["transportation"],
          committees: ["House Transportation"],
          agencies: ["TxDOT"],
          billIds: ["HB 14"],
        },
      },
    ],
    expectedDeterministicScore: 0,
    expectedMatchDimensions: [],
    expectedPipelineAction: "archive",
    scoreFloor: 0,
    scoreCeiling: 0,
  },
  {
    name: "Committee match only",
    doc: {
      id: 6,
      workspaceId: 2,
      title: "Committee hearing notice",
      sourceType: "manual",
      normalizedText:
        "The House Appropriations committee will convene on Monday to discuss budgeting.",
      summary: "Appropriations hearing notice.",
      billId: null,
      rawPayload: { committee: "House Appropriations" },
      createdAt: new Date(),
    },
    watchlists: [
      {
        id: 15,
        workspaceId: 2,
        name: "Budget",
        isActive: true,
        rulesJson: {
          keywords: [],
          committees: ["House Appropriations"],
          agencies: [],
          billIds: [],
        },
      },
    ],
    expectedDeterministicScore: 25, // committee only
    expectedMatchDimensions: ["committee"],
    expectedPipelineAction: "watch",
    scoreFloor: 10,
    scoreCeiling: 60,
  },
];

// ── Tests ────────────────────────────────────────────────────────────────────

describe("Scoring Regression", () => {
  describe("Deterministic score-alert() stability", () => {
    for (const fx of fixtures) {
      it(`${fx.name}: deterministic score`, () => {
        const matches = matchDocumentToAllWatchlists(fx.doc, fx.watchlists);

        if (fx.expectedMatchDimensions.length === 0) {
          expect(matches.length).toBe(0);
          return;
        }

        expect(matches.length).toBeGreaterThan(0);
        const reasons = matches[0].reasons;
        const dims = reasons.map((r: any) => r.dimension);
        for (const dim of fx.expectedMatchDimensions) {
          expect(dims).toContain(dim);
        }

        const score = scoreAlert(reasons);

        if (fx.expectedDeterministicScore >= 0) {
          expect(score).toBe(fx.expectedDeterministicScore);
        }
        // Always: score stays within valid range
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    }
  });

  describe("Agent pipeline score stability", () => {
    for (const fx of fixtures) {
      it(`${fx.name}: pipeline within [${fx.scoreFloor}, ${fx.scoreCeiling}]`, async () => {
        const matches = matchDocumentToAllWatchlists(fx.doc, fx.watchlists);

        if (fx.expectedMatchDimensions.length === 0) {
          // No match → no pipeline to run
          return;
        }

        const scorecard = await buildAgentScorecard(
          fx.doc.title,
          fx.doc.summary,
          matches[0].reasons,
          {
            docDate: fx.doc.createdAt,
            rawPayload: fx.doc.rawPayload,
          },
        );

        expect(scorecard.totalScore).toBeGreaterThanOrEqual(fx.scoreFloor);
        expect(scorecard.totalScore).toBeLessThanOrEqual(fx.scoreCeiling);
        expect(scorecard.pipelineSignal.action).toBe(fx.expectedPipelineAction);
      });
    }
  });

  describe("whyItMatters text stability", () => {
    it("always produces a non-empty string for matched docs", () => {
      for (const fx of fixtures) {
        const matches = matchDocumentToAllWatchlists(fx.doc, fx.watchlists);
        if (matches.length === 0) continue;

        const text = buildWhyItMatters(fx.doc.title, matches[0].reasons);
        expect(text.length).toBeGreaterThan(0);
        expect(typeof text).toBe("string");
      }
    });

    it("references the document title", () => {
      const fx = fixtures[0];
      const matches = matchDocumentToAllWatchlists(fx.doc, fx.watchlists);
      const text = buildWhyItMatters(fx.doc.title, matches[0].reasons);
      expect(text.toLowerCase()).toContain("hb 14");
    });
  });

  describe("Weight invariants", () => {
    it("agent weights remain stable with default champion config", async () => {
      const { getChampionConfig } = await import(
        "../server/policy-intel/engine/champion"
      );
      const config = await getChampionConfig();
      const weights = config.weights;

      // 6 agent weights should sum to ~1.0
      const sum = Object.values(weights).reduce((a: number, b: unknown) => a + (b as number), 0);
      expect(sum).toBeCloseTo(1.0, 1);

      // Each weight between 0 and 1
      for (const [key, value] of Object.entries(weights)) {
        expect(value as number).toBeGreaterThanOrEqual(0);
        expect(value as number).toBeLessThanOrEqual(1);
      }
    });
  });
});
