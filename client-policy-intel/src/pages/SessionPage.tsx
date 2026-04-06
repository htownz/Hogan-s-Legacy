import { useState, useCallback } from "react";
import { api, type SessionDashboard, type SessionMilestone, type ClientAction } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

// ── Phase Badge ──────────────────────────────────────────────────────────────

const PHASE_COLORS: Record<string, string> = {
  interim: "#95a5a6",
  pre_filing: "#3498db",
  filing_period: "#2980b9",
  committee_hearings: "#f39c12",
  floor_action: "#e74c3c",
  conference: "#9b59b6",
  enrollment: "#1abc9c",
  post_session: "#2c3e50",
  special_session: "#c0392b",
};

const PHASE_LABELS: Record<string, string> = {
  interim: "Interim",
  pre_filing: "Pre-Filing",
  filing_period: "Filing Period",
  committee_hearings: "Committee Hearings",
  floor_action: "Floor Action",
  conference: "Conference",
  enrollment: "Enrollment",
  post_session: "Post-Session",
  special_session: "Special Session",
};

function PhaseBadge({ phase }: { phase: string }) {
  return (
    <span style={{
      background: PHASE_COLORS[phase] ?? "#555",
      color: "#fff",
      padding: "4px 14px",
      borderRadius: 16,
      fontSize: 13,
      fontWeight: 600,
      letterSpacing: 0.5,
    }}>
      {PHASE_LABELS[phase] ?? phase}
    </span>
  );
}

// ── Milestone Timeline ───────────────────────────────────────────────────────

