import { useState, type ReactNode } from "react";
import {
  type IntelligenceBriefing,
  type BillSponsorAnalysis,
  type SponsorProfile,
  type CalibrationBucket,
  type CommitteePassageRate,
  type SessionAnalysis,
  type BillTypePattern,
  type LegislatorProfile,
  type BillInfluenceMap,
} from "../api";

export function ForecastTab({ data }: { data: IntelligenceBriefing }) {
  const { forecast, delta } = data;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>
          Delta Briefing
          <span
            style={{
              marginLeft: 8,
              padding: "2px 10px",
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 600,
              background: delta.threatTrend === "escalating" ? "#e74c3c" : delta.threatTrend === "deescalating" ? "#2ecc71" : "#f1c40f",
              color: "#fff",
            }}
          >
            {delta.threatTrend}
          </span>
        </h3>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: "0 0 12px" }}>{delta.narrative}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
          <DeltaStat label="New Risks" value={delta.newRisks.length} color="#e74c3c" />
          <DeltaStat label="Resolved Risks" value={delta.resolvedRisks.length} color="#2ecc71" />
          <DeltaStat label="Escalated" value={delta.escalatedRisks.length} color="#e67e22" />
          <DeltaStat label="De-escalated" value={delta.deescalatedRisks.length} color="#3498db" />
          <DeltaStat label="New Anomalies" value={delta.newAnomalies} color="#e67e22" />
          <DeltaStat label="New Clusters" value={delta.newClusters} color="#9b59b6" />
        </div>
        {delta.escalatedRisks.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#e67e22", marginBottom: 4 }}>Escalated Bills</div>
            {delta.escalatedRisks.map((entry, index) => (
              <div key={`${entry.billId}-${index}`} style={{ fontSize: 12, color: "#666", padding: "2px 0" }}>
                {entry.billId}: {entry.previousLevel} to {entry.currentLevel}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>
          Model Accuracy
          <span
            style={{
              marginLeft: 8,
              padding: "2px 10px",
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 600,
              background: forecast.grade.trendDirection === "improving" ? "#2ecc71" : forecast.grade.trendDirection === "degrading" ? "#e74c3c" : "#f1c40f",
              color: "#fff",
            }}
          >
            {forecast.grade.trendDirection}
          </span>
        </h3>
        <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: "0 0 12px" }}>{forecast.grade.narrative}</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <StatBadge label="Overall Accuracy" value={`${(forecast.grade.accuracy.overall * 100).toFixed(0)}%`} color="#3498db" isText />
          <StatBadge label="Ranking Accuracy" value={`${(forecast.grade.accuracy.rankingAccuracy * 100).toFixed(0)}%`} color="#9b59b6" isText />
          <StatBadge label="Predictions" value={forecast.grade.totalPredictions} color="#888" />
          <StatBadge label="History Depth" value={forecast.historyDepth} color="#2ecc71" />
        </div>
      </Card>

      {forecast.grade.accuracy.calibration.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Calibration</h3>
          <p style={{ fontSize: 12, color: "#888", margin: "0 0 10px" }}>When we predict X% probability, does it happen X% of the time?</p>
          <div style={{ display: "grid", gap: 6 }}>
            {forecast.grade.accuracy.calibration.map((bucket, index) => (
              <CalibrationRow key={`${bucket.range}-${index}`} bucket={bucket} />
            ))}
          </div>
        </Card>
      )}

      {forecast.grade.blindSpots.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Blind Spots</h3>
          {forecast.grade.blindSpots.map((spot, index) => (
            <div key={`${spot.category}-${index}`} style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{spot.category}</span>
                <span style={{ padding: "2px 8px", borderRadius: 10, background: "#e74c3c", color: "#fff", fontSize: 10 }}>{spot.missCount} misses</span>
              </div>
              <p style={{ fontSize: 12, color: "#666", margin: "4px 0 0" }}>{spot.description}</p>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

export function SponsorsTab({ data }: { data: IntelligenceBriefing }) {
  const { sponsors } = data;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Sponsor Network Overview</h3>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <StatBadge label="Total Sponsors" value={sponsors.networkStats.totalSponsors} color="#3498db" />
          <StatBadge label="Avg Coalition" value={sponsors.networkStats.avgCoalitionSize.toFixed(1)} color="#9b59b6" isText />
          <StatBadge label="Bipartisan Rate" value={`${(sponsors.networkStats.bipartisanRate * 100).toFixed(0)}%`} color="#2ecc71" isText />
          <StatBadge label="Leadership Rate" value={`${(sponsors.networkStats.leadershipRate * 100).toFixed(0)}%`} color="#e67e22" isText />
        </div>
      </Card>

      {sponsors.leadershipBacked.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Leadership-Backed Bills</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {sponsors.leadershipBacked.map((bill, index) => (
              <SponsorBillCard key={`${bill.billId}-${index}`} bill={bill} badge="leadership" />
            ))}
          </div>
        </Card>
      )}

      {sponsors.bipartisanBills.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Bipartisan Bills</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {sponsors.bipartisanBills.map((bill, index) => (
              <SponsorBillCard key={`${bill.billId}-${index}`} bill={bill} badge="bipartisan" />
            ))}
          </div>
        </Card>
      )}

      {sponsors.prolificSponsors.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Prolific Sponsors</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {sponsors.prolificSponsors.map((sponsor, index) => (
              <ProlificSponsorRow key={`${sponsor.name}-${index}`} sponsor={sponsor} rank={index + 1} />
            ))}
          </div>
        </Card>
      )}

      {sponsors.billAnalyses.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Coalition Analysis by Bill</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {sponsors.billAnalyses.slice(0, 20).map((bill, index) => (
              <SponsorBillCard key={`${bill.billId}-${index}`} bill={bill} />
            ))}
          </div>
        </Card>
      )}

      {sponsors.billAnalyses.length === 0 && (
        <Card>
          <p style={{ color: "#888", textAlign: "center", padding: 20 }}>No sponsor data available yet.</p>
        </Card>
      )}
    </div>
  );
}

