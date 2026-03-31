import { useState } from "react";
import { Link } from "wouter";
import { api, type PowerNetworkReport, type LegislationPredictorReport, type PowerCenterProfile, type VotingBlocResult, type PowerFlowEdge, type LegislationPredictionItem } from "../api";
import { useAsync } from "../hooks";

type Tab = "overview" | "bigThree" | "votingBlocs" | "predictions" | "powerFlows" | "findings";

export function PowerNetworkPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [refreshing, setRefreshing] = useState(false);
  const { data: network, loading: netLoading, error: netError, refetch: refetchNet } = useAsync(() => api.getPowerNetworkReport());
  const { data: predictions, loading: predLoading, error: predError, refetch: refetchPred } = useAsync(() => api.getLegislationPredictions());

  const loading = netLoading || predLoading;
  const error = netError || predError;

  const handleReanalyze = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchNet(), refetchPred()]);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !refreshing) return <div style={{ padding: 40, textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 16 }}>🔄</div>Analyzing political power network...</div>;
  if (error) return <div style={{ padding: 40, color: "#e74c3c" }}>Error: {String(error)}<br /><button onClick={handleReanalyze} style={{ marginTop: 12, padding: "8px 16px", cursor: "pointer" }}>Retry</button></div>;
  if (!network || !predictions) return null;

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "bigThree", label: "Big Three", count: 3 },
    { key: "votingBlocs", label: "Committee Cohorts", count: network.votingBlocs.length },
    { key: "predictions", label: "Predictions", count: predictions.predictions.length },
    { key: "powerFlows", label: "Power Flow", count: network.powerFlows.length },
    { key: "findings", label: "Findings", count: network.keyFindings.length },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>🏛️ Political Power Network</h1>
          <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
            Texas Legislature &middot; {predictions.session} Session &middot; {new Date(network.analyzedAt).toLocaleString()}
          </p>
        </div>
        <button onClick={handleReanalyze} disabled={refreshing} style={{ padding: "8px 16px", fontSize: 13, cursor: refreshing ? "wait" : "pointer", background: refreshing ? "#666" : "#8e44ad", color: "#fff", border: "none", borderRadius: 6, fontWeight: 600, opacity: refreshing ? 0.7 : 1 }}>
          {refreshing ? "Analyzing..." : "Re-analyze"}
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", borderRadius: 10, padding: "18px 22px", marginBottom: 20, color: "#e8e8e8" }}>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#7f8c9b", marginBottom: 8 }}>Power Network Overview</div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <Stat label="Legislators" value={network.stats.totalStakeholders} color="#3498db" />
          <Stat label="Committee Chairs" value={network.stats.totalChairs} color="#e74c3c" />
          <Stat label="Vice Chairs" value={network.stats.totalViceChairs} color="#e67e22" />
          <Stat label="House" value={network.stats.chamberBreakdown.house} color="#2ecc71" />
          <Stat label="Senate" value={network.stats.chamberBreakdown.senate} color="#9b59b6" />
          <Stat label="GOP" value={network.stats.partyBreakdown.R} color="#c0392b" />
          <Stat label="Dem" value={network.stats.partyBreakdown.D} color="#2980b9" />
          <Stat label="Cohorts" value={network.stats.blocsDetected} color="#1abc9c" />
          <Stat label="Predictions" value={predictions.stats.totalPredictions} color="#f39c12" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, overflowX: "auto" }}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 14px",
              fontSize: 13,
              cursor: "pointer",
              background: tab === t.key ? "#8e44ad" : "#2a2a3e",
              color: tab === t.key ? "#fff" : "#aaa",
              border: "none",
              borderRadius: 6,
              fontWeight: tab === t.key ? 600 : 400,
              whiteSpace: "nowrap",
            }}
          >
            {t.label} {t.count != null && <span style={{ fontSize: 11, opacity: 0.7 }}>({t.count})</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && <OverviewTab network={network} predictions={predictions} onNavigate={setTab} />}
      {tab === "bigThree" && <BigThreeTab bigThree={network.bigThree} />}
      {tab === "votingBlocs" && <VotingBlocsTab blocs={network.votingBlocs} />}
      {tab === "predictions" && <PredictionsTab report={predictions} />}
      {tab === "powerFlows" && <PowerFlowsTab flows={network.powerFlows} />}
      {tab === "findings" && <FindingsTab findings={network.keyFindings} />}
    </div>
  );
}

// ── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ network, predictions, onNavigate }: {
  network: PowerNetworkReport;
  predictions: LegislationPredictorReport;
  onNavigate: (tab: Tab) => void;
}) {
  const topPredictions = predictions.predictions.slice(0, 5);
  const topFindings = network.keyFindings.slice(0, 4);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      {/* Big Three Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
        {network.bigThree.map(pc => (
          <div key={pc.role} onClick={() => onNavigate("bigThree")} style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
            borderRadius: 10, padding: 18, cursor: "pointer",
            borderLeft: `4px solid ${roleColor(pc.role)}`,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: roleColor(pc.role), fontWeight: 700 }}>
                  {pc.role === "governor" ? "Governor" : pc.role === "lieutenant_governor" ? "Lt. Governor" : "Speaker"}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, margin: "4px 0" }}>{pc.name}</div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {pc.party} · {pc.priorities.length} priorities · {pc.committeeChairs.length} chairs · {pc.allies.length} allies
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: roleColor(pc.role) }}>{pc.metrics.chamberControl}%</div>
                <div style={{ fontSize: 10, color: "#888" }}>Control</div>
              </div>
            </div>
            {/* Top 3 priorities mini-list */}
            <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
              {pc.priorities.slice(0, 3).map(p => (
                <span key={p.topic} style={{
                  fontSize: 10, background: "#252538", borderRadius: 3, padding: "2px 8px",
                  borderLeft: `2px solid ${p.stance === "champion" ? "#2ecc71" : p.stance === "oppose" ? "#e74c3c" : "#f39c12"}`,
                }}>
                  {p.topic}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Two-column: Top Predictions + Top Findings */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 16 }}>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>📊 Top Predictions</h3>
            <button onClick={() => onNavigate("predictions")} style={{
              fontSize: 11, background: "none", border: "none", color: "#8e44ad", cursor: "pointer", textDecoration: "underline",
            }}>View all →</button>
          </div>
          {topPredictions.map((pred, idx) => (
            <div key={pred.topic + idx} style={{ background: "#1e1e2e", borderRadius: 6, padding: "10px 14px", marginBottom: 8, fontSize: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ background: pred.predictedBillType === "SB" ? "#8e44ad" : "#2980b9", color: "#fff", padding: "1px 6px", borderRadius: 3, fontSize: 10, marginRight: 6 }}>
                    {pred.predictedBillType}
                  </span>
                  <strong>{pred.topic}</strong>
                </div>
                <div style={{ display: "flex", gap: 8         }}>
                  <span style={{ color: confColor(pred.confidence), fontWeight: 700 }}>{(pred.confidence * 100).toFixed(0)}%</span>
                  <span style={{ color: confColor(pred.passageProbability) }}>{(pred.passageProbability * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <PowerBadge label="Gov" stance={pred.powerCenterDynamic.governor} />
                <PowerBadge label="Lt Gov" stance={pred.powerCenterDynamic.ltGov} />
                <PowerBadge label="Spkr" stance={pred.powerCenterDynamic.speaker} />
              </div>
            </div>
          ))}
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>🔍 Key Findings</h3>
            <button onClick={() => onNavigate("findings")} style={{
              fontSize: 11, background: "none", border: "none", color: "#8e44ad", cursor: "pointer", textDecoration: "underline",
            }}>View all →</button>
          </div>
          {topFindings.map((f, idx) => (
            <div key={idx} style={{ background: "#1e1e2e", borderRadius: 6, padding: "10px 14px", marginBottom: 8, borderLeft: "3px solid #8e44ad", fontSize: 12, lineHeight: 1.5 }}>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Voting Blocs Summary */}
      {network.votingBlocs.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 14 }}>🤝 Committee Cohorts</h3>
            <button onClick={() => onNavigate("votingBlocs")} style={{
              fontSize: 11, background: "none", border: "none", color: "#8e44ad", cursor: "pointer", textDecoration: "underline",
            }}>View all →</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 10 }}>
            {network.votingBlocs.slice(0, 4).map((bloc, idx) => (
              <div key={bloc.name + idx} style={{
                background: "#1e1e2e", borderRadius: 8, padding: "12px 16px",
                border: bloc.bipartisan ? "1px solid #1abc9c" : "1px solid #333",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{bloc.name}</div>
                  <div style={{ color: bloc.cohesion > 0.6 ? "#2ecc71" : "#f39c12", fontWeight: 700, fontSize: 14 }}>
                    {(bloc.cohesion * 100).toFixed(0)}%
                  </div>
                </div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                  {bloc.members.length} members · {bloc.chamber}
                  {bloc.bipartisan && <span style={{ color: "#1abc9c", marginLeft: 6 }}>Bipartisan</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Big Three Tab ──────────────────────────────────────────────────────────

function BigThreeTab({ bigThree }: { bigThree: PowerCenterProfile[] }) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      {bigThree.map(pc => (
        <div key={pc.role} style={{ background: "#1e1e2e", borderRadius: 10, padding: 20, border: "1px solid #333" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: roleColor(pc.role), fontWeight: 700 }}>
                {pc.role === "governor" ? "👑 Governor" : pc.role === "lieutenant_governor" ? "⚖️ Lieutenant Governor" : "🔨 Speaker of the House"}
              </div>
              <h2 style={{ margin: "4px 0 0", fontSize: 20 }}>{pc.name}</h2>
              <span style={{ fontSize: 12, color: "#888" }}>{pc.party} &middot; {pc.chamber}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: roleColor(pc.role) }}>{pc.metrics.chamberControl}%</div>
              <div style={{ fontSize: 11, color: "#888" }}>Chamber Control</div>
            </div>
          </div>

          {/* Priorities */}
          <h3 style={{ fontSize: 14, margin: "16px 0 8px", color: "#ccc" }}>Policy Priorities</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 8 }}>
            {pc.priorities.map(p => (
              <div key={p.topic} style={{ background: "#252538", borderRadius: 6, padding: "10px 14px", borderLeft: `3px solid ${p.stance === "champion" ? "#2ecc71" : p.stance === "oppose" ? "#e74c3c" : "#f39c12"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{p.topic}</span>
                  <IntensityBar intensity={p.intensity} />
                </div>
                <div style={{ fontSize: 11, color: "#999", marginTop: 4 }}>{p.evidence}</div>
              </div>
            ))}
          </div>

          {/* Committee Chairs */}
          {pc.committeeChairs.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, margin: "16px 0 8px", color: "#ccc" }}>
                Appointed Committee Chairs ({pc.committeeChairs.length})
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {pc.committeeChairs.map(ch => (
                  <Link key={ch.stakeholderId} href={`/stakeholders/${ch.stakeholderId}`} style={{ background: "#252538", borderRadius: 4, padding: "4px 10px", fontSize: 12, color: "inherit", textDecoration: "none" }}>
                    <strong style={{ borderBottom: "1px dotted #666" }}>{ch.name}</strong> — {ch.committee}
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Allies */}
          {pc.allies.length > 0 && (
            <>
              <h3 style={{ fontSize: 14, margin: "16px 0 8px", color: "#ccc" }}>Key Allies ({pc.allies.length})</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 6 }}>
                {pc.allies.map(a => (
                  <Link key={a.stakeholderId} href={`/stakeholders/${a.stakeholderId}`} style={{ background: "#252538", borderRadius: 6, padding: "8px 12px", fontSize: 12, color: "inherit", textDecoration: "none" }}>
                    <strong style={{ borderBottom: "1px dotted #666" }}>{a.name}</strong> <span style={{ color: a.party === "R" ? "#c0392b" : "#2980b9" }}>({a.party})</span>
                    <div style={{ color: "#888", marginTop: 2 }}>{a.reason}</div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Voting Blocs Tab ───────────────────────────────────────────────────────

function VotingBlocsTab({ blocs }: { blocs: VotingBlocResult[] }) {
  if (blocs.length === 0) return <EmptyState message="No committee cohorts detected yet. More committee membership data needed." />;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {blocs.map((bloc, idx) => (
        <div key={bloc.name + idx} style={{ background: "#1e1e2e", borderRadius: 10, padding: 20, border: `1px solid ${bloc.bipartisan ? "#1abc9c" : "#333"}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                {bloc.name}
                {bloc.bipartisan && <span style={{ fontSize: 11, background: "#1abc9c", color: "#fff", padding: "2px 8px", borderRadius: 4, marginLeft: 8 }}>Bipartisan</span>}
              </h3>
              <span style={{ fontSize: 12, color: "#888" }}>{bloc.chamber} &middot; {bloc.members.length} members &middot; Aligned: {bloc.alignedPowerCenter}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: bloc.cohesion > 0.6 ? "#2ecc71" : "#f39c12" }}>{(bloc.cohesion * 100).toFixed(0)}%</div>
              <div style={{ fontSize: 11, color: "#888" }}>Cohesion</div>
            </div>
          </div>

          <p style={{ fontSize: 13, color: "#bbb", margin: "0 0 12px" }}>{bloc.narrative}</p>

          {bloc.issueAreas.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, color: "#888" }}>Issue Areas: </span>
              {bloc.issueAreas.map(ia => (
                <span key={ia} style={{ background: "#252538", borderRadius: 4, padding: "2px 8px", fontSize: 11, marginRight: 4 }}>{ia}</span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {bloc.members.map(m => (
              <Link key={m.stakeholderId} href={`/stakeholders/${m.stakeholderId}`} style={{
                background: m.isLeader ? "#3d2468" : "#252538",
                border: m.isLeader ? "1px solid #8e44ad" : "1px solid transparent",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 12,
                color: "inherit",
                textDecoration: "none",
              }}>
                <span style={{ color: m.party === "R" ? "#e74c3c" : "#3498db" }}>●</span>{" "}
                {m.name}
                {m.isLeader && <span style={{ fontSize: 10, marginLeft: 4, color: "#8e44ad" }}>★ Leader</span>}
                <span style={{ color: "#666", marginLeft: 4 }}>{(m.loyalty * 100).toFixed(0)}%</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Predictions Tab ────────────────────────────────────────────────────────

function PredictionsTab({ report }: { report: LegislationPredictorReport }) {
  const [filter, setFilter] = useState<"all" | "high" | "pass" | "blocked">("all");

  const filtered = filter === "high" ? report.predictions.filter(p => p.confidence >= 0.7)
    : filter === "pass" ? report.mostLikelyToPass
    : filter === "blocked" ? report.likelyBlocked
    : report.predictions;

  return (
    <div>
      {/* Prediction Stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Stat label="Total" value={report.stats.totalPredictions} color="#3498db" />
        <Stat label="High Conf." value={report.stats.highConfidence} color="#2ecc71" />
        <Stat label="Medium" value={report.stats.mediumConfidence} color="#f39c12" />
        <Stat label="Low" value={report.stats.lowConfidence} color="#e74c3c" />
        <Stat label="Avg Passage" value={`${(report.stats.avgPassageProbability * 100).toFixed(0)}%`} color="#9b59b6" isText />
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {(["all", "high", "pass", "blocked"] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: "6px 12px", fontSize: 12, cursor: "pointer",
            background: filter === f ? "#8e44ad" : "#252538",
            color: filter === f ? "#fff" : "#aaa",
            border: "none", borderRadius: 4,
          }}>
            {f === "all" ? "All" : f === "high" ? "High Confidence" : f === "pass" ? "Likely to Pass" : "Likely Blocked"}
          </button>
        ))}
      </div>

      {/* Predictions */}
      <div style={{ display: "grid", gap: 12 }}>
        {filtered.length === 0 ? (
          <EmptyState message={`No predictions match the "${filter}" filter.`} />
        ) : filtered.map((pred, idx) => (
          <PredictionCard key={pred.topic + idx} prediction={pred} />
        ))}
      </div>

      {/* Chamber Conflicts */}
      {report.chamberConflicts.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, margin: "24px 0 12px", color: "#e67e22" }}>⚔️ Chamber Conflicts</h3>
          {report.chamberConflicts.map((cc, idx) => (
            <div key={cc.topic + idx} style={{ background: "#1e1e2e", borderRadius: 8, padding: 16, marginBottom: 12, borderLeft: "3px solid #e67e22" }}>
              <h4 style={{ margin: "0 0 8px", fontSize: 14 }}>{cc.topic}</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><span style={{ fontSize: 11, color: "#2980b9", fontWeight: 700 }}>HOUSE:</span> <span style={{ fontSize: 12 }}>{cc.housePosition}</span></div>
                <div><span style={{ fontSize: 11, color: "#c0392b", fontWeight: 700 }}>SENATE:</span> <span style={{ fontSize: 12 }}>{cc.senatePosition}</span></div>
              </div>
              <p style={{ fontSize: 12, color: "#999", margin: "8px 0 0" }}>{cc.narrative}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function PredictionCard({ prediction: p }: { prediction: LegislationPredictionItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ background: "#1e1e2e", borderRadius: 10, padding: 16, border: "1px solid #333", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 11, background: p.predictedBillType === "SB" ? "#8e44ad" : "#2980b9", color: "#fff", padding: "2px 8px", borderRadius: 4, marginRight: 8 }}>
            {p.predictedBillType}
          </span>
          <strong style={{ fontSize: 14 }}>{p.topic}</strong>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: confColor(p.confidence) }}>{(p.confidence * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 10, color: "#888" }}>Confidence</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: confColor(p.passageProbability) }}>{(p.passageProbability * 100).toFixed(0)}%</div>
            <div style={{ fontSize: 10, color: "#888" }}>Passage</div>
          </div>
        </div>
      </div>

      {/* Power Center Dynamics */}
      <div style={{ display: "flex", gap: 12, marginTop: 10 }}>
        <PowerBadge label="Gov" stance={p.powerCenterDynamic.governor} />
        <PowerBadge label="Lt Gov" stance={p.powerCenterDynamic.ltGov} />
        <PowerBadge label="Speaker" stance={p.powerCenterDynamic.speaker} />
        {p.likelySponsor && (
          <span style={{ fontSize: 12, color: "#bbb" }}>
            Likely Sponsor: <strong>{p.likelySponsor.name}</strong> ({p.likelySponsor.party})
          </span>
        )}
        {p.likelyCommittee && (
          <span style={{ fontSize: 12, color: "#888" }}>→ {p.likelyCommittee}</span>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: 12, borderTop: "1px solid #333", paddingTop: 12 }}>
          <p style={{ fontSize: 13, color: "#bbb", margin: "0 0 10px" }}>{p.assessment}</p>
          <h4 style={{ fontSize: 12, margin: "8px 0 4px", color: "#888" }}>Evidence Sources</h4>
          {p.evidenceSources.map((ev, i) => (
            <div key={ev.type + i} style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>
              <span style={{ background: "#252538", borderRadius: 3, padding: "1px 6px", fontSize: 10, marginRight: 6 }}>{ev.type.replace(/_/g, " ")}</span>
              {ev.detail}
              <span style={{ color: "#666", marginLeft: 8 }}>weight: {ev.weight.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Power Flows Tab ────────────────────────────────────────────────────────

function PowerFlowsTab({ flows }: { flows: PowerFlowEdge[] }) {
  if (flows.length === 0) return <EmptyState message="No power flow connections mapped yet. Run analysis to generate flow data." />;

  const grouped = new Map<string, typeof flows>();
  for (const f of flows) {
    const key = f.sourceRole;
    const list = grouped.get(key) ?? [];
    list.push(f);
    grouped.set(key, list);
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
        Power flows from leadership to committee chairs to members. Each edge represents an appointment, alliance, or control relationship.
      </p>
      {[...grouped.entries()].map(([role, edges]) => (
        <div key={role} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 14, margin: "0 0 8px", textTransform: "capitalize" }}>
            {role.replace(/_/g, " ")} → ({edges.length} connections)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 8 }}>
            {edges.map((f, idx) => (
              <div key={f.targetId + "-" + idx} style={{ background: "#1e1e2e", borderRadius: 6, padding: "10px 14px", fontSize: 12, borderLeft: `3px solid ${flowColor(f.flowType)}` }}>
                <div style={{ fontWeight: 600 }}>{f.sourceName} → {f.targetName}</div>
                <div style={{ color: "#888", marginTop: 4 }}>
                  <span style={{ textTransform: "capitalize" }}>{f.flowType.replace(/_/g, " ")}</span>
                  {" "}&middot; Strength: {(f.strength * 100).toFixed(0)}%
                </div>
                <div style={{ color: "#666", marginTop: 2 }}>{f.evidence}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Findings Tab ───────────────────────────────────────────────────────────

function FindingsTab({ findings }: { findings: string[] }) {
  if (findings.length === 0) return <EmptyState message="No key findings generated yet. Run analysis to generate insights." />;

  return (
    <div>
      <h3 style={{ fontSize: 16, margin: "0 0 16px" }}>🔍 Key Power Network Findings</h3>
      {findings.map((f, idx) => (
        <div key={idx} style={{ background: "#1e1e2e", borderRadius: 8, padding: "14px 18px", marginBottom: 10, borderLeft: "3px solid #8e44ad" }}>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>{f}</p>
        </div>
      ))}
    </div>
  );
}

// ── Shared Components ──────────────────────────────────────────────────────

function Stat({ label, value, color, isText }: { label: string; value: number | string; color: string; isText?: boolean }) {
  return (
    <div style={{ textAlign: "center", minWidth: 60 }}>
      <div style={{ fontSize: isText ? 14 : 22, fontWeight: 700, color }}>{isText ? String(value) : value}</div>
      <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function IntensityBar({ intensity }: { intensity: number }) {
  return (
    <div style={{ display: "flex", gap: 1, alignItems: "center" }}>
      {Array.from({ length: 10 }, (_, i) => (
        <div key={i} style={{ width: 4, height: 12, borderRadius: 1, background: i < intensity ? (intensity >= 8 ? "#e74c3c" : intensity >= 5 ? "#f39c12" : "#2ecc71") : "#333" }} />
      ))}
    </div>
  );
}

function PowerBadge({ label, stance }: { label: string; stance: string }) {
  const color = stance === "support" ? "#2ecc71" : stance === "oppose" ? "#e74c3c" : stance === "neutral" ? "#f39c12" : "#666";
  const icon = stance === "support" ? "✓" : stance === "oppose" ? "✗" : stance === "neutral" ? "~" : "?";
  return (
    <span style={{ fontSize: 11, background: "#252538", borderRadius: 4, padding: "2px 8px", border: `1px solid ${color}33` }}>
      <span style={{ color }}>{icon}</span> {label}
    </span>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div style={{ textAlign: "center", padding: 40, color: "#888" }}>{message}</div>;
}

function roleColor(role: string) {
  return role === "governor" ? "#c0392b" : role === "lieutenant_governor" ? "#8e44ad" : "#2980b9";
}

function confColor(v: number) {
  return v >= 0.7 ? "#2ecc71" : v >= 0.4 ? "#f39c12" : "#e74c3c";
}

function flowColor(type: string) {
  return type === "appoints" ? "#8e44ad" : type === "allies_with" ? "#2ecc71" : type === "controls" ? "#e74c3c" : "#3498db";
}
