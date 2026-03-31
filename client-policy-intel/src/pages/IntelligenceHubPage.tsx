import { useState } from "react";
import { api, type IntelligenceBriefing, type StrategicInsight, type VelocityVector, type RiskAssessment, type Anomaly, type InfluenceProfile, type BillCluster } from "../api";
import { useAsync } from "../hooks";

type Tab = "briefing" | "velocity" | "risk" | "influence" | "correlations" | "anomalies";

export function IntelligenceHubPage() {
  const [tab, setTab] = useState<Tab>("briefing");
  const { data, loading, error, refetch } = useAsync(() => api.getIntelligenceBriefing());

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={refetch} />;
  if (!data) return null;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "briefing", label: "Strategic Briefing", count: data.insights.length },
    { key: "velocity", label: "Velocity", count: data.velocity.topMovers.length },
    { key: "risk", label: "Risk Model", count: data.risk.assessments.length },
    { key: "influence", label: "Influence", count: data.influence.profiles.length },
    { key: "correlations", label: "Clusters", count: data.correlations.clusters.length },
    { key: "anomalies", label: "Anomalies", count: data.anomalies.anomalies.length },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>🧠 Intelligence Hub</h1>
          <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
            Swarm analysis completed in {data.analysisTimeMs}ms &middot; {new Date(data.generatedAt).toLocaleString()}
          </p>
        </div>
        <button onClick={refetch} style={{ padding: "8px 16px", fontSize: 13, cursor: "pointer", background: "#3498db", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600 }}>
          Re-run Analysis
        </button>
      </div>

      {/* Executive Summary */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderRadius: 10, padding: "18px 22px", marginBottom: 20, color: "#e8e8e8" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#7f8c9b", marginBottom: 8 }}>Executive Summary</div>
        <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{data.executiveSummary}</p>
        <div style={{ display: "flex", gap: 16, marginTop: 14 }}>
          <StatBadge label="Insights" value={data.insights.length} color="#3498db" />
          <StatBadge label="Critical Risks" value={data.risk.criticalRisks.length} color="#e74c3c" />
          <StatBadge label="Anomalies" value={data.anomalies.anomalies.length} color="#e67e22" />
          <StatBadge label="Surging" value={data.velocity.topMovers.filter(v => v.momentum === "surging").length} color="#2ecc71" />
          <StatBadge label="Regime" value={data.risk.regime.replace(/_/g, " ")} color="#9b59b6" isText />
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              fontSize: 13,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: tab === t.key ? 700 : 400,
              background: tab === t.key ? "#3498db" : "#f0f0f0",
              color: tab === t.key ? "#fff" : "#555",
              whiteSpace: "nowrap",
            }}
          >
            {t.label}
            {t.count !== undefined && <span style={{ marginLeft: 6, opacity: 0.8, fontSize: 11 }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "briefing" && <BriefingTab data={data} />}
      {tab === "velocity" && <VelocityTab data={data} />}
      {tab === "risk" && <RiskTab data={data} />}
      {tab === "influence" && <InfluenceTab data={data} />}
      {tab === "correlations" && <CorrelationsTab data={data} />}
      {tab === "anomalies" && <AnomaliesTab data={data} />}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>🧠</div>
      <h2 style={{ fontSize: 18, color: "#555" }}>Running Intelligence Swarm...</h2>
      <p style={{ fontSize: 13, color: "#888" }}>5 analyzers executing in parallel</p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
        {["Velocity", "Correlations", "Influence", "Risk", "Anomalies"].map(name => (
          <span key={name} style={{ padding: "4px 10px", background: "#f0f0f0", borderRadius: 12, fontSize: 11, color: "#888" }}>{name}</span>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: 60 }}>
      <p style={{ color: "#e74c3c", fontSize: 14 }}>{error}</p>
      <button onClick={onRetry} style={{ padding: "8px 18px", cursor: "pointer", marginTop: 8, background: "#e74c3c", color: "#fff", border: "none", borderRadius: 6 }}>Retry</button>
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

// ── Briefing Tab ─────────────────────────────────────────────────────────────

function BriefingTab({ data }: { data: IntelligenceBriefing }) {
  const priorityColors: Record<number, string> = { 1: "#e74c3c", 2: "#e67e22", 3: "#f1c40f", 4: "#3498db", 5: "#95a5a6" };
  const categoryIcons: Record<string, string> = {
    immediate_action: "🚨",
    emerging_threat: "⚡",
    opportunity: "🎯",
    situational_awareness: "👁️",
    strategic_recommendation: "📋",
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {data.insights.length === 0 && (
        <Card>
          <p style={{ color: "#888", textAlign: "center", padding: 20 }}>No strategic insights generated — the legislative landscape appears quiet.</p>
        </Card>
      )}
      {data.insights.map((ins, i) => (
        <InsightCard key={i} insight={ins} priorityColors={priorityColors} categoryIcons={categoryIcons} />
      ))}
    </div>
  );
}

function InsightCard({ insight, priorityColors, categoryIcons }: { insight: StrategicInsight; priorityColors: Record<number, string>; categoryIcons: Record<string, string> }) {
  const color = priorityColors[insight.priority] ?? "#95a5a6";
  const icon = categoryIcons[insight.category] ?? "📌";

  return (
    <Card>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ padding: "2px 8px", borderRadius: 10, background: color, color: "#fff", fontSize: 10, fontWeight: 700 }}>P{insight.priority}</span>
            <span style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>{insight.category.replace(/_/g, " ")}</span>
            <span style={{ fontSize: 10, color: "#aaa" }}>{(insight.confidence * 100).toFixed(0)}% confidence</span>
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{insight.title}</div>
          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: 0 }}>{insight.narrative}</p>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {insight.sources.map(s => (
              <span key={s} style={{ padding: "2px 8px", background: "#f0f0f0", borderRadius: 10, fontSize: 10, color: "#888" }}>{s}</span>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Velocity Tab ─────────────────────────────────────────────────────────────

function VelocityTab({ data }: { data: IntelligenceBriefing }) {
  const { velocity } = data;
  const momentumColors: Record<string, string> = {
    surging: "#e74c3c",
    heating: "#e67e22",
    steady: "#3498db",
    cooling: "#95a5a6",
    stalled: "#bdc3c7",
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Momentum Chart */}
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Momentum Vectors</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {velocity.vectors.sort((a, b) => Math.abs(b.weekOverWeekChange) - Math.abs(a.weekOverWeekChange)).map((v, i) => (
            <VelocityRow key={i} vector={v} colors={momentumColors} />
          ))}
          {velocity.vectors.length === 0 && <p style={{ color: "#888", textAlign: "center" }}>No velocity data yet — need alert history to analyze trends.</p>}
        </div>
      </Card>

      {velocity.emergingTopics.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px" }}>🌱 Emerging Topics</h3>
          {velocity.emergingTopics.map((v, i) => <p key={i} style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{v.narrative}</p>)}
        </Card>
      )}
    </div>
  );
}

function VelocityRow({ vector, colors }: { vector: VelocityVector; colors: Record<string, string> }) {
  const color = colors[vector.momentum] ?? "#95a5a6";
  const changeStr = vector.weekOverWeekChange >= 0 ? `+${vector.weekOverWeekChange.toFixed(0)}%` : `${vector.weekOverWeekChange.toFixed(0)}%`;
  const barWidth = Math.min(Math.abs(vector.weekOverWeekChange), 200);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderBottom: "1px solid #f0f0f0" }}>
      <div style={{ width: 140, fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={vector.subject}>
        {vector.subject}
      </div>
      <span style={{ padding: "2px 8px", borderRadius: 10, background: color, color: "#fff", fontSize: 10, fontWeight: 600, width: 60, textAlign: "center" }}>
        {vector.momentum}
      </span>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ height: 6, borderRadius: 3, background: color, width: `${barWidth}px`, opacity: 0.7, transition: "width 0.3s" }} />
        <span style={{ fontSize: 12, fontWeight: 600, color: vector.weekOverWeekChange >= 0 ? "#27ae60" : "#e74c3c" }}>{changeStr}</span>
      </div>
      <div style={{ fontSize: 11, color: "#888", width: 80, textAlign: "right" }}>
        {vector.current7d} / {vector.previous7d}
      </div>
    </div>
  );
}

