import { useState, useCallback } from "react";
import { Link } from "wouter";
import { api, type Stakeholder, type TecSearchResult, type TecImportResult } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

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
  const { data: stakeholders, loading, error, refetch } = useAsync(() => api.getStakeholders(DEFAULT_WORKSPACE_ID));
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showTecPanel, setShowTecPanel] = useState(false);

  if (loading) return <p>Loading stakeholders...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;

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
          <Link href={`/stakeholders/${s.id}`}>
            <div style={{ fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#1a1a1a" }}>{s.name}</div>
          </Link>
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

// ── TEC Search & Import Panel ────────────────────────────────────────────────

function TecSearchPanel({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<TecSearchResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<TecImportResult | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setSearching(true);
    setSearchError(null);
    setResults(null);
    setImportResult(null);
    try {
      const r = await api.searchTec(searchTerm.trim());
      setResults(r);
    } catch (err: any) {
      setSearchError(err?.message ?? "TEC search failed");
    } finally {
      setSearching(false);
    }
  }, [searchTerm]);

  const handleImport = useCallback(async () => {
    if (!searchTerm.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      const r = await api.importTec({ searchTerm: searchTerm.trim(), workspaceId: DEFAULT_WORKSPACE_ID });
      setImportResult(r);
      if (r.stakeholdersCreated > 0) {
        setTimeout(() => onImported(), 1500);
      }
    } catch (err: any) {
      setSearchError(err?.message ?? "TEC import failed");
    } finally {
      setImporting(false);
    }
  }, [searchTerm, onImported]);

  const totalResults = (results?.filers.length ?? 0) + (results?.lobbyists.length ?? 0);

  return (
    <div style={{
      background: "#fff",
      borderRadius: 10,
      padding: 24,
      marginBottom: 24,
      boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
      border: "1px solid #e0e0e0",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Search Texas Ethics Commission</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>×</button>
      </div>

      <p style={{ fontSize: 12, color: "#777", marginBottom: 16 }}>
        Search for lobbyists and campaign finance filers on the TEC. Results can be imported as stakeholders with linked source documents.
      </p>

      {/* Search bar */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Search by name (e.g., AT&T, John Smith)..."
          style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }}
        />
        <button
          onClick={handleSearch}
          disabled={searching || !searchTerm.trim()}
          style={{
            padding: "8px 20px", borderRadius: 6, border: "none",
            background: searching || !searchTerm.trim() ? "#bbb" : "#b71c1c",
            color: "#fff", fontWeight: 600, fontSize: 13,
            cursor: searching || !searchTerm.trim() ? "not-allowed" : "pointer",
          }}
        >
          {searching ? "Searching..." : "Search TEC"}
        </button>
      </div>

      {searchError && (
        <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#fdeaea", borderRadius: 6 }}>
          {searchError}
        </div>
      )}

      {/* Search results */}
      {results && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#333" }}>
            Found {totalResults} result{totalResults !== 1 ? "s" : ""} for "{searchTerm}"
          </div>

          {results.filers.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#b71c1c", marginBottom: 6 }}>
                Campaign Finance Filers ({results.filers.length})
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #eee", borderRadius: 6, background: "#fafafa" }}>
                {results.filers.map((f, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "8px 12px",
                    borderBottom: i < results.filers.length - 1 ? "1px solid #f0f0f0" : "none", fontSize: 12,
                  }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{f.filerName}</span>
                      <span style={{ color: "#888", marginLeft: 8 }}>{f.filerType}</span>
                    </div>
                    <span style={{ color: "#aaa" }}>ID: {f.filerId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.lobbyists.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#6a1b9a", marginBottom: 6 }}>
                Registered Lobbyists ({results.lobbyists.length})
              </div>
              <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #eee", borderRadius: 6, background: "#fafafa" }}>
                {results.lobbyists.map((l, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", padding: "8px 12px",
                    borderBottom: i < results.lobbyists.length - 1 ? "1px solid #f0f0f0" : "none", fontSize: 12,
                  }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{l.name}</span>
                      {l.clients.length > 0 && (
                        <span style={{ color: "#888", marginLeft: 8 }}>Clients: {l.clients.slice(0, 3).join(", ")}</span>
                      )}
                    </div>
                    <span style={{ color: "#aaa" }}>Reg: {l.registrationId}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.errors.length > 0 && (
            <div style={{ fontSize: 11, color: "#e74c3c", marginBottom: 8 }}>
              {results.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}

          {totalResults > 0 && (
            <button
              onClick={handleImport}
              disabled={importing}
              style={{
                padding: "8px 20px", borderRadius: 6, border: "none",
                background: importing ? "#bbb" : "#2e7d32",
                color: "#fff", fontWeight: 600, fontSize: 13, width: "100%",
                cursor: importing ? "not-allowed" : "pointer",
              }}
            >
              {importing ? "Importing..." : `Import ${totalResults} as Stakeholders`}
            </button>
          )}
        </div>
      )}

      {/* Import results */}
      {importResult && (
        <div style={{
          padding: 12, borderRadius: 6, fontSize: 12,
          background: importResult.errors.length > 0 ? "#fff3e0" : "#e8f5e9",
          border: `1px solid ${importResult.errors.length > 0 ? "#ffcc80" : "#a5d6a7"}`,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Import Complete</div>
          <div>Stakeholders created: <strong>{importResult.stakeholdersCreated}</strong> (existing: {importResult.stakeholdersExisting})</div>
          <div>Source docs inserted: <strong>{importResult.sourceDocsInserted}</strong> (skipped: {importResult.sourceDocsSkipped})</div>
          <div>Observations: <strong>{importResult.observationsCreated}</strong></div>
          {importResult.errors.length > 0 && (
            <div style={{ color: "#e74c3c", marginTop: 4 }}>
              {importResult.errors.map((e, i) => <div key={i}>{e}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
