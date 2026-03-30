/**
 * Multi-Agent Scoring Pipeline — ported from Hogan Market OS
 *
 * Architecture (adapted from Hogan's AgentPipeline → MetaWeigher):
 *
 *   ProceduralAgent   --+
 *   RelevanceAgent     --+--> MetaWeigher --> PipelineSignal
 *   StakeholderAgent   --+
 *   ActionabilityAgent --+
 *   TimelinessAgent    --+
 *   RegimeAgent        --+
 *
 * Each agent produces a typed AgentScore (0-1 normalized, with confidence
 * and rationale). The MetaWeigher combines scores with configurable,
 * regime-adaptive weights into a final 0-100 score with a pipeline-level
 * confidence metric.
 *
 * Backwards-compatible: produces a Scorecard that alert-service.ts can
 * consume without changes.
 */
import type { MatchReason } from "./match-watchlists";
import type { EvaluatorScore, Scorecard } from "./evaluators";
import { metrics } from "../metrics";
import { getChampionConfig } from "./champion";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AgentScore {
  agent: string;
  /** Normalized score 0-1 (MetaWeigher scales to final output) */
  score: number;
  /** Agent's self-assessed confidence in this score (0-1) */
  confidence: number;
  /** Human-readable rationale */
  rationale: string;
  /** Optional structured details for diagnostics */
  details?: Record<string, unknown>;
}

export interface PipelineSignal {
  action: "escalate" | "watch" | "archive";
  /** Combined score 0-100 (backwards-compatible with Scorecard.totalScore) */
  totalScore: number;
  /** Pipeline-level confidence (0-1) — how much agreement between agents */
  confidence: number;
  /** Human-readable explanation built from agent contributions */
  explanation: string;
  /** Individual agent scores */
  agents: AgentScore[];
  /** Weights used for this run */
  weights: Record<string, number>;
  /** Regime detected for this document */
  regime: string;
}

// ── Agent Interface ──────────────────────────────────────────────────────────

interface ScoringAgent {
  name: string;
  analyze(ctx: AgentContext): AgentScore;
}

interface AgentContext {
  docTitle: string;
  docSummary: string | null | undefined;
  reasons: MatchReason[];
  docDate?: Date | null;
  rawPayload?: Record<string, unknown>;
}

// ── Procedural Agent ─────────────────────────────────────────────────────────
// Wraps evaluateProceduralSignificance — detects legislative stage

const PROCEDURAL_KEYWORDS: Record<string, number> = {
  "floor vote": 25,
  "final passage": 25,
  "signed by governor": 25,
  "enrolled": 22,
  "third reading": 22,
  "conference committee": 20,
  "second reading": 18,
  "committee vote": 18,
  "reported favorably": 18,
  "substitute": 16,
  "amendment": 15,
  "public hearing": 14,
  "committee hearing": 12,
  "referred to committee": 10,
  "filed": 8,
  "introduced": 6,
  "posted": 5,
  "agenda": 4,
  "meeting": 3,
  "notice": 2,
};

const proceduralAgent: ScoringAgent = {
  name: "procedural",
  analyze(ctx: AgentContext): AgentScore {
    const text = `${ctx.docTitle} ${ctx.docSummary ?? ""}`.toLowerCase();
    let bestScore = 0;
    let bestKeyword = "";
    const found: string[] = [];

    for (const [keyword, score] of Object.entries(PROCEDURAL_KEYWORDS)) {
      if (text.includes(keyword)) {
        found.push(keyword);
        if (score > bestScore) {
          bestScore = score;
          bestKeyword = keyword;
        }
      }
    }

    // Confidence: high when we find strong procedural keywords, lower for weak ones
    const confidence = found.length > 0
      ? Math.min(1.0, 0.5 + (bestScore / 25) * 0.5)
      : 0.3; // Low confidence when nothing found (absence is informative)

    return {
      agent: "procedural",
      score: bestScore / 25,
      confidence,
      rationale: bestScore > 0
        ? `Procedural stage "${bestKeyword}" detected (${bestScore}/25)`
        : "No significant procedural stage detected",
      details: { found, bestKeyword, bestScore },
    };
  },
};