// ── Risk Tab ─────────────────────────────────────────────────────────────────

function RiskTab({ data }: { data: IntelligenceBriefing }) {
  const { risk } = data;
  const riskColors: Record<string, string> = {
    critical: "#e74c3c",
    high: "#e67e22",
    elevated: "#f1c40f",
    moderate: "#3498db",
    low: "#2ecc71",
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>Legislative Regime: <span style={{ color: "#9b59b6" }}>{risk.regime.replace(/_/g, " ")}</span></h3>
        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{risk.assessments.length} bills assessed</p>
      </Card>

      {risk.assessments.length === 0 && (
        <Card><p style={{ color: "#888", textAlign: "center", padding: 20 }}>No bills to assess — need alerts with bill IDs to generate risk models.</p></Card>
      )}

      {risk.assessments.map((ra, i) => (
        <RiskCard key={i} assessment={ra} riskColors={riskColors} />
      ))}
    </div>
  );
}

function RiskCard({ assessment, riskColors }: { assessment: RiskAssessment; riskColors: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  const color = riskColors[assessment.riskLevel] ?? "#95a5a6";
  const probPct = (assessment.passageProbability * 100).toFixed(0);

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{assessment.billId}</span>
            <span style={{ padding: "2px 8px", borderRadius: 10, background: color, color: "#fff", fontSize: 10, fontWeight: 600 }}>{assessment.riskLevel}</span>
            <span style={{ fontSize: 11, color: "#888" }}>Stage: {assessment.stage}</span>
          </div>
          <p style={{ fontSize: 12, color: "#555", margin: 0 }}>{assessment.title}</p>
        </div>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color }}>{probPct}%</div>
          <div style={{ fontSize: 10, color: "#888" }}>passage</div>
        </div>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, padding: "12px 0 0", borderTop: "1px solid #f0f0f0" }}>
          <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5 }}>{assessment.narrative}</p>
          {assessment.riskFactors.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#e74c3c", marginBottom: 4 }}>Risk Factors</div>
              {assessment.riskFactors.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: "#666", padding: "2px 0" }}>• {f.detail}</div>
              ))}
            </div>
          )}
          {assessment.recommendations.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#3498db", marginBottom: 4 }}>Recommendations</div>
              {assessment.recommendations.map((r, i) => (
                <div key={i} style={{ fontSize: 12, color: "#666", padding: "2px 0" }}>→ {r}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Influence Tab ─────────────────────────────────────────────────────────────

function InfluenceTab({ data }: { data: IntelligenceBriefing }) {
  const { influence } = data;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {influence.powerBrokers.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>👑 Power Brokers</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {influence.powerBrokers.map((p, i) => <InfluenceRow key={i} profile={p} rank={i + 1} />)}
          </div>
        </Card>
      )}

      {influence.gatekeepers.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>🚪 Gatekeepers</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {influence.gatekeepers.map((p, i) => <InfluenceRow key={i} profile={p} />)}
          </div>
        </Card>
      )}

      {influence.underEngaged.length > 0 && (
        <Card>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>⚠️ Under-Engaged (High Power, Low Activity)</h3>
          <div style={{ display: "grid", gap: 6 }}>
            {influence.underEngaged.map((p, i) => <InfluenceRow key={i} profile={p} />)}
          </div>
        </Card>
      )}

      {influence.profiles.length === 0 && (
        <Card><p style={{ color: "#888", textAlign: "center", padding: 20 }}>No stakeholder profiles yet — import legislators to enable influence analysis.</p></Card>
      )}
    </div>
  );
}

function InfluenceRow({ profile, rank }: { profile: InfluenceProfile; rank?: number }) {
  const b = profile.breakdown;
  const barMax = 100;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f5f5f5" }}>
      {rank && <span style={{ fontSize: 14, fontWeight: 700, color: "#bbb", width: 24 }}>#{rank}</span>}
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{profile.name}</span>
          {profile.party && <span style={{ fontSize: 10, color: profile.party === "R" ? "#e74c3c" : profile.party === "D" ? "#3498db" : "#888" }}>({profile.party})</span>}
          {profile.chamber && <span style={{ fontSize: 10, color: "#888" }}>{profile.chamber}</span>}
        </div>
        <div style={{ display: "flex", gap: 2, marginTop: 4, height: 4 }}>
          <div style={{ width: `${(b.positionalPower / 30) * barMax}%`, background: "#9b59b6", borderRadius: 2 }} title={`Position: ${b.positionalPower}/30`} />
          <div style={{ width: `${(b.activityLevel / 25) * barMax}%`, background: "#3498db", borderRadius: 2 }} title={`Activity: ${b.activityLevel}/25`} />
          <div style={{ width: `${(b.networkReach / 25) * barMax}%`, background: "#2ecc71", borderRadius: 2 }} title={`Network: ${b.networkReach}/25`} />
          <div style={{ width: `${(b.recency / 20) * barMax}%`, background: "#e67e22", borderRadius: 2 }} title={`Recency: ${b.recency}/20`} />
        </div>
      </div>
      <div style={{ textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: profile.influenceScore >= 60 ? "#e74c3c" : profile.influenceScore >= 30 ? "#e67e22" : "#888" }}>
          {profile.influenceScore}
        </div>
        <div style={{ fontSize: 9, color: "#aaa" }}>score</div>
      </div>
    </div>
  );
}

// ── Correlations Tab ──────────────────────────────────────────────────────────

function CorrelationsTab({ data }: { data: IntelligenceBriefing }) {
  const { correlations } = data;
  const sigColors: Record<string, string> = { critical: "#e74c3c", high: "#e67e22", moderate: "#f1c40f", low: "#95a5a6" };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card>
        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>{correlations.totalBillsAnalyzed} bills analyzed &middot; {correlations.clusters.length} clusters found &middot; {correlations.isolatedBills.length} isolated</p>
      </Card>

      {correlations.clusters.length === 0 && (
        <Card><p style={{ color: "#888", textAlign: "center", padding: 20 }}>No bill clusters detected — need more bill data to identify relationships.</p></Card>
      )}

      {correlations.clusters.map((cluster, i) => (
        <ClusterCard key={i} cluster={cluster} sigColors={sigColors} />
      ))}
    </div>
  );
}

