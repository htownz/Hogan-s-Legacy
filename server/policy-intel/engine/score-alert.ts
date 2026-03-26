/**
 * Alert Scoring Engine
 *
 * Calculates a relevanceScore (0-100) from the match dimensions.
 * Fully deterministic — no LLM needed.
 *
 * Scoring dimensions (additive, capped at 100):
 *   bill_id   match  → +40  (strongest signal: exact bill reference)
 *   committee match  → +25  (structural relevance)
 *   agency    match  → +20  (regulatory / jurisdictional relevance)
 *   keyword   match  → +15  per unique keyword (first three, then +5 each)
 *
 * Bonus:
 *   Multiple dimension types matched  → +10  (breadth signal)
 */
import type { MatchReason } from "./match-watchlists";

const WEIGHTS: Record<MatchReason["dimension"], number> = {
  bill_id: 40,
  committee: 25,
  agency: 20,
  keyword: 15,
};

/** Diminishing return after 3 keyword hits */
const KEYWORD_DIMINISH_AFTER = 3;
const KEYWORD_DIMINISH_VALUE = 5;

/**
 * Compute relevanceScore from match reasons.
 */
export function scoreAlert(reasons: MatchReason[]): number {
  if (reasons.length === 0) return 0;

  let score = 0;
  const dimensionsSeen = new Set<MatchReason["dimension"]>();

  // Group by dimension so we can count keyword hits specially
  const keywordCount = { n: 0 };

  for (const r of reasons) {
    dimensionsSeen.add(r.dimension);

    if (r.dimension === "keyword") {
      keywordCount.n++;
      if (keywordCount.n <= KEYWORD_DIMINISH_AFTER) {
        score += WEIGHTS.keyword;
      } else {
        score += KEYWORD_DIMINISH_VALUE;
      }
    } else {
      // bill_id, committee, agency: count once per dimension
      // (multiple bill_id matches should not double-count)
      score += WEIGHTS[r.dimension];
    }
  }

  // Breadth bonus: matched in ≥ 2 distinct dimension types
  if (dimensionsSeen.size >= 2) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Generate a human-readable "why it matters" summary from match reasons.
 */
export function buildWhyItMatters(
  docTitle: string,
  reasons: MatchReason[],
): string {
  const dimensions = new Set(reasons.map((r) => r.dimension));
  const parts: string[] = [];

  if (dimensions.has("bill_id")) {
    const bills = reasons.filter((r) => r.dimension === "bill_id").map((r) => r.rule);
    parts.push(`Bill ${bills.join(", ")} directly referenced`);
  }
  if (dimensions.has("committee")) {
    const committees = reasons.filter((r) => r.dimension === "committee").map((r) => r.rule);
    parts.push(`Committee match: ${committees.join(", ")}`);
  }
  if (dimensions.has("agency")) {
    const agencies = reasons.filter((r) => r.dimension === "agency").map((r) => r.rule);
    parts.push(`Agency match: ${agencies.join(", ")}`);
  }
  if (dimensions.has("keyword")) {
    const keywords = reasons.filter((r) => r.dimension === "keyword").map((r) => r.rule);
    const display = keywords.length <= 4 ? keywords.join(", ") : `${keywords.slice(0, 4).join(", ")} +${keywords.length - 4} more`;
    parts.push(`Keyword match: ${display}`);
  }

  return `"${docTitle}" — ${parts.join("; ")}.`;
}