export function HistoricalTab({ data }: { data: IntelligenceBriefing }) {
  const historical = data.historical;
  const [expandedCommittee, setExpandedCommittee] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <Card>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Historical Pattern Analysis</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <StatBadge label="Bills Analyzed" value={historical.totalBillsAnalyzed.toLocaleString()} color="#3498db" isText />
          <StatBadge label="Sessions" value={historical.sessionsAnalyzed} color="#9b59b6" />
          <StatBadge label="Passage Rate" value={`${(historical.overallPassageRate * 100).toFixed(1)}%`} color="#2ecc71" isText />
          <StatBadge label="Committees" value={historical.committeeRates.length} color="#e67e22" />
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Key Findings</div>
        {historical.keyFindings.map((finding, index) => (
          <div key={`${finding}-${index}`} style={{ fontSize: 13, padding: "6px 0", borderBottom: index < historical.keyFindings.length - 1 ? "1px solid #f0f0f0" : "none", color: "#444" }}>
            • {finding}
          </div>
        ))}
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Committee Bottleneck Analysis</div>
        <div style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>How many referred bills advance past each committee? Click to see trends.</div>
        {historical.committeeRates.slice(0, 20).map((rate) => (
          <CommitteeRow
            key={rate.committee}
            rate={rate}
            expanded={expandedCommittee === rate.committee}
            onToggle={() => setExpandedCommittee(expandedCommittee === rate.committee ? null : rate.committee)}
          />
        ))}
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Bill Type Outcomes</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {historical.billTypePatterns.map((pattern) => (
            <BillTypeCard key={pattern.billType} pattern={pattern} />
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Session-by-Session Comparison</div>
        {historical.sessionAnalyses.map((session) => (
          <SessionRow key={session.sessionName} session={session} medianRate={historical.overallPassageRate} />
        ))}
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Chamber Patterns</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {historical.chamberPatterns.map((pattern) => (
            <div key={pattern.chamber} style={{ background: "#f8f9fa", borderRadius: 8, padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{pattern.chamber}</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3498db" }}>{(pattern.passageRate * 100).toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: "#888" }}>
                {pattern.passedBills.toLocaleString()} / {pattern.totalBills.toLocaleString()} bills passed
              </div>
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>Top Committees:</div>
                {pattern.topCommittees.map((committee) => (
                  <div key={committee.committee} style={{ fontSize: 12, display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                    <span>{committee.committee}</span>
                    <span style={{ fontWeight: 600 }}>{(committee.passageRate * 100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Passage Timing (Month Distribution)</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 120 }}>
          {historical.timingPatterns.map((pattern) => {
            const maxShare = Math.max(...historical.timingPatterns.map((entry) => entry.shareOfPassages), 0.01);
            const barHeight = pattern.shareOfPassages > 0 ? Math.max((pattern.shareOfPassages / maxShare) * 100, 4) : 2;
            return (
              <div key={pattern.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>
                  {pattern.billsPassedInMonth > 0 ? `${(pattern.shareOfPassages * 100).toFixed(0)}%` : ""}
                </div>
                <div
                  style={{
                    width: "100%",
                    height: barHeight,
                    background: pattern.shareOfPassages > 0.15 ? "#2ecc71" : pattern.shareOfPassages > 0.05 ? "#3498db" : "#ddd",
                    borderRadius: 3,
                  }}
                />
                <div style={{ fontSize: 9, color: "#888", marginTop: 4 }}>{pattern.monthLabel.slice(0, 3)}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export function LegislatorsTab({ data }: { data: IntelligenceBriefing }) {
  const { legislators } = data;
  const [filter, setFilter] = useState<"all" | "critical" | "high" | "moderate" | "low">("all");

  const filtered = filter === "all"
    ? legislators.profiles
    : legislators.profiles.filter((profile) => profile.impactLevel === filter);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Legislator Intelligence Profiles</h3>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <StatBadge label="Legislators" value={legislators.totalLegislators} color="#3498db" />
          <StatBadge label="Bills Matched" value={legislators.totalBillsMatched} color="#9b59b6" />
          <StatBadge label="Avg Power" value={legislators.stats.avgPowerScore} color="#e67e22" />
          <StatBadge label="Key Players" value={legislators.keyPlayers.length} color="#e74c3c" />
          <StatBadge label="Gatekeepers" value={legislators.gatekeepers.length} color="#f1c40f" />
          <StatBadge label="Bridge Builders" value={legislators.bridgeBuilders.length} color="#2ecc71" />
          <StatBadge label="Blind Spots" value={legislators.blindSpots.length} color="#95a5a6" />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 11, flexWrap: "wrap" }}>
          {Object.entries(legislators.stats.byParty).map(([party, count]) => (
            <span key={party} style={{ background: party === "R" ? "#ffebee" : party === "D" ? "#e3f2fd" : "#f5f5f5", padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>
              {party === "R" ? "Republican" : party === "D" ? "Democrat" : party}: {count}
            </span>
          ))}
          {Object.entries(legislators.stats.byChamber).map(([chamber, count]) => (
            <span key={chamber} style={{ background: "#f3e5f5", padding: "3px 10px", borderRadius: 12, fontWeight: 600 }}>
              {chamber}: {count}
            </span>
          ))}
        </div>
      </Card>

      {legislators.keyPlayers.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Key Players</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {legislators.keyPlayers.map((profile, index) => (
              <LegislatorRow key={profile.stakeholderId} profile={profile} rank={index + 1} />
            ))}
          </div>
        </Card>
      )}

      {legislators.blindSpots.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Blind Spots</h3>
          <div style={{ display: "grid", gap: 8 }}>
            {legislators.blindSpots.map((profile, index) => (
              <LegislatorRow key={profile.stakeholderId} profile={profile} rank={index + 1} />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>All Legislator Profiles ({filtered.length})</h3>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {(["all", "critical", "high", "moderate", "low"] as const).map((value) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: filter === value ? 700 : 400,
                  background: filter === value ? "#3498db" : "#f0f0f0",
                  color: filter === value ? "#fff" : "#666",
                }}
              >
                {value === "all" ? "All" : value.charAt(0).toUpperCase() + value.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {filtered.slice(0, 50).map((profile, index) => (
            <LegislatorRow key={`${profile.stakeholderId}-${index}`} profile={profile} rank={index + 1} />
          ))}
          {filtered.length === 0 && <p style={{ color: "#888", textAlign: "center", padding: 20 }}>No legislators match this filter.</p>}
        </div>
      </Card>
    </div>
  );
}

export function InfluenceMapTab({ data }: { data: IntelligenceBriefing }) {
  const { influenceMap } = data;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Bill Influence Maps</h3>
        <p style={{ fontSize: 12, color: "#666", margin: "0 0 12px" }}>For each critical bill, who can change the outcome and how to reach them.</p>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <StatBadge label="Bills Mapped" value={influenceMap.stats.totalBillsAnalyzed} color="#3498db" />
          <StatBadge label="Targets Found" value={influenceMap.stats.totalTargetsIdentified} color="#9b59b6" />
          <StatBadge label="Avg/Bill" value={influenceMap.stats.avgTargetsPerBill.toFixed(1)} color="#2ecc71" isText />
          <StatBadge label="Engagement Gaps" value={influenceMap.stats.engagementGapCount} color="#e74c3c" />
          <StatBadge label="Pivotal People" value={influenceMap.pivotalLegislators.length} color="#e67e22" />
        </div>
      </Card>

      {influenceMap.outreachPlan.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Prioritized Outreach Plan</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {influenceMap.outreachPlan.slice(0, 15).map((plan, index) => {
              const engagementColor = plan.currentEngagement === "none" ? "#e74c3c" : plan.currentEngagement === "low" ? "#e67e22" : plan.currentEngagement === "moderate" ? "#f1c40f" : "#2ecc71";
              return (
                <div key={`${plan.name}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f5f5", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#3498db", width: 28 }}>#{plan.priority}</span>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{plan.name}</span>
                      <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>{plan.party}, {plan.chamber}</span>
                      <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>
                        Influences: {plan.billIds.slice(0, 4).join(", ")}{plan.billIds.length > 4 ? ` +${plan.billIds.length - 4} more` : ""}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{plan.combinedLeverage}</div>
                      <div style={{ fontSize: 9, color: "#aaa" }}>leverage</div>
                    </div>
                    <span style={{ padding: "2px 8px", borderRadius: 8, background: engagementColor, color: "#fff", fontSize: 10, fontWeight: 600 }}>
                      {plan.currentEngagement}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {influenceMap.pivotalLegislators.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Pivotal Legislators</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {influenceMap.pivotalLegislators.map((legislator, index) => (
              <div key={`${legislator.name}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}>
                <div>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{legislator.name}</span>
                  <span style={{ fontSize: 11, color: "#888", marginLeft: 6 }}>({legislator.party})</span>
                  <div style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>{legislator.billIds.join(", ")}</div>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: "#3498db" }}>{legislator.billCount}</div>
                    <div style={{ fontSize: 9, color: "#aaa" }}>bills</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{legislator.avgLeverage}</div>
                    <div style={{ fontSize: 9, color: "#aaa" }}>avg lev.</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {influenceMap.maps.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>Per-Bill Influence Analysis</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {influenceMap.maps.slice(0, 20).map((map, index) => (
              <BillInfluenceCard key={`${map.billId}-${index}`} map={map} />
            ))}
          </div>
        </Card>
      )}

      {influenceMap.maps.length === 0 && (
        <Card>
          <p style={{ color: "#888", textAlign: "center", padding: 20 }}>No influence maps generated yet.</p>
        </Card>
      )}
    </div>
  );
}

function DeltaStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: 6, padding: "8px 12px", textAlign: "center" }}>
      <div style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#888" }}>{label}</div>
    </div>
  );
}

function CalibrationRow({ bucket }: { bucket: CalibrationBucket }) {
  const errorColor = bucket.calibrationError > 0.2 ? "#e74c3c" : bucket.calibrationError > 0.1 ? "#e67e22" : "#2ecc71";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0" }}>
      <div style={{ width: 80, fontSize: 12, fontWeight: 500 }}>{bucket.range}</div>
      <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, position: "relative" }}>
        <div style={{ height: "100%", borderRadius: 4, background: "#3498db", width: `${Math.min(bucket.actualRate * 100, 100)}%` }} />
        <div style={{ position: "absolute", top: -2, height: 12, width: 2, background: "#333", left: `${((bucket.lower + bucket.upper) / 2) * 100}%` }} />
      </div>
      <div style={{ width: 50, fontSize: 11, textAlign: "right", color: errorColor, fontWeight: 600 }}>
        {(bucket.actualRate * 100).toFixed(0)}%
      </div>
      <div style={{ width: 30, fontSize: 10, color: "#aaa" }}>n={bucket.count}</div>
    </div>
  );
}

function SponsorBillCard({ bill, badge }: { bill: BillSponsorAnalysis; badge?: "bipartisan" | "leadership" }) {
  const [expanded, setExpanded] = useState(false);
  const powerColor = bill.coalition.coalitionPower >= 60 ? "#e74c3c" : bill.coalition.coalitionPower >= 30 ? "#e67e22" : "#3498db";

  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>{bill.billId}</span>
            {badge === "bipartisan" && <span style={{ padding: "1px 6px", borderRadius: 8, background: "#2ecc71", color: "#fff", fontSize: 9, fontWeight: 600 }}>BIPARTISAN</span>}
            {badge === "leadership" && <span style={{ padding: "1px 6px", borderRadius: 8, background: "#9b59b6", color: "#fff", fontSize: 9, fontWeight: 600 }}>LEADERSHIP</span>}
            {bill.coalition.hasCommitteeChair && <span style={{ padding: "1px 6px", borderRadius: 8, background: "#e67e22", color: "#fff", fontSize: 9, fontWeight: 600 }}>CHAIR</span>}
          </div>
          <p style={{ fontSize: 12, color: "#666", margin: "2px 0 0" }}>{bill.title}</p>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0, marginLeft: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: powerColor }}>{bill.coalition.coalitionPower}</div>
          <div style={{ fontSize: 9, color: "#aaa" }}>power</div>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #f5f5f5" }}>
          <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>{bill.narrative}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 11, color: "#888", flexWrap: "wrap" }}>
            <span>Coalition: {bill.coalition.size}</span>
            <span>Parties: {bill.coalition.parties.join(", ")}</span>
            <span>Chambers: {bill.coalition.chambers.join(", ")}</span>
            <span>Network: {(bill.networkDensity * 100).toFixed(0)}%</span>
          </div>
          {bill.sponsors.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4 }}>Sponsors</div>
              {bill.sponsors.map((sponsor, index) => (
                <div key={`${sponsor.name}-${index}`} style={{ fontSize: 11, color: "#666", padding: "2px 0" }}>
                  {sponsor.name} ({sponsor.party}) {sponsor.isLeadership ? "★" : ""} {sponsor.chairPositions.length > 0 ? `[Chair: ${sponsor.chairPositions.join(", ")}]` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ProlificSponsorRow({ sponsor, rank }: { sponsor: SponsorProfile; rank: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f5f5f5" }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: "#bbb", width: 24 }}>#{rank}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{sponsor.name}</span>
          <span style={{ fontSize: 10, color: sponsor.party === "R" ? "#e74c3c" : sponsor.party === "D" ? "#3498db" : "#888" }}>({sponsor.party})</span>
          {sponsor.isLeadership && <span style={{ padding: "1px 6px", borderRadius: 8, background: "#9b59b6", color: "#fff", fontSize: 9, fontWeight: 600 }}>LEADER</span>}
        </div>
        <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>
          {sponsor.billCount} bills · {sponsor.committeeCount} committees
          {sponsor.chairPositions.length > 0 && ` · Chair: ${sponsor.chairPositions.join(", ")}`}
        </div>
      </div>
    </div>
  );
}

function CommitteeRow({ rate, expanded, onToggle }: { rate: CommitteePassageRate; expanded: boolean; onToggle: () => void }) {
  const barColor = rate.relativePerformance === "above_average" ? "#2ecc71" : rate.relativePerformance === "below_average" ? "#e74c3c" : "#f1c40f";
  return (
    <div style={{ borderBottom: "1px solid #f0f0f0", padding: "8px 0" }}>
      <div onClick={onToggle} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 200, fontWeight: 600, fontSize: 13 }}>{rate.committee}</div>
        <div style={{ flex: 1, background: "#f0f0f0", borderRadius: 4, height: 18, position: "relative" }}>
          <div style={{ width: `${Math.min(rate.passageRate * 100, 100)}%`, height: "100%", background: barColor, borderRadius: 4 }} />
          <span style={{ position: "absolute", right: 6, top: 1, fontSize: 11, fontWeight: 700 }}>{(rate.passageRate * 100).toFixed(1)}% progress</span>
        </div>
        <div style={{ width: 100, fontSize: 11, color: "#888", textAlign: "right" }}>{rate.passedBills}/{rate.totalBills} advanced</div>
        <span style={{ fontSize: 10 }}>{expanded ? "▲" : "▼"}</span>
      </div>
      {expanded && (
        <div style={{ marginTop: 8, padding: "8px 12px", background: "#f8f9fa", borderRadius: 6 }}>
          <div style={{ fontSize: 12, color: "#555", marginBottom: 8 }}>{rate.narrative}</div>
          {rate.statusBreakdown && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Status Breakdown:</div>
              {Object.entries(rate.statusBreakdown).map(([status, count]) => (
                <span key={status} style={{ fontSize: 11, marginRight: 12, color: "#666" }}>
                  {status}: {count}
                </span>
              ))}
            </div>
          )}
          <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Session Trends:</div>
          {rate.sessionTrends.map((trend) => (
            <div key={trend.session} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "2px 0" }}>
              <span>{trend.session}</span>
              <span>{trend.passed}/{trend.total} advanced ({(trend.rate * 100).toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BillTypeCard({ pattern }: { pattern: BillTypePattern }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: 8, padding: 14, textAlign: "center" }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{pattern.label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "#3498db" }}>{(pattern.passageRate * 100).toFixed(1)}%</div>
      <div style={{ fontSize: 11, color: "#888" }}>{pattern.passedBills.toLocaleString()} / {pattern.totalBills.toLocaleString()}</div>
      {pattern.vetoedBills > 0 && <div style={{ fontSize: 11, color: "#e74c3c", marginTop: 4 }}>{pattern.vetoedBills} vetoed</div>}
    </div>
  );
}

function SessionRow({ session, medianRate }: { session: SessionAnalysis; medianRate: number }) {
  const vsMedian = session.performanceVsMedian;
  const badge = vsMedian > 0.05 ? { label: "Above", color: "#2ecc71" } : vsMedian < -0.05 ? { label: "Below", color: "#e74c3c" } : { label: "Average", color: "#f1c40f" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0", borderBottom: "1px solid #f0f0f0", fontSize: 12, flexWrap: "wrap" }}>
      <div style={{ width: 260, fontWeight: 600 }}>{session.sessionName}</div>
      <div style={{ width: 70 }}>{session.totalBills.toLocaleString()} bills</div>
      <div style={{ width: 80, fontWeight: 700, color: "#3498db" }}>{(session.passageRate * 100).toFixed(1)}%</div>
      <div style={{ width: 70 }}>{session.passed.toLocaleString()} passed</div>
      <div style={{ width: 60 }}>{session.vetoed} vetoed</div>
      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: badge.color, color: "#fff", fontWeight: 600 }}>{badge.label}</span>
    </div>
  );
}

function LegislatorRow({ profile, rank }: { profile: LegislatorProfile; rank: number }) {
  const [expanded, setExpanded] = useState(false);
  const impactColors: Record<string, string> = { critical: "#e74c3c", high: "#e67e22", moderate: "#f1c40f", low: "#95a5a6" };
  const partyColor = profile.party === "R" ? "#e74c3c" : profile.party === "D" ? "#3498db" : "#95a5a6";

  return (
    <div style={{ padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#aaa", width: 24 }}>#{rank}</span>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: partyColor, flexShrink: 0 }} />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
              <span style={{ fontWeight: 700, fontSize: 13 }}>{profile.name}</span>
              <span style={{ fontSize: 10, color: "#888" }}>{profile.party}-{profile.chamber}, Dist. {profile.district}</span>
              {profile.title && <span style={{ padding: "1px 6px", borderRadius: 8, background: "#9b59b6", color: "#fff", fontSize: 9 }}>LEADERSHIP</span>}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 3, flexWrap: "wrap" }}>
              {profile.tags.slice(0, 4).map((tag) => (
                <span key={tag} style={{ padding: "1px 6px", borderRadius: 8, background: "#f0f0f0", fontSize: 9, color: "#666" }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{profile.powerScore}</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>power</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.sponsorship.totalBills}</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>bills</div>
          </div>
          <span style={{ padding: "2px 8px", borderRadius: 8, background: impactColors[profile.impactLevel], color: "#fff", fontSize: 10, fontWeight: 600 }}>
            {profile.impactLevel.toUpperCase()}
          </span>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f5f5f5", fontSize: 12 }}>
          <p style={{ color: "#555", lineHeight: 1.5, margin: "0 0 8px" }}>{profile.assessment}</p>
          {profile.committees.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4 }}>Committees</div>
              {profile.committees.map((committee, index) => (
                <div key={`${committee.name}-${index}`} style={{ fontSize: 11, color: "#666", padding: "2px 0", display: "flex", gap: 6 }}>
                  <span style={{ fontWeight: committee.role === "chair" ? 700 : 400 }}>{committee.name}</span>
                  <span style={{ color: committee.role === "chair" ? "#e74c3c" : committee.role === "vice_chair" ? "#e67e22" : "#aaa", fontSize: 10 }}>({committee.role})</span>
                  {committee.activeBillCount > 0 && <span style={{ color: "#3498db", fontSize: 10 }}>{committee.activeBillCount} active bills</span>}
                </div>
              ))}
            </div>
          )}
          {profile.issueFocus.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4 }}>Issue Focus</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {profile.issueFocus.map((focus, index) => (
                  <span key={`${focus.topic}-${index}`} style={{ padding: "2px 8px", borderRadius: 8, background: focus.stance === "champion" ? "#e8f5e9" : focus.stance === "aligned" ? "#e3f2fd" : "#f5f5f5", fontSize: 10, color: "#555" }}>
                    {focus.topic} ({focus.billCount})
                  </span>
                ))}
              </div>
            </div>
          )}
          {profile.allies.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4 }}>Legislative Allies</div>
              {profile.allies.map((ally, index) => (
                <div key={`${ally.name}-${index}`} style={{ fontSize: 11, color: "#666", padding: "2px 0" }}>
                  {ally.name} ({ally.party}) — {ally.sharedBills} shared bills {ally.isCrossParty && <span style={{ color: "#2ecc71", fontSize: 10 }}>cross-party</span>}
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#888", flexWrap: "wrap" }}>
            <span>Observations: {profile.engagement.observationCount}</span>
            <span>Meeting Notes: {profile.engagement.meetingNoteCount}</span>
            <span>Last Contact: {profile.engagement.lastContactDate ? new Date(profile.engagement.lastContactDate).toLocaleDateString() : "Never"}</span>
            <span style={{ color: profile.engagement.engagementLevel === "none" ? "#e74c3c" : profile.engagement.engagementLevel === "high" ? "#2ecc71" : "#f1c40f" }}>
              Engagement: {profile.engagement.engagementLevel}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function BillInfluenceCard({ map }: { map: BillInfluenceMap }) {
  const [expanded, setExpanded] = useState(false);
  const probabilityColor = map.passageProbability >= 0.6 ? "#e74c3c" : map.passageProbability >= 0.3 ? "#e67e22" : "#3498db";

  return (
    <div style={{ padding: 12, border: "1px solid #eee", borderRadius: 8, background: "#fafafa" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{map.billId}</span>
            <span style={{ padding: "2px 8px", borderRadius: 8, background: "#f0f0f0", fontSize: 10, color: "#666" }}>{map.stage}</span>
            {map.engagedCount === 0 && map.targets.length > 0 && <span style={{ padding: "2px 8px", borderRadius: 8, background: "#e74c3c", color: "#fff", fontSize: 9 }}>NO OUTREACH</span>}
          </div>
          <p style={{ fontSize: 11, color: "#888", margin: "4px 0 0" }}>
            {map.committeePath.length > 0 ? `Path: ${map.committeePath.join(" -> ")}` : "No committee path identified"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: probabilityColor }}>{(map.passageProbability * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>passage</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{map.targets.length}</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>targets</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{map.totalLeverage}</div>
            <div style={{ fontSize: 9, color: "#aaa" }}>leverage</div>
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eee" }}>
          <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5, margin: "0 0 8px" }}>{map.narrative}</p>
          {map.recommendations.length > 0 && (
            <div style={{ background: "#fff3cd", borderRadius: 6, padding: "8px 12px", marginBottom: 10, fontSize: 11 }}>
              <strong>Recommendations:</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                {map.recommendations.map((recommendation, index) => (
                  <li key={`${recommendation}-${index}`} style={{ marginBottom: 2 }}>{recommendation}</li>
                ))}
              </ul>
            </div>
          )}
          <div style={{ display: "grid", gap: 4 }}>
            {map.targets.map((target, index) => {
              const leverageWidth = Math.min(100, target.leverage);
              const stanceColor: Record<string, string> = { support: "#2ecc71", lean_support: "#82e0aa", undecided: "#f1c40f", lean_oppose: "#e67e22", oppose: "#e74c3c", unknown: "#95a5a6" };
              return (
                <div key={`${target.name}-${index}`} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", fontSize: 11 }}>
                  <span style={{ width: 20, color: "#aaa", flexShrink: 0 }}>#{index + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{target.name}</span>
                      <span style={{ color: "#888" }}>{target.party}, {target.chamber}</span>
                      <span style={{ padding: "1px 6px", borderRadius: 8, background: stanceColor[target.likelyStance] ?? "#95a5a6", color: "#fff", fontSize: 9 }}>
                        {target.likelyStance.replace(/_/g, " ")}
                      </span>
                      <span style={{ fontSize: 9, color: "#aaa" }}>{target.role.replace(/_/g, " ")}</span>
                    </div>
                    <div style={{ width: "100%", background: "#f0f0f0", borderRadius: 3, height: 4, marginTop: 3 }}>
                      <div style={{ width: `${leverageWidth}%`, background: leverageWidth >= 60 ? "#e74c3c" : leverageWidth >= 30 ? "#e67e22" : "#3498db", height: 4, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div style={{ textAlign: "right", width: 60, flexShrink: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{target.leverage}</div>
                    <div style={{ fontSize: 9, color: "#aaa" }}>leverage</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBadge({ label, value, color, isText }: { label: string; value: number | string; color: string; isText?: boolean }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: isText ? 13 : 20, fontWeight: 700, color }}>{isText ? String(value) : value}</div>
      <div style={{ fontSize: 10, color: "#7f8c9b", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      {children}
    </div>
  );
}
