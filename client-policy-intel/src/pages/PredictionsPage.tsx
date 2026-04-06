import { useState, useCallback } from "react";
import { api, type PredictionDashboard, type PredictionResult } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

// ── Probability Gauge ────────────────────────────────────────────────────────

function ProbabilityGauge({ probability, size = 80 }: { probability: number; size?: number }) {
  const pct = Math.round(probability * 100);
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (probability * circumference);
  const color = pct >= 75 ? "#27ae60" : pct >= 55 ? "#f39c12" : pct >= 40 ? "#e67e22" : pct >= 10 ? "#e74c3c" : "#95a5a6";

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-block" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#ecf0f1" strokeWidth={5} />
        <circle
          cx={size / 2} cy={size / 2} r={radius} fill="none"
          stroke={color} strokeWidth={5}
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.25, fontWeight: 700, color,
      }}>
        {pct}%
      </div>
    </div>
  );
}

// ── Prediction Card ──────────────────────────────────────────────────────────

function PredictionCard({ p }: { p: PredictionResult }) {
  const [expanded, setExpanded] = useState(false);
  const predLabel: Record<string, string> = {
    likely_pass: "Likely Pass",
    lean_pass: "Lean Pass",
    toss_up: "Toss-Up",
    lean_fail: "Lean Fail",
    likely_fail: "Likely Fail",
    dead: "Dead",
  };
  const predColor: Record<string, string> = {
    likely_pass: "#27ae60",
    lean_pass: "#2ecc71",
    toss_up: "#f39c12",
    lean_fail: "#e67e22",
    likely_fail: "#e74c3c",
    dead: "#95a5a6",
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 8, padding: 16,
      border: `2px solid ${predColor[p.prediction] ?? "#ddd"}`,
      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <ProbabilityGauge probability={p.probability} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: "#1a365d" }}>{p.billId}</div>
          {p.billTitle && <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{p.billTitle}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
            <span style={{
              background: predColor[p.prediction] ?? "#ddd",
              color: "#fff", padding: "2px 10px", borderRadius: 12, fontSize: 12, fontWeight: 600,
            }}>
              {predLabel[p.prediction] ?? p.prediction}
            </span>
            <span style={{
              background: "#ecf0f1", padding: "2px 10px", borderRadius: 12, fontSize: 12,
            }}>
              Stage: {p.currentStage ?? "Unknown"}
            </span>
            {p.trend && (
              <span style={{
                background: p.trend === "improving" ? "#d5f5e3" : p.trend === "declining" ? "#fadbd8" : "#fdebd0",
                padding: "2px 10px", borderRadius: 12, fontSize: 12,
              }}>
                {p.trend === "improving" ? "📈" : p.trend === "declining" ? "📉" : "➡️"} {p.trend}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            Confidence: {Math.round(p.confidence * 100)}% · Sponsor: {Math.round(p.sponsorStrength * 100)}%
            {p.nextMilestone && ` · Next: ${p.nextMilestone}`}
          </div>
        </div>
      </div>

      {/* Risk Factors */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          marginTop: 10, background: "none", border: "1px solid #ddd",
          borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 12, color: "#555",
        }}
      >
        {expanded ? "Hide" : "Show"} Risk Factors ({p.riskFactors.length})
      </button>

      {expanded && (
        <div style={{ marginTop: 8 }}>
          {p.riskFactors.map((rf, i) => (
            <div key={i} style={{
              display: "flex", gap: 8, padding: "4px 0", fontSize: 13,
              borderBottom: i < p.riskFactors.length - 1 ? "1px solid #f0f0f0" : "none",
            }}>
              <span style={{
                color: rf.impact === "positive" ? "#27ae60" : rf.impact === "negative" ? "#e74c3c" : "#f39c12",
                fontWeight: 600, minWidth: 18,
              }}>
                {rf.impact === "positive" ? "+" : rf.impact === "negative" ? "−" : "•"}
              </span>
              <span style={{ fontWeight: 600 }}>{rf.factor}:</span>
              <span style={{ color: "#555" }}>{rf.detail}</span>
            </div>
          ))}
          {p.supportSignals.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: "#27ae60" }}>Support Signals</div>
              {p.supportSignals.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: "#555", paddingLeft: 8 }}>
                  ✅ {s.signal} ({s.source})
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Breakdown Bar Chart ──────────────────────────────────────────────────────

function BreakdownChart({ breakdown }: { breakdown: PredictionDashboard["breakdown"] }) {
  const total = Object.values(breakdown).reduce((a, b) => a + b, 0);
  if (total === 0) return <div style={{ color: "#888", fontSize: 13 }}>No predictions yet</div>;

  const items = [
    { key: "likely_pass", label: "Likely Pass", color: "#27ae60" },
    { key: "lean_pass", label: "Lean Pass", color: "#2ecc71" },
    { key: "toss_up", label: "Toss-Up", color: "#f39c12" },
    { key: "lean_fail", label: "Lean Fail", color: "#e67e22" },
    { key: "likely_fail", label: "Likely Fail", color: "#e74c3c" },
    { key: "dead", label: "Dead", color: "#95a5a6" },
  ] as const;

  return (
    <div>
      <div style={{
        display: "flex", height: 28, borderRadius: 6, overflow: "hidden",
        background: "#ecf0f1", marginBottom: 8,
      }}>
        {items.map(({ key, color }) => {
          const count = breakdown[key];
          if (count === 0) return null;
          return (
            <div
              key={key}
              style={{
                width: `${(count / total) * 100}%`,
                background: color, minWidth: 4,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 11, fontWeight: 700,
              }}
              title={`${key}: ${count}`}
            >
              {count}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {items.map(({ key, label, color }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
            <span style={{ width: 10, height: 10, background: color, borderRadius: 2, display: "inline-block" }} />
            {label}: {breakdown[key]}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function PredictionsPage() {
  const [workspaceId] = useState(DEFAULT_WORKSPACE_ID);
  const [predictBillId, setPredictBillId] = useState("");
  const [predicting, setPredicting] = useState(false);

  const { data: dashboard, loading, error, refetch } = useAsync(
    () => api.getPredictionDashboard(workspaceId),
    [workspaceId],
  );

  const handlePredict = useCallback(async () => {
    if (!predictBillId.trim()) return;
    setPredicting(true);
    try {
      await api.predictBillPassage(workspaceId, predictBillId.trim());
      setPredictBillId("");
      refetch();
    } catch {
      // handled by error display
    } finally {
      setPredicting(false);
    }
  }, [workspaceId, predictBillId, refetch]);

  const handleAutoDiscover = useCallback(async () => {
    setPredicting(true);
    try {
      await api.autoDiscoverAndPredict(workspaceId);
      refetch();
    } finally {
      setPredicting(false);
    }
  }, [workspaceId, refetch]);

  if (loading) return <div style={{ padding: 24 }}>Loading predictions...</div>;
  if (error) return <div style={{ padding: 24, color: "#e74c3c" }}>Error: {error}</div>;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1a365d", fontSize: 28 }}>📊 Bill Passage Predictions</h1>
          <p style={{ margin: "4px 0 0", color: "#555", fontSize: 14 }}>
            Live probability estimates for tracked legislation
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={predictBillId}
            onChange={(e) => setPredictBillId(e.target.value)}
            placeholder="e.g. HB 1234"
            style={{
              padding: "8px 12px", border: "1px solid #ccc", borderRadius: 6,
              fontSize: 14, width: 150,
            }}
            onKeyDown={(e) => e.key === "Enter" && handlePredict()}
          />
          <button
            onClick={handlePredict}
            disabled={predicting || !predictBillId.trim()}
            style={{
              padding: "8px 16px", background: "#1a365d", color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14,
              opacity: predicting ? 0.6 : 1,
            }}
          >
            Predict
          </button>
          <button
            onClick={handleAutoDiscover}
            disabled={predicting}
            style={{
              padding: "8px 16px", background: "#2ecc71", color: "#fff",
              border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14,
              opacity: predicting ? 0.6 : 1,
            }}
          >
            Auto-Discover
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {dashboard && (
        <>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200, 1fr))",
            gap: 16, marginBottom: 24,
          }}>
            <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#1a365d" }}>{dashboard.totalTracked}</div>
              <div style={{ fontSize: 13, color: "#888" }}>Bills Tracked</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#27ae60" }}>{dashboard.breakdown.likely_pass + dashboard.breakdown.lean_pass}</div>
              <div style={{ fontSize: 13, color: "#888" }}>Likely to Pass</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#f39c12" }}>{dashboard.breakdown.toss_up}</div>
              <div style={{ fontSize: 13, color: "#888" }}>Toss-Up</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#e74c3c" }}>{dashboard.breakdown.likely_fail + dashboard.breakdown.lean_fail + dashboard.breakdown.dead}</div>
              <div style={{ fontSize: 13, color: "#888" }}>Unlikely / Dead</div>
            </div>
          </div>

          {/* Breakdown Chart */}
          <div style={{ background: "#fff", borderRadius: 8, padding: 16, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
            <h3 style={{ margin: "0 0 12px", color: "#1a365d" }}>Prediction Breakdown</h3>
            <BreakdownChart breakdown={dashboard.breakdown} />
          </div>

          {/* Recent Changes */}
          {dashboard.recentChanges.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 8, padding: 16, marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
              <h3 style={{ margin: "0 0 12px", color: "#1a365d" }}>📈 Recent Changes</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #ecf0f1" }}>
                    <th style={{ textAlign: "left", padding: 6 }}>Bill</th>
                    <th style={{ textAlign: "right", padding: 6 }}>Previous</th>
                    <th style={{ textAlign: "right", padding: 6 }}>Current</th>
                    <th style={{ textAlign: "right", padding: 6 }}>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentChanges.map((c) => (
                    <tr key={c.billId} style={{ borderBottom: "1px solid #f5f5f5" }}>
                      <td style={{ padding: 6, fontWeight: 600 }}>{c.billId}</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{Math.round(c.previousProbability * 100)}%</td>
                      <td style={{ padding: 6, textAlign: "right" }}>{Math.round(c.currentProbability * 100)}%</td>
                      <td style={{
                        padding: 6, textAlign: "right", fontWeight: 600,
                        color: c.direction === "up" ? "#27ae60" : "#e74c3c",
                      }}>
                        {c.direction === "up" ? "▲" : "▼"} {Math.round(Math.abs(c.delta) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Top Risks */}
          {dashboard.topRisks.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: "#1a365d", marginBottom: 12 }}>🔴 Highest Passage Probability</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {dashboard.topRisks.map((p) => (
                  <PredictionCard key={p.billId} p={p} />
                ))}
              </div>
            </div>
          )}

          {/* Top Opportunities */}
          {dashboard.topOpportunities.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ color: "#1a365d", marginBottom: 12 }}>🟢 Lowest Passage Probability</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {dashboard.topOpportunities.map((p) => (
                  <PredictionCard key={p.billId} p={p} />
                ))}
              </div>
            </div>
          )}

          <div style={{ color: "#888", fontSize: 12, marginTop: 16 }}>
            Last analyzed: {new Date(dashboard.analyzedAt).toLocaleString()}
          </div>
        </>
      )}
    </div>
  );
}
