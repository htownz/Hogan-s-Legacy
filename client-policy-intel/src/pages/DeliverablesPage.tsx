import { useState, useCallback } from "react";
import { api, type Deliverable, type SourceDocument, type Watchlist, type Matter } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

const TYPE_COLORS: Record<string, string> = {
  issue_brief: "#1565c0",
  hearing_memo: "#6a1b9a",
  client_alert: "#2e7d32",
  weekly_digest: "#e65100",
  brief: "#1565c0",
  memo: "#6a1b9a",
  summary: "#2e7d32",
  report: "#e65100",
  talking_points: "#00838f",
};

function typeColor(type: string) {
  return TYPE_COLORS[type.toLowerCase()] ?? "#546e7a";
}

export function DeliverablesPage() {
  const { data: deliverables, loading, error, refetch } = useAsync(() => api.getDeliverables());
  const [selected, setSelected] = useState<Deliverable | null>(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [showGenerator, setShowGenerator] = useState(false);

  if (loading) return <p>Loading deliverables...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;

  const allTypes = Array.from(new Set((deliverables ?? []).map((d) => d.type.toLowerCase()))).sort();

  const filtered = (deliverables ?? []).filter(
    (d) => typeFilter === "all" || d.type.toLowerCase() === typeFilter,
  );

  return (
    <div>
      {/* Generator Panel */}
      {showGenerator && (
        <BriefGenerator
          onClose={() => setShowGenerator(false)}
          onGenerated={() => { setShowGenerator(false); refetch(); }}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: 24 }}>
        {/* List panel */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h1 style={{ fontSize: 22, margin: 0 }}>Briefs &amp; Deliverables</h1>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#888" }}>{(deliverables ?? []).length} total</span>
              <button
                onClick={() => setShowGenerator(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: "#1565c0",
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                + Generate Brief
              </button>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {(["all", ...allTypes] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 14,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: typeFilter === t ? 600 : 400,
                  background: typeFilter === t ? (t === "all" ? "#3498db" : typeColor(t)) : "#e0e0e0",
                  color: typeFilter === t ? "#fff" : "#555",
                }}
              >
                {t.replace(/_/g, " ")}
                {t !== "all" && (
                  <span style={{ marginLeft: 4, opacity: 0.75 }}>
                    ({(deliverables ?? []).filter((d) => d.type.toLowerCase() === t).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <p style={{ color: "#888", fontSize: 13 }}>No deliverables found. Click "Generate Brief" to create one.</p>
          )}

          <div style={{ display: "grid", gap: 10 }}>
            {filtered.map((d) => (
              <DeliverableRow
                key={d.id}
                deliverable={d}
                selected={selected?.id === d.id}
                onClick={() => setSelected(selected?.id === d.id ? null : d)}
              />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <div style={{
            background: "#fff",
            borderRadius: 8,
            padding: "20px 24px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            alignSelf: "start",
            position: "sticky",
            top: 0,
            maxHeight: "90vh",
            overflow: "auto",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, margin: 0, flex: 1, marginRight: 12 }}>{selected.title}</h2>
              <button
                onClick={() => setSelected(null)}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#888", padding: 0 }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <span style={{
                padding: "2px 10px",
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                background: typeColor(selected.type) + "18",
                color: typeColor(selected.type),
              }}>
                {selected.type.replace(/_/g, " ")}
              </span>
              {selected.matterId && (
                <span style={{ fontSize: 11, color: "#888" }}>Matter #{selected.matterId}</span>
              )}
            </div>

            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 16 }}>
              Generated by {selected.generatedBy} · {new Date(selected.createdAt).toLocaleString()}
            </div>

            {selected.bodyMarkdown ? (
              <div style={{ fontSize: 13, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {selected.bodyMarkdown}
              </div>
            ) : (
              <p style={{ color: "#aaa", fontSize: 13 }}>No content available.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Brief Generator ──────────────────────────────────────────────────────────

function BriefGenerator({ onClose, onGenerated }: { onClose: () => void; onGenerated: () => void }) {
  const { data: sourceDocs } = useAsync(() => api.getSourceDocuments({ limit: 100 }));
  const { data: watchlistsData } = useAsync(() => api.getWatchlists(DEFAULT_WORKSPACE_ID));
  const { data: mattersData } = useAsync(() => api.getMatters(DEFAULT_WORKSPACE_ID));

  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [workspaceId] = useState(DEFAULT_WORKSPACE_ID);
  const [watchlistId, setWatchlistId] = useState<number | undefined>();
  const [matterId, setMatterId] = useState<number | undefined>();
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState("");

  const docs = (sourceDocs?.data ?? []).filter(
    (d) => !docSearch || d.title.toLowerCase().includes(docSearch.toLowerCase()),
  );

  const toggleDoc = useCallback((id: number) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (selectedDocs.size === 0) return;
    setGenerating(true);
    setGenError(null);
    try {
      await api.generateBrief({
        workspaceId,
        sourceDocumentIds: Array.from(selectedDocs),
        title: title || undefined,
        watchlistId,
        matterId,
      });
      onGenerated();
    } catch (err: any) {
      setGenError(err?.message ?? "Brief generation failed");
    } finally {
      setGenerating(false);
    }
  }, [selectedDocs, workspaceId, title, watchlistId, matterId, onGenerated]);

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
        <h2 style={{ margin: 0, fontSize: 18 }}>Generate Issue Brief</h2>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#888" }}>×</button>
      </div>

      {/* Title */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Title (optional, auto-generated if blank)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Brief: HB 123 Transportation Impact"
          style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, boxSizing: "border-box" }}
        />
      </div>

      {/* Watchlist + Matter selectors */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Watchlist (optional)</label>
          <select
            value={watchlistId ?? ""}
            onChange={(e) => setWatchlistId(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }}
          >
            <option value="">— None —</option>
            {(watchlistsData ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>Matter (optional)</label>
          <select
            value={matterId ?? ""}
            onChange={(e) => setMatterId(e.target.value ? Number(e.target.value) : undefined)}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }}
          >
            <option value="">— None —</option>
            {(mattersData ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Source document picker */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: "#555", display: "block", marginBottom: 4 }}>
          Source Documents ({selectedDocs.size} selected) — <span style={{ fontWeight: 400, color: "#e74c3c" }}>required</span>
        </label>
        <input
          value={docSearch}
          onChange={(e) => setDocSearch(e.target.value)}
          placeholder="Search documents by title..."
          style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, marginBottom: 8, boxSizing: "border-box" }}
        />
        <div style={{
          maxHeight: 240,
          overflowY: "auto",
          border: "1px solid #eee",
          borderRadius: 6,
          background: "#fafafa",
        }}>
          {docs.length === 0 && (
            <div style={{ padding: 16, textAlign: "center", color: "#aaa", fontSize: 13 }}>No documents found</div>
          )}
          {docs.map((d) => (
            <label
              key={d.id}
              style={{
                display: "flex",
                gap: 8,
                padding: "8px 12px",
                borderBottom: "1px solid #f0f0f0",
                cursor: "pointer",
                alignItems: "flex-start",
                background: selectedDocs.has(d.id) ? "#e8f0fe" : "transparent",
                fontSize: 12,
              }}
            >
              <input
                type="checkbox"
                checked={selectedDocs.has(d.id)}
                onChange={() => toggleDoc(d.id)}
                style={{ marginTop: 2 }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>{d.title.slice(0, 100)}</div>
                <div style={{ color: "#888", fontSize: 11 }}>
                  {d.sourceType} · {d.publisher} · {d.publishedAt ? new Date(d.publishedAt).toLocaleDateString() : "no date"}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {genError && (
        <div style={{ color: "#e74c3c", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#fdeaea", borderRadius: 6 }}>
          {genError}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", fontSize: 13, cursor: "pointer" }}>
          Cancel
        </button>
        <button
          onClick={handleGenerate}
          disabled={selectedDocs.size === 0 || generating}
          style={{
            padding: "8px 20px",
            borderRadius: 6,
            border: "none",
            background: selectedDocs.size === 0 || generating ? "#bbb" : "#1565c0",
            color: "#fff",
            fontWeight: 600,
            fontSize: 13,
            cursor: selectedDocs.size === 0 || generating ? "not-allowed" : "pointer",
          }}
        >
          {generating ? "Generating..." : `Generate Brief (${selectedDocs.size} source${selectedDocs.size !== 1 ? "s" : ""})`}
        </button>
      </div>
    </div>
  );
}

function DeliverableRow({
  deliverable: d,
  selected,
  onClick,
}: {
  deliverable: Deliverable;
  selected: boolean;
  onClick: () => void;
}) {
  const color = typeColor(d.type);
  const preview = d.bodyMarkdown?.slice(0, 160).replace(/\n/g, " ");

  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "#f0f7ff" : "#fff",
        borderRadius: 8,
        padding: "12px 16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        borderLeft: `4px solid ${selected ? "#3498db" : color}`,
        cursor: "pointer",
        transition: "background 0.1s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{d.title}</div>
          {preview && (
            <div style={{ fontSize: 11, color: "#777", marginTop: 4 }}>{preview}…</div>
          )}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
          <span style={{
            padding: "2px 8px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 600,
            background: color + "18",
            color,
          }}>
            {d.type.replace(/_/g, " ")}
          </span>
          <div style={{ fontSize: 10, color: "#aaa", marginTop: 4 }}>
            {new Date(d.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
