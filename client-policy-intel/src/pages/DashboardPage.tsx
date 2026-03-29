import { api, type SchedulerStatus, type JobRunRecord } from "../api";
import { useAsync } from "../hooks";
import { useState, useCallback } from "react";

export function DashboardPage() {
  const { data: stats, loading, error } = useAsync(() => api.getDashboardStats());
  const { data: scheduler, loading: schedLoading, refetch: refetchScheduler } = useAsync(() => api.getSchedulerStatus());
  const [triggering, setTriggering] = useState<string | null>(null);

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

  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!stats) return null;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Policy Intelligence Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Alerts" value={stats.totalAlerts} />
        <StatCard label="Pending Review" value={stats.pendingReview} color="#e67e22" />
        <StatCard label="High Priority (70+)" value={stats.highPriority} color="#e74c3c" />
        <StatCard label="Source Documents" value={stats.totalDocuments} color="#3498db" />
        <StatCard label="Active Matters" value={stats.activeMatters} color="#27ae60" />
        <StatCard label="Active Watchlists" value={stats.activeWatchlists} color="#8e44ad" />
      </div>

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

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? "#2c3e50" }}>{value.toLocaleString()}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );
}
