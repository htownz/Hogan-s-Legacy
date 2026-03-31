import { useState } from "react";
import { Link, useRoute } from "wouter";
import { api, type Alert, type AlertDetail } from "../api";
import { useAsync } from "../hooks";

export function AlertDetailPage() {
  const [, params] = useRoute("/alerts/:id");
  const id = Number(params?.id);
  const [reviewing, setReviewing] = useState(false);
  const [note, setNote] = useState("");
  const [creatingIssueRoom, setCreatingIssueRoom] = useState(false);

  const { data, loading, error, refetch } = useAsync(() => api.getAlert(id), [id]);

  if (loading) return <p>Loading alert...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;
  if (!data) return <p>Alert not found</p>;

  const { alert: a, sourceDocument: srcDoc, watchlist: wl, issueRoom: ir } = data;

  async function handleReview(status: string) {
    try {
      await api.patchAlert(a.id, { status, reviewerNote: note || undefined });
      setReviewing(false);
      setNote("");
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Review failed: " + message);
    }
  }

  async function handleCreateIssueRoom() {
    try {
      setCreatingIssueRoom(true);
      const result = await api.createIssueRoomFromAlert(a.id, {
        title: a.title,
        summary: a.whyItMatters ?? a.summary ?? undefined,
      });
      window.alert(`Issue room created: ${result.issueRoom.title}`);
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Failed: " + message);
    } finally {
      setCreatingIssueRoom(false);
    }
  }

  const scoreColor = a.relevanceScore >= 70 ? "#e74c3c" : a.relevanceScore >= 40 ? "#e67e22" : "#95a5a6";

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
        <Link href="/alerts"><span style={{ color: "#3498db", cursor: "pointer" }}>Alert Queue</span></Link>
        <span> / Alert #{a.id}</span>
      </div>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 22, margin: 0 }}>{a.title}</h1>
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center" }}>
            <StatusBadge status={a.status} />
            {wl && <span style={{ fontSize: 12, color: "#888" }}>Watchlist: {wl.name}</span>}
            <span style={{ fontSize: 12, color: "#888" }}>{new Date(a.createdAt).toLocaleString()}</span>
          </div>
        </div>
        <div style={{ textAlign: "center", minWidth: 80 }}>
          <div style={{ fontSize: 36, fontWeight: 700, color: scoreColor }}>{a.relevanceScore}</div>
          <div style={{ fontSize: 11, color: "#888" }}>Relevance</div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {a.status === "pending_review" && !reviewing && (
          <button onClick={() => setReviewing(true)} style={btnStyle("#3498db")}>Review</button>
        )}
        {!a.issueRoomId && (
          <button onClick={handleCreateIssueRoom} disabled={creatingIssueRoom} style={btnStyle("#16213e")}>
            {creatingIssueRoom ? "Creating..." : "Create Issue Room"}
          </button>
        )}
        {ir && (
          <Link href={`/issue-rooms/${ir.id}`}>
            <button style={btnStyle("#27ae60")}>View Issue Room</button>
          </Link>
        )}
      </div>

      {/* Review Panel */}
      {reviewing && (
        <div style={{ background: "#f8f9fa", border: "1px solid #dee2e6", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Review Alert</div>
          <input type="text" placeholder="Reviewer note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
            style={{ width: "100%", padding: "8px 12px", fontSize: 13, border: "1px solid #ddd", borderRadius: 4, marginBottom: 10 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => handleReview("ready")} style={btnStyle("#27ae60")}>Approve</button>
            <button onClick={() => handleReview("suppressed")} style={btnStyle("#e74c3c")}>Suppress</button>
            <button onClick={() => { setReviewing(false); setNote(""); }} style={btnStyle("#888")}>Cancel</button>
          </div>
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Left: Context */}
        <div>
          {/* Why It Matters */}
          {a.whyItMatters && (
            <Card title="Why It Matters">
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#333" }}>{a.whyItMatters}</p>
            </Card>
          )}

          {/* Summary */}
          {a.summary && (
            <Card title="Summary">
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "#555" }}>{a.summary}</p>
            </Card>
          )}

          {/* Reviewer Note */}
          {a.reviewerNote && (
            <Card title="Reviewer Note">
              <p style={{ fontSize: 13, color: "#555" }}>{a.reviewerNote}</p>
              {a.reviewedAt && <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Reviewed: {new Date(a.reviewedAt).toLocaleString()}</p>}
            </Card>
          )}
        </div>

        {/* Right: Metadata */}
        <div>
          {/* Scorecard */}
          {a.reasonsJson?.length > 0 && (
            <Card title="Scoring Breakdown">
              <div style={{ display: "grid", gap: 8 }}>
                {a.reasonsJson.filter(ev => ev.evaluator !== "_pipeline").map((ev, i) => (
                  <div key={i}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}>
                      <span style={{ fontWeight: 500 }}>{ev.evaluator.replace(/_/g, " ")}</span>
                      <span style={{ fontWeight: 600 }}>{ev.evaluatorScore}/{ev.maxScore}</span>
                    </div>
                    <div style={{ background: "#e8e8e8", borderRadius: 4, height: 8 }}>
                      <div style={{
                        background: ev.evaluatorScore / ev.maxScore >= 0.6 ? "#27ae60" : ev.evaluatorScore / ev.maxScore >= 0.3 ? "#e67e22" : "#ccc",
                        borderRadius: 4, height: 8,
                        width: `${(ev.evaluatorScore / ev.maxScore) * 100}%`,
                      }} />
                    </div>
                    {ev.rationale && <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{ev.rationale}</div>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Source Document */}
          {srcDoc && (
            <Card title="Source Document">
              <div style={{ fontSize: 13 }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{srcDoc.title}</div>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                  {srcDoc.sourceType.replace(/_/g, " ")} · {srcDoc.publisher}
                  {srcDoc.publishedAt && ` · ${new Date(srcDoc.publishedAt).toLocaleDateString()}`}
                </div>
                {srcDoc.summary && <p style={{ fontSize: 12, color: "#555", marginTop: 4, lineHeight: 1.5 }}>{srcDoc.summary.slice(0, 500)}</p>}
                {srcDoc.sourceUrl && (
                  <a href={srcDoc.sourceUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: "#3498db", display: "inline-block", marginTop: 6 }}>
                    View Original →
                  </a>
                )}
              </div>
            </Card>
          )}

          {/* Watchlist */}
          {wl && (
            <Card title="Watchlist">
              <Link href={`/watchlists/${wl.id}`}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#3498db", cursor: "pointer" }}>{wl.name}</span>
              </Link>
              {wl.topic && <p style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{wl.topic}</p>}
              {wl.description && <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{wl.description}</p>}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "16px 20px", marginBottom: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <h3 style={{ fontSize: 13, fontWeight: 600, color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10, margin: "0 0 10px 0" }}>
        {title}
      </h3>
      {children}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, { bg: string; fg: string }> = {
    pending_review: { bg: "#e67e2222", fg: "#e67e22" },
    ready: { bg: "#27ae6022", fg: "#27ae60" },
    sent: { bg: "#3498db22", fg: "#3498db" },
    suppressed: { bg: "#95a5a622", fg: "#95a5a6" },
  };
  const c = colors[status] ?? { bg: "#e8e8e8", fg: "#666" };
  return (
    <span style={{ padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 600, background: c.bg, color: c.fg }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return { padding: "8px 16px", fontSize: 13, background: bg, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 500 };
}
