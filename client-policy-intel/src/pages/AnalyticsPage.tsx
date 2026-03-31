import { api, type DashboardAnalytics, type VelocityReport, type VelocityVector, type RiskReport, type RiskAssessment, type AnomalyReport, type Anomaly, type ForecastReport } from "../api";
import { useAsync } from "../hooks";
import { useState } from "react";

export function AnalyticsPage() {
  const { data, loading, error, refetch } = useAsync(() => api.getDashboardAnalytics());
  const { data: velocity } = useAsync(() => api.getVelocityReport());
  const { data: risk } = useAsync(() => api.getRiskReport());
  const { data: anomalies } = useAsync(() => api.getAnomalyReport());
  const { data: forecast } = useAsync(() => api.getForecastReport());

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;
  if (!data) return null;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Analytics</h1>
      <div style={{ display: "grid", gap: 20 }}>
        <ScoreDistributionChart data={data.scoreDistribution} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          <SourceBreakdown data={data.sourceTypeBreakdown} />
          <DailyVolume data={data.dailyAlertVolume} />
        </div>

        {/* Intelligence Engine Sections */}
        {velocity && <VelocitySection report={velocity} />}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          {risk && <RiskLandscape report={risk} />}
          {anomalies && <AnomalyOverview report={anomalies} />}
        </div>
        {forecast && <ForecastAccuracy report={forecast} />}
      </div>
    </div>
  );
}

