import { useState } from "react";
import { api, type Alert } from "../api";
import { useAsync } from "../hooks";

export function AlertQueuePage() {
  const { data: alerts, loading, error, refetch } = useAsync(() => api.getAlerts());
  const [filter, setFilter] = useState<"all" | "pending_review" | "ready" | "suppressed">("all");
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [note, setNote] = useState("");

  if (loading) return <p>Loading alerts...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const filtered = (alerts ?? []).filter((a) => filter === "all" || a.status === filter);

  async function handleReview(alert: Alert, status: string) {
    try {
      await api.patchAlert(alert.id, { status, reviewerNote: note || undefined });
      setReviewing(null);
      setNote("");
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Review failed: " + message);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Alert Review Queue</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(["all", "pending_review", "ready", "suppressed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              borderRadius: 16,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: filter === f ? 600 : 400,
              background: filter === f ? "#3498db" : "#e0e0e0",
              color: filter === f ? "#fff" : "#555",
            }}
          >
            {f.replace(/_/g, " ")} ({(alerts ?? []).filter((a) => f === "all" || a.status === f).length})
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((a) => (
          <div key={a.id} style={{
            background: "#fff",
            borderRadius: 8,
            padding: "14px 18px",
            borderLeft: `4px solid ${a.relevanceScore >= 70 ? "#e74c3c" : a.relevanceScore >= 40 ? "#e67e22" : "#95a5a6"}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</div>
                {a.whyItMatters && <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{a.whyItMatters.slice(0, 300)}</p>}
              </div>
              <div style={{ textAlign: "right", minWidth: 80 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: a.relevanceScore >= 70 ? "#e74c3c" : "#888" }}>
                  {a.relevanceScore}
                </div>
                <div style={{ fontSize: 10, color: "#aaa" }}>relevance</div>
              </div>
            </div>

            {/* Scorecard pills */}
            {a.reasonsJson?.length > 0 && a.reasonsJson[0]?.evaluator && (
              <div style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {a.reasonsJson.map((ev, i) => (
                  <span key={i} title={ev.rationale} style={{
                    padding: "2px 8px",
                    borderRadius: 10,
                    fontSize: 11,
                    background: ev.evaluatorScore >= 15 ? "#27ae6022" : "#f0f0f0",
                    color: ev.evaluatorScore >= 15 ? "#27ae60" : "#888",
                    cursor: "help",
                  }}>
                    {ev.evaluator.replace(/_/g, " ")}: {ev.evaluatorScore}/{ev.maxScore}
                  </span>
                ))}
              </div>
            )}

            <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>
              {a.status} · {new Date(a.createdAt).toLocaleString()}
              {a.reviewerNote && <span> · Note: {a.reviewerNote}</span>}
            </div>

            {/* Review actions */}
            {a.status === "pending_review" && (
              <div style={{ marginTop: 10 }}>
                {reviewing === a.id ? (
                  <div>
                    <input
                      type="text"
                      placeholder="Reviewer note (optional)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      style={{ padding: "6px 10px", fontSize: 12, width: "100%", marginBottom: 8, border: "1px solid #ddd", borderRadius: 4 }}
                    />
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleReview(a, "ready")} style={{ padding: "6px 14px", fontSize: 12, background: "#27ae60", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                        Approve
                      </button>
                      <button onClick={() => handleReview(a, "suppressed")} style={{ padding: "6px 14px", fontSize: 12, background: "#e74c3c", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
                        Suppress
                      </button>
                      <button onClick={() => { setReviewing(null); setNote(""); }} style={{ padding: "6px 14px", fontSize: 12, background: "#e0e0e0", border: "none", borderRadius: 4, cursor: "pointer" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewing(a.id)}
                    style={{ padding: "6px 14px", fontSize: 12, background: "#3498db", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                  >
                    Review
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ color: "#888" }}>No alerts match the current filter.</p>
        )}
      </div>
    </div>
  );
}