// ── Relevance Agent ──────────────────────────────────────────────────────────
// Wraps evaluateMatterRelevance — scores dimension breadth and depth

const relevanceAgent: ScoringAgent = {
  name: "relevance",
  analyze(ctx: AgentContext): AgentScore {
    if (ctx.reasons.length === 0) {
      return {
        agent: "relevance",
        score: 0,
        confidence: 0.9, // High confidence that there's no match
        rationale: "No watchlist rule matches",
      };
    }

    const dimensions = new Set(ctx.reasons.map((r) => r.dimension));
    let rawScore = 0;

    if (dimensions.has("bill_id")) rawScore += 12;
    if (dimensions.has("committee")) rawScore += 7;
    if (dimensions.has("agency")) rawScore += 5;

    const keywordCount = ctx.reasons.filter((r) => r.dimension === "keyword").length;
    rawScore += Math.min(keywordCount * 3, 9);

    if (dimensions.size >= 3) rawScore += 4;
    else if (dimensions.size >= 2) rawScore += 2;

    const score = Math.min(rawScore, 25) / 25;

    // Confidence scales with breadth — more dimensions = more confident
    const confidence = Math.min(1.0, 0.4 + dimensions.size * 0.2);

    const matched = Array.from(dimensions).join(", ");
    return {
      agent: "relevance",
      score,
      confidence,
      rationale: `Matched ${ctx.reasons.length} rule(s) across dimensions: ${matched}`,
      details: { dimensions: Array.from(dimensions), keywordCount, rawScore },
    };
  },
};

// ── Stakeholder Agent ────────────────────────────────────────────────────────
// Wraps evaluateStakeholderImpact + enhanced entity detection

const STAKEHOLDER_INDICATORS = [
  "governor",
  "lt. governor",
  "speaker",
  "chairman",
  "chair",
  "commissioner",
  "secretary",
  "director",
  "executive director",
  "TxDOT",
  "TCEQ",
  "HHSC",
  "PUC",
  "TWC",
  "TEA",
  "METRO",
  "Houston",
  "Harris County",
  "city council",
  "commissioners court",
];

// Tier system: higher-impact stakeholders get more weight
const STAKEHOLDER_TIERS: Record<string, number> = {
  governor: 3,
  "lt. governor": 3,
  speaker: 3,
  "signed by governor": 3,
  "executive director": 2,
  commissioner: 2,
  chairman: 2,
  chair: 2,
  secretary: 2,
  director: 1,
  TxDOT: 2,
  TCEQ: 2,
  HHSC: 2,
  PUC: 2,
  TWC: 1,
  TEA: 2,
  METRO: 1,
  Houston: 1,
  "Harris County": 2,
  "city council": 1,
  "commissioners court": 2,
};

const stakeholderAgent: ScoringAgent = {
  name: "stakeholder",
  analyze(ctx: AgentContext): AgentScore {
    const text = `${ctx.docTitle} ${ctx.docSummary ?? ""}`.toLowerCase();
    const found: { indicator: string; tier: number }[] = [];

    for (const indicator of STAKEHOLDER_INDICATORS) {
      if (text.includes(indicator.toLowerCase())) {
        found.push({
          indicator,
          tier: STAKEHOLDER_TIERS[indicator] ?? 1,
        });
      }
    }

    // Weighted scoring: tier 3 = 8pts, tier 2 = 5pts, tier 1 = 3pts
    const rawScore = found.reduce((sum, f) => {
      const pts = f.tier === 3 ? 8 : f.tier === 2 ? 5 : 3;
      return sum + pts;
    }, 0);

    const score = Math.min(rawScore, 25) / 25;

    // Confidence: higher when we find high-tier stakeholders
    const maxTier = found.length > 0 ? Math.max(...found.map((f) => f.tier)) : 0;
    const confidence = found.length > 0
      ? Math.min(1.0, 0.5 + maxTier * 0.15 + found.length * 0.05)
      : 0.4;

    return {
      agent: "stakeholder",
      score,
      confidence,
      rationale: found.length > 0
        ? `Stakeholder indicators: ${found.slice(0, 5).map((f) => f.indicator).join(", ")}${found.length > 5 ? ` +${found.length - 5} more` : ""}`
        : "No known stakeholder references detected",
      details: { found: found.map((f) => f.indicator), tiers: found.map((f) => f.tier) },
    };
  },
};

