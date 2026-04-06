import { api, type DashboardKpis, type SparklinePoint, type SchedulerStatus, type JobRunRecord, type ChampionStatus, type RetrainResult, type HearingEvent, type PowerNetworkReport, type LegislationPredictorReport, type IntelligenceBriefing } from "../api";
import { useAsync } from "../hooks";
import { useState, useCallback, useEffect, useRef } from "react";

// ── SVG Sparkline ────────────────────────────────────────────────────────────

function Sparkline({
  data,
  width = 120,
  height = 32,
  color = "#4da8da",
  filled = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  filled?: boolean;
}) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height}>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke={color} strokeWidth={1} opacity={0.3} strokeDasharray="4 2" />
      </svg>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const usableH = height - pad * 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = pad + usableH - ((v - min) / range) * usableH;
    return `${x},${y}`;
  });

  const linePath = `M${points.join(" L")}`;
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {filled && <path d={fillPath} fill={color} opacity={0.1} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* Current value dot */}
      <circle
        cx={parseFloat(points[points.length - 1].split(",")[0])}
        cy={parseFloat(points[points.length - 1].split(",")[1])}
        r={2.5}
        fill={color}
      />
    </svg>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  subtitle,
  color = "#2c3e50",
  sparkData,
  sparkColor,
  format,
}: {
  label: string;
  value: number;
  subtitle?: string;
  color?: string;
  sparkData?: number[];
  sparkColor?: string;
  format?: "number" | "percent" | "ms" | "score";
}) {
  const formatted = formatValue(value, format);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      padding: "16px 20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      borderLeft: `3px solid ${color}`,
      display: "flex",
      flexDirection: "column",
      gap: 6,
      minWidth: 0,
    }}>
      <div style={{ fontSize: 11, color: "#888", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>{formatted}</div>
          {subtitle && <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{subtitle}</div>}
        </div>
        {sparkData && sparkData.length > 1 && (
          <Sparkline data={sparkData} color={sparkColor ?? color} width={100} height={28} />
        )}
      </div>
    </div>
  );
}

function formatValue(v: number, fmt?: string): string {
  if (fmt === "percent") return `${v}%`;
  if (fmt === "ms") return `${v.toFixed(1)}ms`;
  if (fmt === "score") return v.toFixed(1);
  return v.toLocaleString();
}

// ── Regime Badge ─────────────────────────────────────────────────────────────

const REGIME_COLORS: Record<string, string> = {
  pre_filing: "#8e44ad",
  early_session: "#2980b9",
  committee_season: "#27ae60",
  floor_action: "#e67e22",
  conference: "#e74c3c",
  sine_die: "#c0392b",
  special_session: "#d35400",
  interim: "#7f8c8d",
  unknown: "#95a5a6",
};

function RegimeBadge({ regime }: { regime: string }) {
  const bgColor = REGIME_COLORS[regime] ?? REGIME_COLORS.unknown;
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 10px",
      borderRadius: 12,
      background: bgColor,
      color: "#fff",
      fontSize: 11,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
    }}>
      {regime.replace(/_/g, " ")}
    </span>
  );
}

// ── Agent Score Bar ──────────────────────────────────────────────────────────

function AgentScoreBar({ agent, mean }: { agent: string; mean: number }) {
  const pct = Math.round(mean * 100);
  const barColor = pct >= 70 ? "#27ae60" : pct >= 40 ? "#e67e22" : "#e74c3c";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
      <div style={{ width: 90, fontSize: 12, fontWeight: 500, color: "#555", textTransform: "capitalize" }}>
        {agent}
      </div>
      <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: 4, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ width: 36, fontSize: 11, fontWeight: 600, color: barColor, textAlign: "right" }}>
        {pct}%
      </div>
    </div>
  );
}

// ── Pipeline Action Distribution ─────────────────────────────────────────────

