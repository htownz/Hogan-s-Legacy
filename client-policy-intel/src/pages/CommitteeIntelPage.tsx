import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "wouter";
import {
  api,
  type CommitteeIntelFocusedBrief,
  type CommitteeIntelSession,
  type CommitteeIntelSessionDetail,
  type HearingEvent,
} from "../api";
import { DEFAULT_WORKSPACE_ID } from "../constants";
import { useAsync } from "../hooks";

const STATUS_COLORS: Record<string, string> = {
  planned: "#2563eb",
  monitoring: "#059669",
  paused: "#d97706",
  completed: "#6b7280",
};

const POSITION_COLORS: Record<string, string> = {
  support: "#047857",
  oppose: "#b91c1c",
  questioning: "#b45309",
  neutral: "#1d4ed8",
  monitoring: "#6b7280",
  unknown: "#6b7280",
};

const SPEAKER_ROLES = [
  "unknown",
  "chair",
  "member",
  "agency",
  "invited_witness",
  "public_witness",
  "staff",
  "moderator",
];

function formatHearingDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function splitLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinLines(values: string[]): string {
  return values.join("\n");
}

function statusLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function positionLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function SectionCard(props: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
        padding: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>{props.title}</h3>
          {props.subtitle && (
            <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{props.subtitle}</div>
          )}
        </div>
        {props.actions}
      </div>
      {props.children}
    </section>
  );
}

function Badge(props: { label: string; color: string; background?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: props.color,
        background: props.background ?? `${props.color}15`,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {props.label}
    </span>
  );
}

interface CommitteeIntelPageProps {
  hearingId?: number;
  sessionId?: number;
}

