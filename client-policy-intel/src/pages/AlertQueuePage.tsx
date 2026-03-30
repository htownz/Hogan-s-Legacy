import { useState, useCallback } from "react";
import { Link } from "wouter";
import { api, type Alert } from "../api";
import { useAsync } from "../hooks";

export function AlertQueuePage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "pending_review" | "ready" | "suppressed">("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [reviewing, setReviewing] = useState<number | null>(null);
  const [creatingIssueRoom, setCreatingIssueRoom] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const LIMIT = 50;

  const fetchAlerts = useCallback(
    () => api.getAlerts({ page, limit: LIMIT, status: filter, search: search || undefined }),
    [page, filter, search],
  );
  const { data: result, loading, error, refetch } = useAsync(fetchAlerts, [page, filter, search]);

  const alerts = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  function changeFilter(f: typeof filter) {
    setFilter(f);
    setPage(1);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

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

  async function handleCreateIssueRoom(alert: Alert) {
    try {
      setCreatingIssueRoom(alert.id);
      const result = await api.createIssueRoomFromAlert(alert.id, {
        title: alert.title,
        summary: alert.whyItMatters ?? alert.summary ?? undefined,
      });
      window.alert(`Issue room created: ${result.issueRoom.title}`);
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Create issue room failed: " + message);
    } finally {
      setCreatingIssueRoom(null);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Alert Review Queue</h1>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          type="text"
          placeholder="Search alerts by title..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{ flex: 1, padding: "8px 12px", fontSize: 13, border: "1px solid #ddd", borderRadius: 6 }}
        />
        <button type="submit" style={{ padding: "8px 16px", fontSize: 13, background: "#3498db", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}>
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} style={{ padding: "8px 12px", fontSize: 13, background: "#e0e0e0", border: "none", borderRadius: 6, cursor: "pointer" }}>
            Clear
          </button>
        )}
      </form>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, alignItems: "center" }}>
        {(["all", "pending_review", "ready", "suppressed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
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
            {f.replace(/_/g, " ")}
          </button>
        ))}
        <span style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>
          {total.toLocaleString()} alert{total !== 1 ? "s" : ""}
        </span>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {alerts.map((a) => (
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
              {a.issueRoomId && (
                <span>
                  {" "}·{" "}
                  <Link href={`/issue-rooms/${a.issueRoomId}`}>
                    <span style={{ color: "#3498db", cursor: "pointer" }}>Issue room #{a.issueRoomId}</span>
                  </Link>
                </span>
              )}
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
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      onClick={() => setReviewing(a.id)}
                      style={{ padding: "6px 14px", fontSize: 12, background: "#3498db", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
                    >
                      Review
                    </button>
                    {!a.issueRoomId && (
                      <button
                        onClick={() => handleCreateIssueRoom(a)}
                        disabled={creatingIssueRoom === a.id}
                        style={{ padding: "6px 14px", fontSize: 12, background: "#16213e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", opacity: creatingIssueRoom === a.id ? 0.7 : 1 }}
                      >
                        {creatingIssueRoom === a.id ? "Creating..." : "Create Issue Room"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Promote to issue room for approved alerts */}
            {a.status === "ready" && !a.issueRoomId && (
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => handleCreateIssueRoom(a)}
                  disabled={creatingIssueRoom === a.id}
                  style={{ padding: "6px 14px", fontSize: 12, background: "#16213e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", opacity: creatingIssueRoom === a.id ? 0.7 : 1 }}
                >
                  {creatingIssueRoom === a.id ? "Creating..." : "Promote to Issue Room"}
                </button>
              </div>
            )}
          </div>
        ))}

        {alerts.length === 0 && !loading && (
          <p style={{ color: "#888" }}>No alerts match the current filter.</p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 24 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: "6px 14px", fontSize: 12, border: "1px solid #ddd", borderRadius: 4, cursor: page <= 1 ? "not-allowed" : "pointer", background: "#fff", opacity: page <= 1 ? 0.5 : 1 }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: 13, color: "#555" }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            style={{ padding: "6px 14px", fontSize: 12, border: "1px solid #ddd", borderRadius: 4, cursor: page >= totalPages ? "not-allowed" : "pointer", background: "#fff", opacity: page >= totalPages ? 0.5 : 1 }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