function ActionDistribution({ escalations, watches, archives }: { escalations: number; watches: number; archives: number }) {
  const total = escalations + watches + archives || 1;
  const segments = [
    { label: "Escalate", value: escalations, color: "#e74c3c" },
    { label: "Watch", value: watches, color: "#e67e22" },
    { label: "Archive", value: archives, color: "#95a5a6" },
  ];

  return (
    <div>
      <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color, minWidth: s.value > 0 ? 4 : 0 }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: s.color }} />
            <span style={{ fontSize: 11, color: "#666" }}>{s.label}: <b>{s.value}</b></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Uptime Display ───────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ── Extract sparkline series from time-series points ─────────────────────────

function extractSeries(points: SparklinePoint[], key: keyof SparklinePoint): number[] {
  return points.map((p) => p[key] as number);
}

// ── Main Dashboard ───────────────────────────────────────────────────────────

export function DashboardPage() {
  const { data: stats, loading, error, refetch } = useAsync(() => api.getDashboardStats());
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const { data: scheduler, loading: schedLoading, refetch: refetchScheduler } = useAsync(() => api.getSchedulerStatus());
  const [triggering, setTriggering] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [champion, setChampion] = useState<ChampionStatus | null>(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainResult, setRetrainResult] = useState<RetrainResult | null>(null);
  const { data: thisWeekData } = useAsync(() => api.getThisWeekHearings(DEFAULT_WORKSPACE_ID));
  const { data: powerNetwork } = useAsync(() => api.getPowerNetworkReport());
  const { data: predictions } = useAsync(() => api.getLegislationPredictions());
  const { data: briefing } = useAsync(() => api.getIntelligenceBriefing());

  // Auto-refresh KPIs every 15 seconds
  const fetchKpis = useCallback(async () => {
    try {
      const data = await api.getDashboardKpis();
      setKpis(data);
      setLastRefresh(new Date());
    } catch {
      // silent — KPI overlay is optional
    }
    try {
      const cs = await api.getChampionStatus();
      setChampion(cs);
    } catch {
      // silent — champion data is optional
    }
  }, []);

  useEffect(() => {
    fetchKpis();
    intervalRef.current = setInterval(fetchKpis, 15_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchKpis]);

  const handleTrigger = useCallback(async (jobName: string) => {
    setTriggering(jobName);
    try {
      await api.triggerScheduledJob(jobName);
      refetchScheduler();
    } catch {
      // ignore - result will show in status
    } finally {
      setTriggering(null);
    }
  }, [refetchScheduler]);

  const handleRetrain = useCallback(async () => {
    setRetraining(true);
    setRetrainResult(null);
    try {
      const result = await api.triggerRetrain();
      setRetrainResult(result);
      // Refresh champion status
      const cs = await api.getChampionStatus();
      setChampion(cs);
    } catch {
      // ignore
    } finally {
      setRetraining(false);
    }
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;
  if (!stats) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Policy Intelligence Dashboard</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {kpis && <RegimeBadge regime={kpis.regime} />}
          <span style={{ fontSize: 11, color: "#aaa" }}>
            {kpis ? `Up ${formatUptime(kpis.uptime)}` : ""}
            {" · "}
            Refreshed {lastRefresh.toLocaleTimeString()}
          </span>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: kpis ? "#27ae60" : "#e74c3c",
            boxShadow: kpis ? "0 0 6px #27ae60" : "none",
          }} />
        </div>
      </div>

      {/* ── KPI Cards (top row) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <KpiCard
          label="Total Alerts"
          value={kpis?.kpis.totalAlerts ?? stats.totalAlerts}
          color="#2c3e50"
          sparkData={extractSeries(kpis?.sparklines ?? [], "alertsCreated")}
          sparkColor="#2c3e50"
        />
        <KpiCard
          label="Pending Review"
          value={kpis?.kpis.pendingReview ?? stats.pendingReview}
          color="#e67e22"
        />
        <KpiCard
          label="High Priority (70+)"
          value={kpis?.kpis.highPriority ?? stats.highPriority}
          color="#e74c3c"
          sparkData={extractSeries(kpis?.sparklines ?? [], "escalations")}
          sparkColor="#e74c3c"
        />
        <KpiCard
          label="Pipeline Runs"
          value={kpis?.kpis.pipelineRuns ?? 0}
          color="#3498db"
          sparkData={extractSeries(kpis?.sparklines ?? [], "pipelineRuns")}
          sparkColor="#3498db"
        />
      </div>

      {/* ── KPI Cards (second row) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <KpiCard
          label="Docs Processed"
          value={kpis?.kpis.docsProcessed ?? stats.totalDocuments}
          color="#3498db"
          sparkData={extractSeries(kpis?.sparklines ?? [], "docsProcessed")}
          sparkColor="#3498db"
        />
        <KpiCard
          label="Match Rate"
          value={kpis?.kpis.matchRate ?? 0}
          color="#27ae60"
          format="percent"
        />
        <KpiCard
          label="Avg Score"
          value={kpis?.pipeline.avgScore ?? 0}
          subtitle={kpis ? `${kpis.pipeline.totalRuns} scored` : undefined}
          color="#8e44ad"
          format="score"
          sparkData={extractSeries(kpis?.sparklines ?? [], "avgScore")}
          sparkColor="#8e44ad"
        />
        <KpiCard
          label="Avg Latency"
          value={kpis?.pipeline.avgDurationMs ?? 0}
          subtitle={kpis ? `conf: ${(kpis.pipeline.avgConfidence * 100).toFixed(0)}%` : undefined}
          color="#16a085"
          format="ms"
        />
      </div>

      {/* ── Pipeline Intelligence Row ── */}
      {kpis && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          {/* Action Distribution */}
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 14, color: "#333" }}>Pipeline Actions</h3>
            <ActionDistribution
              escalations={kpis.kpis.escalations}
              watches={kpis.kpis.watches}
              archives={kpis.kpis.archives}
            />
            <div style={{ marginTop: 10, fontSize: 11, color: "#aaa" }}>
              {kpis.kpis.alertsSkipped} skipped (dedup/cooldown)
            </div>
          </div>

          {/* Agent Scores */}
          <div style={{ background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
            <h3 style={{ fontSize: 14, marginTop: 0, marginBottom: 14, color: "#333" }}>Agent Scores (avg)</h3>
            {kpis.agents.map((a) => (
              <AgentScoreBar key={a.agent} agent={a.agent} mean={a.mean} />
            ))}
          </div>
        </div>
      )}

      {/* ── Champion Model Panel ── */}
      {champion && (
        <div style={{ background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 14, margin: 0, color: "#333" }}>
              Champion Model
              <span style={{
                marginLeft: 8,
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 10,
                background: champion.isDefault ? "#95a5a6" : "#27ae60",
                color: "#fff",
                fontWeight: 600,
              }}>
                {champion.isDefault ? "DEFAULT" : `GEN ${champion.generation}`}
              </span>
            </h3>
            <button
              onClick={handleRetrain}
              disabled={retraining}
              style={{
                fontSize: 11,
                padding: "5px 14px",
                borderRadius: 4,
                border: "1px solid #ddd",
                background: retraining ? "#eee" : "#fff",
                cursor: retraining ? "not-allowed" : "pointer",
                fontWeight: 500,
              }}
            >
              {retraining ? "Retraining..." : "Run Retrain"}
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Weights */}
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Agent Weights</div>
              {Object.entries(champion.weights).map(([agent, weight]) => (
                <div key={agent} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, width: 100, textTransform: "capitalize" }}>{agent}</span>
                  <div style={{ flex: 1, height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{
                      width: `${(weight as number) * 100}%`,
                      height: "100%",
                      background: "#3498db",
                      borderRadius: 4,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#666", marginLeft: 8, width: 40, textAlign: "right" }}>
                    {((weight as number) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
            {/* Stats */}
            <div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Status</div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>
                <strong>Accuracy:</strong> {champion.accuracy > 0 ? `${(champion.accuracy * 100).toFixed(1)}%` : "—"}
              </div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>
                <strong>Feedback:</strong> {champion.feedbackCount} samples
              </div>
              <div style={{ fontSize: 12, marginBottom: 6 }}>
                <strong>Thresholds:</strong> escalate ≥{champion.escalateThreshold}, archive ≤{champion.archiveThreshold}
              </div>
              <div style={{ fontSize: 12, color: "#aaa" }}>
                {champion.isDefault ? "No retraining yet" : `Promoted ${new Date(champion.promotedAt).toLocaleDateString()}`}
              </div>
              {retrainResult && (
                <div style={{
                  marginTop: 10,
                  padding: 8,
                  borderRadius: 6,
                  background: retrainResult.promoted ? "#eafaf1" : "#fef9e7",
                  fontSize: 11,
                }}>
                  {retrainResult.promoted
                    ? `Challenger promoted! Gen ${retrainResult.newGeneration} (${(retrainResult.challengerAccuracy * 100).toFixed(1)}% vs ${(retrainResult.championAccuracy * 100).toFixed(1)}%)`
                    : retrainResult.trainSize === 0
                      ? `Need ≥20 feedback samples (have ${champion.feedbackCount})`
                      : `No promotion — challenger ${(retrainResult.challengerAccuracy * 100).toFixed(1)}% vs champion ${(retrainResult.championAccuracy * 100).toFixed(1)}%`
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── What's Happening This Week ── */}
      {thisWeekData && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, margin: 0 }}>
              What's Happening This Week
              <span style={{
                marginLeft: 8,
                fontSize: 11,
                padding: "2px 8px",
                borderRadius: 10,
                background: thisWeekData.hearings.length > 0 ? "#27ae60" : "#95a5a6",
                color: "#fff",
                fontWeight: 600,
              }}>
                {thisWeekData.hearings.length} hearing{thisWeekData.hearings.length !== 1 ? "s" : ""}
              </span>
            </h3>
            <a href="/calendar" style={{ fontSize: 12, color: "#3498db", textDecoration: "none" }}>View Calendar →</a>
          </div>
          {thisWeekData.hearings.length === 0 ? (
            <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", color: "#888", fontSize: 13 }}>
              No committee hearings scheduled this week.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {thisWeekData.hearings.map((h: HearingEvent) => {
                const chamberColor = h.chamber === "House" ? "#2980b9" : h.chamber === "Senate" ? "#8e44ad" : "#e67e22";
                return (
                  <div key={h.id} style={{
                    background: "#fff",
                    borderRadius: 8,
                    padding: "12px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                    borderLeft: `3px solid ${chamberColor}`,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#333" }}>{h.committee}</div>
                      <span style={{
                        fontSize: 10,
                        padding: "2px 8px",
                        borderRadius: 10,
                        background: chamberColor + "18",
                        color: chamberColor,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                      }}>
                        {h.chamber}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 4 }}>
                      {new Date(h.hearingDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      {h.timeDescription && ` · ${h.timeDescription}`}
                    </div>
                    {h.location && (
                      <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>📍 {h.location}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Intelligence Briefing Card */}
      {briefing && (
        <div style={{ background: "#fff", borderRadius: 10, padding: 20, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.08)", borderLeft: "4px solid #8e44ad" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, margin: 0, color: "#8e44ad" }}>🧠 Intelligence Briefing</h3>
            <a href="/intelligence" style={{ fontSize: 12, color: "#3498db", textDecoration: "none" }}>Full Intel Hub →</a>
          </div>
          <p style={{ fontSize: 13, color: "#444", lineHeight: 1.5, margin: "0 0 10px" }}>{briefing.executiveSummary}</p>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            <span style={{ color: "#c0392b", fontWeight: 600 }}>
              {briefing.insights.filter((i) => i.priority === 1).length} critical
            </span>
            <span style={{ color: "#e67e22", fontWeight: 600 }}>
              {briefing.insights.filter((i) => i.priority === 2).length} high-priority
            </span>
            <span style={{ color: "#888" }}>
              {briefing.insights.length} total insights
            </span>
            {briefing.delta?.threatTrend && (
              <span style={{
                color: briefing.delta.threatTrend === "escalating" ? "#e74c3c" : briefing.delta.threatTrend === "deescalating" ? "#27ae60" : "#888",
                fontWeight: 600,
              }}>
                Threat: {briefing.delta.threatTrend}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Power Network + Predictions Quick View */}
      {(powerNetwork || predictions) && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ fontSize: 15, margin: 0 }}>⚡ Power Network &amp; Predictions</h3>
            <a href="/power-network" style={{ fontSize: 12, color: "#3498db", textDecoration: "none" }}>Full Analysis →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {/* Big Three Mini Cards */}
            {powerNetwork && (
              <div style={{ display: "grid", gap: 10 }}>
                {powerNetwork.bigThree.map(pc => {
                  const roleCol = pc.role === "governor" ? "#e67e22" : pc.role === "lieutenant_governor" ? "#8e44ad" : "#2980b9";
                  return (
                    <div key={pc.role} style={{
                      background: "#fff", borderRadius: 8, padding: "12px 16px",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                      borderLeft: `3px solid ${roleCol}`,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: roleCol, fontWeight: 700 }}>
                            {pc.role === "governor" ? "Governor" : pc.role === "lieutenant_governor" ? "Lt. Governor" : "Speaker"}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#333" }}>{pc.name}</div>
                          <div style={{ fontSize: 11, color: "#888" }}>{pc.priorities.length} priorities · {pc.allies.length} allies</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 700, color: roleCol }}>{pc.metrics.chamberControl}%</div>
                          <div style={{ fontSize: 9, color: "#888" }}>Control</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Top Predictions */}
            {predictions && (
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#2ecc71" }}>{predictions.stats.highConfidence}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>High Conf.</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#3498db" }}>{predictions.mostLikelyToPass.length}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>Likely Pass</div>
                  </div>
                  <div style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.06)", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: "#e67e22" }}>{predictions.chamberConflicts.length}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>Conflicts</div>
                  </div>
                </div>
                {predictions.predictions.slice(0, 4).map((p, idx) => (
                  <div key={p.topic + idx} style={{
                    background: "#fff", borderRadius: 6, padding: "8px 12px", marginBottom: 6,
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)", fontSize: 12,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontWeight: 600 }}>{p.topic}</span>
                      <span style={{ color: p.passageProbability > 0.5 ? "#27ae60" : p.passageProbability > 0.3 ? "#f39c12" : "#e74c3c", fontWeight: 700 }}>
                        {(p.passageProbability * 100).toFixed(0)}% pass
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alert status breakdown */}
      {stats.alertsByStatus.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>Alerts by Status</h3>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {stats.alertsByStatus.map((s) => (
              <div key={s.status} style={{
                background: "#fff",
                borderRadius: 8,
                padding: "10px 16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                minWidth: 120,
              }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{s.count.toLocaleString()}</div>
                <div style={{ fontSize: 11, color: "#888", textTransform: "capitalize" }}>{s.status.replace(/_/g, " ")}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts by watchlist */}
      {stats.alertsByWatchlist.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>Top Watchlists by Alert Volume</h3>
          <div style={{ background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            {stats.alertsByWatchlist.map((w, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: i < stats.alertsByWatchlist.length - 1 ? "1px solid #f0f0f0" : "none",
              }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{w.watchlistName}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#555" }}>{w.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>Recent Alerts</h3>
          {stats.recentAlerts.map((a) => (
            <div key={a.id} style={{ padding: "8px 12px", background: "#fff", borderRadius: 6, marginBottom: 8, borderLeft: `3px solid ${a.relevanceScore >= 70 ? "#e74c3c" : a.relevanceScore >= 40 ? "#e67e22" : "#95a5a6"}` }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title.slice(0, 80)}</div>
              <div style={{ fontSize: 11, color: "#888" }}>Score: {a.relevanceScore} · {a.status}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ marginBottom: 12, fontSize: 15 }}>Recent Documents</h3>
          {stats.recentDocuments.map((s) => (
            <div key={s.id} style={{ padding: "8px 12px", background: "#fff", borderRadius: 6, marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{s.title.slice(0, 80)}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{s.sourceType} · {s.publisher}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scheduler Status */}
      {scheduler && (
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ marginBottom: 12, fontSize: 15, display: "flex", alignItems: "center", gap: 8 }}>
            Scheduled Ingestion
            <span style={{
              fontSize: 11,
              padding: "2px 8px",
              borderRadius: 10,
              background: scheduler.enabled ? "#27ae60" : "#95a5a6",
              color: "#fff",
              fontWeight: 600,
            }}>
              {scheduler.enabled ? "ACTIVE" : "DISABLED"}
            </span>
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
            {scheduler.jobs.map((job) => (
              <div key={job.name} style={{
                background: "#fff",
                borderRadius: 8,
                padding: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                borderLeft: `3px solid ${job.running ? "#3498db" : job.lastRun?.status === "error" ? "#e74c3c" : "#27ae60"}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{job.name}</span>
                  <button
                    onClick={() => handleTrigger(job.name)}
                    disabled={triggering === job.name || job.running}
                    style={{
                      fontSize: 11,
                      padding: "4px 10px",
                      borderRadius: 4,
                      border: "1px solid #ddd",
                      background: triggering === job.name || job.running ? "#eee" : "#fff",
                      cursor: triggering === job.name || job.running ? "not-allowed" : "pointer",
                      fontWeight: 500,
                    }}
                  >
                    {triggering === job.name ? "Running..." : job.running ? "In Progress" : "Run Now"}
                  </button>
                </div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                  Schedule: <code style={{ background: "#f5f5f5", padding: "1px 4px", borderRadius: 3 }}>{job.cronExpression}</code>
                </div>
                <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
                  Runs: {job.runCounts.total} total ({job.runCounts.success} ok / {job.runCounts.error} error) · skipped overlaps: {job.runCounts.skippedWhileRunning}
                </div>
                {job.running && job.runningSince && (
                  <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
                    Running since: {new Date(job.runningSince).toLocaleString()}
                  </div>
                )}
                {job.consecutiveFailures > 0 && (
                  <div style={{ fontSize: 11, color: "#b91c1c", marginBottom: 4 }}>
                    Consecutive failures: {job.consecutiveFailures}
                  </div>
                )}
                {job.lastRun && (
                  <div style={{ fontSize: 11, color: job.lastRun.status === "error" ? "#e74c3c" : "#555", marginTop: 4 }}>
                    Last: {new Date(job.lastRun.finishedAt).toLocaleString()} ({job.lastRun.durationMs}ms)
                    {job.lastRun.status === "error" && <span> — {job.lastRun.error}</span>}
                    {job.lastRun.status === "success" && job.lastRun.summary && (
                      <span> — {Object.entries(job.lastRun.summary).map(([k, v]) => `${k}: ${v}`).join(", ")}</span>
                    )}
                  </div>
                )}
                {!job.lastRun && <div style={{ fontSize: 11, color: "#aaa" }}>No runs yet</div>}
              </div>
            ))}
          </div>
          {scheduler.recentHistory.length > 0 && (
            <details style={{ marginTop: 12 }}>
              <summary style={{ cursor: "pointer", fontSize: 13, color: "#555" }}>
                Recent job history ({scheduler.recentHistory.length})
              </summary>
              <div style={{
                marginTop: 8,
                background: "#fff",
                borderRadius: 8,
                overflow: "hidden",
                boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                maxHeight: 300,
                overflowY: "auto",
              }}>
                {scheduler.recentHistory.map((run, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                    borderBottom: i < scheduler.recentHistory.length - 1 ? "1px solid #f0f0f0" : "none",
                    fontSize: 12,
                  }}>
                    <span style={{ fontWeight: 500, minWidth: 120 }}>{run.jobName}</span>
                    <span style={{ color: "#888" }}>{new Date(run.finishedAt).toLocaleString()}</span>
                    <span style={{ color: "#888" }}>{run.durationMs}ms</span>
                    <span style={{
                      fontWeight: 600,
                      color: run.status === "error" ? "#e74c3c" : "#27ae60",
                    }}>
                      {run.status}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
