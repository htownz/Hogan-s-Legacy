import { useState } from "react";
import { api, type Alert, type Activity, type Deliverable, type Stakeholder } from "../api";
import { useAsync } from "../hooks";

export function MatterDetailPage({ id }: { id: number }) {
  const [tab, setTab] = useState<"alerts" | "activities" | "briefs" | "stakeholders">("alerts");

  const { data: matter, loading, error, refetch } = useAsync(() => api.getMatter(id), [id]);
  const { data: matterAlerts } = useAsync(() => api.getMatterAlerts(id), [id]);
  const { data: matterActivities } = useAsync(() => api.getMatterActivities(id), [id]);
  const { data: matterBriefs } = useAsync(() => api.getMatterBriefs(id), [id]);
  const { data: matterStakeholders } = useAsync(() => api.getMatterStakeholders(id), [id]);

  if (loading) return <p>Loading matter...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;
  if (!matter) return <p>Matter not found</p>;

  const tabs = [
    { key: "alerts" as const, label: `Alerts (${(matterAlerts ?? []).length})` },
    { key: "activities" as const, label: `Activities (${(matterActivities ?? []).length})` },
    { key: "briefs" as const, label: `Briefs (${(matterBriefs ?? []).length})` },
    { key: "stakeholders" as const, label: `Stakeholders (${(matterStakeholders ?? []).length})` },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>{matter.name}</h1>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        {matter.clientName && <span>{matter.clientName} · </span>}
        {matter.practiceArea} · {matter.jurisdictionScope} · {matter.status}
      </p>
      {matter.description && <p style={{ fontSize: 14, marginBottom: 20 }}>{matter.description}</p>}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e0e0e0" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "8px 16px",
              border: "none",
              borderBottom: tab === t.key ? "2px solid #3498db" : "2px solid transparent",
              background: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? "#2c3e50" : "#888",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "alerts" && <AlertsTab alerts={matterAlerts ?? []} />}
      {tab === "activities" && <ActivitiesTab activities={matterActivities ?? []} />}
      {tab === "briefs" && <BriefsTab briefs={matterBriefs ?? []} />}
      {tab === "stakeholders" && <StakeholdersTab stakeholders={matterStakeholders ?? []} />}
    </div>
  );
}

function AlertsTab({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return <p style={{ color: "#888" }}>No alerts linked to this matter.</p>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {alerts.map((a) => (
        <div key={a.id} style={{
          background: "#fff",
          borderRadius: 6,
          padding: "12px 16px",
          borderLeft: `3px solid ${a.relevanceScore >= 70 ? "#e74c3c" : a.relevanceScore >= 40 ? "#e67e22" : "#95a5a6"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{a.title.slice(0, 100)}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: a.relevanceScore >= 70 ? "#e74c3c" : "#888" }}>
              {a.relevanceScore}
            </span>
          </div>
          {a.whyItMatters && <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{a.whyItMatters.slice(0, 250)}</p>}
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 6 }}>
            {a.status} · {new Date(a.createdAt).toLocaleDateString()}
          </div>
          {/* Scorecard */}
          {a.reasonsJson && a.reasonsJson.length > 0 && a.reasonsJson[0]?.evaluator && (
            <div style={{ marginTop: 8, fontSize: 11, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {a.reasonsJson.map((ev, i) => (
                <span key={i} style={{
                  padding: "2px 8px",
                  borderRadius: 10,
                  background: ev.evaluatorScore >= 15 ? "#27ae6022" : "#e0e0e0",
                  color: ev.evaluatorScore >= 15 ? "#27ae60" : "#666",
                }}>
                  {ev.evaluator.replace(/_/g, " ")}: {ev.evaluatorScore}/{ev.maxScore}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ActivitiesTab({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) return <p style={{ color: "#888" }}>No activities yet.</p>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {activities.map((a) => (
        <div key={a.id} style={{ background: "#fff", borderRadius: 6, padding: "10px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{a.summary}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            {a.type.replace(/_/g, " ")} · {new Date(a.createdAt).toLocaleString()}
          </div>
          {a.detailText && <p style={{ fontSize: 12, color: "#555", marginTop: 4 }}>{a.detailText}</p>}
        </div>
      ))}
    </div>
  );
}

function BriefsTab({ briefs }: { briefs: Deliverable[] }) {
  if (briefs.length === 0) return <p style={{ color: "#888" }}>No briefs generated yet.</p>;

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {briefs.map((b) => (
        <div key={b.id} style={{ background: "#fff", borderRadius: 6, padding: "12px 16px" }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{b.title}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            {b.type.replace(/_/g, " ")} · {b.generatedBy} · {new Date(b.createdAt).toLocaleDateString()}
          </div>
          {b.bodyMarkdown && (
            <pre style={{ fontSize: 12, color: "#555", marginTop: 8, whiteSpace: "pre-wrap", maxHeight: 300, overflow: "auto" }}>
              {b.bodyMarkdown}
            </pre>
          )}
        </div>
      ))}
    </div>
  );
}

function StakeholdersTab({ stakeholders }: { stakeholders: Stakeholder[] }) {
  if (stakeholders.length === 0) return <p style={{ color: "#888" }}>No stakeholders linked.</p>;

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {stakeholders.map((s) => (
        <div key={s.id} style={{ background: "#fff", borderRadius: 6, padding: "10px 16px" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
          <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
            {s.type} · {s.organization ?? ""} · {s.jurisdiction ?? ""}
          </div>
        </div>
      ))}
    </div>
  );
}
