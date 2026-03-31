import { useState } from "react";
import { Link, useRoute } from "wouter";
import { api, type StakeholderFull, type MeetingNote } from "../api";
import { useAsync } from "../hooks";

const TYPE_COLORS: Record<string, string> = {
  legislator: "#1565c0",
  lobbyist: "#6a1b9a",
  pac: "#b71c1c",
  organization: "#2e7d32",
  agency_official: "#e65100",
  individual: "#546e7a",
};

const CHAMBER_COLORS: Record<string, string> = {
  House: "#2980b9",
  Senate: "#8e44ad",
};

export function StakeholderDetailPage() {
  const [, params] = useRoute("/stakeholders/:id");
  const id = Number(params?.id);
  const { data: s, loading, error, refetch } = useAsync(() => api.getStakeholderFull(id), [id]);
  const [obsText, setObsText] = useState("");
  const [adding, setAdding] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteDate, setNoteDate] = useState("");
  const [noteMethod, setNoteMethod] = useState("in-person");
  const [addingNote, setAddingNote] = useState(false);
  const [activeTab, setActiveTab] = useState<"observations" | "committees" | "notes">("observations");

  if (loading) return <p>Loading...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;
  if (!s) return <p>Stakeholder not found.</p>;

  const color = TYPE_COLORS[s.type.toLowerCase()] ?? "#546e7a";
  const isLegislator = s.type === "legislator";

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

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    try {
      setAddingNote(true);
      await api.addMeetingNote(s!.id, {
        noteText: noteText.trim(),
        meetingDate: noteDate || undefined,
        contactMethod: noteMethod,
      });
      setNoteText("");
      setNoteDate("");
      refetch();
    } catch (err: unknown) {
      window.alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAddingNote(false);
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
        {isLegislator && s.party && (
          <span style={{
            padding: "3px 10px",
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600,
            background: s.party === "R" ? "#e74c3c18" : s.party === "D" ? "#2980b918" : "#95a5a618",
            color: s.party === "R" ? "#c0392b" : s.party === "D" ? "#2471a3" : "#555",
          }}>
            {s.party === "R" ? "Republican" : s.party === "D" ? "Democrat" : s.party}
          </span>
        )}
      </div>

      {/* Profile card */}
      <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)", marginBottom: 20, borderTop: `3px solid ${color}` }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 30px" }}>
          {s.title && <Field label="Title" value={s.title} />}
          {s.organization && <Field label="Organization" value={s.organization} />}
          {s.jurisdiction && <Field label="Jurisdiction" value={s.jurisdiction} />}
          {isLegislator && s.chamber && <Field label="Chamber" value={`Texas ${s.chamber}`} />}
          {isLegislator && s.district && <Field label="District" value={s.district} />}
          {s.email && <Field label="Email" value={s.email} />}
          {s.phone && <Field label="Phone" value={s.phone} />}
          {s.officeAddress && <Field label="Office" value={s.officeAddress} />}
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

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: 0, marginBottom: 0 }}>
        {(["observations", "committees", "notes"] as const).map((tab) => {
          const labels = {
            observations: `Observations (${s.observations.length})`,
            committees: `Committees (${s.committees.length})`,
            notes: `Meeting Notes (${s.meetingNotes.length})`,
          };
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 600,
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #3498db" : "2px solid transparent",
                background: activeTab === tab ? "#fff" : "#f8f9fa",
                color: activeTab === tab ? "#333" : "#888",
                cursor: "pointer",
                borderRadius: "6px 6px 0 0",
              }}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div style={{ background: "#fff", borderRadius: "0 8px 8px 8px", padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>

        {/* Observations Tab */}
        {activeTab === "observations" && (
          <>
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
          </>
        )}

        {/* Committees Tab */}
        {activeTab === "committees" && (
          <>
            {s.committees.length === 0 ? (
              <p style={{ color: "#888", fontSize: 13 }}>No committee assignments recorded.</p>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {s.committees.map((c) => (
                  <div key={c.id} style={{
                    padding: "10px 14px",
                    borderRadius: 6,
                    background: "#f8f9fa",
                    borderLeft: `3px solid ${CHAMBER_COLORS[c.chamber] ?? "#555"}`,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{c.committeeName}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{c.chamber}</div>
                    </div>
                    <span style={{
                      fontSize: 11,
                      padding: "2px 10px",
                      borderRadius: 10,
                      fontWeight: 600,
                      background: c.role === "chair" ? "#27ae6018" : c.role === "vice_chair" ? "#e67e2218" : "#95a5a618",
                      color: c.role === "chair" ? "#27ae60" : c.role === "vice_chair" ? "#e67e22" : "#555",
                      textTransform: "capitalize",
                    }}>
                      {c.role.replace(/_/g, " ")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Meeting Notes Tab */}
        {activeTab === "notes" && (
          <>
            <form onSubmit={handleAddNote} style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a meeting note..."
                style={{ flex: 2, minWidth: 200, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
              />
              <input
                type="date"
                value={noteDate}
                onChange={(e) => setNoteDate(e.target.value)}
                style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
              />
              <select
                value={noteMethod}
                onChange={(e) => setNoteMethod(e.target.value)}
                style={{ padding: "8px 10px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
              >
                <option value="in-person">In-Person</option>
                <option value="phone">Phone</option>
                <option value="email">Email</option>
                <option value="testimony">Testimony</option>
              </select>
              <button type="submit" disabled={addingNote || !noteText.trim()}
                style={{ padding: "8px 16px", fontSize: 13, background: "#16213e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, opacity: addingNote || !noteText.trim() ? 0.6 : 1 }}>
                {addingNote ? "Adding..." : "Add Note"}
              </button>
            </form>
            {s.meetingNotes.length === 0 ? (
              <p style={{ color: "#888", fontSize: 13 }}>No meeting notes yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 0 }}>
                {s.meetingNotes.map((note, i) => (
                  <div key={note.id} style={{
                    padding: "10px 0",
                    borderBottom: i < s.meetingNotes.length - 1 ? "1px solid #eee" : "none",
                    display: "flex",
                    gap: 12,
                  }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "#f0f4f8",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      flexShrink: 0,
                      marginTop: 2,
                    }}>
                      {note.contactMethod === "phone" ? "📞" : note.contactMethod === "email" ? "📧" : note.contactMethod === "testimony" ? "🏛" : "🤝"}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "#333" }}>{note.noteText}</div>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 3 }}>
                        {note.meetingDate ? new Date(note.meetingDate).toLocaleDateString() : "No date"}
                        {note.contactMethod && <span style={{ marginLeft: 8, textTransform: "capitalize" }}>{note.contactMethod}</span>}
                        <span style={{ marginLeft: 8 }}>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
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
