/**
 * Multi-Agent Scoring Pipeline — Unit Tests
 *
 * Tests all 6 agents, regime detection, MetaWeigher, and the full pipeline.
 * Mocks the champion config to use default weights (no DB dependency).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the champion module to avoid DB access
vi.mock("../server/policy-intel/engine/champion", () => ({
  getChampionConfig: vi.fn().mockResolvedValue({
    weights: {
      procedural: 0.25,
      relevance: 0.30,
      stakeholder: 0.15,
      actionability: 0.15,
      timeliness: 0.10,
      regime: 0.05,
    },
    escalateThreshold: 60,
    archiveThreshold: 20,
  }),
}));

// Mock metrics to avoid side effects
vi.mock("../server/policy-intel/metrics", () => ({
  metrics: {
    inc: vi.fn(),
    observe: vi.fn(),
    set: vi.fn(),
    counter: vi.fn(),
    gauge: vi.fn(),
    histogram: vi.fn(),
  },
}));

import { runAgentPipeline, buildAgentScorecard } from "../server/policy-intel/engine/agent-pipeline";
import type { MatchReason } from "../server/policy-intel/engine/match-watchlists";

// ── Agent-level Tests ────────────────────────────────────────────────────────

describe("Agent Pipeline", () => {
  describe("Procedural Agent", () => {
    it("scores high for 'floor vote' keyword", async () => {
      const signal = await runAgentPipeline(
        "HB 14 passes floor vote in Texas House",
        null,
        [{ dimension: "bill_id", rule: "HB 14", excerpt: "" }],
      );
      const proc = signal.agents.find((a) => a.agent === "procedural")!;
      expect(proc.score).toBe(1.0); // floor vote = 25/25
    });

    it("scores medium for 'committee hearing'", async () => {
      const signal = await runAgentPipeline(
        "Committee hearing on transportation bill",
        null,
        [{ dimension: "keyword", rule: "transportation", excerpt: "" }],
      );
      const proc = signal.agents.find((a) => a.agent === "procedural")!;
      expect(proc.score).toBe(12 / 25); // committee hearing = 12
    });

    it("scores zero for generic text", async () => {
      const signal = await runAgentPipeline(
        "General legislative discussion notes",
        null,
        [{ dimension: "keyword", rule: "legislative", excerpt: "" }],
      );
      const proc = signal.agents.find((a) => a.agent === "procedural")!;
      expect(proc.score).toBe(0);
    });

    it("takes the highest keyword when multiple match", async () => {
      const signal = await runAgentPipeline(
        "Floor vote on amendment after committee hearing",
        null,
        [],
      );
      const proc = signal.agents.find((a) => a.agent === "procedural")!;
      // floor vote = 25, amendment = 15, committee hearing = 12
      expect(proc.score).toBe(1.0); // floor vote wins
    });
  });

  describe("Relevance Agent", () => {
    it("scores 0 with no match reasons", async () => {
      const signal = await runAgentPipeline("Some title", null, []);
      const rel = signal.agents.find((a) => a.agent === "relevance")!;
      expect(rel.score).toBe(0);
    });

    it("scores high for bill_id + keywords + committee", async () => {
      const reasons: MatchReason[] = [
        { dimension: "bill_id", rule: "HB 14", excerpt: "" },
        { dimension: "committee", rule: "Finance", excerpt: "" },
        { dimension: "keyword", rule: "transportation", excerpt: "" },
      ];
      const signal = await runAgentPipeline("HB 14 Finance hearing", null, reasons);
      const rel = signal.agents.find((a) => a.agent === "relevance")!;
      // 12 (bill_id) + 7 (committee) + 3 (keyword) + 4 (>=3 dims) = 26, capped 25 → 1.0
      expect(rel.score).toBe(1.0);
    });

    it("gives breadth bonus for ≥2 dimensions", async () => {
      const reasons: MatchReason[] = [
        { dimension: "bill_id", rule: "HB 14", excerpt: "" },
        { dimension: "keyword", rule: "highway", excerpt: "" },
      ];
      const signal = await runAgentPipeline("HB 14 highway", null, reasons);
      const rel = signal.agents.find((a) => a.agent === "relevance")!;
      // 12 + 3 + 2 (breadth) = 17/25 = 0.68
      expect(rel.score).toBeCloseTo(17 / 25, 2);
    });
  });

  describe("Stakeholder Agent", () => {
    it("scores high for governor mention", async () => {
      const signal = await runAgentPipeline(
        "Governor signs HB 14 into law",
        null,
        [],
      );
      const sh = signal.agents.find((a) => a.agent === "stakeholder")!;
      expect(sh.score).toBeGreaterThan(0.3);
    });

    it("scores zero for no stakeholder indicators", async () => {
      const signal = await runAgentPipeline(
        "Generic bill text with no entity references",
        null,
        [],
      );
      const sh = signal.agents.find((a) => a.agent === "stakeholder")!;
      expect(sh.score).toBe(0);
    });

    it("scores high for multiple tier-3 stakeholders", async () => {
      const signal = await runAgentPipeline(
        "Governor and Speaker announce support for highway plan",
        null,
        [],
      );
      const sh = signal.agents.find((a) => a.agent === "stakeholder")!;
      // governor (tier 3, 8pts) + speaker (tier 3, 8pts) = 16/25
      expect(sh.score).toBeGreaterThanOrEqual(16 / 25);
    });
  });

  describe("Actionability Agent", () => {
    it("scores maximum for 'vote scheduled'", async () => {
      const signal = await runAgentPipeline(
        "Vote scheduled for HB 14 on Monday",
        null,
        [],
      );
      const act = signal.agents.find((a) => a.agent === "actionability")!;
      expect(act.score).toBe(1.0); // vote scheduled = 25/25
    });

    it("scores high for deadline reference", async () => {
      const signal = await runAgentPipeline(
        "Deadline for filing amendments to transportation bill",
        null,
        [],
      );
      const act = signal.agents.find((a) => a.agent === "actionability")!;
      expect(act.score).toBe(22 / 25);
    });

    it("scores zero for no actionable triggers", async () => {
      const signal = await runAgentPipeline(
        "General policy discussion about highways",
        null,
        [],
      );
      const act = signal.agents.find((a) => a.agent === "actionability")!;
      expect(act.score).toBe(0);
    });
  });

  describe("Timeliness Agent", () => {
    it("scores 1.0 for recent documents", async () => {
      const signal = await runAgentPipeline(
        "Recent bill action",
        null,
        [],
        { docDate: new Date() },
      );
      const tl = signal.agents.find((a) => a.agent === "timeliness")!;
      expect(tl.score).toBe(1.0);
    });

    it("scores low for month-old documents", async () => {
      const oneMonthAgo = new Date(Date.now() - 32 * 24 * 60 * 60 * 1000);
      const signal = await runAgentPipeline(
        "Old bill text",
        null,
        [],
        { docDate: oneMonthAgo },
      );
      const tl = signal.agents.find((a) => a.agent === "timeliness")!;
      expect(tl.score).toBe(0.1); // >1 month old
    });

    it("scores 0.5 for unknown document age", async () => {
      const signal = await runAgentPipeline(
        "No date available",
        null,
        [],
      );
      const tl = signal.agents.find((a) => a.agent === "timeliness")!;
      expect(tl.score).toBe(0.5);
    });
  });

  describe("Regime Agent", () => {
    it("detects special_session from content", async () => {
      const signal = await runAgentPipeline(
        "Governor calls special session on school finance",
        null,
        [],
      );
      expect(signal.regime).toBe("special_session");
    });

    it("detects conference from content", async () => {
      const signal = await runAgentPipeline(
        "Conference committee appointed for HB 14",
        null,
        [],
      );
      expect(signal.regime).toBe("conference");
    });

    it("detects floor_action from content", async () => {
      const signal = await runAgentPipeline(
        "Floor vote on third reading of highway bill",
        null,
        [],
      );
      expect(signal.regime).toBe("floor_action");
    });

    it("detects committee_season from content", async () => {
      const signal = await runAgentPipeline(
        "Public hearing scheduled with witness list",
        null,
        [],
      );
      expect(signal.regime).toBe("committee_season");
    });

    it("detects sine_die from content", async () => {
      const signal = await runAgentPipeline(
        "Bill signed by governor and enrolled",
        null,
        [],
      );
      expect(signal.regime).toBe("sine_die");
    });
  });

  // ── MetaWeigher Integration ──

  describe("MetaWeigher (Combined Score)", () => {
    it("produces totalScore in 0-100 range", async () => {
      const signal = await runAgentPipeline(
        "HB 14 floor vote on transportation funding deadline",
        null,
        [
          { dimension: "bill_id", rule: "HB 14", excerpt: "" },
          { dimension: "keyword", rule: "transportation", excerpt: "" },
        ],
        { docDate: new Date() },
      );
      expect(signal.totalScore).toBeGreaterThanOrEqual(0);
      expect(signal.totalScore).toBeLessThanOrEqual(100);
    });

    it("escalates high-signal documents", async () => {
      const signal = await runAgentPipeline(
        "Floor vote scheduled on HB 14 — Governor and Speaker support. Deadline Monday.",
        null,
        [
          { dimension: "bill_id", rule: "HB 14", excerpt: "" },
          { dimension: "committee", rule: "Finance", excerpt: "" },
          { dimension: "keyword", rule: "transportation", excerpt: "" },
        ],
        { docDate: new Date() },
      );
      // Strong signals across all agents → should escalate
      expect(signal.action).toBe("escalate");
      expect(signal.totalScore).toBeGreaterThanOrEqual(60);
    });

    it("archives low-signal documents", async () => {
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const signal = await runAgentPipeline(
        "General notice about routine policy review",
        null,
        [],
        { docDate: threeMonthsAgo },
      );
      expect(signal.action).toBe("archive");
      expect(signal.totalScore).toBeLessThanOrEqual(20);
    });

    it("watches medium-signal documents", async () => {
      const signal = await runAgentPipeline(
        "Committee hearing on highway bill amendments",
        null,
        [
          { dimension: "keyword", rule: "highway", excerpt: "" },
        ],
        { docDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }, // 2 days old
      );
      // Some signals but not overwhelming → watch
      expect(signal.action).toBe("watch");
      expect(signal.totalScore).toBeGreaterThan(20);
      expect(signal.totalScore).toBeLessThan(60);
    });

    it("includes all 6 agents in output", async () => {
      const signal = await runAgentPipeline("Test doc", null, []);
      expect(signal.agents).toHaveLength(6);
      const names = signal.agents.map((a) => a.agent).sort();
      expect(names).toEqual([
        "actionability",
        "procedural",
        "regime",
        "relevance",
        "stakeholder",
        "timeliness",
      ]);
    });

    it("weights sum to ~1.0", async () => {
      const signal = await runAgentPipeline("Test doc", null, []);
      const sum = Object.values(signal.weights).reduce((s, v) => s + v, 0);
      expect(sum).toBeCloseTo(1.0, 1);
    });

    it("confidence is between 0 and 1", async () => {
      const signal = await runAgentPipeline("Test doc", null, []);
      expect(signal.confidence).toBeGreaterThanOrEqual(0);
      expect(signal.confidence).toBeLessThanOrEqual(1);
    });
  });

  // ── buildAgentScorecard Backwards Compatibility ──

  describe("buildAgentScorecard", () => {
    it("produces evaluators with 0-25 scores", async () => {
      const card = await buildAgentScorecard(
        "HB 14 transportation hearing",
        null,
        [{ dimension: "bill_id", rule: "HB 14", excerpt: "" }],
      );
      for (const ev of card.evaluators) {
        expect(ev.score).toBeGreaterThanOrEqual(0);
        expect(ev.score).toBeLessThanOrEqual(25);
        expect(ev.maxScore).toBe(25);
      }
    });

    it("totalScore matches pipeline signal", async () => {
      const card = await buildAgentScorecard(
        "Floor vote on HB 14",
        null,
        [{ dimension: "bill_id", rule: "HB 14", excerpt: "" }],
      );
      expect(card.totalScore).toBe(card.pipelineSignal.totalScore);
    });

    it("summary contains action label", async () => {
      const card = await buildAgentScorecard("Test", null, []);
      expect(card.summary).toMatch(/\[ESCALATE\]|\[WATCH\]|\[ARCHIVE\]/);
    });
  });
});
