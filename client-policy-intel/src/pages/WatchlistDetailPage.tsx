import { useState } from "react";
import { Link, useRoute } from "wouter";
import { api, type Alert } from "../api";
import { useAsync } from "../hooks";

export function WatchlistDetailPage() {
  const [, params] = useRoute("/watchlists/:id");
  const id = Number(params?.id);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "pending_review" | "ready" | "suppressed">("all");
  const LIMIT = 50;

  const { data: watchlist, loading, error, refetch } = useAsync(() => api.getWatchlist(id), [id]);
  const { data: alertResult } = useAsync(
    () => api.getWatchlistAlerts(id, { page, limit: LIMIT, status: filter }),
    [id, page, filter],
  );

  if (loading) return <p>Loading watchlist...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;
  if (!watchlist) return <p>Watchlist not found</p>;

  const alerts = alertResult?.data ?? [];
  const total = alertResult?.total ?? 0;
  const totalPages = alertResult?.totalPages ?? 1;
  const rules = (watchlist.rulesJson ?? {}) as Record<string, unknown>;

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
        <Link href="/watchlists"><span style={{ color: "#3498db", cursor: "pointer" }}>Watchlists</span></Link>
        <span> / {watchlist.name}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>{watchlist.name}</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "center" }}>
            <span style={{
              padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600,
              background: watchlist.isActive ? "#e8f5e9" : "#fafafa",
              color: watchlist.isActive ? "#27ae60" : "#bdbdbd",
            }}>
              {watchlist.isActive ? "Active" : "Inactive"}
            </span>
            {watchlist.topic && (
              <span style={{ padding: "1px 8px", background: "#e3f2fd", color: "#1565c0", borderRadius: 10, fontSize: 11, fontWeight: 500 }}>
                {watchlist.topic}
              </span>
            )}
          </div>
          {watchlist.description && <p style={{ fontSize: 13, color: "#666", marginTop: 8 }}>{watchlist.description}</p>}
        </div>
        <div style={{ textAlign: "right", minWidth: 80 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#2c3e50" }}>{total.toLocaleString()}</div>
          <div style={{ fontSize: 11, color: "#888" }}>Total Alerts</div>
        </div>
      </div>

      {/* Rules summary */}
      {Object.keys(rules).length > 0 && (
        <div style={{ background: "#fff", borderRadius: 8, padding: "14px 18px", marginBottom: 20, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 8px 0" }}>
            Matching Rules
          </h3>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {(rules.billIds as string[] | undefined)?.length && (
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Bill IDs: </span>
                {((rules.billIds as string[]) ?? []).map((b, i) => (
                  <span key={i} style={{ display: "inline-block", marginRight: 4, padding: "1px 6px", background: "#e3f2fd", color: "#1565c0", borderRadius: 6, fontSize: 11 }}>{b}</span>
                ))}
              </div>
            )}
            {(rules.keywords as string[] | undefined)?.length && (
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Keywords: </span>
                {((rules.keywords as string[]) ?? []).map((k, i) => (
                  <span key={i} style={{ display: "inline-block", marginRight: 4, padding: "1px 6px", background: "#fce4ec", color: "#c62828", borderRadius: 6, fontSize: 11 }}>{k}</span>
                ))}
              </div>
            )}
            {(rules.committees as string[] | undefined)?.length && (
              <div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#555" }}>Committees: </span>
                {((rules.committees as string[]) ?? []).map((c, i) => (
                  <span key={i} style={{ display: "inline-block", marginRight: 4, padding: "1px 6px", background: "#f3e5f5", color: "#6a1b9a", borderRadius: 6, fontSize: 11 }}>{c}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, alignItems: "center" }}>
        {(["all", "pending_review", "ready", "suppressed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1); }}
            style={{
              padding: "5px 12px", borderRadius: 14, border: "none", cursor: "pointer", fontSize: 11, fontWeight: filter === f ? 600 : 400,
              background: filter === f ? "#3498db" : "#e0e0e0", color: filter === f ? "#fff" : "#555",
            }}
          >
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Alert list */}
      <div style={{ display: "grid", gap: 8 }}>
        {alerts.map((a) => (
          <div key={a.id} style={{
            background: "#fff", borderRadius: 6, padding: "12px 16px",
            borderLeft: `3px solid ${a.relevanceScore >= 70 ? "#e74c3c" : a.relevanceScore >= 40 ? "#e67e22" : "#95a5a6"}`,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Link href={`/alerts/${a.id}`}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#2c3e50", cursor: "pointer" }}>{a.title}</span>
              </Link>
              <span style={{ fontSize: 13, fontWeight: 700, color: a.relevanceScore >= 70 ? "#e74c3c" : "#888", minWidth: 30, textAlign: "right" }}>
                {a.relevanceScore}
              </span>
            </div>
            {a.whyItMatters && <p style={{ fontSize: 12, color: "#555", marginTop: 4, marginBottom: 0 }}>{a.whyItMatters.slice(0, 200)}</p>}
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
              {a.status.replace(/_/g, " ")} · {new Date(a.createdAt).toLocaleDateString()}
            </div>
          </div>
        ))}
        {alerts.length === 0 && <p style={{ color: "#888", fontSize: 13 }}>No alerts for this watchlist.</p>}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 20 }}>
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
            style={{ padding: "5px 12px", fontSize: 12, border: "1px solid #ddd", borderRadius: 4, background: "#fff", cursor: page <= 1 ? "not-allowed" : "pointer", opacity: page <= 1 ? 0.5 : 1 }}>
            ← Prev
          </button>
          <span style={{ fontSize: 12, color: "#555" }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            style={{ padding: "5px 12px", fontSize: 12, border: "1px solid #ddd", borderRadius: 4, background: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer", opacity: page >= totalPages ? 0.5 : 1 }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
