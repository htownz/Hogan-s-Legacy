import { api } from "../api";
import { useAsync } from "../hooks";

export function SourceDocsPage() {
  const { data: docs, loading, error } = useAsync(() => api.getSourceDocuments());

  if (loading) return <p>Loading source documents...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  const typeColors: Record<string, string> = {
    texas_legislation: "#2980b9",
    texas_regulation: "#8e44ad",
    texas_local: "#27ae60",
    federal_legislation: "#2c3e50",
    manual: "#95a5a6",
  };

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Source Documents</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>{(docs ?? []).length} documents ingested</p>

      <div style={{ display: "grid", gap: 10 }}>
        {(docs ?? []).map((d) => (
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
              <span style={{
                fontSize: 11,
                padding: "2px 10px",
                borderRadius: 12,
                background: `${typeColors[d.sourceType] ?? "#ccc"}22`,
                color: typeColors[d.sourceType] ?? "#888",
                fontWeight: 600,
                whiteSpace: "nowrap",
                marginLeft: 12,
              }}>
                {d.sourceType.replace(/_/g, " ")}
              </span>
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

        {(docs ?? []).length === 0 && (
          <p style={{ color: "#888" }}>No documents yet. Run a job to ingest data.</p>
        )}
      </div>
    </div>
  );
}
