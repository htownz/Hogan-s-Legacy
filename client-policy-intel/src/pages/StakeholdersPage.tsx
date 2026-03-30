import { useState, useCallback } from "react";
import { Link } from "wouter";
import { api, type Stakeholder, type TecSearchResult, type TecImportResult } from "../api";
import { useAsync } from "../hooks";

const TYPE_COLORS: Record<string, string> = {
  legislator: "#1565c0",
  lobbyist: "#6a1b9a",
  pac: "#b71c1c",
  organization: "#2e7d32",
  agency: "#e65100",
  agency_official: "#e65100",
  media: "#00838f",
  individual: "#546e7a",
};

function typeColor(type: string) {
  return TYPE_COLORS[type.toLowerCase()] ?? "#546e7a";
}

export function StakeholdersPage() {
  const { data: stakeholders, loading, error, refetch } = useAsync(() => api.getStakeholders());
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showTecPanel, setShowTecPanel] = useState(false);

  if (loading) return <p>Loading stakeholders...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const allTypes = Array.from(new Set((stakeholders ?? []).map((s) => s.type.toLowerCase()))).sort();

  const filtered = (stakeholders ?? []).filter((s) => {
    const matchesType = typeFilter === "all" || s.type.toLowerCase() === typeFilter;
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      s.name.toLowerCase().includes(term) ||
      (s.organization ?? "").toLowerCase().includes(term) ||
      (s.title ?? "").toLowerCase().includes(term);
    return matchesType && matchesSearch;
  });

  return (
    <div>
      {showTecPanel && (
        <TecSearchPanel
          onClose={() => setShowTecPanel(false)}
          onImported={() => { setShowTecPanel(false); refetch(); }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Stakeholders</h1>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#888" }}>{(stakeholders ?? []).length} total</span>
          <button
            onClick={() => setShowTecPanel(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: "#b71c1c",
              color: "#fff",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Search TEC
          </button>
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, org, or title..."
          style={{
            flex: 1,
            minWidth: 220,
            padding: "8px 12px",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(["all", ...allTypes] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: "6px 14px",
                borderRadius: 16,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: typeFilter === t ? 600 : 400,
                background: typeFilter === t ? (t === "all" ? "#3498db" : typeColor(t)) : "#e0e0e0",
                color: typeFilter === t ? "#fff" : "#555",
              }}
            >
              {t}
              {t !== "all" && (
                <span style={{ marginLeft: 4, opacity: 0.75 }}>
                  ({(stakeholders ?? []).filter((s) => s.type.toLowerCase() === t).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <p style={{ color: "#888", fontSize: 13 }}>No stakeholders match your filters.</p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
        {filtered.map((s) => (
          <StakeholderCard key={s.id} stakeholder={s} />
        ))}
      </div>
    </div>
  );
}

function StakeholderCard({ stakeholder: s }: { stakeholder: Stakeholder }) {
  const color = typeColor(s.type);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      padding: "14px 16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
      borderTop: `3px solid ${color}`,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</div>
          {s.title && <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{s.title}</div>}
          {s.organization && (
            <div style={{ fontSize: 12, color: "#777", marginTop: 1 }}>{s.organization}</div>
          )}
        </div>
        <span style={{
          padding: "2px 10px",
          borderRadius: 10,
          fontSize: 11,
          fontWeight: 600,
          background: color + "18",
          color,
          flexShrink: 0,
          marginLeft: 8,
        }}>
          {s.type}
        </span>
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
        {s.jurisdiction && (
          <span style={{ fontSize: 11, color: "#888" }}>📍 {s.jurisdiction}</span>
        )}
        {(s.tagsJson ?? []).slice(0, 3).map((tag, i) => (
          <span key={i} style={{
            fontSize: 11,
            padding: "1px 7px",
            background: "#f0f4f8",
            borderRadius: 8,
            color: "#546e7a",
          }}>
            {tag}
          </span>
        ))}
      </div>

      {s.issueRoomId && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#3498db" }}>
          <Link href={`/issue-rooms/${s.issueRoomId}`}>
            <span style={{ cursor: "pointer" }}>→ Issue room #{s.issueRoomId}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
