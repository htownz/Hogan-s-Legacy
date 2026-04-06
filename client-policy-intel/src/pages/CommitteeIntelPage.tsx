import { useEffect, useMemo, useState, type FormEvent, lazy, Suspense } from "react";
import { Link } from "wouter";
import {
  api,
  type CommitteeIntelFocusedBrief,
  type CommitteeIntelPostHearingRecap,
  type CommitteeIntelSessionDetail,
  type CommitteeIntelTranscriptSyncResult,
} from "../api";
import { DEFAULT_WORKSPACE_ID } from "../constants";
import { useAsync } from "../hooks";

const CommitteeIntelSessionInsights = lazy(() =>
  import("./committee-intel/CommitteeIntelSessionInsights").then((mod) => ({ default: mod.CommitteeIntelSessionInsights })),
);

const STATUS_COLORS: Record<string, string> = {
  planned: "#2563eb",
  monitoring: "#059669",
  paused: "#d97706",
  completed: "#6b7280",
};

const SESSION_STATUS_PRIORITY: Record<string, number> = {
  monitoring: 0,
  planned: 1,
  paused: 2,
  completed: 3,
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

const TRANSCRIPT_SOURCE_TYPES = ["official", "manual", "webvtt", "json", "text"];

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
    from.setDate(from.getDate() - 45);
    const to = new Date();
    to.setDate(to.getDate() + 120);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const [sessionRefreshNonce, setSessionRefreshNonce] = useState(0);
  const [syncingHearings, setSyncingHearings] = useState(false);
  const { data: hearings, loading: hearingsLoading, error: hearingsError, refetch: refetchHearings } = useAsync(
    () => api.getHearings({ workspaceId: DEFAULT_WORKSPACE_ID, from: hearingWindow.from, to: hearingWindow.to }),
    [hearingWindow.from, hearingWindow.to],
  );
  const { data: sessions, loading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useAsync(
    () => api.getCommitteeIntelSessions({ workspaceId: DEFAULT_WORKSPACE_ID }),
    [sessionRefreshNonce],
  );

  const [selectedHearingId, setSelectedHearingId] = useState<number | null>(hearingId ?? null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(sessionId ?? null);
  const [sessionDetail, setSessionDetail] = useState<CommitteeIntelSessionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [maintenanceNotice, setMaintenanceNotice] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);
  const [deletingSession, setDeletingSession] = useState(false);
  const [resettingSession, setResettingSession] = useState(false);
  const [rebuildingSession, setRebuildingSession] = useState(false);
  const [addingSegment, setAddingSegment] = useState(false);
  const [syncingFeed, setSyncingFeed] = useState(false);
  const [generatingBrief, setGeneratingBrief] = useState(false);
  const [generatingRecap, setGeneratingRecap] = useState(false);
  const [brief, setBrief] = useState<CommitteeIntelFocusedBrief | null>(null);
  const [recap, setRecap] = useState<CommitteeIntelPostHearingRecap | null>(null);
  const [syncResult, setSyncResult] = useState<CommitteeIntelTranscriptSyncResult | null>(null);

  const [sessionForm, setSessionForm] = useState({
    title: "",
    status: "planned",
    focusTopics: "",
    interimCharges: "",
    clientContext: "",
    monitoringNotes: "",
    agendaUrl: "",
    videoUrl: "",
    transcriptSourceType: "official",
    transcriptSourceUrl: "",
    autoIngestEnabled: false,
    autoIngestIntervalSeconds: "120",
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
    const now = Date.now();
    return [...(hearings ?? [])]
      .filter((hearing) => new Date(hearing.hearingDate).getTime() >= now)
      .sort((left, right) => new Date(left.hearingDate).getTime() - new Date(right.hearingDate).getTime());
  }, [hearings]);

  const recentHearings = useMemo(() => {
    const now = Date.now();
    return [...(hearings ?? [])]
      .filter((hearing) => new Date(hearing.hearingDate).getTime() < now)
      .sort((left, right) => new Date(right.hearingDate).getTime() - new Date(left.hearingDate).getTime())
      .slice(0, 8);
  }, [hearings]);

  const availableHearings = useMemo(() => {
    return [...upcomingHearings, ...recentHearings];
  }, [recentHearings, upcomingHearings]);

  const selectedHearing = useMemo(() => {
    return availableHearings.find((hearing) => hearing.id === selectedHearingId) ?? null;
  }, [availableHearings, selectedHearingId]);

  const orderedSessions = useMemo(() => {
    const now = Date.now();
    return [...(sessions ?? [])].sort((left, right) => {
      const statusDelta =
        (SESSION_STATUS_PRIORITY[left.status] ?? 99) -
        (SESSION_STATUS_PRIORITY[right.status] ?? 99);
      if (statusDelta !== 0) return statusDelta;

      const leftTime = new Date(left.hearingDate).getTime();
      const rightTime = new Date(right.hearingDate).getTime();
      const leftIsFuture = leftTime >= now;
      const rightIsFuture = rightTime >= now;

      if (leftIsFuture !== rightIsFuture) {
        return leftIsFuture ? -1 : 1;
      }

      return leftIsFuture ? leftTime - rightTime : rightTime - leftTime;
    });
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
    if (!selectedHearingId && availableHearings.length > 0) {
      setSelectedHearingId(hearingId ?? availableHearings[0].id);
    }
  }, [selectedHearingId, availableHearings, hearingId]);

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
      transcriptSourceType: sessionDetail.session.transcriptSourceType,
      transcriptSourceUrl: sessionDetail.session.transcriptSourceUrl ?? "",
      autoIngestEnabled: sessionDetail.session.autoIngestEnabled,
      autoIngestIntervalSeconds: String(sessionDetail.session.autoIngestIntervalSeconds),
    });
    setRecap(sessionDetail.analysis.postHearingRecap);

    if (sessionDetail.session.hearingId) {
      setSelectedHearingId(sessionDetail.session.hearingId);
    }
  }, [sessionDetail, selectedHearing]);

  useEffect(() => {
    if (!selectedSessionId || !sessionDetail?.session.autoIngestEnabled) return;

    const timer = window.setInterval(() => {
      api.getCommitteeIntelSession(selectedSessionId)
        .then((detail) => {
          setSessionDetail(detail);
          setRecap(detail.analysis.postHearingRecap);
        })
        .catch(() => {
          // Silent background refresh failure; surfaced on the next manual action.
        });
    }, 30_000);

    return () => window.clearInterval(timer);
  }, [selectedSessionId, sessionDetail?.session.autoIngestEnabled]);

  function applySessionDetail(detail: CommitteeIntelSessionDetail) {
    setSessionDetail(detail);
    setSelectedSessionId(detail.session.id);
    setSelectedHearingId(detail.session.hearingId ?? selectedHearingId);
    setBrief(null);
    setRecap(detail.analysis.postHearingRecap);
    setActionError(null);
    setSessionRefreshNonce((value) => value + 1);
    refetchSessions();
  }

  async function handleSyncHearings() {
    setSyncingHearings(true);
    setActionError(null);
    setMaintenanceNotice(null);
    try {
      const result = await api.syncHearings(DEFAULT_WORKSPACE_ID);
      await refetchHearings();
      setMaintenanceNotice(
        `Synced hearings for workspace ${DEFAULT_WORKSPACE_ID}: created ${result.created} and skipped ${result.skipped} existing record${result.skipped === 1 ? "" : "s"}.`,
      );
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncingHearings(false);
    }
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
        transcriptSourceType: sessionForm.transcriptSourceType,
        transcriptSourceUrl: sessionForm.transcriptSourceUrl.trim() || undefined,
        autoIngestEnabled: sessionForm.autoIngestEnabled,
        autoIngestIntervalSeconds: Number(sessionForm.autoIngestIntervalSeconds || 120),
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
        transcriptSourceType: sessionForm.transcriptSourceType,
        transcriptSourceUrl: sessionForm.transcriptSourceUrl.trim() || null,
        autoIngestEnabled: sessionForm.autoIngestEnabled,
        autoIngestIntervalSeconds: Number(sessionForm.autoIngestIntervalSeconds || 120),
      });
      applySessionDetail(detail);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSavingSession(false);
    }
  }

  async function handleDeleteSession() {
    if (!sessionDetail) return;
    const confirmDelete = window.confirm(`Delete monitoring session "${sessionDetail.session.title}"? This removes all synced segments, signals, and recap data for the session.`);
    if (!confirmDelete) return;

    setDeletingSession(true);
    setActionError(null);
    try {
      await api.deleteCommitteeIntelSession(sessionDetail.session.id);
      setSelectedSessionId(null);
      setSessionDetail(null);
      setBrief(null);
      setRecap(null);
      setSyncResult(null);
      setActionError(null);
      setSessionRefreshNonce((value) => value + 1);
      refetchSessions();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeletingSession(false);
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

  async function handleGenerateBrief() {
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

  async function handleSyncFeed() {
    if (!sessionDetail) return;
    setSyncingFeed(true);
    setActionError(null);
    setMaintenanceNotice(null);
    try {
      const result = await api.syncCommitteeIntelFeed(sessionDetail.session.id);
      setSyncResult(result.sync);
      applySessionDetail(result.detail);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setSyncingFeed(false);
    }
  }

  async function handleGenerateRecap() {
    if (!sessionDetail) return;
    setGeneratingRecap(true);
    setActionError(null);
    try {
      const nextRecap = await api.getCommitteeIntelPostHearingRecap(sessionDetail.session.id);
      setRecap(nextRecap);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setGeneratingRecap(false);
    }
  }

  async function handleResetSession() {
    if (!sessionDetail) return;
    const confirmReset = window.confirm(`Reset monitoring data for "${sessionDetail.session.title}"? This clears synced segments, signals, recap output, and the ingestion cursor but keeps the session shell.`);
    if (!confirmReset) return;

    setResettingSession(true);
    setActionError(null);
    setMaintenanceNotice(null);
    try {
      const result = await api.resetCommitteeIntelSession(sessionDetail.session.id);
      setSyncResult(null);
      applySessionDetail(result.detail);
      setMaintenanceNotice(`Reset cleared ${result.reset.clearedSegments} segment${result.reset.clearedSegments === 1 ? "" : "s"} and ${result.reset.clearedSignals} signal${result.reset.clearedSignals === 1 ? "" : "s"}.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setResettingSession(false);
    }
  }

  async function handleRebuildSession() {
    if (!sessionDetail) return;
    const confirmRebuild = window.confirm(`Rebuild "${sessionDetail.session.title}" from its configured source? This clears existing synced data first and then repopulates the session from the official source or transcript feed.`);
    if (!confirmRebuild) return;

    setRebuildingSession(true);
    setActionError(null);
    setMaintenanceNotice(null);
    try {
      const result = await api.rebuildCommitteeIntelSession(sessionDetail.session.id);
      setSyncResult(result.sync);
      applySessionDetail(result.detail);
      setMaintenanceNotice(`Rebuild cleared ${result.reset.clearedSegments} segment${result.reset.clearedSegments === 1 ? "" : "s"} and ${result.reset.clearedSignals} signal${result.reset.clearedSignals === 1 ? "" : "s"} before repopulating the session.`);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setRebuildingSession(false);
    }
  }

  const primarySession = sessionDetail?.session ?? null;
  const displayedRecap = recap ?? sessionDetail?.analysis.postHearingRecap ?? null;

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
              Launch a live hearing session, wire in official House or Senate committee sources, paste transcript chunks when needed, and continuously map who is advancing, questioning, or resisting each issue.
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

      {maintenanceNotice && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412", borderRadius: 12, padding: 14, fontSize: 13 }}>
          {maintenanceNotice}
        </div>
      )}

      {syncResult && (
        <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", color: "#155e75", borderRadius: 12, padding: 14, fontSize: 13 }}>
          Source sync {syncResult.outcome === "waiting_source" ? "is waiting on source availability" : "completed"} and ingested {syncResult.ingestedSegments} segment{syncResult.ingestedSegments === 1 ? "" : "s"}, updated {syncResult.updatedSegments} existing cue{syncResult.updatedSegments === 1 ? "" : "s"}, and skipped {syncResult.duplicateSegments} duplicate{syncResult.duplicateSegments === 1 ? "" : "s"} using {syncResult.sourceMode === "audio_transcription" ? "audio transcription" : "a transcript feed"} from {syncResult.sourceLabel ?? syncResult.sourceType} at {new Date(syncResult.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}. Duration: {syncResult.durationMs}ms.
          {syncResult.error && (
            <div style={{ marginTop: 8, color: "#0e7490" }}>
              Waiting for source availability: {syncResult.error}{syncResult.waitReason ? ` (${statusLabel(syncResult.waitReason)})` : ""}
            </div>
          )}
          {syncResult.nextEligibleAutoIngestAt && (
            <div style={{ marginTop: 8, color: "#0e7490" }}>
              Next auto-sync window: {new Date(syncResult.nextEligibleAutoIngestAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              {typeof syncResult.nextEligibleAutoIngestInSeconds === "number" ? ` (${syncResult.nextEligibleAutoIngestInSeconds}s)` : ""}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        <SectionCard
          title="Hearings In Scope"
          subtitle="Upcoming hearings first, followed by recent past hearings for transcript-backed follow-up"
          actions={(
            <button type="button" onClick={handleSyncHearings} disabled={syncingHearings} style={secondaryButtonStyle}>
              {syncingHearings ? "Syncing..." : "Sync Hearings"}
            </button>
          )}
        >
          <div style={{ display: "grid", gap: 10 }}>
            {hearingsLoading && <div style={{ fontSize: 13, color: "#64748b" }}>Loading hearings...</div>}
            {!hearingsLoading && availableHearings.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>
                No hearings are loaded for the current workspace window yet. Use sync to pull the latest Texas hearing records into this workspace.
              </div>
            )}
            {availableHearings.slice(0, 14).map((hearing) => {
              const selected = hearing.id === selectedHearingId;
              const existingSession = orderedSessions.find((session) => session.hearingId === hearing.id) ?? null;
              const isUpcoming = new Date(hearing.hearingDate).getTime() >= Date.now();
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
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <Badge label={isUpcoming ? "Upcoming" : "Recent"} color={isUpcoming ? "#0f766e" : "#b45309"} />
                      <Badge label={hearing.chamber} color="#1d4ed8" />
                    </div>
                  </div>
                  {hearing.location && (
                    <div style={{ fontSize: 12, color: "#334155", marginTop: 8 }}>{hearing.location}</div>
                  )}
                  {existingSession && (
                    <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge
                        label={`Session ${statusLabel(existingSession.status)}`}
                        color={STATUS_COLORS[existingSession.status] ?? "#475569"}
                      />
                      <span style={{ fontSize: 12, color: existingSession.liveSummary ? "#0f766e" : "#92400e", fontWeight: 700 }}>
                        {existingSession.liveSummary ? "Transcript-backed intel available" : "Session exists - ingest or analyze next"}
                      </span>
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
                  placeholder="Optional livestream, archive page, or direct HLS URL"
                  style={inputStyle}
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={labelStyle}>
                  Source Type
                  <select
                    value={sessionForm.transcriptSourceType}
                    onChange={(event) => setSessionForm((current) => ({ ...current, transcriptSourceType: event.target.value }))}
                    style={inputStyle}
                  >
                    {TRANSCRIPT_SOURCE_TYPES.map((type) => (
                      <option key={type} value={type}>{statusLabel(type)}</option>
                    ))}
                  </select>
                </label>
                <label style={labelStyle}>
                  Auto-Ingest Interval (seconds)
                  <input
                    value={sessionForm.autoIngestIntervalSeconds}
                    onChange={(event) => setSessionForm((current) => ({ ...current, autoIngestIntervalSeconds: event.target.value }))}
                    placeholder="120"
                    style={inputStyle}
                  />
                </label>
              </div>

              <label style={labelStyle}>
                Source URL / Feed Override
                <input
                  value={sessionForm.transcriptSourceUrl}
                  onChange={(event) => setSessionForm((current) => ({ ...current, transcriptSourceUrl: event.target.value }))}
                  placeholder={sessionForm.transcriptSourceType === "official"
                    ? "Optional official player page, transcript feed, or event-specific override"
                    : "https://example.com/live-captions.vtt or data:text/vtt,..."}
                  style={inputStyle}
                />
              </label>

              {sessionForm.transcriptSourceType === "official" && (
                <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
                  Official mode resolves Texas House and Senate committee sources automatically. Use the URL fields only when you want to pin the session to a specific official page, transcript feed, or HLS stream.
                </div>
              )}

              <label style={{ ...labelStyle, gap: 8, flexDirection: "row", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={sessionForm.autoIngestEnabled}
                  onChange={(event) => setSessionForm((current) => ({ ...current, autoIngestEnabled: event.target.checked }))}
                />
                Automatically poll the official source or transcript feed for new segments
              </label>

              {primarySession && (
                <div style={{ background: "#f8fafc", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0", fontSize: 12, color: "#475569", lineHeight: 1.6 }}>
                  <div><strong>Status:</strong> {statusLabel(primarySession.autoIngestStatus)}</div>
                  <div><strong>Last Sync:</strong> {primarySession.lastAutoIngestedAt ? new Date(primarySession.lastAutoIngestedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "Never"}</div>
                  {primarySession.autoIngestError && <div><strong>Error:</strong> {primarySession.autoIngestError}</div>}
                </div>
              )}

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
                {primarySession && (
                  <button type="button" onClick={handleSyncFeed} disabled={syncingFeed} style={secondaryButtonStyle}>
                    {syncingFeed ? "Syncing Source..." : "Sync Source Now"}
                  </button>
                )}
                {primarySession && (
                  <button type="button" onClick={handleRebuildSession} disabled={rebuildingSession} style={secondaryButtonStyle}>
                    {rebuildingSession ? "Rebuilding..." : "Rebuild From Source"}
                  </button>
                )}
                {primarySession && (
                  <button type="button" onClick={handleResetSession} disabled={resettingSession} style={warningButtonStyle}>
                    {resettingSession ? "Resetting..." : "Reset Session Data"}
                  </button>
                )}
                {primarySession && (
                  <button type="button" onClick={handleDeleteSession} disabled={deletingSession} style={destructiveButtonStyle}>
                    {deletingSession ? "Deleting..." : "Delete Session"}
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
            <Suspense
              fallback={(
                <SectionCard title="Session Analysis">
                  <div style={{ fontSize: 13, color: "#64748b" }}>Loading committee-intelligence workspace...</div>
                </SectionCard>
              )}
            >
              <CommitteeIntelSessionInsights
                primarySession={primarySession}
                sessionDetail={sessionDetail}
                displayedRecap={displayedRecap}
                brief={brief}
                briefIssue={briefIssue}
                onBriefIssueChange={setBriefIssue}
                onGenerateBrief={handleGenerateBrief}
                generatingBrief={generatingBrief}
                onGenerateRecap={handleGenerateRecap}
                generatingRecap={generatingRecap}
              />
            </Suspense>
          )}
        </div>
      </div>
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

const destructiveButtonStyle: React.CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 10,
  background: "#fef2f2",
  color: "#991b1b",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const warningButtonStyle: React.CSSProperties = {
  border: "1px solid #fdba74",
  borderRadius: 10,
  background: "#fff7ed",
  color: "#9a3412",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
