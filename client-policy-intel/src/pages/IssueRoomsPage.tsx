import { Link } from "wouter";
import { api } from "../api";
import { useAsync } from "../hooks";

export function IssueRoomsPage() {
  const { data: issueRooms, loading, error } = useAsync(() => api.getIssueRooms());

  if (loading) return <p>Loading issue rooms...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Issue Rooms</h1>
      <p style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>
        Source-backed rooms for active Grace &amp; McEwan monitoring and strategy work.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        {(issueRooms ?? []).map((room) => (
          <Link key={room.id} href={`/issue-rooms/${room.id}`}>
            <div style={{ background: "#fff", borderRadius: 8, padding: "16px 18px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", cursor: "pointer", borderLeft: `4px solid ${room.status === "active" ? "#3498db" : "#95a5a6"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{room.title}</div>
                  {room.summary && <p style={{ fontSize: 13, color: "#555", marginTop: 6 }}>{room.summary}</p>}
                </div>
                <div style={{ minWidth: 100, textAlign: "right" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#16213e" }}>{room.status.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{room.jurisdiction}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#888", marginTop: 10 }}>
                {room.issueType ?? "general"}
                {room.relatedBillIds.length > 0 && <span> · Bills: {room.relatedBillIds.join(", ")}</span>}
              </div>
            </div>
          </Link>
        ))}

        {(issueRooms ?? []).length === 0 && <p style={{ color: "#888" }}>No issue rooms yet.</p>}
      </div>
    </div>
  );
}