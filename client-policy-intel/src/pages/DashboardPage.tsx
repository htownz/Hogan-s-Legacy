import { api } from "../api";
import { useAsync } from "../hooks";

export function DashboardPage() {
  const { data: stats, loading, error } = useAsync(() => api.getDashboardStats());

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
