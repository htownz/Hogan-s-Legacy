/**
 * Named Evaluators — Decision Kernel Hardening (Phase 7)
 *
 * Splits the flat relevanceScore into 4 named evaluators, each producing
 * a 0-25 sub-score and a human-readable rationale. The final scorecard
 * is stored in alerts.reasonsJson for full transparency.
 *
 * Evaluators:
 *  1. proceduralSignificance — how important is this procedural stage?
 *  2. matterRelevance       — how closely does the doc match the watchlist?
 *  3. stakeholderImpact      — does the doc reference known stakeholders / orgs?
 *  4. actionability          — is there a deadline, vote, or hearing upcoming?
 *
 * All evaluators are deterministic — no LLM required.
 */
import type { MatchReason } from "./match-watchlists";

// ── Types ────────────────────────────────────────────────────────────────────

export interface EvaluatorScore {
  evaluator: string;
  score: number;   // 0-25
  maxScore: 25;
  rationale: string;
}

export interface Scorecard {
  evaluators: EvaluatorScore[];
  totalScore: number;  // 0-100
  summary: string;
}

// ── Evaluator 1: Procedural Significance ─────────────────────────────────────

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

function evaluateProceduralSignificance(
  docTitle: string,
  docSummary: string | null | undefined,
  reasons: MatchReason[],
): EvaluatorScore {
  const text = `${docTitle} ${docSummary ?? ""}`.toLowerCase();
  let bestScore = 0;
  let bestKeyword = "";

  for (const [keyword, score] of Object.entries(PROCEDURAL_KEYWORDS)) {
    if (text.includes(keyword) && score > bestScore) {
      bestScore = score;
      bestKeyword = keyword;
    }
  }

  return {
    evaluator: "procedural_significance",
    score: Math.min(bestScore, 25),
    maxScore: 25,
    rationale: bestScore > 0
      ? `Procedural stage "${bestKeyword}" detected (significance: ${bestScore}/25)`
      : "No significant procedural stage detected",
  };
}

// ── Evaluator 2: Matter Relevance ────────────────────────────────────────────

function evaluateMatterRelevance(reasons: MatchReason[]): EvaluatorScore {
  if (reasons.length === 0) {
    return {
      evaluator: "matter_relevance",
      score: 0,
      maxScore: 25,
      rationale: "No watchlist rule matches",
    };
  }

  const dimensions = new Set(reasons.map((r) => r.dimension));
  let score = 0;

  // Bill ID match is strongest signal
  if (dimensions.has("bill_id")) score += 12;
  // Committee match adds structural relevance
  if (dimensions.has("committee")) score += 7;
  // Agency match adds regulatory relevance
  if (dimensions.has("agency")) score += 5;
  // Keyword matches (diminishing)
  const keywordCount = reasons.filter((r) => r.dimension === "keyword").length;
  score += Math.min(keywordCount * 3, 9);

  // Breadth bonus
  if (dimensions.size >= 3) score += 4;
  else if (dimensions.size >= 2) score += 2;

  const matched = Array.from(dimensions).join(", ");
  return {
    evaluator: "matter_relevance",
    score: Math.min(score, 25),
    maxScore: 25,
    rationale: `Matched ${reasons.length} rule(s) across dimensions: ${matched}`,
  };
}

// ── Evaluator 3: Stakeholder Impact ──────────────────────────────────────────

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

function evaluateStakeholderImpact(
  docTitle: string,
  docSummary: string | null | undefined,
): EvaluatorScore {
  const text = `${docTitle} ${docSummary ?? ""}`.toLowerCase();
  const found: string[] = [];

  for (const indicator of STAKEHOLDER_INDICATORS) {
    if (text.includes(indicator.toLowerCase())) {
      found.push(indicator);
    }
  }

  const score = Math.min(found.length * 5, 25);

  return {
    evaluator: "stakeholder_impact",
    score,
    maxScore: 25,
    rationale: found.length > 0
      ? `Stakeholder indicators found: ${found.slice(0, 5).join(", ")}${found.length > 5 ? ` +${found.length - 5} more` : ""}`
      : "No known stakeholder references detected",
  };
}

// ── Evaluator 4: Actionability ───────────────────────────────────────────────

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

function evaluateActionability(
  docTitle: string,
  docSummary: string | null | undefined,
): EvaluatorScore {
  const text = `${docTitle} ${docSummary ?? ""}`;
  let bestScore = 0;
  let bestLabel = "";

  for (const { pattern, score, label } of ACTIONABILITY_PATTERNS) {
    if (pattern.test(text) && score > bestScore) {
      bestScore = score;
      bestLabel = label;
    }
  }

  return {
    evaluator: "actionability",
    score: Math.min(bestScore, 25),
    maxScore: 25,
    rationale: bestScore > 0
      ? `Actionable signal: ${bestLabel} (score: ${bestScore}/25)`
      : "No immediate action trigger detected",
  };
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Run all 4 evaluators and produce a structured scorecard.
 */
export function buildScorecard(
  docTitle: string,
  docSummary: string | null | undefined,
  reasons: MatchReason[],
): Scorecard {
  const evaluators = [
    evaluateProceduralSignificance(docTitle, docSummary, reasons),
    evaluateMatterRelevance(reasons),
    evaluateStakeholderImpact(docTitle, docSummary),
    evaluateActionability(docTitle, docSummary),
  ];

  const totalScore = evaluators.reduce((sum, e) => sum + e.score, 0);

  const topFactors = evaluators
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((e) => e.rationale);

  const summary = topFactors.length > 0
    ? topFactors.slice(0, 2).join("; ")
    : "Low-confidence match — no strong signals detected";

  return {
    evaluators,
    totalScore: Math.min(totalScore, 100),
    summary,
  };
}