// ── Actionability Agent ──────────────────────────────────────────────────────
// Wraps evaluateActionability — detects deadlines, votes, hearings

const ACTIONABILITY_PATTERNS: { pattern: RegExp; score: number; label: string }[] = [
  { pattern: /vote\s+(scheduled|set|on)/i, score: 25, label: "vote scheduled" },
  { pattern: /deadline/i, score: 22, label: "deadline referenced" },
  { pattern: /hearing\s+(on|scheduled|set)/i, score: 20, label: "hearing scheduled" },
  { pattern: /public\s+comment/i, score: 18, label: "public comment period" },
  { pattern: /comment\s+period/i, score: 18, label: "comment period" },
  { pattern: /testimony/i, score: 16, label: "testimony referenced" },
  { pattern: /witness\s+list/i, score: 16, label: "witness list" },
  { pattern: /rulemaking/i, score: 14, label: "rulemaking activity" },
  { pattern: /proposed\s+rule/i, score: 14, label: "proposed rule" },
  { pattern: /effective\s+date/i, score: 12, label: "effective date mentioned" },
  { pattern: /procurement|rfp|bid/i, score: 12, label: "procurement action" },
  { pattern: /contract/i, score: 10, label: "contract referenced" },
  { pattern: /appropriat/i, score: 10, label: "appropriation referenced" },
  { pattern: /amendment/i, score: 8, label: "amendment activity" },
  { pattern: /report\s+(due|filed|released)/i, score: 8, label: "report activity" },
];

const actionabilityAgent: ScoringAgent = {
  name: "actionability",
  analyze(ctx: AgentContext): AgentScore {
    const text = `${ctx.docTitle} ${ctx.docSummary ?? ""}`;
    let bestScore = 0;
    let bestLabel = "";
    const triggers: string[] = [];

    for (const { pattern, score, label } of ACTIONABILITY_PATTERNS) {
      if (pattern.test(text)) {
        triggers.push(label);
        if (score > bestScore) {
          bestScore = score;
          bestLabel = label;
        }
      }
    }

    const score = bestScore / 25;

    // Confidence: multiple triggers = higher confidence
    const confidence = triggers.length > 0
      ? Math.min(1.0, 0.6 + triggers.length * 0.1)
      : 0.5;

    return {
      agent: "actionability",
      score,
      confidence,
      rationale: bestScore > 0
        ? `Actionable signal: ${bestLabel} (${bestScore}/25)`
        : "No immediate action trigger detected",
      details: { triggers, bestLabel, bestScore },
    };
  },
};

// ── Timeliness Agent (NEW — no legacy equivalent) ────────────────────────────
// Scores document freshness and recency. Stale docs get dampened,
// just like Hogan's SentimentAgent applies freshness discounts to old data.