export function CommitteeIntelPage({ hearingId, sessionId }: CommitteeIntelPageProps) {
  const hearingWindow = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const to = new Date();
    to.setDate(to.getDate() + 60);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const [sessionRefreshNonce, setSessionRefreshNonce] = useState(0);
  const { data: hearings, loading: hearingsLoading, error: hearingsError } = useAsync(
    () => api.getHearings({ from: hearingWindow.from, to: hearingWindow.to }),
    [hearingWindow.from, hearingWindow.to],
  );
  const { data: sessions, loading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useAsync(
    () => api.getCommitteeIntelSessions({ workspaceId: DEFAULT_WORKSPACE_ID, from: hearingWindow.from }),
    [hearingWindow.from, sessionRefreshNonce],
  );

  const [selectedHearingId, setSelectedHearingId] = useState<number | null>(hearingId ?? null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(sessionId ?? null);
  const [sessionDetail, setSessionDetail] = useState<CommitteeIntelSessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const [addingSegment, setAddingSegment] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [brief, setBrief] = useState<CommitteeIntelFocusedBrief | null>(null);

  const [sessionForm, setSessionForm] = useState({
    title: "",
    status: "planned",
    focusTopics: "",
    interimCharges: "",
    clientContext: "",
    monitoringNotes: "",
    agendaUrl: "",
    videoUrl: "",
  });
  const [segmentForm, setSegmentForm] = useState({
    capturedAt: "",
    startedAtSecond: "",
    endedAtSecond: "",
    speakerName: "",
    speakerRole: "unknown",
    affiliation: "",
    transcriptText: "",
    invited: false,
  });
  const [briefIssue, setBriefIssue] = useState("");

  const upcomingHearings = useMemo(() => {
    return [...(hearings ?? [])].sort(
      (left, right) => new Date(left.hearingDate).getTime() - new Date(right.hearingDate).getTime(),
    );
  }, [hearings]);

  const selectedHearing = useMemo(() => {
    return upcomingHearings.find((hearing) => hearing.id === selectedHearingId) ?? null;
  }, [selectedHearingId, upcomingHearings]);

  const orderedSessions = useMemo(() => {
    return [...(sessions ?? [])].sort(
      (left, right) => new Date(left.hearingDate).getTime() - new Date(right.hearingDate).getTime(),
    );
  }, [sessions]);

  useEffect(() => {
    if (hearingId && selectedHearingId !== hearingId) {
      setSelectedHearingId(hearingId);
    }
  }, [hearingId, selectedHearingId]);

  useEffect(() => {
    if (sessionId && selectedSessionId !== sessionId) {
      setSelectedSessionId(sessionId);
    }
  }, [sessionId, selectedSessionId]);

  useEffect(() => {
    if (!selectedHearingId && upcomingHearings.length > 0) {
      setSelectedHearingId(hearingId ?? upcomingHearings[0].id);
    }
  }, [selectedHearingId, upcomingHearings, hearingId]);

  useEffect(() => {
    if (!sessions || !hearingId) return;
    const existing = sessions.find((session) => session.hearingId === hearingId);
    if (existing && selectedSessionId !== existing.id) {
      setSelectedSessionId(existing.id);
    }
  }, [sessions, hearingId, selectedSessionId]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedSessionId) {
      setSessionDetail(null);
      setDetailError(null);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    api.getCommitteeIntelSession(selectedSessionId)
      .then((detail) => {
        if (cancelled) return;
        setSessionDetail(detail);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setDetailError(err.message);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedSessionId]);

  useEffect(() => {
    if (!sessionDetail) {
      if (selectedHearing) {
        setSessionForm((current) => ({
          ...current,
          title: current.title || `${selectedHearing.committee} Committee Intelligence`,
        }));
      }
      return;
    }

    setSessionForm({
      title: sessionDetail.session.title,
      status: sessionDetail.session.status,
      focusTopics: joinLines(sessionDetail.session.focusTopicsJson),
      interimCharges: joinLines(sessionDetail.session.interimChargesJson),
      clientContext: sessionDetail.session.clientContext ?? "",
      monitoringNotes: sessionDetail.session.monitoringNotes ?? "",
      agendaUrl: sessionDetail.session.agendaUrl ?? "",
      videoUrl: sessionDetail.session.videoUrl ?? "",
    });

    if (sessionDetail.session.hearingId) {
      setSelectedHearingId(sessionDetail.session.hearingId);
    }
  }, [sessionDetail, selectedHearing]);

  function applySessionDetail(detail: CommitteeIntelSessionDetail) {
    setSessionDetail(detail);
    setSelectedSessionId(detail.session.id);
    setSelectedHearingId(detail.session.hearingId ?? selectedHearingId);
    setBrief(null);
    setActionError(null);
    setSessionRefreshNonce((value) => value + 1);
    refetchSessions();
  }

  async function handleCreateSession() {
    if (!selectedHearingId) return;
    setSavingSession(true);
    setActionError(null);
    try {
      const detail = await api.createCommitteeIntelSessionFromHearing({
        workspaceId: DEFAULT_WORKSPACE_ID,
        hearingId: selectedHearingId,
        title: sessionForm.title.trim() || undefined,
        status: sessionForm.status,
        focusTopics: splitLines(sessionForm.focusTopics),
        interimCharges: splitLines(sessionForm.interimCharges),
        clientContext: sessionForm.clientContext.trim() || undefined,
        monitoringNotes: sessionForm.monitoringNotes.trim() || undefined,
        agendaUrl: sessionForm.agendaUrl.trim() || undefined,
        videoUrl: sessionForm.videoUrl.trim() || undefined,
      });
      applySessionDetail(detail);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSession(false);
    }
  }

  async function handleSaveSession() {
    if (!sessionDetail) return;
    setSavingSession(true);
    setActionError(null);
    try {
      const detail = await api.updateCommitteeIntelSession(sessionDetail.session.id, {
        title: sessionForm.title.trim() || undefined,
        status: sessionForm.status,
        focusTopics: splitLines(sessionForm.focusTopics),
        interimCharges: splitLines(sessionForm.interimCharges),
        clientContext: sessionForm.clientContext.trim() || null,
        monitoringNotes: sessionForm.monitoringNotes.trim() || null,
        agendaUrl: sessionForm.agendaUrl.trim() || null,
        videoUrl: sessionForm.videoUrl.trim() || null,
      });
      applySessionDetail(detail);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSession(false);
    }
  }

  async function handleAnalyze() {
    if (!sessionDetail) return;
    setSavingSession(true);
    setActionError(null);
    try {
      const detail = await api.analyzeCommitteeIntelSession(sessionDetail.session.id);
      applySessionDetail(detail);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSession(false);
    }
  }

  async function handleAddSegment(event: FormEvent) {
    event.preventDefault();
    if (!sessionDetail) return;
    setAddingSegment(true);
    setActionError(null);
    try {
      const detail = await api.addCommitteeIntelSegment(sessionDetail.session.id, {
        capturedAt: segmentForm.capturedAt ? new Date(segmentForm.capturedAt).toISOString() : undefined,
        startedAtSecond: segmentForm.startedAtSecond ? Number(segmentForm.startedAtSecond) : null,
        endedAtSecond: segmentForm.endedAtSecond ? Number(segmentForm.endedAtSecond) : null,
        speakerName: segmentForm.speakerName.trim() || undefined,
        speakerRole: segmentForm.speakerRole,
        affiliation: segmentForm.affiliation.trim() || undefined,
        transcriptText: segmentForm.transcriptText,
        invited: segmentForm.invited,
      });
      applySessionDetail(detail);
      setSegmentForm((current) => ({
        ...current,
        startedAtSecond: "",
        endedAtSecond: "",
        speakerName: "",
        affiliation: "",
        transcriptText: "",
        invited: false,
      }));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setAddingSegment(false);
    }
  }

  async function handleGenerateBrief(event: FormEvent) {
    event.preventDefault();
    if (!sessionDetail || !briefIssue.trim()) return;
    setGeneratingBrief(true);
    setActionError(null);
    try {
      const nextBrief = await api.getCommitteeIntelFocusedBrief(sessionDetail.session.id, { issue: briefIssue.trim() });
      setBrief(nextBrief);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingBrief(false);
    }
  }

  const primarySession = sessionDetail?.session ?? null;

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #0f766e 100%)",
          color: "#f8fafc",
          borderRadius: 18,
          padding: 24,
          boxShadow: "0 20px 40px rgba(15, 23, 42, 0.18)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.1, textTransform: "uppercase", color: "#99f6e4" }}>
              Interim Monitoring
            </div>
            <h1 style={{ margin: "8px 0 10px", fontSize: 30, lineHeight: 1.1 }}>Committee Intelligence</h1>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "#cbd5e1" }}>
              Launch a live hearing session, paste transcript or caption chunks as the meeting unfolds, and continuously map who is advancing, questioning, or resisting each issue.
            </p>
          </div>
          <div style={{ display: "grid", gap: 10, minWidth: 240 }}>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#99f6e4", textTransform: "uppercase", letterSpacing: 0.5 }}>Tracked Sessions</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{orderedSessions.length}</div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 11, color: "#99f6e4", textTransform: "uppercase", letterSpacing: 0.5 }}>Upcoming Hearings</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>{upcomingHearings.length}</div>
            </div>
          </div>
        </div>
      </div>

      {(hearingsError || sessionsError || detailError || actionError) && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: 12, padding: 14, fontSize: 13 }}>
          {[hearingsError, sessionsError, detailError, actionError].filter(Boolean).join(" | ")}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        <SectionCard
          title="Upcoming Hearings"
          subtitle="Pick a hearing to launch or pre-stage a monitoring session"
        >
          <div style={{ display: "grid", gap: 10 }}>
            {hearingsLoading && <div style={{ fontSize: 13, color: "#64748b" }}>Loading hearings...</div>}
            {!hearingsLoading && upcomingHearings.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>No hearings are loaded for the current window.</div>
            )}
            {upcomingHearings.slice(0, 12).map((hearing) => {
              const selected = hearing.id === selectedHearingId;
              const existingSession = orderedSessions.find((session) => session.hearingId === hearing.id) ?? null;
              return (
                <button
                  key={hearing.id}
                  type="button"
                  onClick={() => {
                    setSelectedHearingId(hearing.id);
                    if (existingSession) setSelectedSessionId(existingSession.id);
                  }}
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 12,
                    border: selected ? "1px solid #0f766e" : "1px solid #e2e8f0",
                    background: selected ? "#f0fdfa" : "#f8fafc",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{hearing.committee}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{formatHearingDate(hearing.hearingDate)}</div>
                    </div>
                    <Badge label={hearing.chamber} color="#1d4ed8" />
                  </div>
                  {hearing.location && (
                    <div style={{ fontSize: 12, color: "#334155", marginTop: 8 }}>{hearing.location}</div>
                  )}
                  {existingSession && (
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                      <Badge
                        label={`Session ${statusLabel(existingSession.status)}`}
                        color={STATUS_COLORS[existingSession.status] ?? "#475569"}
                      />
                      <span style={{ fontSize: 12, color: "#0f766e", fontWeight: 700 }}>Open monitoring session</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Monitoring Sessions" subtitle="Existing committee-intelligence sessions in this workspace">
          <div style={{ display: "grid", gap: 10 }}>
            {sessionsLoading && <div style={{ fontSize: 13, color: "#64748b" }}>Loading sessions...</div>}
            {!sessionsLoading && orderedSessions.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>No committee-intelligence sessions have been created yet.</div>
            )}
            {orderedSessions.map((session) => {
              const selected = session.id === selectedSessionId;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    setSelectedSessionId(session.id);
                    setSelectedHearingId(session.hearingId ?? null);
                  }}
                  style={{
                    textAlign: "left",
                    padding: 14,
                    borderRadius: 12,
                    border: selected ? "1px solid #0f766e" : "1px solid #e2e8f0",
                    background: selected ? "#ecfeff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{session.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{formatHearingDate(session.hearingDate)}</div>
                    </div>
                    <Badge label={statusLabel(session.status)} color={STATUS_COLORS[session.status] ?? "#475569"} />
                  </div>
                  <div style={{ fontSize: 12, color: "#334155", marginTop: 8 }}>{session.committee} · {session.chamber}</div>
                  {session.liveSummary && (
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>{session.liveSummary}</div>
                  )}
                </button>
              );
            })}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 420px) minmax(0, 1fr)", gap: 18 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <SectionCard
            title={primarySession ? "Session Controls" : "Launch Session"}
            subtitle={selectedHearing ? `${selectedHearing.committee} · ${formatHearingDate(selectedHearing.hearingDate)}` : "Choose a hearing to get started"}
            actions={
              primarySession ? (
                <button type="button" onClick={handleAnalyze} disabled={savingSession} style={secondaryButtonStyle}>
                  Refresh Analysis
                </button>
              ) : undefined
            }
          >
            {selectedHearing && (
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 12, marginBottom: 14, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{selectedHearing.committee}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{selectedHearing.chamber} · {formatHearingDate(selectedHearing.hearingDate)}</div>
                {selectedHearing.location && <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>{selectedHearing.location}</div>}
                {selectedHearing.description && (
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 8, lineHeight: 1.5 }}>{selectedHearing.description}</div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gap: 12 }}>
              <label style={labelStyle}>
                Session Title
                <input
                  value={sessionForm.title}
                  onChange={(event) => setSessionForm((current) => ({ ...current, title: event.target.value }))}
                  placeholder="Business & Commerce Committee Intelligence"
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Status
                <select
                  value={sessionForm.status}
                  onChange={(event) => setSessionForm((current) => ({ ...current, status: event.target.value }))}
                  style={inputStyle}
                >
                  <option value="planned">Planned</option>
                  <option value="monitoring">Monitoring</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </label>

              <label style={labelStyle}>
                Focus Topics
                <textarea
                  value={sessionForm.focusTopics}
                  onChange={(event) => setSessionForm((current) => ({ ...current, focusTopics: event.target.value }))}
                  placeholder="critical infrastructure&#10;supply chain integrity&#10;electric grid security"
                  rows={4}
                  style={textareaStyle}
                />
              </label>

              <label style={labelStyle}>
                Interim Charges
                <textarea
                  value={sessionForm.interimCharges}
                  onChange={(event) => setSessionForm((current) => ({ ...current, interimCharges: event.target.value }))}
                  placeholder="Paste the full interim charge or hearing focus language"
                  rows={4}
                  style={textareaStyle}
                />
              </label>

              <label style={labelStyle}>
                Client Context
                <textarea
                  value={sessionForm.clientContext}
                  onChange={(event) => setSessionForm((current) => ({ ...current, clientContext: event.target.value }))}
                  placeholder="What matters to Hogan Legacy or the client in this hearing?"
                  rows={3}
                  style={textareaStyle}
                />
              </label>

              <label style={labelStyle}>
                Monitoring Notes
                <textarea
                  value={sessionForm.monitoringNotes}
                  onChange={(event) => setSessionForm((current) => ({ ...current, monitoringNotes: event.target.value }))}
                  placeholder="Operating assumptions, witness expectations, follow-up hooks"
                  rows={3}
                  style={textareaStyle}
                />
              </label>

              <label style={labelStyle}>
                Agenda URL
                <input
                  value={sessionForm.agendaUrl}
                  onChange={(event) => setSessionForm((current) => ({ ...current, agendaUrl: event.target.value }))}
                  placeholder="https://capitol.texas.gov/..."
                  style={inputStyle}
                />
              </label>

              <label style={labelStyle}>
                Video URL
                <input
                  value={sessionForm.videoUrl}
                  onChange={(event) => setSessionForm((current) => ({ ...current, videoUrl: event.target.value }))}
                  placeholder="Optional livestream or archive URL"
                  style={inputStyle}
                />
              </label>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!primarySession ? (
                  <button type="button" onClick={handleCreateSession} disabled={!selectedHearing || savingSession} style={primaryButtonStyle}>
                    {savingSession ? "Launching..." : "Launch Monitoring Session"}
                  </button>
                ) : (
                  <button type="button" onClick={handleSaveSession} disabled={savingSession} style={primaryButtonStyle}>
                    {savingSession ? "Saving..." : "Save Session"}
                  </button>
                )}
                {selectedHearing && (
                  <Link href="/calendar">
                    <span style={{ ...secondaryButtonStyle, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      Open Calendar
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </SectionCard>

          {primarySession && (
            <SectionCard title="Live Transcript Ingestion" subtitle="Paste captions, transcript chunks, or hearing notes as the meeting runs">
              <form onSubmit={handleAddSegment} style={{ display: "grid", gap: 12 }}>
                <label style={labelStyle}>
                  Captured At
                  <input
                    type="datetime-local"
                    value={segmentForm.capturedAt}
                    onChange={(event) => setSegmentForm((current) => ({ ...current, capturedAt: event.target.value }))}
                    style={inputStyle}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={labelStyle}>
                    Start Second
                    <input
                      value={segmentForm.startedAtSecond}
                      onChange={(event) => setSegmentForm((current) => ({ ...current, startedAtSecond: event.target.value }))}
                      placeholder="0"
                      style={inputStyle}
                    />
                  </label>
                  <label style={labelStyle}>
                    End Second
                    <input
                      value={segmentForm.endedAtSecond}
                      onChange={(event) => setSegmentForm((current) => ({ ...current, endedAtSecond: event.target.value }))}
                      placeholder="60"
                      style={inputStyle}
                    />
                  </label>
                </div>

                <label style={labelStyle}>
                  Speaker Name
                  <input
                    value={segmentForm.speakerName}
                    onChange={(event) => setSegmentForm((current) => ({ ...current, speakerName: event.target.value }))}
                    placeholder="Sen. Charles Schwertner"
                    style={inputStyle}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <label style={labelStyle}>
                    Speaker Role
                    <select
                      value={segmentForm.speakerRole}
                      onChange={(event) => setSegmentForm((current) => ({ ...current, speakerRole: event.target.value }))}
                      style={inputStyle}
                    >
                      {SPEAKER_ROLES.map((role) => (
                        <option key={role} value={role}>{statusLabel(role)}</option>
                      ))}
                    </select>
                  </label>
                  <label style={labelStyle}>
                    Affiliation
                    <input
                      value={segmentForm.affiliation}
                      onChange={(event) => setSegmentForm((current) => ({ ...current, affiliation: event.target.value }))}
                      placeholder="ERCOT"
                      style={inputStyle}
                    />
                  </label>
                </div>

                <label style={{ ...labelStyle, gap: 8, flexDirection: "row", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={segmentForm.invited}
                    onChange={(event) => setSegmentForm((current) => ({ ...current, invited: event.target.checked }))}
                  />
                  Invited witness or invited agency testimony
                </label>

                <label style={labelStyle}>
                  Transcript Chunk
                  <textarea
                    value={segmentForm.transcriptText}
                    onChange={(event) => setSegmentForm((current) => ({ ...current, transcriptText: event.target.value }))}
                    placeholder="Paste the caption chunk or hearing note here..."
                    rows={8}
                    style={textareaStyle}
                  />
                </label>

                <button type="submit" disabled={addingSegment || !segmentForm.transcriptText.trim()} style={primaryButtonStyle}>
                  {addingSegment ? "Analyzing Segment..." : "Add Segment"}
                </button>
              </form>
            </SectionCard>
          )}
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {detailLoading && (
            <SectionCard title="Session Analysis">
              <div style={{ fontSize: 13, color: "#64748b" }}>Loading committee-intelligence analysis...</div>
            </SectionCard>
          )}

          {!detailLoading && !primarySession && (
            <SectionCard title="Session Analysis" subtitle="No monitoring session selected yet">
              <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                Choose an upcoming hearing and launch a monitoring session to start tracking live testimony, issue clusters, elected-member questions, and witness positioning.
              </div>
            </SectionCard>
          )}

          {!detailLoading && primarySession && sessionDetail && (
            <>
              <SectionCard
                title={primarySession.title}
                subtitle={`${primarySession.committee} · ${primarySession.chamber} · ${formatHearingDate(primarySession.hearingDate)}`}
                actions={<Badge label={statusLabel(primarySession.status)} color={STATUS_COLORS[primarySession.status] ?? "#475569"} />}
              >
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
                  <div style={statCardStyle}>
                    <div style={statLabelStyle}>Segments</div>
                    <div style={statValueStyle}>{sessionDetail.analysis.totalSegments}</div>
                  </div>
                  <div style={statCardStyle}>
                    <div style={statLabelStyle}>Signals</div>
                    <div style={statValueStyle}>{sessionDetail.analysis.totalSignals}</div>
                  </div>
                  <div style={statCardStyle}>
                    <div style={statLabelStyle}>Tracked Entities</div>
                    <div style={statValueStyle}>{sessionDetail.analysis.trackedEntities}</div>
                  </div>
                  <div style={statCardStyle}>
                    <div style={statLabelStyle}>Invited Witnesses</div>
                    <div style={statValueStyle}>{sessionDetail.analysis.invitedWitnessCount}</div>
                  </div>
                </div>

                <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>{sessionDetail.analysis.summary}</div>

                {(primarySession.agendaUrl || primarySession.videoUrl) && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                    {primarySession.agendaUrl && (
                      <a href={primarySession.agendaUrl} target="_blank" rel="noreferrer" style={secondaryLinkStyle}>
                        Open Agenda
                      </a>
                    )}
                    {primarySession.videoUrl && (
                      <a href={primarySession.videoUrl} target="_blank" rel="noreferrer" style={secondaryLinkStyle}>
                        Open Video
                      </a>
                    )}
                  </div>
                )}
              </SectionCard>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
                <SectionCard title="Top Issues" subtitle="What the hearing is orbiting around right now">
                  <div style={{ display: "grid", gap: 10 }}>
                    {sessionDetail.analysis.issueCoverage.length === 0 && (
                      <div style={{ fontSize: 13, color: "#64748b" }}>No issue clusters have been extracted yet.</div>
                    )}
                    {sessionDetail.analysis.issueCoverage.slice(0, 8).map((issue) => (
                      <div key={issue.issueTag} style={{ background: "#f8fafc", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{issue.label}</div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>{issue.mentionCount} mentions</div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                          <Badge label={`support ${issue.supportCount}`} color="#047857" />
                          <Badge label={`oppose ${issue.opposeCount}`} color="#b91c1c" />
                          <Badge label={`questions ${issue.questioningCount}`} color="#b45309" />
                        </div>
                        {issue.keyEntities.length > 0 && (
                          <div style={{ fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>
                            {issue.keyEntities.join(", ")}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Focused Brief" subtitle="Generate an issue-specific client readout from the live session">
                  <form onSubmit={handleGenerateBrief} style={{ display: "grid", gap: 12 }}>
                    <label style={labelStyle}>
                      Issue
                      <input
                        value={briefIssue}
                        onChange={(event) => setBriefIssue(event.target.value)}
                        placeholder="electric grid security"
                        style={inputStyle}
                      />
                    </label>
                    <button type="submit" disabled={generatingBrief || !briefIssue.trim()} style={primaryButtonStyle}>
                      {generatingBrief ? "Building Brief..." : "Generate Focused Brief"}
                    </button>
                  </form>
                  {brief && (
                    <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
                      <div style={{ background: "#f8fafc", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{brief.issue}</div>
                        <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{brief.summary}</div>
                      </div>
                      <div style={{ display: "grid", gap: 8 }}>
                        {brief.recommendations.map((recommendation) => (
                          <div key={recommendation} style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, padding: 10, borderRadius: 10, background: "#ecfeff", border: "1px solid #bae6fd" }}>
                            {recommendation}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </SectionCard>
              </div>

              <SectionCard title="Key Moments" subtitle="High-signal segments to review or clip for follow-up">
                <div style={{ display: "grid", gap: 10 }}>
                  {sessionDetail.analysis.keyMoments.length === 0 && (
                    <div style={{ fontSize: 13, color: "#64748b" }}>No high-signal moments have been extracted yet.</div>
                  )}
                  {sessionDetail.analysis.keyMoments.map((moment) => (
                    <div key={moment.segmentId} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <Badge label={moment.timestampLabel} color="#1d4ed8" />
                          <Badge label={positionLabel(moment.position)} color={POSITION_COLORS[moment.position] ?? "#475569"} />
                          <Badge label={`impact ${moment.importance}`} color="#0f766e" />
                        </div>
                        {moment.speakerName && <div style={{ fontSize: 12, color: "#64748b" }}>{moment.speakerName}</div>}
                      </div>
                      <div style={{ marginTop: 10, fontSize: 13, color: "#0f172a", lineHeight: 1.6 }}>{moment.summary}</div>
                      {moment.issueTags.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          {moment.issueTags.map((tag) => (
                            <Badge key={tag} label={statusLabel(tag)} color="#0f766e" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
                <SectionCard title="Elected Focus" subtitle="Which members are pressing hardest on the issues">
                  <div style={{ display: "grid", gap: 10 }}>
                    {sessionDetail.analysis.electedFocus.length === 0 && (
                      <div style={{ fontSize: 13, color: "#64748b" }}>No member questioning or positioning has been isolated yet.</div>
                    )}
                    {sessionDetail.analysis.electedFocus.map((entry) => (
                      <EntitySummaryCard key={`${entry.entityName}-${entry.entityType}`} entry={entry} />
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Witness and Agency Activity" subtitle="Who is testifying, updating, or shaping the record">
                  <div style={{ display: "grid", gap: 10 }}>
                    {sessionDetail.analysis.activeWitnesses.length === 0 && (
                      <div style={{ fontSize: 13, color: "#64748b" }}>No witnesses or agencies have been isolated yet.</div>
                    )}
                    {sessionDetail.analysis.activeWitnesses.map((entry) => (
                      <EntitySummaryCard key={`${entry.entityName}-${entry.entityType}`} entry={entry} />
                    ))}
                  </div>
                </SectionCard>
              </div>

              <SectionCard title="Position Map" subtitle="Who is lining up where, issue by issue">
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                    <thead>
                      <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12 }}>
                        <th style={tableHeadStyle}>Entity</th>
                        <th style={tableHeadStyle}>Issue</th>
                        <th style={tableHeadStyle}>Position</th>
                        <th style={tableHeadStyle}>Confidence</th>
                        <th style={tableHeadStyle}>Mentions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessionDetail.analysis.positionMap.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ padding: 14, fontSize: 13, color: "#64748b" }}>No position signals have been extracted yet.</td>
                        </tr>
                      )}
                      {sessionDetail.analysis.positionMap.map((row, index) => (
                        <tr key={`${row.entityName}-${row.issueTag}-${index}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={tableCellStyle}>
                            <div style={{ fontWeight: 700, color: "#0f172a" }}>{row.entityName}</div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{row.entityType}{row.invited ? " · invited" : ""}</div>
                          </td>
                          <td style={tableCellStyle}>{row.label}</td>
                          <td style={tableCellStyle}>
                            <Badge label={positionLabel(row.position)} color={POSITION_COLORS[row.position] ?? "#475569"} />
                          </td>
                          <td style={tableCellStyle}>{row.confidence.toFixed(2)}</td>
                          <td style={tableCellStyle}>{row.mentionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>

              <SectionCard title="Transcript Timeline" subtitle="Most recent ingested hearing segments">
                <div style={{ display: "grid", gap: 10 }}>
                  {sessionDetail.segments.length === 0 && (
                    <div style={{ fontSize: 13, color: "#64748b" }}>No transcript has been ingested yet.</div>
                  )}
                  {sessionDetail.segments.slice().reverse().slice(0, 12).map((segment) => (
                    <div key={segment.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                            {segment.speakerName || segment.affiliation || "Unknown speaker"}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                            {new Date(segment.capturedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                            {segment.affiliation ? ` · ${segment.affiliation}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                          <Badge label={statusLabel(segment.speakerRole)} color="#1d4ed8" />
                          <Badge label={positionLabel(segment.position)} color={POSITION_COLORS[segment.position] ?? "#475569"} />
                        </div>
                      </div>
                      {segment.summary && (
                        <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginTop: 10 }}>{segment.summary}</div>
                      )}
                      <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginTop: 10 }}>{segment.transcriptText}</div>
                      {segment.issueTagsJson.length > 0 && (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                          {segment.issueTagsJson.map((tag) => (
                            <Badge key={tag} label={statusLabel(tag)} color="#0f766e" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function EntitySummaryCard(props: {
  entry: CommitteeIntelSessionDetail["analysis"]["electedFocus"][number];
}) {
  const entry = props.entry;
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{entry.entityName}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {entry.entityType}
            {entry.affiliation ? ` · ${entry.affiliation}` : ""}
            {entry.invited ? " · invited" : ""}
          </div>
        </div>
        <Badge label={`${entry.mentionCount} mentions`} color="#0f766e" />
      </div>

      {entry.primaryIssues.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {entry.primaryIssues.map((issue) => (
            <Badge key={issue} label={issue} color="#1d4ed8" />
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {entry.positions.slice(0, 3).map((position) => (
          <div key={`${entry.entityName}-${position.issueTag}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, color: "#334155" }}>
            <span>{position.label}</span>
            <span style={{ color: POSITION_COLORS[position.position] ?? "#475569", fontWeight: 700 }}>
              {positionLabel(position.position)} · {position.mentionCount}
            </span>
          </div>
        ))}
      </div>

      {entry.stakeholderId && (
        <div style={{ marginTop: 10 }}>
          <Link href={`/stakeholders/${entry.stakeholderId}`}>
            <span style={{ fontSize: 12, color: "#0f766e", fontWeight: 700, cursor: "pointer" }}>Open stakeholder record</span>
          </Link>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#334155",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "10px 12px",
  fontSize: 13,
  background: "#fff",
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 100,
  resize: "vertical",
  fontFamily: "inherit",
};

const primaryButtonStyle: React.CSSProperties = {
  border: "none",
  borderRadius: 10,
  background: "linear-gradient(135deg, #0f766e 0%, #0f172a 100%)",
  color: "#fff",
  padding: "11px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  color: "#0f172a",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryLinkStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  color: "#0f172a",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
};

const statCardStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const statLabelStyle: React.CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const statValueStyle: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
  marginTop: 6,
};

const tableHeadStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontWeight: 700,
};

const tableCellStyle: React.CSSProperties = {
  padding: "12px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "top",
};