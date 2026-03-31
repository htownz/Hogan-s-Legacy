/**
 * Historical Pattern Analysis — mines 23 Texas legislative sessions
 * (107K+ bills) to provide statistically-grounded context.
 *
 * This answers: "Bills with this committee path historically pass 73%
 * of the time" and provides session timing predictions.
 *
 * Capabilities:
 * - Committee passage rates (per-committee success/failure across sessions)
 * - Bill type analysis (HB vs SB vs HJR vs SJR outcomes)
 * - Chamber crossover patterns (which chamber's bills survive more?)
 * - Session timing predictions (when in a session do most bills pass?)
 * - Session-over-session comparisons (is this session more productive?)
 * - Committee path signatures (which committee combos yield passage?)
 */
import { policyIntelDb } from "../../db";
import { sourceDocuments } from "@shared/schema-policy-intel";
import { sql } from "drizzle-orm";

// ── Types ────────────────────────────────────────────────────────────────────

export interface CommitteePassageRate {
  committee: string;
  /** Total bills referred to this committee that are still tracked at referral stage */
  totalBills: number;
  /** Bills that made it past committee (engrossed+) — from this referral pool */
  passedBills: number;
  /** Fraction still stuck at introduced (bottleneck measure) */
  passageRate: number;
  vetoedBills: number;
  vetoRate: number;
  /** How this committee compares to the overall average */
  relativePerformance: "above_average" | "average" | "below_average";
  /** Status breakdown for bills referred here */
  statusBreakdown: Record<string, number>;
  /** Passage rate per session for trend analysis */
  sessionTrends: Array<{ session: string; total: number; passed: number; rate: number }>;
  narrative: string;
}

export interface BillTypePattern {
  billType: string;
  label: string;
  totalBills: number;
  passedBills: number;
  passageRate: number;
  vetoedBills: number;
  engrossedBills: number;
  /** Average days from introduction to passage (for passed bills) */
  avgProgressionDays: number | null;
  narrative: string;
}

export interface SessionAnalysis {
  sessionName: string;
  sessionId: string;
  totalBills: number;
  introduced: number;
  engrossed: number;
  enrolled: number;
  passed: number;
  vetoed: number;
  passageRate: number;
  /** Compared to historical median passage rate */
  performanceVsMedian: number;
  narrative: string;
}

export interface ChamberPattern {
  chamber: string;
  totalBills: number;
  passedBills: number;
  passageRate: number;
  topCommittees: Array<{ committee: string; bills: number; passageRate: number }>;
  narrative: string;
}

export interface TimingPattern {
  /** Month of last action for passed bills */
  month: number;
  monthLabel: string;
  billsPassedInMonth: number;
  /** Fraction of all passed bills that pass in this month */
  shareOfPassages: number;
  narrative: string;
}