const timelinessAgent: ScoringAgent = {
  name: "timeliness",
  analyze(ctx: AgentContext): AgentScore {
    const now = Date.now();

    // Try to extract a date from the document
    let docAge = Infinity;
    if (ctx.docDate) {
      docAge = (now - new Date(ctx.docDate).getTime()) / (1000 * 60 * 60); // hours
    } else if (ctx.rawPayload?.date) {
      const parsed = new Date(ctx.rawPayload.date as string);
      if (!isNaN(parsed.getTime())) {
        docAge = (now - parsed.getTime()) / (1000 * 60 * 60);
      }
    } else if (ctx.rawPayload?.lastAction) {
      const parsed = new Date(ctx.rawPayload.lastAction as string);
      if (!isNaN(parsed.getTime())) {
        docAge = (now - parsed.getTime()) / (1000 * 60 * 60);
      }
    }

    // Freshness curve (similar to Hogan's data staleness discount)
    let freshness: number;
    let rationale: string;

    if (docAge <= 24) {
      freshness = 1.0;
      rationale = "Document is less than 24 hours old — maximum freshness";
    } else if (docAge <= 72) {
      freshness = 0.85;
      rationale = "Document is 1-3 days old — high freshness";
    } else if (docAge <= 168) {
      freshness = 0.6;
      rationale = "Document is 3-7 days old — moderate freshness";
    } else if (docAge <= 720) {
      freshness = 0.3;
      rationale = "Document is 1-4 weeks old — low freshness";
    } else if (docAge !== Infinity) {
      freshness = 0.1;
      rationale = "Document is over a month old — stale";
    } else {
      freshness = 0.5; // Unknown age, neutral
      rationale = "Document age unknown — neutral freshness";
    }

    // Confidence: high when we have a date, low when we don't
    const confidence = docAge !== Infinity ? 0.8 : 0.3;

    return {
      agent: "timeliness",
      score: freshness,
      confidence,
      rationale,
      details: { docAgeHours: docAge === Infinity ? null : Math.round(docAge) },
    };
  },
};

// ── Regime Agent — Granular Legislative Calendar ─────────────────────────────
// Analogous to Hogan's MacroAgent regime detection (trending_up, ranging,
// volatile, etc.) but for the Texas legislative calendar.
//
// 8 regimes map the full legislative lifecycle:
//   pre_filing       → Nov-Dec even year: bills filed, positioning
//   early_session     → Jan odd year: session convenes, referrals begin
//   committee_season  → Feb-Mar odd year: hearings, testimony, markups
//   floor_action      → Apr-early May: 2nd/3rd readings, floor votes
//   conference        → mid-May: conference committees reconcile
//   sine_die          → late May: final passage, enrollment, governor action
//   interim           → Jun even year - Oct even year: studies, charges
//   special_session   → called at any time by governor
//
// Detection uses (1) document content signals first, then (2) calendar math.

export type LegislativeRegime =
  | "pre_filing"
  | "early_session"
  | "committee_season"
  | "floor_action"
  | "conference"
  | "sine_die"
  | "special_session"
  | "interim";

// Content-based regime signals (checked before calendar fallback)
const REGIME_CONTENT_SIGNALS: { regime: LegislativeRegime; patterns: RegExp[] }[] = [
  {
    regime: "special_session",
    patterns: [
      /special\s+session/i,
      /called\s+session/i,
      /extraordinary\s+session/i,
    ],
  },
  {
    regime: "sine_die",
    patterns: [
      /sine\s+die/i,
      /signed\s+by\s+(the\s+)?governor/i,
      /enrolled/i,
      /final\s+passage/i,
      /vetoed/i,
      /line[- ]item\s+veto/i,
    ],
  },
  {
    regime: "conference",
    patterns: [
      /conference\s+committee/i,
      /free\s+conference/i,
      /conferees\s+appointed/i,
      /conference\s+report/i,
    ],
  },
  {
    regime: "floor_action",
    patterns: [
      /floor\s+vote/i,
      /third\s+reading/i,
      /second\s+reading/i,
      /passed\s+(house|senate)/i,
      /record\s+vote/i,
      /yeas\s+and\s+nays/i,
      /calendar/i,
      /point\s+of\s+order/i,
    ],
  },
  {
    regime: "committee_season",
    patterns: [
      /committee\s+hearing/i,
      /public\s+hearing/i,
      /witness\s+list/i,
      /reported\s+favorably/i,
      /substitute/i,
      /committee\s+vote/i,
      /referred\s+to\s+committee/i,
      /testimony/i,
      /markup/i,
    ],
  },
  {
    regime: "early_session",
    patterns: [
      /convened/i,
      /session\s+opened/i,
      /first\s+reading/i,
      /filed/i,
      /introduced/i,
    ],
  },
  {
    regime: "pre_filing",
    patterns: [
      /pre[- ]?fil(e|ing)/i,
      /interim\s+charge/i,
      /interim\s+report/i,
      /interim\s+study/i,
    ],
  },
];

