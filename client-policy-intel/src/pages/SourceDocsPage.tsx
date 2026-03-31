import { useState, useCallback } from "react";
import { api } from "../api";
import { useAsync } from "../hooks";

export function SourceDocsPage() {
  const [page, setPage] = useState(1);
  const [sourceType, setSourceType] = useState("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const LIMIT = 50;

  const fetchDocs = useCallback(
    () => api.getSourceDocuments({ page, limit: LIMIT, sourceType: sourceType || undefined, search: search || undefined }),
    [page, sourceType, search],
  );
  const { data: result, loading, error } = useAsync(fetchDocs, [page, sourceType, search]);

  const docs = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 1;

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const typeColors: Record<string, string> = {
    texas_legislation: "#2980b9",
    texas_regulation: "#8e44ad",
    texas_local: "#27ae60",
    federal_legislation: "#2c3e50",
    manual: "#95a5a6",
  };

  const sourceTypes = ["", "texas_legislation", "texas_regulation", "texas_local", "federal_legislation", "manual"];

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Source Documents</h1>

      {/* Search + filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, flex: 1 }}>
          <input
            type="text"
            placeholder="Search documents by title..."
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
        <select
          value={sourceType}
          onChange={(e) => { setSourceType(e.target.value); setPage(1); }}
          style={{ padding: "8px 12px", fontSize: 13, border: "1px solid #ddd", borderRadius: 6 }}
        >
          <option value="">All types</option>
          {sourceTypes.filter(Boolean).map((t) => (
            <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>{total.toLocaleString()} documents</p>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "grid", gap: 10 }}>
        {docs.map((d) => (
          <div key={d.id} style={{
            background: "#fff",
            borderRadius: 8,
            padding: "14px 18px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</div>
                {d.summary && <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{d.summary.slice(0, 250)}</p>}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: 12 }}>
                {(d as any).alertCount > 0 && (
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 12, fontWeight: 600,
                    background: (d as any).maxAlertScore >= 70 ? "#e74c3c18" : (d as any).maxAlertScore >= 40 ? "#e67e2218" : "#3498db18",
                    color: (d as any).maxAlertScore >= 70 ? "#e74c3c" : (d as any).maxAlertScore >= 40 ? "#e67e22" : "#3498db",
                    whiteSpace: "nowrap",
                  }}>
                    {(d as any).alertCount} alert{(d as any).alertCount > 1 ? "s" : ""}
                  </span>
                )}
                <span style={{
                  fontSize: 11,
                  padding: "2px 10px",
                  borderRadius: 12,
                  background: `${typeColors[d.sourceType] ?? "#ccc"}22`,
                  color: typeColors[d.sourceType] ?? "#888",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}>
                  {d.sourceType.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 8 }}>
              {d.publisher} · {d.fetchedAt ? new Date(d.fetchedAt).toLocaleDateString() : ""}
              {d.sourceUrl && (
                <span> · <a href={d.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#3498db" }}>source</a></span>
              )}
            </div>
            {d.tagsJson.length > 0 && (
              <div style={{ marginTop: 6, display: "flex", gap: 4, flexWrap: "wrap" }}>
                {d.tagsJson.map((tag, i) => (
                  <span key={i} style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "#f0f0f0", color: "#666" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {docs.length === 0 && !loading && (
          <p style={{ color: "#888" }}>No documents match the current filter.</p>
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
            Page {page} of {totalPages.toLocaleString()}
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
