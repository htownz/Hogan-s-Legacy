import { useState } from "react";
import { Link } from "wouter";
import { api, type Watchlist } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

export function WatchlistsPage() {
  const { data: watchlists, loading, error, refetch } = useAsync(() => api.getWatchlists());
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", topic: "", description: "" });

  if (loading) return <p>Loading watchlists...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;

  const active = (watchlists ?? []).filter((w) => w.isActive);
  const inactive = (watchlists ?? []).filter((w) => !w.isActive);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      setSubmitting(true);
      await api.createWatchlist({
        workspaceId: DEFAULT_WORKSPACE_ID,
        name: form.name.trim(),
        topic: form.topic.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setForm({ name: "", topic: "", description: "" });
      setShowForm(false);
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Create failed: " + message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Watchlists</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          style={{
            padding: "8px 16px",
            background: "#3498db",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {showForm ? "Cancel" : "+ New Watchlist"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: "20px 24px",
            marginBottom: 24,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            display: "grid",
            gap: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 15 }}>Create Watchlist</h3>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Name *
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Energy Regulation Texas"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Topic
            <input
              value={form.topic}
              onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
              placeholder="e.g. energy, healthcare, transportation"
              style={inputStyle}
            />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Description
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="What should this watchlist monitor?"
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: "8px 18px",
                background: submitting ? "#aaa" : "#27ae60",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                cursor: submitting ? "not-allowed" : "pointer",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      )}

      <SectionHeader label="Active" count={active.length} />
      <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
        {active.length === 0 && <p style={{ color: "#888", fontSize: 13 }}>No active watchlists yet.</p>}
        {active.map((w) => (
          <WatchlistCard key={w.id} watchlist={w} onUpdate={refetch} />
        ))}
      </div>

      {inactive.length > 0 && (
        <>
          <SectionHeader label="Inactive" count={inactive.length} />
          <div style={{ display: "grid", gap: 10 }}>
            {inactive.map((w) => (
              <WatchlistCard key={w.id} watchlist={w} onUpdate={refetch} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>
        {label}
      </span>
      <span style={{
        fontSize: 11,
        background: "#e8edf2",
        color: "#666",
        borderRadius: 10,
        padding: "1px 8px",
        fontWeight: 600,
      }}>
        {count}
      </span>
    </div>
  );
}

function WatchlistCard({ watchlist: w, onUpdate }: { watchlist: Watchlist; onUpdate: () => void }) {
  const rules = (w.rulesJson ?? {}) as Record<string, unknown>;
  const ruleCount = Object.keys(rules).length;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(w.name);
  const [editTopic, setEditTopic] = useState(w.topic ?? "");
  const [editDesc, setEditDesc] = useState(w.description ?? "");
  const [editActive, setEditActive] = useState(w.isActive);
  const [editBillIds, setEditBillIds] = useState(((rules.billIds as string[]) ?? []).join(", "));
  const [editKeywords, setEditKeywords] = useState(((rules.keywords as string[]) ?? []).join(", "));

  function startEdit() {
    setEditName(w.name);
    setEditTopic(w.topic ?? "");
    setEditDesc(w.description ?? "");
    setEditActive(w.isActive);
    setEditBillIds(((rules.billIds as string[]) ?? []).join(", "));
    setEditKeywords(((rules.keywords as string[]) ?? []).join(", "));
    setEditing(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      const newRules = { ...rules };
      const billIds = editBillIds.split(",").map((s) => s.trim()).filter(Boolean);
      const keywords = editKeywords.split(",").map((s) => s.trim()).filter(Boolean);
      if (billIds.length > 0) newRules.billIds = billIds; else delete newRules.billIds;
      if (keywords.length > 0) newRules.keywords = keywords; else delete newRules.keywords;
      await api.patchWatchlist(w.id, {
        name: editName.trim(),
        topic: editTopic.trim() || undefined,
        description: editDesc.trim() || undefined,
        rulesJson: newRules,
        isActive: editActive,
      });
      setEditing(false);
      onUpdate();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Save failed: " + message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{
      background: "#fff",
      borderRadius: 8,
      padding: "14px 18px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      borderLeft: `4px solid ${w.isActive ? "#27ae60" : "#bdbdbd"}`,
      opacity: w.isActive ? 1 : 0.65,
    }}>
      {editing ? (
        <div style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Name
            <input value={editName} onChange={(e) => setEditName(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Topic
            <input value={editTopic} onChange={(e) => setEditTopic(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Description
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: "vertical" }} />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Bill IDs <span style={{ fontWeight: 400, color: "#888" }}>(comma-separated, e.g. HB 5, SB 1234)</span>
            <input value={editBillIds} onChange={(e) => setEditBillIds(e.target.value)} placeholder="HB 5, SB 1234" style={inputStyle} />
          </label>
          <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
            Keywords <span style={{ fontWeight: 400, color: "#888" }}>(comma-separated)</span>
            <input value={editKeywords} onChange={(e) => setEditKeywords(e.target.value)} style={inputStyle} />
          </label>
          <label style={{ fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
            <input type="checkbox" checked={editActive} onChange={(e) => setEditActive(e.target.checked)} /> Active
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{ padding: "6px 16px", fontSize: 12, background: "#27ae60", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setEditing(false)} style={{ padding: "6px 16px", fontSize: 12, background: "#e0e0e0", border: "none", borderRadius: 4, cursor: "pointer" }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Link href={`/watchlists/${w.id}`}><div style={{ fontSize: 14, fontWeight: 600, color: "#2c3e50", cursor: "pointer" }}>{w.name}</div></Link>
            {w.topic && (
              <span style={{ display: "inline-block", marginTop: 4, padding: "1px 8px", background: "#e3f2fd", color: "#1565c0", borderRadius: 10, fontSize: 11, fontWeight: 500 }}>
                {w.topic}
              </span>
            )}
            {w.description && <p style={{ fontSize: 12, color: "#666", marginTop: 6, marginBottom: 0 }}>{w.description}</p>}
            {((rules.billIds as string[]) ?? []).length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#888" }}>
                Tracking: {((rules.billIds as string[]) ?? []).join(", ")}
              </div>
            )}
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: "#aaa" }}>
            <div style={{
              display: "inline-block",
              padding: "2px 10px",
              borderRadius: 10,
              background: w.isActive ? "#e8f5e9" : "#fafafa",
              color: w.isActive ? "#27ae60" : "#bdbdbd",
              fontWeight: 600,
              marginBottom: 4,
            }}>
              {w.isActive ? "Active" : "Inactive"}
            </div>
            {ruleCount > 0 && <div>{ruleCount} rule{ruleCount !== 1 ? "s" : ""}</div>}
            <div style={{ marginTop: 4 }}>#{w.id}</div>
            <button onClick={startEdit}
              style={{ marginTop: 6, padding: "4px 12px", fontSize: 11, background: "#f0f0f0", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", color: "#555" }}>
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 13,
  width: "100%",
  boxSizing: "border-box",
};