function ScoreDistributionChart({ data }: { data: DashboardAnalytics["scoreDistribution"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Alert Score Distribution</h3>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 180 }}>
        {data.map((d) => {
          const h = Math.max(4, (d.count / max) * 160);
          const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : "0";
          const color = barColor(d.bucket);
          return (
            <div key={d.bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 10, color: "#888" }}>{d.count.toLocaleString()}</div>
              <div
                title={`${d.bucket}: ${d.count.toLocaleString()} (${pct}%)`}
                style={{ width: "100%", height: h, background: color, borderRadius: "4px 4px 0 0", cursor: "help", transition: "height 0.3s" }}
              />
              <div style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap" }}>{d.bucket}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 10, textAlign: "center" }}>
        Total: {total.toLocaleString()} alerts
      </div>
    </div>
  );
}

function barColor(bucket: string): string {
  const n = parseInt(bucket);
  if (n >= 70) return "#e74c3c";
  if (n >= 40) return "#e67e22";
  if (n >= 20) return "#f1c40f";
  return "#95a5a6";
}

function SourceBreakdown({ data }: { data: DashboardAnalytics["sourceTypeBreakdown"] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Source Type Breakdown</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {data.map((d) => {
          const pct = total > 0 ? (d.count / total) * 100 : 0;
          return (
            <div key={d.source_type}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: "#555" }}>{d.source_type.replace(/_/g, " ")}</span>
                <span style={{ color: "#888" }}>{d.count.toLocaleString()} ({pct.toFixed(1)}%)</span>
              </div>
              <div style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "#3498db", borderRadius: 3, transition: "width 0.3s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyVolume({ data }: { data: DashboardAnalytics["dailyAlertVolume"] }) {
  if (data.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Daily Alert Volume (30d)</h3>
        <p style={{ fontSize: 13, color: "#888" }}>No data in the last 30 days.</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Daily Alert Volume (30d)</h3>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 100 }}>
        {data.map((d) => {
          const h = Math.max(2, (d.count / max) * 90);
          const label = new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
          return (
            <div key={d.day} title={`${label}: ${d.count}`} style={{ flex: 1, height: h, background: "#27ae60", borderRadius: "2px 2px 0 0", cursor: "help" }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aaa", marginTop: 4 }}>
        <span>{new Date(data[0].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>{new Date(data[data.length - 1].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}

/* ─── Velocity Section ──────────────────────────────────────────── */

const momentumColor: Record<string, string> = {
  surging: "#e74c3c", heating: "#e67e22", steady: "#3498db", cooling: "#95a5a6", stalled: "#bdc3c7",
};

function VelocitySection({ report }: { report: VelocityReport }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Velocity Trends</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        <VelocityGroup label="Top Movers" items={report.topMovers} />
        <VelocityGroup label="Emerging Topics" items={report.emergingTopics} />
        <VelocityGroup label="Decaying Topics" items={report.decayingTopics} />
      </div>
    </div>
  );
}

function VelocityGroup({ label, items }: { label: string; items: VelocityVector[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", color: "#555" }}>{label}</h4>
      <div style={{ display: "grid", gap: 6 }}>
        {items.slice(0, 5).map((v) => (
          <div key={v.subject} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <span style={{ background: momentumColor[v.momentum] || "#ccc", color: "#fff", borderRadius: 4, padding: "2px 6px", fontSize: 10, fontWeight: 600, minWidth: 54, textAlign: "center" }}>
              {v.momentum}
            </span>
            <span style={{ flex: 1, color: "#333" }}>{v.subject}</span>
            <span style={{ color: v.weekOverWeekChange >= 0 ? "#27ae60" : "#e74c3c", fontWeight: 600 }}>
              {v.weekOverWeekChange >= 0 ? "+" : ""}{(v.weekOverWeekChange * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Risk Landscape ────────────────────────────────────────────── */

const riskColor: Record<string, string> = {
  critical: "#c0392b", high: "#e74c3c", elevated: "#e67e22", moderate: "#f39c12", low: "#27ae60",
};

function RiskLandscape({ report }: { report: RiskReport }) {
  const buckets: Record<string, number> = {};
  for (const a of report.assessments) {
    buckets[a.riskLevel] = (buckets[a.riskLevel] || 0) + 1;
  }
  const levels = ["critical", "high", "elevated", "moderate", "low"];
  const max = Math.max(...Object.values(buckets), 1);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Risk Landscape</h3>
      <div style={{ display: "grid", gap: 6 }}>
        {levels.map((lvl) => {
          const count = buckets[lvl] || 0;
          const pct = (count / max) * 100;
          return (
            <div key={lvl}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
                <span style={{ textTransform: "capitalize", color: "#555" }}>{lvl}</span>
                <span style={{ color: "#888" }}>{count}</span>
              </div>
              <div style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: riskColor[lvl], borderRadius: 3 }} />
              </div>
            </div>
          );
        })}
      </div>
      {report.criticalRisks.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 12, color: "#c0392b" }}>
          ⚠ {report.criticalRisks.length} critical risk{report.criticalRisks.length > 1 ? "s" : ""}: {report.criticalRisks.slice(0, 3).map((r) => r.billId).join(", ")}
        </div>
      )}
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>Regime: {report.regime}</div>
    </div>
  );
}

/* ─── Anomaly Overview ──────────────────────────────────────────── */

function AnomalyOverview({ report }: { report: AnomalyReport }) {
  const sevCounts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const a of report.anomalies) {
    sevCounts[a.severity] = (sevCounts[a.severity] || 0) + 1;
  }
  const sevColors: Record<string, string> = { critical: "#c0392b", high: "#e74c3c", medium: "#e67e22", low: "#f39c12" };

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Anomaly Detection</h3>
      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        {(["critical", "high", "medium", "low"] as const).map((s) => (
          <div key={s} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: sevColors[s] }}>{sevCounts[s]}</div>
            <div style={{ fontSize: 10, color: "#888", textTransform: "capitalize" }}>{s}</div>
          </div>
        ))}
      </div>
      {report.anomalies.length > 0 && (
        <div style={{ display: "grid", gap: 4 }}>
          {report.anomalies.slice(0, 4).map((a, i) => (
            <div key={i} style={{ fontSize: 12, padding: "4px 8px", background: "#fafafa", borderRadius: 4, display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#555" }}>{a.subject}</span>
              <span style={{ color: sevColors[a.severity], fontWeight: 600, fontSize: 11, textTransform: "capitalize" }}>{a.severity}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>Baseline: {report.baselineWindow}</div>
    </div>
  );
}

/* ─── Forecast Accuracy ─────────────────────────────────────────── */

function ForecastAccuracy({ report }: { report: ForecastReport }) {
  const g = report.grade;
  const trendIcon = g.trendDirection === "improving" ? "📈" : g.trendDirection === "degrading" ? "📉" : "➡";

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>Forecast Accuracy</h3>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: g.accuracy.overall >= 0.7 ? "#27ae60" : g.accuracy.overall >= 0.5 ? "#e67e22" : "#e74c3c" }}>
            {(g.accuracy.overall * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: 11, color: "#888" }}>Overall accuracy</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#3498db" }}>{g.verifiablePredictions}</div>
          <div style={{ fontSize: 11, color: "#888" }}>Verifiable predictions</div>
        </div>
        <div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{trendIcon}</div>
          <div style={{ fontSize: 11, color: "#888", textTransform: "capitalize" }}>{g.trendDirection.replace(/_/g, " ")}</div>
        </div>
      </div>

      {g.accuracy.calibration.length > 0 && (
        <>
          <h4 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", color: "#555" }}>Calibration Buckets</h4>
          <div style={{ display: "grid", gap: 6 }}>
            {g.accuracy.calibration.map((b) => (
              <div key={b.range} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ minWidth: 60, color: "#555" }}>{b.range}</span>
                <div style={{ flex: 1, height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(b.actualRate * 100, 100)}%`, background: b.calibrationError < 0.15 ? "#27ae60" : "#e67e22", borderRadius: 3 }} />
                </div>
                <span style={{ minWidth: 40, textAlign: "right", color: "#888" }}>{(b.actualRate * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      {g.blindSpots.length > 0 && (
        <div style={{ marginTop: 12, padding: "8px 10px", background: "#fdf2e9", borderRadius: 6, fontSize: 12 }}>
          <strong style={{ color: "#e67e22" }}>Blind Spots:</strong>{" "}
          {g.blindSpots.map((b) => b.description).join("; ")}
        </div>
      )}
    </div>
  );
}
