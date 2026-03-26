import { api } from "../api";
import { useAsync } from "../hooks";

export function DashboardPage() {
  const { data: alerts, loading: aLoading } = useAsync(() => api.getAlerts());
  const { data: matters, loading: mLoading } = useAsync(() => api.getMatters());
  const { data: sources, loading: sLoading } = useAsync(() => api.getSourceDocuments());

  if (aLoading || mLoading || sLoading) return <p>Loading dashboard...</p>;

  const pendingAlerts = (alerts ?? []).filter((a) => a.status === "pending_review");
  const highPriority = (alerts ?? []).filter((a) => a.relevanceScore >= 70);

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Policy Intelligence Dashboard</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Alerts" value={(alerts ?? []).length} />
        <StatCard label="Pending Review" value={pendingAlerts.length} color="#e67e22" />
        <StatCard label="High Priority" value={highPriority.length} color="#e74c3c" />
        <StatCard label="Active Matters" value={(matters ?? []).filter((m) => m.status === "active").length} color="#27ae60" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3 style={{ marginBottom: 12 }}>Recent Alerts</h3>
          {(alerts ?? []).slice(0, 5).map((a) => (
            <div key={a.id} style={{ padding: "8px 12px", background: "#fff", borderRadius: 6, marginBottom: 8, borderLeft: `3px solid ${a.relevanceScore >= 70 ? "#e74c3c" : a.relevanceScore >= 40 ? "#e67e22" : "#95a5a6"}` }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{a.title.slice(0, 80)}</div>
              <div style={{ fontSize: 11, color: "#888" }}>Score: {a.relevanceScore} · {a.status}</div>
            </div>
          ))}
        </div>

        <div>
          <h3 style={{ marginBottom: 12 }}>Source Documents</h3>
          <p style={{ fontSize: 13, color: "#666" }}>{(sources ?? []).length} documents ingested</p>
          {(sources ?? []).slice(0, 5).map((s) => (
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
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? "#2c3e50" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{label}</div>
    </div>
  );
}