function ClusterCard({ cluster, sigColors }: { cluster: BillCluster; sigColors: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false);
  const color = sigColors[cluster.significance] ?? "#95a5a6";

  return (
    <Card>
      <div style={{ cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ padding: "2px 8px", borderRadius: 10, background: color, color: "#fff", fontSize: 10, fontWeight: 600 }}>{cluster.significance}</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{cluster.label}</span>
          <span style={{ fontSize: 11, color: "#888" }}>{cluster.bills.length} bills &middot; cohesion {(cluster.cohesion * 100).toFixed(0)}%</span>
        </div>
        <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{cluster.narrative}</p>
      </div>
      {expanded && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #f0f0f0" }}>
          {cluster.bills.map((b, i) => (
            <div key={i} style={{ fontSize: 12, color: "#666", padding: "3px 0" }}>
              <strong>{b.billId}</strong> — {b.title} <span style={{ color: "#aaa" }}>({b.alertCount} alerts)</span>
            </div>
          ))}
          {cluster.linkages.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 4 }}>Linkages</div>
              {cluster.linkages.map((l, i) => (
                <div key={i} style={{ fontSize: 11, color: "#888", padding: "2px 0" }}>• {l.type}: {l.detail} (strength {(l.strength * 100).toFixed(0)}%)</div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Anomalies Tab ─────────────────────────────────────────────────────────────

function AnomaliesTab({ data }: { data: IntelligenceBriefing }) {
  const { anomalies } = data;
  const sevColors: Record<string, string> = { critical: "#e74c3c", high: "#e67e22", medium: "#f1c40f", low: "#95a5a6" };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card>
        <p style={{ fontSize: 12, color: "#888", margin: 0 }}>
          {anomalies.anomalies.length} anomalies detected &middot; Baseline window: {anomalies.baselineWindow}
          {anomalies.criticalCount > 0 && <span style={{ color: "#e74c3c", fontWeight: 600 }}> &middot; {anomalies.criticalCount} critical</span>}
        </p>
      </Card>

      {anomalies.anomalies.length === 0 && (
        <Card><p style={{ color: "#888", textAlign: "center", padding: 20 }}>No anomalies detected — all activity within normal parameters.</p></Card>
      )}

      {anomalies.anomalies.map((a, i) => (
        <AnomalyCard key={i} anomaly={a} sevColors={sevColors} />
      ))}
    </div>
  );
}

function AnomalyCard({ anomaly, sevColors }: { anomaly: Anomaly; sevColors: Record<string, string> }) {
  const color = sevColors[anomaly.severity] ?? "#95a5a6";
  const typeLabel = anomaly.type.replace(/_/g, " ");

  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ padding: "2px 8px", borderRadius: 10, background: color, color: "#fff", fontSize: 10, fontWeight: 600 }}>{anomaly.severity}</span>
        <span style={{ fontSize: 12, color: "#888", textTransform: "uppercase" }}>{typeLabel}</span>
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{anomaly.subject}</div>
      <p style={{ fontSize: 13, color: "#555", lineHeight: 1.5, margin: 0 }}>{anomaly.narrative}</p>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "#aaa" }}>
        <span>Deviation: {anomaly.deviation}σ</span>
        <span>Baseline: {anomaly.baseline}</span>
        <span>Observed: {anomaly.observed}</span>
      </div>
    </Card>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      {children}
    </div>
  );
}
