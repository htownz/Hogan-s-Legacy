import { Link } from "wouter";
import { api } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

export function MattersPage() {
  const { data: matters, loading, error, refetch } = useAsync(() => api.getMatters(DEFAULT_WORKSPACE_ID));

  if (loading) return <p>Loading matters...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;

  const statusColors: Record<string, string> = {
    active: "#27ae60",
    watching: "#3498db",
    closed: "#95a5a6",
    archived: "#7f8c8d",
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 24 }}>Matters</h1>
      <div style={{ display: "grid", gap: 12 }}>
        {(matters ?? []).map((m) => (
          <Link key={m.id} href={`/matters/${m.id}`}>
            <div style={{
              background: "#fff",
              borderRadius: 8,
              padding: "16px 20px",
              cursor: "pointer",
              borderLeft: `4px solid ${statusColors[m.status] ?? "#ccc"}`,
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{m.name}</div>
                  <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                    {m.clientName && <span>{m.clientName} · </span>}
                    {m.practiceArea && <span>{m.practiceArea} · </span>}
                    {m.jurisdictionScope}
                  </div>
                </div>
                <span style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 12,
                  background: `${statusColors[m.status] ?? "#ccc"}22`,
                  color: statusColors[m.status] ?? "#ccc",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}>
                  {m.status}
                </span>
              </div>
              {m.description && (
                <p style={{ fontSize: 13, color: "#555", marginTop: 8 }}>{m.description.slice(0, 200)}</p>
              )}
            </div>
          </Link>
        ))}
        {(matters ?? []).length === 0 && (
          <p style={{ color: "#888" }}>No matters yet for the current workspace.</p>
        )}
      </div>
    </div>
  );
}
