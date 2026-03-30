import { useState, type ReactNode } from "react";
import { api, type Alert } from "../api";
import { useAsync } from "../hooks";

export function IssueRoomDetailPage({ id }: { id: number }) {
  const { data, loading, error, refetch } = useAsync(() => api.getIssueRoom(id), [id]);
  const { data: roomAlerts } = useAsync(() => api.getIssueRoomAlerts(id), [id]);

  const [newUpdate, setNewUpdate] = useState({ title: "", body: "", updateType: "analysis" });
  const [newOption, setNewOption] = useState({ label: "", description: "", recommendationRank: "0", politicalFeasibility: "unknown", legalDurability: "unknown", implementationComplexity: "unknown" });
  const [newTask, setNewTask] = useState({ title: "", description: "", priority: "medium", assignee: "" });
  const [newStakeholder, setNewStakeholder] = useState({ type: "organization", name: "", title: "", organization: "", jurisdiction: "", tags: "", sourceSummary: "" });
  const [taskDrafts, setTaskDrafts] = useState<Record<number, { status: string; priority: string; assignee: string; dueDate: string; completedAt: string | null }>>({});

  const [savingUpdate, setSavingUpdate] = useState(false);
  const [savingOption, setSavingOption] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [savingStakeholder, setSavingStakeholder] = useState(false);
  const [savingTaskUpdateId, setSavingTaskUpdateId] = useState<number | null>(null);
  const [savingStatus, setSavingStatus] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [briefResult, setBriefResult] = useState<string | null>(null);

  if (loading) return <p>Loading issue room...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!data) return <p>Issue room not found.</p>;

  async function submitUpdate() {
    if (!newUpdate.title.trim() || !newUpdate.body.trim()) {
      window.alert("Update title and body are required.");
      return;
    }
    try {
      setSavingUpdate(true);
      await api.createIssueRoomUpdate(id, {
        title: newUpdate.title.trim(),
        body: newUpdate.body.trim(),
        updateType: newUpdate.updateType,
      });
      setNewUpdate({ title: "", body: "", updateType: "analysis" });
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Could not save update: " + message);
    } finally {
      setSavingUpdate(false);
    }
  }

  async function submitStrategyOption() {
    if (!newOption.label.trim()) {
      window.alert("Strategy option label is required.");
      return;
    }
    try {
      setSavingOption(true);
      await api.createIssueRoomStrategyOption(id, {
        label: newOption.label.trim(),
        description: newOption.description.trim() || undefined,
        politicalFeasibility: newOption.politicalFeasibility,
        legalDurability: newOption.legalDurability,
        implementationComplexity: newOption.implementationComplexity,
        recommendationRank: Number(newOption.recommendationRank) || 0,
      });
      setNewOption({ label: "", description: "", recommendationRank: "0", politicalFeasibility: "unknown", legalDurability: "unknown", implementationComplexity: "unknown" });
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Could not save strategy option: " + message);
    } finally {
      setSavingOption(false);
    }
  }

  async function submitTask() {
    if (!newTask.title.trim()) {
      window.alert("Task title is required.");
      return;
    }
    try {
      setSavingTask(true);
      await api.createIssueRoomTask(id, {
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        priority: newTask.priority,
        assignee: newTask.assignee.trim() || undefined,
      });
      setNewTask({ title: "", description: "", priority: "medium", assignee: "" });
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Could not save task: " + message);
    } finally {
      setSavingTask(false);
    }
  }

  async function submitStakeholder() {
    if (!newStakeholder.type.trim() || !newStakeholder.name.trim()) {
      window.alert("Stakeholder type and name are required.");
      return;
    }
    try {
      setSavingStakeholder(true);
      const tagsJson = newStakeholder.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await api.createIssueRoomStakeholder(id, {
        type: newStakeholder.type,
        name: newStakeholder.name.trim(),
        title: newStakeholder.title.trim() || undefined,
        organization: newStakeholder.organization.trim() || undefined,
        jurisdiction: newStakeholder.jurisdiction.trim() || undefined,
        tagsJson,
        sourceSummary: newStakeholder.sourceSummary.trim() || undefined,
      });
      setNewStakeholder({ type: "organization", name: "", title: "", organization: "", jurisdiction: "", tags: "", sourceSummary: "" });
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Could not save stakeholder: " + message);
    } finally {
      setSavingStakeholder(false);
    }
  }

  function getTaskDraft(task: { id: number; status: string; priority: string; assignee: string | null; dueDate: string | null; completedAt: string | null }) {
    return taskDrafts[task.id] ?? {
      status: task.status,
      priority: task.priority,
      assignee: task.assignee ?? "",
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
      completedAt: task.completedAt,
    };
  }

  function patchTaskDraft(taskId: number, patch: Partial<{ status: string; priority: string; assignee: string; dueDate: string; completedAt: string | null }>) {
    setTaskDrafts((prev) => {
      const existing = prev[taskId] ?? { status: "todo", priority: "medium", assignee: "", dueDate: "", completedAt: null };
      return { ...prev, [taskId]: { ...existing, ...patch } };
    });
  }

  async function saveTaskCard(task: { id: number; status: string; priority: string; assignee: string | null; dueDate: string | null; completedAt: string | null }) {
    const draft = getTaskDraft(task);
    try {
      setSavingTaskUpdateId(task.id);
      await api.updateIssueRoomTask(id, task.id, {
        status: draft.status,
        priority: draft.priority,
        assignee: draft.assignee.trim() || undefined,
        dueDate: draft.dueDate || null,
        completedAt: draft.completedAt,
      });
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Could not update task: " + message);
    } finally {
      setSavingTaskUpdateId(null);
    }
  }

  const { issueRoom, updates, strategyOptions, tasks, stakeholders, sourceDocuments } = data;

  async function handleStatusChange(newStatus: string) {
    try {
      setSavingStatus(true);
      await api.updateIssueRoom(id, { status: newStatus });
      refetch();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Could not update status: " + message);
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleGenerateBrief() {
    if (sourceDocuments.length === 0) {
      window.alert("No evidence documents linked to generate a brief from.");
      return;
    }
    try {
      setGeneratingBrief(true);
      setBriefResult(null);
      const result = await api.generateBrief({
        workspaceId: issueRoom.workspaceId,
        sourceDocumentIds: sourceDocuments.map((d) => d.id),
        matterId: issueRoom.matterId ?? undefined,
        title: `Brief: ${issueRoom.title}`,
      });
      setBriefResult(result.brief?.content ?? "Brief generated (see Deliverables page).");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      window.alert("Brief generation failed: " + message);
    } finally {
      setGeneratingBrief(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>{issueRoom.title}</h1>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <select
            value={issueRoom.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={savingStatus}
            style={{ padding: "6px 10px", fontSize: 12, border: "1px solid #d7d7d7", borderRadius: 4, cursor: "pointer" }}
          >
            <option value="active">Active</option>
            <option value="watching">Watching</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
          <button
            onClick={handleGenerateBrief}
            disabled={generatingBrief || sourceDocuments.length === 0}
            style={{ padding: "7px 14px", fontSize: 12, background: "#8e44ad", color: "#fff", border: "none", borderRadius: 4, cursor: generatingBrief || sourceDocuments.length === 0 ? "not-allowed" : "pointer", opacity: generatingBrief ? 0.7 : 1, whiteSpace: "nowrap" }}
          >
            {generatingBrief ? "Generating..." : "Generate Brief"}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 18 }}>
        {issueRoom.issueType ?? "general"} · {issueRoom.jurisdiction} · {issueRoom.status}
      </p>
      {briefResult && (
        <div style={{ background: "#f5eef8", borderRadius: 8, padding: "12px 14px", marginBottom: 18, border: "1px solid #d2b4de" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6c3483", marginBottom: 4 }}>Generated Brief</div>
          <div style={{ fontSize: 13, color: "#4a235a", whiteSpace: "pre-wrap" }}>{briefResult}</div>
        </div>
      )}
      {issueRoom.summary && <p style={{ fontSize: 14, marginBottom: 18 }}>{issueRoom.summary}</p>}
      {issueRoom.recommendedPath && (
        <div style={{ background: "#eef6ff", borderRadius: 8, padding: "12px 14px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#16213e", marginBottom: 4 }}>Recommended path</div>
          <div style={{ fontSize: 13, color: "#35506b" }}>{issueRoom.recommendedPath}</div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 24 }}>
        <div style={{ display: "grid", gap: 20 }}>
          <Section title={`Alerts (${(roomAlerts ?? []).length})`}>
            <AlertsList alerts={roomAlerts ?? []} emptyLabel="No alerts linked yet." />
          </Section>

          <Section title={`Updates (${updates.length})`}>
            <div style={{ background: "#fff", borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Add update</div>
              <input
                value={newUpdate.title}
                onChange={(e) => setNewUpdate((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Update title"
                style={fieldStyle}
              />
              <textarea
                value={newUpdate.body}
                onChange={(e) => setNewUpdate((prev) => ({ ...prev, body: e.target.value }))}
                placeholder="What changed and why it matters"
                rows={3}
                style={{ ...fieldStyle, resize: "vertical", marginTop: 8 }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={newUpdate.updateType}
                  onChange={(e) => setNewUpdate((prev) => ({ ...prev, updateType: e.target.value }))}
                  style={{ ...fieldStyle, width: 170, margin: 0 }}
                >
                  <option value="analysis">analysis</option>
                  <option value="status">status</option>
                  <option value="political">political</option>
                  <option value="legal">legal</option>
                  <option value="funding">funding</option>
                  <option value="meeting_note">meeting note</option>
                </select>
                <button onClick={submitUpdate} disabled={savingUpdate} style={primaryButtonStyle}>
                  {savingUpdate ? "Saving..." : "Save update"}
                </button>
              </div>
            </div>
            {updates.length === 0 ? <Empty label="No updates yet." /> : updates.map((update) => (
              <div key={update.id} style={{ padding: "10px 12px", background: "#fff", borderRadius: 6, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{update.title}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{update.updateType.replace(/_/g, " ")}</div>
                <p style={{ fontSize: 12, color: "#555", marginTop: 6 }}>{update.body}</p>
              </div>
            ))}
          </Section>

          <Section title={`Evidence (${sourceDocuments.length})`}>
            {sourceDocuments.length === 0 ? <Empty label="No source documents linked yet." /> : sourceDocuments.map((doc) => (
              <a key={doc.id} href={doc.sourceUrl} target="_blank" rel="noreferrer" style={{ display: "block", textDecoration: "none", color: "inherit", background: "#fff", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{doc.title}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{doc.publisher} · {doc.sourceType}</div>
              </a>
            ))}
          </Section>
        </div>

        <div style={{ display: "grid", gap: 20 }}>
          <Section title={`Strategy Options (${strategyOptions.length})`}>
            <div style={{ background: "#fff", borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Add strategy option</div>
              <input
                value={newOption.label}
                onChange={(e) => setNewOption((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="Option label"
                style={fieldStyle}
              />
              <textarea
                value={newOption.description}
                onChange={(e) => setNewOption((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                rows={2}
                style={{ ...fieldStyle, resize: "vertical", marginTop: 8 }}
              />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(120px, 1fr))", gap: 8, marginTop: 8 }}>
                <select value={newOption.politicalFeasibility} onChange={(e) => setNewOption((prev) => ({ ...prev, politicalFeasibility: e.target.value }))} style={fieldStyle}>
                  <option value="unknown">political: unknown</option>
                  <option value="low">political: low</option>
                  <option value="medium">political: medium</option>
                  <option value="high">political: high</option>
                </select>
                <select value={newOption.legalDurability} onChange={(e) => setNewOption((prev) => ({ ...prev, legalDurability: e.target.value }))} style={fieldStyle}>
                  <option value="unknown">legal: unknown</option>
                  <option value="low">legal: low</option>
                  <option value="medium">legal: medium</option>
                  <option value="high">legal: high</option>
                </select>
                <select value={newOption.implementationComplexity} onChange={(e) => setNewOption((prev) => ({ ...prev, implementationComplexity: e.target.value }))} style={fieldStyle}>
                  <option value="unknown">implementation: unknown</option>
                  <option value="low">implementation: low</option>
                  <option value="medium">implementation: medium</option>
                  <option value="high">implementation: high</option>
                </select>
                <input
                  value={newOption.recommendationRank}
                  onChange={(e) => setNewOption((prev) => ({ ...prev, recommendationRank: e.target.value }))}
                  placeholder="Rank"
                  type="number"
                  min={0}
                  style={fieldStyle}
                />
              </div>
              <button onClick={submitStrategyOption} disabled={savingOption} style={{ ...primaryButtonStyle, marginTop: 8 }}>
                {savingOption ? "Saving..." : "Save option"}
              </button>
            </div>
            {strategyOptions.length === 0 ? <Empty label="No strategy options yet." /> : strategyOptions.map((option) => (
              <div key={option.id} style={{ background: "#fff", borderRadius: 6, padding: "12px 14px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{option.recommendationRank > 0 ? `#${option.recommendationRank} ` : ""}{option.label}</div>
                {option.description && <p style={{ fontSize: 12, color: "#555", marginTop: 6 }}>{option.description}</p>}
                <div style={{ fontSize: 11, color: "#888", marginTop: 6 }}>
                  political: {option.politicalFeasibility ?? "unknown"} · legal: {option.legalDurability ?? "unknown"} · implementation: {option.implementationComplexity ?? "unknown"}
                </div>
              </div>
            ))}
          </Section>

          <Section title={`Tasks (${tasks.length})`}>
            <div style={{ background: "#fff", borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Add task</div>
              <input
                value={newTask.title}
                onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Task title"
                style={fieldStyle}
              />
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Task detail"
                rows={2}
                style={{ ...fieldStyle, resize: "vertical", marginTop: 8 }}
              />
              <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, priority: e.target.value }))}
                  style={{ ...fieldStyle, width: 150, margin: 0 }}
                >
                  <option value="low">low</option>
                  <option value="medium">medium</option>
                  <option value="high">high</option>
                  <option value="critical">critical</option>
                </select>
                <input
                  value={newTask.assignee}
                  onChange={(e) => setNewTask((prev) => ({ ...prev, assignee: e.target.value }))}
                  placeholder="Assignee"
                  style={{ ...fieldStyle, margin: 0, flex: 1, minWidth: 130 }}
                />
                <button onClick={submitTask} disabled={savingTask} style={primaryButtonStyle}>
                  {savingTask ? "Saving..." : "Save task"}
                </button>
              </div>
            </div>
            {tasks.length === 0 ? <Empty label="No tasks yet." /> : tasks.map((task) => (
              <div key={task.id} style={{ background: "#fff", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{task.title}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{task.status.replace(/_/g, " ")} · {task.priority}</div>
                {task.description && <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{task.description}</p>}
                {task.assignee && <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>Assignee: {task.assignee}</div>}
                {task.completedAt && <div style={{ fontSize: 11, color: "#2c7a4b", marginTop: 4 }}>Completed: {new Date(task.completedAt).toLocaleString()}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(110px, 1fr))", gap: 8, marginTop: 8 }}>
                  <select
                    value={getTaskDraft(task).status}
                    onChange={(e) => patchTaskDraft(task.id, { status: e.target.value })}
                    style={fieldStyle}
                  >
                    <option value="todo">todo</option>
                    <option value="in_progress">in progress</option>
                    <option value="blocked">blocked</option>
                    <option value="done">done</option>
                  </select>
                  <select
                    value={getTaskDraft(task).priority}
                    onChange={(e) => patchTaskDraft(task.id, { priority: e.target.value })}
                    style={fieldStyle}
                  >
                    <option value="low">low</option>
                    <option value="medium">medium</option>
                    <option value="high">high</option>
                    <option value="critical">critical</option>
                  </select>
                  <input
                    value={getTaskDraft(task).assignee}
                    onChange={(e) => patchTaskDraft(task.id, { assignee: e.target.value })}
                    placeholder="Assignee"
                    style={fieldStyle}
                  />
                  <input
                    type="date"
                    value={getTaskDraft(task).dueDate}
                    onChange={(e) => patchTaskDraft(task.id, { dueDate: e.target.value })}
                    style={fieldStyle}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => patchTaskDraft(task.id, getTaskDraft(task).completedAt ? { status: "todo", completedAt: null } : { status: "done", completedAt: new Date().toISOString() })}
                    style={{ ...secondaryButtonStyle, background: getTaskDraft(task).completedAt ? "#eceff1" : "#e8f5e9" }}
                  >
                    {getTaskDraft(task).completedAt ? "Mark not done" : "Mark done"}
                  </button>
                  <button
                    onClick={() => saveTaskCard(task)}
                    disabled={savingTaskUpdateId === task.id}
                    style={primaryButtonStyle}
                  >
                    {savingTaskUpdateId === task.id ? "Updating..." : "Update task"}
                  </button>
                </div>
              </div>
            ))}
          </Section>

          <Section title={`Stakeholders (${stakeholders.length})`}>
            <div style={{ background: "#fff", borderRadius: 6, padding: "12px 14px", marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Add stakeholder</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(140px, 1fr))", gap: 8 }}>
                <select
                  value={newStakeholder.type}
                  onChange={(e) => setNewStakeholder((prev) => ({ ...prev, type: e.target.value }))}
                  style={fieldStyle}
                >
                  <option value="organization">organization</option>
                  <option value="agency_official">agency_official</option>
                  <option value="legislator">legislator</option>
                  <option value="lobbyist">lobbyist</option>
                  <option value="pac">pac</option>
                  <option value="individual">individual</option>
                </select>
                <input
                  value={newStakeholder.name}
                  onChange={(e) => setNewStakeholder((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Name"
                  style={fieldStyle}
                />
                <input
                  value={newStakeholder.title}
                  onChange={(e) => setNewStakeholder((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Title"
                  style={fieldStyle}
                />
                <input
                  value={newStakeholder.organization}
                  onChange={(e) => setNewStakeholder((prev) => ({ ...prev, organization: e.target.value }))}
                  placeholder="Organization"
                  style={fieldStyle}
                />
                <input
                  value={newStakeholder.jurisdiction}
                  onChange={(e) => setNewStakeholder((prev) => ({ ...prev, jurisdiction: e.target.value }))}
                  placeholder="Jurisdiction"
                  style={fieldStyle}
                />
                <input
                  value={newStakeholder.tags}
                  onChange={(e) => setNewStakeholder((prev) => ({ ...prev, tags: e.target.value }))}
                  placeholder="Tags (comma separated)"
                  style={fieldStyle}
                />
              </div>
              <textarea
                value={newStakeholder.sourceSummary}
                onChange={(e) => setNewStakeholder((prev) => ({ ...prev, sourceSummary: e.target.value }))}
                placeholder="Source-backed summary"
                rows={2}
                style={{ ...fieldStyle, resize: "vertical", marginTop: 8 }}
              />
              <button onClick={submitStakeholder} disabled={savingStakeholder} style={{ ...primaryButtonStyle, marginTop: 8 }}>
                {savingStakeholder ? "Saving..." : "Save stakeholder"}
              </button>
            </div>
            {stakeholders.length === 0 ? <Empty label="No stakeholders yet." /> : stakeholders.map((stakeholder) => (
              <div key={stakeholder.id} style={{ background: "#fff", borderRadius: 6, padding: "10px 12px", marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{stakeholder.name}</div>
                <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{stakeholder.type} · {stakeholder.organization ?? stakeholder.jurisdiction ?? ""}</div>
                {stakeholder.sourceSummary && <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{stakeholder.sourceSummary}</p>}
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 style={{ marginBottom: 12 }}>{title}</h3>
      {children}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p style={{ color: "#888" }}>{label}</p>;
}

function AlertsList({ alerts, emptyLabel }: { alerts: Alert[]; emptyLabel: string }) {
  if (alerts.length === 0) return <Empty label={emptyLabel} />;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {alerts.map((alert) => (
        <div key={alert.id} style={{ background: "#fff", borderRadius: 6, padding: "10px 12px", borderLeft: `3px solid ${alert.relevanceScore >= 70 ? "#e74c3c" : alert.relevanceScore >= 40 ? "#e67e22" : "#95a5a6"}` }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{alert.title}</div>
          {alert.whyItMatters && <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{alert.whyItMatters}</p>}
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>{alert.status} · score {alert.relevanceScore}</div>
        </div>
      ))}
    </div>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  fontSize: 12,
  padding: "7px 9px",
  border: "1px solid #d7d7d7",
  borderRadius: 4,
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "7px 12px",
  fontSize: 12,
  background: "#16213e",
  color: "#fff",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "7px 12px",
  fontSize: 12,
  background: "#eceff1",
  color: "#1f2937",
  border: "1px solid #d0d7de",
  borderRadius: 4,
  cursor: "pointer",
};