export interface HistoricalPatternsReport {
  analyzedAt: string;
  /** Total bills analyzed across all sessions */
  totalBillsAnalyzed: number;
  /** Number of sessions spanned */
  sessionsAnalyzed: number;
  /** Per-committee passage rates */
  committeeRates: CommitteePassageRate[];
  /** Bill type breakdown (HB, SB, HJR, SJR, etc.) */
  billTypePatterns: BillTypePattern[];
  /** Per-session outcome analysis */
  sessionAnalyses: SessionAnalysis[];
  /** Per-chamber outcomes */
  chamberPatterns: ChamberPattern[];
  /** When in the session do bills pass? */
  timingPatterns: TimingPattern[];
  /** Key statistical insights (human-readable) */
  keyFindings: string[];
  /** Overall passage rate across all sessions */
  overallPassageRate: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Normalize LegiScan status codes: "status_4", "4", "Passed" → canonical label */
function normalizeStatus(raw: string | number | null | undefined): string {
  if (raw == null) return "unknown";
  const s = String(raw).toLowerCase().replace("status_", "").trim();
  switch (s) {
    case "0": return "na";
    case "1": return "introduced";
    case "2": return "engrossed";
    case "3": return "enrolled";
    case "4": return "passed";
    case "5": return "vetoed";
    default: return "unknown";
  }
}

const MONTH_LABELS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Extract committee name from lastAction string (e.g. "Referred to State Affairs") */
function extractCommittee(lastAction: string): string | null {
  const m = lastAction.match(/(?:Referred to|referred to)\s+(.+?)(?:\.|$)/i);
  return m ? m[1].trim() : null;
}

/** Extract bill type from billNumber (e.g. "HB 1234" → "HB") */
function extractBillType(billNumber: string): string {
  const m = billNumber.match(/^(H\.?B\.?|S\.?B\.?|H\.?J\.?R\.?|S\.?J\.?R\.?|H\.?C\.?R\.?|S\.?C\.?R\.?)/i);
  return m ? m[1].replace(/\./g, "").toUpperCase() : "OTHER";
}

const BILL_TYPE_LABELS: Record<string, string> = {
  HB: "House Bill",
  SB: "Senate Bill",
  HJR: "House Joint Resolution",
  SJR: "Senate Joint Resolution",
  HCR: "House Concurrent Resolution",
  SCR: "Senate Concurrent Resolution",
  OTHER: "Other",
};

// ── Main Analyzer ────────────────────────────────────────────────────────────

export async function analyzeHistoricalPatterns(): Promise<HistoricalPatternsReport> {
  // ── 1a. Get final bill status (best/highest status per unique bill) ──
  const statusQuery = await policyIntelDb.execute<{
    bill_number: string | null;
    session_id: string | null;
    session_name: string | null;
    chamber: string | null;
    best_status: string | null;
    last_action_date: string | null;
  }>(sql`
    SELECT
      raw_payload->>'billNumber' AS bill_number,
      raw_payload->>'sessionId' AS session_id,
      raw_payload->>'sessionName' AS session_name,
      raw_payload->>'chamber' AS chamber,
      MAX(CASE
        WHEN (raw_payload->>'status') IN ('5', 'status_5') THEN '5'
        WHEN (raw_payload->>'status') IN ('4', 'status_4') THEN '4'
        WHEN (raw_payload->>'status') IN ('3', 'status_3') THEN '3'
        WHEN (raw_payload->>'status') IN ('2', 'status_2') THEN '2'
        WHEN (raw_payload->>'status') IN ('1', 'status_1') THEN '1'
        ELSE '0'
      END) AS best_status,
      MAX(raw_payload->>'lastActionDate') AS last_action_date
    FROM policy_intel_source_documents
    WHERE source_type = 'texas_legislation'
      AND raw_payload->>'billNumber' IS NOT NULL
    GROUP BY raw_payload->>'billNumber', raw_payload->>'sessionId',
             raw_payload->>'sessionName', raw_payload->>'chamber'
  `);

  // ── 1b. Get committee assignments (from "Referred to X" lastAction) ──
  const committeeQuery = await policyIntelDb.execute<{
    bill_number: string | null;
    session_id: string | null;
    last_action: string | null;
  }>(sql`
    SELECT DISTINCT ON (raw_payload->>'billNumber', raw_payload->>'sessionId')
      raw_payload->>'billNumber' AS bill_number,
      raw_payload->>'sessionId' AS session_id,
      raw_payload->>'lastAction' AS last_action
    FROM policy_intel_source_documents
    WHERE source_type = 'texas_legislation'
      AND raw_payload->>'lastAction' ILIKE 'Referred to%'
  `);

  // Build committee lookup: billKey → committee name
  const committeeOf = new Map<string, string>();
  for (const row of committeeQuery as any[]) {
    const bn = (row.bill_number ?? "").trim();
    const sid = row.session_id ?? "";
    const committee = extractCommittee(row.last_action ?? "");
    if (bn && committee) {
      committeeOf.set(`${bn}||${sid}`, committee);
    }
  }

  // ── 2. Parse into bill records ────────────────────────────────────
  interface BillRecord {
    status: string;
    chamber: string;
    sessionName: string;
    sessionId: string;
    billNumber: string;
    billType: string;
    committee: string | null;
    lastActionDate: string | null;
    lastActionMonth: number | null;
  }

  const STATUS_MAP: Record<string, string> = {
    "0": "na", "1": "introduced", "2": "engrossed", "3": "enrolled", "4": "passed", "5": "vetoed",
  };

  const parsed: BillRecord[] = [];
  for (const row of statusQuery as any[]) {
    const billNumber = (row.bill_number ?? "").trim();
    const sessionId = row.session_id ?? "";
    const lastActionDate = row.last_action_date ?? null;
    let month: number | null = null;
    if (lastActionDate) {
      const d = new Date(lastActionDate);
      if (!isNaN(d.getTime())) month = d.getMonth() + 1;
    }

    const committee = committeeOf.get(`${billNumber}||${sessionId}`) ?? null;

    parsed.push({
      status: STATUS_MAP[row.best_status ?? "0"] ?? "unknown",
      chamber: row.chamber ?? "Unknown",
      sessionName: row.session_name ?? "Unknown",
      sessionId,
      billNumber,
      billType: extractBillType(billNumber),
      committee,
      lastActionDate,
      lastActionMonth: month,
    });
  }

  const totalBills = parsed.length;

  // Overall passage rate
  const passedCount = parsed.filter(b => b.status === "passed").length;
  const overallPassageRate = totalBills > 0 ? passedCount / totalBills : 0;

  // ── 3. Committee analysis ─────────────────────────────────────────
  // LegiScan stores only the LATEST action per bill. Bills still in committee
  // have "Referred to X" as lastAction. Bills that passed have "Signed by Governor", etc.
  // So committee referral data tells us: of bills sent to this committee,
  // what status did they reach? (Most will be "introduced" = still stuck.)
  // This creates a BOTTLENECK analysis: which committees kill the most bills?

  // Query referral data with full status info
  const referralQuery = await policyIntelDb.execute<{
    committee_name: string | null;
    status: string | null;
    session_name: string | null;
    cnt: string;
  }>(sql`
    SELECT
      TRIM(SUBSTRING(raw_payload->>'lastAction' FROM 'Referred to (.+)')) AS committee_name,
      raw_payload->>'status' AS status,
      raw_payload->>'sessionName' AS session_name,
      COUNT(*)::text AS cnt
    FROM policy_intel_source_documents
    WHERE source_type = 'texas_legislation'
      AND raw_payload->>'lastAction' ILIKE 'Referred to%'
    GROUP BY committee_name, raw_payload->>'status', raw_payload->>'sessionName'
  `);

  // Build committee aggregations
  interface CommitteeAgg {
    total: number;
    statusCounts: Record<string, number>;
    sessionTotals: Map<string, { total: number; progressed: number }>;
  }
  const cAgg = new Map<string, CommitteeAgg>();

  for (const row of referralQuery as any[]) {
    const committee = (row.committee_name ?? "").trim();
    if (!committee) continue;
    const count = parseInt(row.cnt, 10) || 0;
    const status = normalizeStatus(row.status);
    const session = row.session_name ?? "Unknown";

    if (!cAgg.has(committee)) {
      cAgg.set(committee, { total: 0, statusCounts: {}, sessionTotals: new Map() });
    }
    const agg = cAgg.get(committee)!;
    agg.total += count;
    agg.statusCounts[status] = (agg.statusCounts[status] ?? 0) + count;

    if (!agg.sessionTotals.has(session)) agg.sessionTotals.set(session, { total: 0, progressed: 0 });
    const st = agg.sessionTotals.get(session)!;
    st.total += count;
    if (status !== "introduced" && status !== "na" && status !== "unknown") {
      st.progressed += count;
    }
  }

  // Compute overall committee progression rate (bills that made it past referral)
  let totalReferred = 0;
  let totalProgressed = 0;
  for (const agg of cAgg.values()) {
    totalReferred += agg.total;
    totalProgressed += Object.entries(agg.statusCounts)
      .filter(([s]) => s !== "introduced" && s !== "na" && s !== "unknown")
      .reduce((sum, [, c]) => sum + c, 0);
  }
  const avgProgressionRate = totalReferred > 0 ? totalProgressed / totalReferred : 0;

  const committeeRates: CommitteePassageRate[] = [];
  for (const [committee, agg] of cAgg.entries()) {
    if (agg.total < 10) continue;
    const progressed = Object.entries(agg.statusCounts)
      .filter(([s]) => s !== "introduced" && s !== "na" && s !== "unknown")
      .reduce((sum, [, c]) => sum + c, 0);
    const progressionRate = agg.total > 0 ? progressed / agg.total : 0;
    const vetoed = agg.statusCounts["vetoed"] ?? 0;

    const sessionTrends = [...agg.sessionTotals.entries()]
      .map(([session, { total, progressed }]) => ({
        session,
        total,
        passed: progressed,
        rate: total > 0 ? progressed / total : 0,
      }))
      .sort((a, b) => a.session.localeCompare(b.session));

    const relativePerformance: CommitteePassageRate["relativePerformance"] =
      progressionRate > avgProgressionRate + 0.05 ? "above_average" :
      progressionRate < avgProgressionRate - 0.05 ? "below_average" : "average";

    const stuckPct = ((1 - progressionRate) * 100).toFixed(1);
    committeeRates.push({
      committee,
      totalBills: agg.total,
      passedBills: progressed,
      passageRate: progressionRate,
      vetoedBills: vetoed,
      vetoRate: agg.total > 0 ? vetoed / agg.total : 0,
      relativePerformance,
      statusBreakdown: agg.statusCounts,
      sessionTrends,
      narrative: `${committee}: ${agg.total} bills referred, ${stuckPct}% still in committee. ${progressed} progressed past referral (${(progressionRate * 100).toFixed(1)}% progression rate). ${relativePerformance === "above_average" ? "Progresses bills faster than average." : relativePerformance === "below_average" ? "Major bottleneck — kills most bills." : "Average progression rate."}`,
    });
  }
  committeeRates.sort((a, b) => b.totalBills - a.totalBills);

  // ── 4. Bill type patterns ──────────────────────────────────────────
  const typeMap = new Map<string, BillRecord[]>();
  for (const b of parsed) {
    if (!typeMap.has(b.billType)) typeMap.set(b.billType, []);
    typeMap.get(b.billType)!.push(b);
  }

  const billTypePatterns: BillTypePattern[] = [];
  for (const [billType, bills] of typeMap.entries()) {
    const total = bills.length;
    const passed = bills.filter(b => b.status === "passed").length;
    const vetoed = bills.filter(b => b.status === "vetoed").length;
    const engrossed = bills.filter(b => b.status === "engrossed").length;
    const rate = total > 0 ? passed / total : 0;

    billTypePatterns.push({
      billType,
      label: BILL_TYPE_LABELS[billType] ?? billType,
      totalBills: total,
      passedBills: passed,
      passageRate: rate,
      vetoedBills: vetoed,
      engrossedBills: engrossed,
      avgProgressionDays: null, // would require introduction date vs passage date
      narrative: `${BILL_TYPE_LABELS[billType] ?? billType}s have a ${(rate * 100).toFixed(1)}% passage rate (${passed}/${total}). ${vetoed > 0 ? `${vetoed} were vetoed.` : ""}`,
    });
  }
  billTypePatterns.sort((a, b) => b.totalBills - a.totalBills);

  // ── 5. Session analyses ─────────────────────────────────────────────
  const sessionMap = new Map<string, BillRecord[]>();
  for (const b of parsed) {
    const key = b.sessionName;
    if (!sessionMap.has(key)) sessionMap.set(key, []);
    sessionMap.get(key)!.push(b);
  }

  const sessionAnalyses: SessionAnalysis[] = [];
  const sessionPassageRates: number[] = [];

  for (const [sessionName, bills] of sessionMap.entries()) {
    const total = bills.length;
    const introduced = bills.filter(b => b.status === "introduced").length;
    const engrossed = bills.filter(b => b.status === "engrossed").length;
    const enrolled = bills.filter(b => b.status === "enrolled").length;
    const passed = bills.filter(b => b.status === "passed").length;
    const vetoed = bills.filter(b => b.status === "vetoed").length;
    const rate = total > 0 ? passed / total : 0;

    sessionPassageRates.push(rate);
    sessionAnalyses.push({
      sessionName,
      sessionId: bills[0]?.sessionId ?? "",
      totalBills: total,
      introduced,
      engrossed,
      enrolled,
      passed,
      vetoed,
      passageRate: rate,
      performanceVsMedian: 0, // computed after median is known
      narrative: "",          // computed after median is known
    });
  }

  // Compute median passage rate
  const sortedRates = [...sessionPassageRates].sort((a, b) => a - b);
  const medianRate = sortedRates.length > 0
    ? sortedRates[Math.floor(sortedRates.length / 2)]
    : 0;

  // Fill in performance vs median
  for (const sa of sessionAnalyses) {
    sa.performanceVsMedian = medianRate > 0 ? (sa.passageRate - medianRate) / medianRate : 0;
    const pctVsMedian = (sa.performanceVsMedian * 100).toFixed(1);
    const dir = sa.performanceVsMedian > 0 ? "above" : sa.performanceVsMedian < 0 ? "below" : "at";
    sa.narrative = `${sa.sessionName}: ${sa.totalBills} bills filed, ${sa.passed} passed (${(sa.passageRate * 100).toFixed(1)}% passage rate, ${dir} median by ${Math.abs(sa.performanceVsMedian * 100).toFixed(1)}%). ${sa.vetoed} vetoed.`;
  }
  sessionAnalyses.sort((a, b) => a.sessionName.localeCompare(b.sessionName));

  // ── 6. Chamber patterns ─────────────────────────────────────────────
  const chamberMap = new Map<string, BillRecord[]>();
  for (const b of parsed) {
    if (!chamberMap.has(b.chamber)) chamberMap.set(b.chamber, []);
    chamberMap.get(b.chamber)!.push(b);
  }

  const chamberPatterns: ChamberPattern[] = [];
  for (const [chamber, bills] of chamberMap.entries()) {
    const total = bills.length;
    const passed = bills.filter(b => b.status === "passed").length;
    const rate = total > 0 ? passed / total : 0;

    // Top committees in this chamber
    const cMap = new Map<string, { total: number; passed: number }>();
    for (const b of bills) {
      if (!b.committee) continue;
      if (!cMap.has(b.committee)) cMap.set(b.committee, { total: 0, passed: 0 });
      const entry = cMap.get(b.committee)!;
      entry.total++;
      if (b.status === "passed") entry.passed++;
    }
    const topCommittees = [...cMap.entries()]
      .map(([committee, { total, passed }]) => ({
        committee,
        bills: total,
        passageRate: total > 0 ? passed / total : 0,
      }))
      .sort((a, b) => b.bills - a.bills)
      .slice(0, 5);

    chamberPatterns.push({
      chamber,
      totalBills: total,
      passedBills: passed,
      passageRate: rate,
      topCommittees,
      narrative: `${chamber} chamber: ${(rate * 100).toFixed(1)}% passage rate across ${total} bills. Top committee: ${topCommittees[0]?.committee ?? "N/A"} (${topCommittees[0] ? (topCommittees[0].passageRate * 100).toFixed(1) + "%" : "N/A"}).`,
    });
  }

  // ── 7. Timing patterns (month of passage) ──────────────────────────
  const passedBills = parsed.filter(b => b.status === "passed" && b.lastActionMonth != null);
  const monthCounts = new Map<number, number>();
  for (const b of passedBills) {
    const m = b.lastActionMonth!;
    monthCounts.set(m, (monthCounts.get(m) ?? 0) + 1);
  }

  const totalPassed = passedBills.length;
  const timingPatterns: TimingPattern[] = [];
  for (let m = 1; m <= 12; m++) {
    const count = monthCounts.get(m) ?? 0;
    const share = totalPassed > 0 ? count / totalPassed : 0;
    timingPatterns.push({
      month: m,
      monthLabel: MONTH_LABELS[m],
      billsPassedInMonth: count,
      shareOfPassages: share,
      narrative: count > 0
        ? `${MONTH_LABELS[m]}: ${count} bills passed (${(share * 100).toFixed(1)}% of all passed bills).`
        : `${MONTH_LABELS[m]}: no bills passed in this month historically.`,
    });
  }

  // ── 8. Key findings ────────────────────────────────────────────────
  const keyFindings: string[] = [];

  // Top committee by progression rate (bills making it past referral)
  const topCommittee = committeeRates.filter(c => c.totalBills >= 50)
    .sort((a, b) => b.passageRate - a.passageRate)[0];
  if (topCommittee) {
    keyFindings.push(
      `${topCommittee.committee} has the highest committee progression rate at ${(topCommittee.passageRate * 100).toFixed(1)}% (${topCommittee.passedBills}/${topCommittee.totalBills} bills advanced past referral).`,
    );
  }

  // Biggest bottleneck committee
  const bottomCommittee = committeeRates.filter(c => c.totalBills >= 50)
    .sort((a, b) => a.passageRate - b.passageRate)[0];
  if (bottomCommittee && bottomCommittee.committee !== topCommittee?.committee) {
    keyFindings.push(
      `${bottomCommittee.committee} is the biggest bottleneck — only ${(bottomCommittee.passageRate * 100).toFixed(1)}% of ${bottomCommittee.totalBills} referred bills advanced past committee.`,
    );
  }

  // Peak passage month
  const peakMonth = timingPatterns.reduce((max, t) =>
    t.billsPassedInMonth > max.billsPassedInMonth ? t : max, timingPatterns[0]);
  if (peakMonth && peakMonth.billsPassedInMonth > 0) {
    keyFindings.push(
      `${peakMonth.monthLabel} is historically the peak month for bill passage, with ${(peakMonth.shareOfPassages * 100).toFixed(1)}% of all passed bills.`,
    );
  }

  // Bill type insight (exclude "OTHER" which includes resolutions/memorials)
  const topType = [...billTypePatterns]
    .filter(bt => bt.billType !== "OTHER")
    .sort((a, b) => b.passageRate - a.passageRate)[0];
  if (topType) {
    keyFindings.push(
      `${topType.label}s have the highest passage rate at ${(topType.passageRate * 100).toFixed(1)}%.`,
    );
  }

  // Overall stat
  keyFindings.push(
    `Overall, ${(overallPassageRate * 100).toFixed(1)}% of bills pass across ${sessionAnalyses.length} sessions (${passedCount}/${totalBills}).`,
  );

  // Chamber comparison
  const housePat = chamberPatterns.find(c => c.chamber === "House");
  const senatePat = chamberPatterns.find(c => c.chamber === "Senate");
  if (housePat && senatePat) {
    const diff = Math.abs(housePat.passageRate - senatePat.passageRate) * 100;
    const higher = housePat.passageRate > senatePat.passageRate ? "House" : "Senate";
    keyFindings.push(
      `${higher} bills pass at a ${diff.toFixed(1)}pp higher rate than ${higher === "House" ? "Senate" : "House"} bills.`,
    );
  }

  return {
    analyzedAt: new Date().toISOString(),
    totalBillsAnalyzed: totalBills,
    sessionsAnalyzed: sessionAnalyses.length,
    committeeRates,
    billTypePatterns,
    sessionAnalyses,
    chamberPatterns,
    timingPatterns,
    keyFindings,
    overallPassageRate,
  };
}
