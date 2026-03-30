import { useState } from "react";
import { Link, useRoute } from "wouter";
import { api, type StakeholderDetail } from "../api";
import { useAsync } from "../hooks";

const TYPE_COLORS: Record<string, string> = {
  legislator: "#1565c0",
  lobbyist: "#6a1b9a",
  pac: "#b71c1c",
  organization: "#2e7d32",
  agency_official: "#e65100",
  individual: "#546e7a",
};

export function StakeholderDetailPage() {
  const [, params] = useRoute("/stakeholders/:id");
  const id = Number(params?.id);
  const { data: s, loading, error, refetch } = useAsync(() => api.getStakeholder(id), [id]);
  const [obsText, setObsText] = useState("");
  const [adding, setAdding] = useState(false);

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!s) return <p>Stakeholder not found.</p>;

  const color = TYPE_COLORS[s.type.toLowerCase()] ?? "#546e7a";

  async function handleAddObservation(e: React.FormEvent) {
    e.preventDefault();
    if (!obsText.trim()) return;
    try {
      setAdding(true);
      await api.addObservation(s!.id, { observationText: obsText.trim() });
      setObsText("");
      refetch();
    } catch (err: unknown) {
      window.alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAdding(false);
    }
  }

  return (
    <div>
      <Link href="/stakeholders">
        <span style={{ fontSize: 13, color: "#3498db", cursor: "pointer" }}>← Back to Stakeholders</span>
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{s.name}</h1>
        <span style={{
          padding: "3px 12px",
          borderRadius: 12,
          fontSize: 12,
          fontWeight: 600,
          background: color + "18",
          color,
        }}>
          {s.type}
        </span>
      </div>

      {/* Profile card */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20, borderTop: `3px solid ${color}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 30px" }}>
          {s.title && <Field label="Title" value={s.title} />}
          {s.organization && <Field label="Organization" value={s.organization} />}
          {s.jurisdiction && <Field label="Jurisdiction" value={s.jurisdiction} />}
          {s.issueRoomId && (
            <div>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Issue Room</div>
              <Link href={`/issue-rooms/${s.issueRoomId}`}>
                <span style={{ fontSize: 13, color: "#3498db", cursor: "pointer" }}>#{s.issueRoomId}</span>
              </Link>
            </div>
          )}
        </div>
        {(s.tagsJson ?? []).length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
            {(s.tagsJson ?? []).map((tag, i) => (
              <span key={i} style={{ padding: "2px 8px", borderRadius: 10, fontSize: 11, background: "#f0f4f8", color: "#546e7a" }}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {s.sourceSummary && (
          <p style={{ fontSize: 12, color: "#666", marginTop: 10, marginBottom: 0 }}>{s.sourceSummary}</p>
        )}
      </div>

      {/* Observations timeline */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>
          Observations ({s.observations.length})
        </h3>

        {/* Add observation */}
        <form onSubmit={handleAddObservation} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={obsText}
            onChange={(e) => setObsText(e.target.value)}
            placeholder="Add an observation..."
            style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
          />
          <button type="submit" disabled={adding || !obsText.trim()}
            style={{ padding: "8px 16px", fontSize: 13, background: "#27ae60", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, opacity: adding || !obsText.trim() ? 0.6 : 1 }}>
            {adding ? "Adding..." : "Add"}
          </button>
        </form>

        {s.observations.length === 0 && (
          <p style={{ color: "#888", fontSize: 13 }}>No observations recorded yet.</p>
        )}

        <div style={{ display: "grid", gap: 0 }}>
          {s.observations.map((obs, i) => (
            <div key={obs.id} style={{
              padding: "10px 0",
              borderBottom: i < s.observations.length - 1 ? "1px solid #eee" : "none",
              display: "flex",
              gap: 12,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: confidenceColor(obs.confidence), marginTop: 5, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: "#333" }}>{obs.observationText}</div>
                <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>
                  {new Date(obs.createdAt).toLocaleString()}
                  <span style={{ marginLeft: 8, textTransform: "capitalize" }}>{obs.confidence}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, color: "#333" }}>{value}</div>
    </div>
  );
}

function confidenceColor(confidence: string): string {
  switch (confidence) {
    case "high": return "#27ae60";
    case "medium": return "#f39c12";
    case "low": return "#e74c3c";
    default: return "#95a5a6";
  }
}