/**
 * Texas regular session: odd years, 140 days starting 2nd Tuesday in January.
 * Computes the exact start/end dates for the session year.
 */
function getTexasSessionWindow(year: number): { start: Date; end: Date } | null {
  if (year % 2 === 0) return null;
  // 2nd Tuesday in January
  const jan1 = new Date(year, 0, 1);
  const dayOfWeek = jan1.getDay(); // 0=Sun
  const daysToFirstTue = (2 - dayOfWeek + 7) % 7;
  const firstTue = 1 + daysToFirstTue;
  const secondTue = firstTue + 7;
  const start = new Date(year, 0, secondTue);
  const end = new Date(start.getTime() + 139 * 24 * 60 * 60 * 1000); // 140 days inclusive
  return { start, end };
}

function detectLegislativeRegime(ctx: AgentContext): LegislativeRegime {
  const text = `${ctx.docTitle} ${ctx.docSummary ?? ""}`.toLowerCase();

  // 1. Content-signal detection (highest priority)
  //    Walk signals in priority order; first match wins.
  for (const { regime, patterns } of REGIME_CONTENT_SIGNALS) {
    for (const re of patterns) {
      if (re.test(text)) {
        return regime;
      }
    }
  }

  // 2. Calendar-based fallback
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  const day = now.getDate();

  // Check if we're in a regular session year
  const session = getTexasSessionWindow(year);
  if (session) {
    const dayOfSession = Math.floor(
      (now.getTime() - session.start.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (dayOfSession < 0) {
      // Before session starts in an odd year (early Jan)
      return "pre_filing";
    }
    if (dayOfSession <= 14) {
      // Days 1-14: convening, first readings, referrals
      return "early_session";
    }
    if (dayOfSession <= 80) {
      // Days 15-80 (~Feb-Mar): committee hearings peak
      return "committee_season";
    }
    if (dayOfSession <= 120) {
      // Days 81-120 (~Apr-early May): floor calendars, 2nd/3rd readings
      return "floor_action";
    }
    if (dayOfSession <= 133) {
      // Days 121-133 (~mid May): conference committees
      return "conference";
    }
    if (dayOfSession <= 150) {
      // Days 134-150 (~late May + governor action window)
      return "sine_die";
    }
    // Past session + governor window
    return "interim";
  }

  // Even year: check for pre-filing season
  if (year % 2 === 0 && month >= 11) {
    return "pre_filing";
  }

  return "interim";
}

interface RegimeProfile {
  urgencyMultiplier: number;
  label: string;
  /** What kind of documents matter most in this regime */
  focus: string;
}

const REGIME_CONFIG: Record<LegislativeRegime, RegimeProfile> = {
  pre_filing: {
    urgencyMultiplier: 0.7,
    label: "Pre-filing season — bills being drafted and positioned",
    focus: "Track bill filings, interim charges, stakeholder positioning",
  },
  early_session: {
    urgencyMultiplier: 0.9,
    label: "Early session — convened, referrals and first readings underway",
    focus: "Committee assignments, bill referrals, early amendments",
  },
  committee_season: {
    urgencyMultiplier: 1.15,
    label: "Committee season — hearings, testimony, and markups at peak",
    focus: "Committee hearings, witness lists, substitutes, favorable reports",
  },
  floor_action: {
    urgencyMultiplier: 1.3,
    label: "Floor action — bills moving through 2nd/3rd readings and votes",
    focus: "Floor votes, calendars, amendments, points of order",
  },
  conference: {
    urgencyMultiplier: 1.35,
    label: "Conference period — chambers reconciling competing versions",
    focus: "Conference committee reports, final amendments, deal-making",
  },
  sine_die: {
    urgencyMultiplier: 1.4,
    label: "Sine die — final passage, enrollment, governor action window",
    focus: "Enrolled bills, governor signatures/vetoes, effective dates",
  },
  special_session: {
    urgencyMultiplier: 1.4,
    label: "Special session — compressed timeline, governor-set agenda",
    focus: "Governor's call items only — fast-track action required",
  },
  interim: {
    urgencyMultiplier: 0.6,
    label: "Interim — legislature not in session",
    focus: "Interim studies, agency rulemaking, stakeholder engagement",
  },
};

const regimeAgent: ScoringAgent = {
  name: "regime",
  analyze(ctx: AgentContext): AgentScore {
    const regime = detectLegislativeRegime(ctx);
    const profile = REGIME_CONFIG[regime];

    // Score represents urgency level, normalized 0-1
    const score = Math.min(profile.urgencyMultiplier / 1.4, 1.0);

    // Content-detected regimes get higher confidence than calendar defaults
    const text = `${ctx.docTitle} ${ctx.docSummary ?? ""}`.toLowerCase();
    const contentDetected = REGIME_CONTENT_SIGNALS.some(({ patterns }) =>
      patterns.some((re) => re.test(text)),
    );
    const confidence = contentDetected ? 0.85 : 0.65;

    return {
      agent: "regime",
      score,
      confidence,
      rationale: `${profile.label}. Focus: ${profile.focus}`,
      details: {
        regime,
        urgencyMultiplier: profile.urgencyMultiplier,
        contentDetected,
        focus: profile.focus,
      },
    };
  },
};

// ── MetaWeigher ──────────────────────────────────────────────────────────────
// Analogous to Hogan's MetaWeigher.combine() — takes all agent scores,
// applies weights, handles agent disagreement, produces final signal.

interface MetaWeigherConfig {
  weights: Record<string, number>;
  /** Score threshold for "escalate" action (0-100) */
  escalateThreshold: number;
  /** Score threshold for "archive" action (0-100) */
  archiveThreshold: number;
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  procedural: 0.25,
  relevance: 0.30,
  stakeholder: 0.15,
  actionability: 0.15,
  timeliness: 0.10,
  regime: 0.05,
};

const DEFAULT_CONFIG: MetaWeigherConfig = {
  weights: DEFAULT_WEIGHTS,
  escalateThreshold: 60,
  archiveThreshold: 20,
};

// Regime-specific weight adjustments (like Hogan's RegimeConfig.meta_*_delta)
// Each regime shifts how much each agent matters.
const REGIME_WEIGHT_DELTAS: Record<LegislativeRegime, Partial<Record<string, number>>> = {
  pre_filing:       { relevance: 0.05, stakeholder: 0.05, procedural: -0.05, actionability: -0.05 },
  early_session:    { procedural: 0.03, relevance: 0.02, actionability: -0.03, stakeholder: -0.02 },
  committee_season: { actionability: 0.06, procedural: 0.04, stakeholder: 0.02, relevance: -0.08, timeliness: -0.04 },
  floor_action:     { procedural: 0.08, actionability: 0.06, timeliness: 0.04, relevance: -0.10, stakeholder: -0.08 },
  conference:       { procedural: 0.08, actionability: 0.08, timeliness: 0.04, relevance: -0.12, stakeholder: -0.08 },
  sine_die:         { procedural: 0.10, actionability: 0.08, timeliness: 0.05, relevance: -0.13, stakeholder: -0.10 },
  special_session:  { procedural: 0.08, actionability: 0.08, timeliness: 0.05, relevance: -0.12, stakeholder: -0.09 },
  interim:          { stakeholder: 0.05, relevance: 0.05, procedural: -0.05, actionability: -0.05 },
};

function normalizeWeights(weights: Record<string, number>): Record<string, number> {
  const total = Object.values(weights).reduce((sum, v) => sum + v, 0);
  if (total <= 0) {
    const n = Object.keys(weights).length;
    return Object.fromEntries(Object.keys(weights).map((k) => [k, 1 / n]));
  }
  return Object.fromEntries(Object.entries(weights).map(([k, v]) => [k, v / total]));
}

function metaWeigh(
  agents: AgentScore[],
  regime: LegislativeRegime,
  config: MetaWeigherConfig = DEFAULT_CONFIG,
): PipelineSignal {
  // Start with base weights
  const w: Record<string, number> = { ...config.weights };

  // Apply regime-specific deltas (like Hogan's RegimeConfig adjustments)
  const deltas = REGIME_WEIGHT_DELTAS[regime] ?? {};
  for (const [key, delta] of Object.entries(deltas)) {
    if (key in w) {
      w[key] = Math.max(0.05, (w[key] ?? 0) + (delta ?? 0));
    }
  }

  // Normalize weights to sum to 1
  const normalized = normalizeWeights(w);

  // Weighted combination with confidence dampening
  // (like Hogan's tech_score = tech_vote * tech.confidence)
  let weightedSum = 0;
  let confidenceSum = 0;

  for (const agent of agents) {
    const weight = normalized[agent.agent] ?? 0;
    // Each agent's contribution is dampened by its own confidence
    const effectiveScore = agent.score * agent.confidence;
    weightedSum += weight * effectiveScore;
    confidenceSum += weight * agent.confidence;
  }

  // Scale to 0-100
  const totalScore = Math.round(Math.min(100, Math.max(0, weightedSum * 100)));

  // Pipeline confidence: weighted average of agent confidences,
  // penalized by agent disagreement (like Hogan's combined_score variance check)
  const scores = agents.map((a) => a.score);
  const mean = scores.reduce((s, v) => s + v, 0) / scores.length;
  const variance = scores.reduce((s, v) => s + (v - mean) ** 2, 0) / scores.length;
  const disagreementPenalty = Math.min(0.3, variance * 2);
  const confidence = Math.max(0, Math.min(1, confidenceSum - disagreementPenalty));

  // Action thresholds (like Hogan's buy_threshold / sell_threshold)
  let action: PipelineSignal["action"];
  if (totalScore >= config.escalateThreshold) {
    action = "escalate";
  } else if (totalScore <= config.archiveThreshold) {
    action = "archive";
  } else {
    action = "watch";
  }

  // Build explanation from top contributors (like Hogan's explanation_parts)
  const sorted = [...agents].sort((a, b) => {
    const wa = normalized[a.agent] ?? 0;
    const wb = normalized[b.agent] ?? 0;
    return (b.score * wb) - (a.score * wa);
  });

  const explanationParts = sorted
    .filter((a) => a.score > 0)
    .slice(0, 3)
    .map((a) => `${a.agent}: ${a.rationale}`);

  const explanation = explanationParts.length > 0
    ? explanationParts.join(" | ") + ` -> ${action.toUpperCase()} (conf=${confidence.toFixed(2)})`
    : `Low-confidence match -> ${action.toUpperCase()} (conf=${confidence.toFixed(2)})`;

  return {
    action,
    totalScore,
    confidence,
    explanation,
    agents,
    weights: normalized,
    regime,
  };
}

// ── Agent Pipeline ───────────────────────────────────────────────────────────
// Orchestrates all agents and produces a backwards-compatible Scorecard.
// Drop-in replacement for buildScorecard().

const ALL_AGENTS: ScoringAgent[] = [
  proceduralAgent,
  relevanceAgent,
  stakeholderAgent,
  actionabilityAgent,
  timelinessAgent,
  regimeAgent,
];

/**
 * Run the full multi-agent pipeline.
 * Returns a PipelineSignal with full diagnostics.
 * Now async — reads champion weights from the champion store.
 */
export async function runAgentPipeline(
  docTitle: string,
  docSummary: string | null | undefined,
  reasons: MatchReason[],
  opts?: {
    docDate?: Date | null;
    rawPayload?: Record<string, unknown>;
  },
): Promise<PipelineSignal> {
  const t0 = Date.now();

  const ctx: AgentContext = {
    docTitle,
    docSummary,
    reasons,
    docDate: opts?.docDate ?? null,
    rawPayload: opts?.rawPayload ?? {},
  };

  // Detect regime first (needed for MetaWeigher)
  const regime = detectLegislativeRegime(ctx);

  // Run all agents
  const agentScores = ALL_AGENTS.map((agent) => agent.analyze(ctx));

  // Load champion weights (falls back to DEFAULT_CONFIG if no champion exists)
  const championConfig = await getChampionConfig();
  const config: MetaWeigherConfig = {
    weights: championConfig.weights,
    escalateThreshold: championConfig.escalateThreshold,
    archiveThreshold: championConfig.archiveThreshold,
  };

  // Combine via MetaWeigher using champion weights
  const signal = metaWeigh(agentScores, regime, config);

  // ── Record Prometheus metrics ──
  const durationMs = Date.now() - t0;
  metrics.inc("policy_intel_pipeline_runs_total");
  metrics.inc("policy_intel_pipeline_actions_total", { action: signal.action });
  metrics.observe("policy_intel_pipeline_score", {}, signal.totalScore);
  metrics.observe("policy_intel_pipeline_confidence", {}, signal.confidence);
  metrics.observe("policy_intel_pipeline_duration_ms", {}, durationMs);
  metrics.inc("policy_intel_regime_detections_total", { regime });

  // Set current regime gauge (clear others, set active to 1)
  for (const r of Object.keys(REGIME_CONFIG)) {
    metrics.set("policy_intel_regime_current", { regime: r }, r === regime ? 1 : 0);
  }

  // Per-agent scores
  for (const a of agentScores) {
    metrics.observe("policy_intel_agent_score", { agent: a.agent }, a.score);
  }

  return signal;
}

/**
 * Run the agent pipeline and produce a Scorecard compatible with the
 * existing alert-service.ts. Drop-in replacement for buildScorecard().
 */
export async function buildAgentScorecard(
  docTitle: string,
  docSummary: string | null | undefined,
  reasons: MatchReason[],
  opts?: {
    docDate?: Date | null;
    rawPayload?: Record<string, unknown>;
  },
): Promise<Scorecard & { pipelineSignal: PipelineSignal }> {
  const signal = await runAgentPipeline(docTitle, docSummary, reasons, opts);

  // Convert agent scores to EvaluatorScore format for backwards compatibility
  // Map 6 agents → 4 evaluator slots (merge timeliness & regime into existing ones)
  const evaluators: EvaluatorScore[] = signal.agents.map((a) => ({
    evaluator: a.agent,
    score: Math.round(a.score * 25),
    maxScore: 25 as const,
    rationale: a.rationale,
  }));

  const topFactors = signal.agents
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((a) => a.rationale);

  const summary = topFactors.length > 0
    ? topFactors.slice(0, 2).join("; ")
    : "Low-confidence match — no strong signals detected";

  return {
    evaluators,
    totalScore: signal.totalScore,
    summary: `[${signal.action.toUpperCase()}] ${summary} (confidence: ${(signal.confidence * 100).toFixed(0)}%)`,
    pipelineSignal: signal,
  };
}

// ── Diagnostics ──────────────────────────────────────────────────────────────
// Exposes pipeline internals for the /metrics endpoint

export function getPipelineConfig() {
  return {
    agents: ALL_AGENTS.map((a) => a.name),
    defaultWeights: { ...DEFAULT_WEIGHTS },
    escalateThreshold: DEFAULT_CONFIG.escalateThreshold,
    archiveThreshold: DEFAULT_CONFIG.archiveThreshold,
    regimeWeightDeltas: { ...REGIME_WEIGHT_DELTAS },
  };
}
