import { api } from "../api";
import { useAsync } from "../hooks";

export function DigestPage() {
  // Default to workspace 2 (Grace & McEwan)
  const { data: digest, loading, error } = useAsync(() => api.getDigest(2));

  if (loading) return <p>Loading digest...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!digest) return <p>No digest available</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Weekly Digest</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        {new Date(digest.period.start).toLocaleDateString()} — {new Date(digest.period.end).toLocaleDateString()}
        {" "}({digest.period.week})
      </p>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
        <MiniStat label="Total Alerts" value={digest.summary.totalAlerts} />
        <MiniStat label="High Priority" value={digest.summary.highPriority} color="#e74c3c" />
        <MiniStat label="Pending" value={digest.summary.pendingReview} color="#e67e22" />
        <MiniStat label="Reviewed" value={digest.summary.reviewed} color="#27ae60" />
        <MiniStat label="Activities" value={digest.summary.activitiesLogged} color="#3498db" />
      </div>

      {/* Sections by watchlist */}
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>By Watchlist</h2>
      {digest.sections.map((section, i) => (
        <div key={i} style={{
          background: "#fff",
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>{section.watchlist}</h3>
            <span style={{ fontSize: 12, color: "#888" }}>
              {section.alertCount} alert(s) · {section.highPriority} high-priority
            </span>
          </div>
          {section.alerts.map((a) => (
            <div key={a.id} style={{
              padding: "6px 10px",
              marginBottom: 4,
              borderLeft: `2px solid ${a.score >= 70 ? "#e74c3c" : a.score >= 40 ? "#e67e22" : "#ddd"}`,
              fontSize: 13,
            }}>
              <span style={{ fontWeight: 500 }}>{a.title.slice(0, 80)}</span>
              <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>({a.score}) {a.status}</span>
            </div>
          ))}
        </div>
      ))}

      {digest.sections.length === 0 && (
        <p style={{ color: "#888" }}>No alerts in this period.</p>
      )}

      {/* Recent Activities */}
      {digest.recentActivities.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 12 }}>Recent Activities</h2>
          <div style={{ display: "grid", gap: 6 }}>
            {digest.recentActivities.map((a) => (
              <div key={a.id} style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{a.summary}</span>
                <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>
                  {a.type.replace(/_/g, " ")} · {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 6, padding: "12px 14px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? "#2c3e50" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{label}</div>
    </div>
  );
}