function MilestoneTimeline({ milestones }: { milestones: SessionMilestone[] }) {
  if (milestones.length === 0) return <div style={{ color: "#888" }}>No milestones</div>;

  return (
    <div style={{ position: "relative", paddingLeft: 24 }}>
      {/* Vertical line */}
      <div style={{
        position: "absolute", left: 9, top: 4, bottom: 4,
        width: 2, background: "#ecf0f1",
      }} />

      {milestones.map((m) => {
        const isPast = new Date(m.dueDate) < new Date();
        const isCompleted = m.status === "completed";
        const isOverdue = isPast && !isCompleted;
        const dotColor = isCompleted ? "#27ae60" : isOverdue ? "#e74c3c" : "#3498db";

        return (
          <div key={m.id} style={{ position: "relative", marginBottom: 16 }}>
            {/* Dot */}
            <div style={{
              position: "absolute", left: -19, top: 4,
              width: 14, height: 14, borderRadius: "50%",
              background: dotColor, border: "2px solid #fff",
              boxShadow: "0 0 0 2px " + dotColor,
            }} />

            <div>
              <div style={{
                fontWeight: 600, fontSize: 14,
                color: isOverdue ? "#e74c3c" : "#2c3e50",
              }}>
                {m.title}
                {isOverdue && <span style={{ fontSize: 11, marginLeft: 8, color: "#e74c3c" }}>OVERDUE</span>}
                {isCompleted && <span style={{ fontSize: 11, marginLeft: 8, color: "#27ae60" }}>✓ DONE</span>}
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#888", marginTop: 2 }}>
                <span>Due: {new Date(m.dueDate).toLocaleDateString()}</span>
                <PhaseBadge phase={m.phase} />
                {m.assignee && <span>Assigned: {m.assignee}</span>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Action Card ──────────────────────────────────────────────────────────────

const ACTION_TYPE_ICONS: Record<string, string> = {
  testimony_prep: "🎤",
  legislator_meeting: "🤝",
  position_letter: "✉️",
  coalition_outreach: "🤲",
  media_response: "📺",
  amendment_draft: "📝",
  fiscal_note_review: "💰",
  witness_coordination: "👥",
  client_briefing: "📋",
  strategy_pivot: "🔄",
  opposition_research: "🔍",
  grassroots_activation: "📢",
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#e74c3c",
  high: "#e67e22",
  medium: "#f39c12",
  low: "#95a5a6",
};

function ActionCard({ action, onUpdate }: { action: ClientAction; onUpdate: () => void }) {
  const [updating, setUpdating] = useState(false);

  const handleComplete = useCallback(async () => {
    setUpdating(true);
    try {
      await api.updateClientAction(action.id, { status: "completed" });
      onUpdate();
    } finally {
      setUpdating(false);
    }
  }, [action.id, onUpdate]);

  return (
    <div style={{
      background: "#fff", borderRadius: 8, padding: 14,
      borderLeft: `4px solid ${PRIORITY_COLORS[action.priority] ?? "#ddd"}`,
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
      display: "flex", alignItems: "center", gap: 12,
    }}>
      <span style={{ fontSize: 24 }}>
        {ACTION_TYPE_ICONS[action.actionType] ?? "📌"}
      </span>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: "#2c3e50" }}>{action.title}</div>
        <div style={{ display: "flex", gap: 8, fontSize: 12, color: "#888", marginTop: 2, flexWrap: "wrap" }}>
          <span style={{
            background: PRIORITY_COLORS[action.priority] ?? "#ddd",
            color: "#fff", padding: "1px 8px", borderRadius: 10, fontSize: 11,
          }}>
            {action.priority}
          </span>
          <span>{action.actionType.replace(/_/g, " ")}</span>
          {action.dueDate && <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>}
          {action.assignee && <span>→ {action.assignee}</span>}
        </div>
      </div>
      {action.status !== "completed" && (
        <button
          onClick={handleComplete}
          disabled={updating}
          style={{
            padding: "6px 14px", background: "#27ae60", color: "#fff",
            border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12,
            opacity: updating ? 0.6 : 1,
          }}
        >
          ✓ Done
        </button>
      )}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function SessionPage() {
  const [workspaceId] = useState(DEFAULT_WORKSPACE_ID);
  const [transitioning, setTransitioning] = useState(false);
  const [selectedNextPhase, setSelectedNextPhase] = useState("");

  const { data: dashboard, loading, error, refetch } = useAsync(
    () => api.getSessionDashboard(workspaceId),
    [workspaceId],
  );

  const handleInitialize = useCallback(async () => {
    await api.initializeSession(workspaceId, 89);
    refetch();
  }, [workspaceId, refetch]);

  const handleTransition = useCallback(async () => {
    if (!selectedNextPhase) return;
    setTransitioning(true);
    try {
      await api.executePhaseTransition(workspaceId, selectedNextPhase);
      refetch();
    } finally {
      setTransitioning(false);
      setSelectedNextPhase("");
    }
  }, [workspaceId, selectedNextPhase, refetch]);

  if (loading) return <div style={{ padding: 24 }}>Loading session data...</div>;
  if (error) return <div style={{ padding: 24, color: "#e74c3c" }}>Error: {error}</div>;

  // No active session
  if (!dashboard || !("session" in dashboard) || !dashboard.session) {
    return (
      <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
        <h1 style={{ color: "#1a365d", fontSize: 28 }}>🏛️ Session Lifecycle Manager</h1>
        <p style={{ color: "#555", fontSize: 16, marginBottom: 24 }}>
          No active legislative session. Initialize the Texas 89th Legislature session to get started.
        </p>
        <button
          onClick={handleInitialize}
          style={{
            padding: "12px 32px", background: "#1a365d", color: "#fff",
            border: "none", borderRadius: 8, cursor: "pointer", fontSize: 16, fontWeight: 600,
          }}
        >
          Initialize Texas 89R Session
        </button>
      </div>
    );
  }

  const d = dashboard as SessionDashboard;

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, color: "#1a365d", fontSize: 28 }}>🏛️ Session Lifecycle Manager</h1>
          <p style={{ margin: "4px 0 0", color: "#555", fontSize: 14 }}>
            Texas {d.session.sessionNumber}th Legislature — {d.session.sessionType} session
          </p>
        </div>
        <PhaseBadge phase={d.currentPhase} />
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16, marginBottom: 24,
      }}>
        {d.daysRemaining !== null && (
          <div style={{
            background: d.daysRemaining < 30 ? "#fdedec" : "#fff",
            borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            borderLeft: `4px solid ${d.daysRemaining < 30 ? "#e74c3c" : "#3498db"}`,
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: d.daysRemaining < 30 ? "#e74c3c" : "#1a365d" }}>
              {d.daysRemaining}
            </div>
            <div style={{ fontSize: 13, color: "#888" }}>Days Remaining</div>
          </div>
        )}
        <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#1a365d" }}>
            {d.stats.completedMilestones}/{d.stats.totalMilestones}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>Milestones Complete</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: d.stats.pendingActions > 5 ? "#e67e22" : "#1a365d" }}>
            {d.stats.pendingActions}
          </div>
          <div style={{ fontSize: 13, color: "#888" }}>Pending Actions</div>
        </div>
        {d.overdueMilestones.length > 0 && (
          <div style={{
            background: "#fdedec", borderRadius: 8, padding: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            borderLeft: "4px solid #e74c3c",
          }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#e74c3c" }}>{d.overdueMilestones.length}</div>
            <div style={{ fontSize: 13, color: "#888" }}>Overdue Items</div>
          </div>
        )}
      </div>

      {/* Phase Guidance */}
      <div style={{
        background: "#eaf2f8", borderRadius: 8, padding: 20, marginBottom: 24,
        border: "1px solid #aed6f1",
      }}>
        <h3 style={{ margin: "0 0 8px", color: "#1a365d" }}>📋 Phase Guidance</h3>
        <p style={{ color: "#2c3e50", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          {d.phaseGuidance.currentPhaseDescription}
        </p>
        {d.phaseGuidance.keyPriorities.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <strong style={{ fontSize: 13, color: "#1a365d" }}>Key Priorities:</strong>
            <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
              {d.phaseGuidance.keyPriorities.map((p, i) => (
                <li key={i} style={{ fontSize: 13, color: "#2c3e50" }}>{p}</li>
              ))}
            </ul>
          </div>
        )}
        {d.phaseGuidance.warnings.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {d.phaseGuidance.warnings.map((w, i) => (
              <div key={i} style={{
                background: "#fadbd8", padding: "6px 12px", borderRadius: 4,
                fontSize: 13, color: "#c0392b", marginTop: 4,
              }}>
                ⚠️ {w}
              </div>
            ))}
          </div>
        )}

        {/* Phase Transition */}
        {d.phaseGuidance.nextPhase && (
          <div style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={selectedNextPhase}
              onChange={(e) => setSelectedNextPhase(e.target.value)}
              style={{
                padding: "8px 12px", border: "1px solid #aed6f1", borderRadius: 6,
                fontSize: 14, background: "#fff",
              }}
            >
              <option value="">Select next phase...</option>
              {Object.entries(PHASE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleTransition}
              disabled={transitioning || !selectedNextPhase}
              style={{
                padding: "8px 20px", background: "#1a365d", color: "#fff",
                border: "none", borderRadius: 6, cursor: "pointer", fontSize: 14,
                opacity: transitioning || !selectedNextPhase ? 0.6 : 1,
              }}
            >
              {transitioning ? "Transitioning..." : "Execute Transition"}
            </button>
          </div>
        )}
      </div>

      {/* Two-column layout: Milestones + Actions */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Milestones */}
        <div>
          <h3 style={{ color: "#1a365d", marginBottom: 12 }}>🎯 Session Milestones</h3>
          <MilestoneTimeline milestones={d.milestones} />
        </div>

        {/* Active Actions */}
        <div>
          <h3 style={{ color: "#1a365d", marginBottom: 12 }}>
            ⚡ Active Actions ({d.activeActions.length})
          </h3>
          {d.activeActions.length === 0 ? (
            <div style={{ color: "#888", fontSize: 13 }}>
              No pending actions. Execute a phase transition to generate tasks.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {d.activeActions.map((a) => (
                <ActionCard key={a.id} action={a} onUpdate={refetch} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
