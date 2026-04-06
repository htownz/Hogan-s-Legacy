import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  api,
  type CommitteeIntelSession,
  type CommitteeIntelSessionDetail,
  type DeliverableResult,
  type HearingEvent,
} from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

function QualityBadge({
  label,
  color,
  background,
}: {
  label: string;
  color: string;
  background?: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color,
        background: background ?? `${color}18`,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {label}
    </span>
  );
}

function getSessionQuality(detail: CommitteeIntelSessionDetail | null, session: CommitteeIntelSession | null) {
  if (detail?.analysis.totalSegments) {
    return {
      label: "Transcript-backed",
      description: `Linked committee session has ${detail.analysis.totalSegments} segment(s) and ${detail.analysis.totalSignals} extracted signal(s).`,
      color: "#0f766e",
    };
  }
  if (session) {
    return {
      label: "Needs ingest",
      description: "A linked committee session exists, but it has not produced transcript-backed analysis yet.",
      color: "#b45309",
    };
  }
  return {
    label: "Metadata only",
    description: "No linked committee session exists yet, so the memo will rely on hearing metadata and source documents only.",
    color: "#64748b",
  };
}

function getMemoResultQuality(result: DeliverableResult) {
  switch (result.sourceQuality) {
    case "transcript_backed":
      return { label: result.sourceQualityLabel ?? "Transcript-backed", color: "#0f766e" };
    case "mixed_source":
      return { label: result.sourceQualityLabel ?? "Mixed transcript + hearing record", color: "#7c3aed" };
    case "source_docs_only":
      return { label: result.sourceQualityLabel ?? "Hearing metadata + source docs", color: "#1d4ed8" };
    default:
      return { label: result.sourceQualityLabel ?? "Hearing metadata only", color: "#64748b" };
  }
}

interface HearingMemoPageProps {
  hearingId?: number;
}

export function HearingMemoPage({ hearingId }: HearingMemoPageProps) {
  const hearingWindow = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 45);
    const to = new Date();
    to.setDate(to.getDate() + 120);
    return { from: from.toISOString(), to: to.toISOString() };
  }, []);

  const {
    data: hearings,
    loading,
    error: hearingsError,
    refetch: refetchHearings,
  } = useAsync(
    () => api.getHearings({ workspaceId: DEFAULT_WORKSPACE_ID, from: hearingWindow.from, to: hearingWindow.to }),
    [hearingWindow.from, hearingWindow.to],
  );
  const {
    data: sessions,
    error: sessionsError,
  } = useAsync(() => api.getCommitteeIntelSessions({ workspaceId: DEFAULT_WORKSPACE_ID }), []);
  const [selectedHearing, setSelectedHearing] = useState<number | null>(hearingId ?? null);
  const [recipientName, setRecipientName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [syncingHearings, setSyncingHearings] = useState(false);
  const [result, setResult] = useState<DeliverableResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedSession = useMemo(() => {
    return (sessions ?? []).find((session) => session.hearingId === selectedHearing) ?? null;
  }, [selectedHearing, sessions]);
  const { data: selectedSessionDetail } = useAsync<CommitteeIntelSessionDetail | null>(
    () => selectedSession ? api.getCommitteeIntelSession(selectedSession.id) : Promise.resolve(null),
    [selectedSession?.id ?? 0],
  );

  useEffect(() => {
    if (hearingId && hearingId !== selectedHearing) {
      setSelectedHearing(hearingId);
    }
  }, [hearingId, selectedHearing]);

  async function generate() {
    if (!selectedHearing) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.generateHearingMemo({
        hearingId: selectedHearing,
        workspaceId: DEFAULT_WORKSPACE_ID,
        recipientName: recipientName || undefined,
        firmName: firmName || undefined,
      });
      setResult(r);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSyncHearings() {
    setSyncingHearings(true);
    setError(null);
    try {
      await api.syncHearings(DEFAULT_WORKSPACE_ID);
      await refetchHearings();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncingHearings(false);
    }
  }

  const now = new Date();
  const upcoming = (hearings ?? [])
    .filter((h: HearingEvent) => new Date(h.hearingDate) >= now)
    .sort(
      (a: HearingEvent, b: HearingEvent) =>
        new Date(a.hearingDate).getTime() - new Date(b.hearingDate).getTime(),
    );
  const past = (hearings ?? [])
    .filter((h: HearingEvent) => new Date(h.hearingDate) < now)
    .sort(
      (a: HearingEvent, b: HearingEvent) =>
        new Date(b.hearingDate).getTime() - new Date(a.hearingDate).getTime(),
    );
  const sorted = [...upcoming, ...past];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>🏛️</span>
        <div>
          <h2 style={{ margin: 0 }}>Hearing Memo Generator</h2>
          <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
            Auto-generate preparation memos for committee hearings
          </p>
        </div>
      </div>

      {(hearingsError || sessionsError) && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: 14,
            color: "#b91c1c",
            marginBottom: 20,
          }}
        >
          {[hearingsError, sessionsError].filter(Boolean).join(" | ")}
        </div>
      )}

      {/* Configuration */}
      <div
        style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 8,
          padding: 20,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>Select Hearing</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {selectedHearing && (
              <Link href={`/committee-intel/hearing/${selectedHearing}`}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ecfeff",
                    border: "1px solid #a5f3fc",
                    borderRadius: 6,
                    padding: "8px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 600,
                    color: "#155e75",
                  }}
                >
                  Open Committee Intel
                </span>
              </Link>
            )}
            <button
              onClick={handleSyncHearings}
              disabled={syncingHearings}
              style={{
                background: "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: 6,
                padding: "8px 14px",
                fontSize: 13,
                cursor: syncingHearings ? "not-allowed" : "pointer",
                fontWeight: 600,
              }}
            >
              {syncingHearings ? "Syncing..." : "Sync Workspace Hearings"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            Committee Hearing *
          </label>
          {loading ? (
            <p style={{ color: "#888" }}>Loading hearings...</p>
          ) : sorted.length === 0 ? (
            <p style={{ color: "#888" }}>No hearings are loaded for this workspace window yet. Sync Texas hearings to continue.</p>
          ) : (
            <select
              value={selectedHearing ?? ""}
              onChange={(e) => setSelectedHearing(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                fontSize: 14,
              }}
            >
              <option value="">Select a hearing...</option>
              {upcoming.length > 0 && (
                <optgroup label="Upcoming">
                  {upcoming.slice(0, 20).map((h: HearingEvent) => (
                    <option key={h.id} value={h.id}>
                      {new Date(h.hearingDate).toLocaleDateString()} — {h.committee} ({h.chamber})
                    </option>
                  ))}
                </optgroup>
              )}
              {past.length > 0 && (
                <optgroup label="Past">
                  {past.slice(0, 20).map((h: HearingEvent) => (
                    <option key={h.id} value={h.id}>
                      {new Date(h.hearingDate).toLocaleDateString()} — {h.committee} ({h.chamber})
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          )}
        </div>

        {/* Selected hearing details */}
        {selectedHearing && (
          <HearingPreview
            hearingId={selectedHearing}
            hearings={sorted}
            linkedSession={selectedSession}
            linkedSessionDetail={selectedSessionDetail}
          />
        )}

        <div style={{ display: "flex", gap: 14, marginBottom: 14, marginTop: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              Recipient Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. John Mitchell"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              Firm Name
            </label>
            <input
              type="text"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              placeholder="Default: Grace & McEwan LLP"
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                fontSize: 14,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <button
          onClick={generate}
          disabled={!selectedHearing || generating}
          style={{
            background: selectedHearing && !generating ? "#6a1b9a" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor: selectedHearing && !generating ? "pointer" : "not-allowed",
          }}
        >
          {generating ? "Generating..." : "🏛️ Generate Hearing Memo"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fca5a5",
            borderRadius: 8,
            padding: 14,
            color: "#b91c1c",
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          style={{
            border: "1px solid #ce93d8",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#f3e5f5",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <strong>{result.title}</strong>
              <span
                style={{
                  marginLeft: 12,
                  background: "#6a1b9a",
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                HEARING MEMO
              </span>
              <span style={{ marginLeft: 12 }}>
                <QualityBadge
                  label={getMemoResultQuality(result).label}
                  color={getMemoResultQuality(result).color}
                />
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(result.bodyMarkdown);
                }}
                style={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                📋 Copy
              </button>
              <button
                onClick={() => {
                  const w = window.open("", "_blank");
                  if (w) {
                    w.document.write(
                      `<html><head><title>${result.title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}h1{color:#1a1a1a}h2{color:#6a1b9a;border-bottom:1px solid #e0e0e0;padding-bottom:4px}h3{color:#333}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}th{background:#f5f5f5}hr{border:none;border-top:1px solid #ccc;margin:20px 0}</style></head><body>${result.bodyMarkdown.replace(/\n/g, "<br>")}</body></html>`,
                    );
                    w.document.close();
                    w.print();
                  }
                }}
                style={{
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: 6,
                  padding: "6px 14px",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                🖨️ Print / PDF
              </button>
            </div>
          </div>
          {(result.provenanceSummary || result.evidenceCounts) && (
            <div
              style={{
                padding: "14px 20px",
                background: "#faf5ff",
                borderTop: "1px solid #e9d5ff",
                fontSize: 13,
                color: "#4c1d95",
                lineHeight: 1.6,
              }}
            >
              {result.provenanceSummary && <div>{result.provenanceSummary}</div>}
              {result.evidenceCounts && (
                <div style={{ marginTop: 6 }}>
                  Evidence counts: {result.evidenceCounts.segments} transcript segment(s), {result.evidenceCounts.signals} signal(s), {result.evidenceCounts.sourceDocuments} source document(s)
                  {typeof result.committeeSessionId === "number" ? `, committee session #${result.committeeSessionId}` : ""}.
                </div>
              )}
            </div>
          )}
          <div
            style={{
              padding: 20,
              whiteSpace: "pre-wrap",
              fontFamily: "Georgia, serif",
              lineHeight: 1.7,
              maxHeight: 600,
              overflow: "auto",
              fontSize: 14,
            }}
          >
            {result.bodyMarkdown}
          </div>
        </div>
      )}
    </div>
  );
}

function HearingPreview({
  hearingId,
  hearings,
  linkedSession,
  linkedSessionDetail,
}: {
  hearingId: number;
  hearings: HearingEvent[];
  linkedSession: CommitteeIntelSession | null;
  linkedSessionDetail: CommitteeIntelSessionDetail | null;
}) {
  const h = hearings.find((x) => x.id === hearingId);
  if (!h) return null;

  const bills = (h.relatedBillIds as string[] | null) ?? [];
  const quality = getSessionQuality(linkedSessionDetail, linkedSession);

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: 6,
        padding: 14,
        marginTop: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
        <QualityBadge label={quality.label} color={quality.color} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/committee-intel/hearing/${hearingId}`}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "6px 10px",
                borderRadius: 6,
                background: "#ecfeff",
                border: "1px solid #a5f3fc",
                color: "#155e75",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Open Committee Intel
            </span>
          </Link>
        </div>
      </div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13 }}>
        <div>
          <span style={{ color: "#888" }}>Committee:</span>{" "}
          <strong>{h.committee}</strong>
        </div>
        <div>
          <span style={{ color: "#888" }}>Chamber:</span>{" "}
          <strong>{h.chamber}</strong>
        </div>
        <div>
          <span style={{ color: "#888" }}>Date:</span>{" "}
          <strong>
            {new Date(h.hearingDate).toLocaleDateString("en-US", {
              weekday: "short",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </strong>
        </div>
        {h.location && (
          <div>
            <span style={{ color: "#888" }}>Location:</span>{" "}
            <strong>{h.location}</strong>
          </div>
        )}
      </div>
      <p style={{ marginTop: 10, marginBottom: 0, fontSize: 13, color: "#475569" }}>
        {quality.description}
      </p>
      {linkedSession && (
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <QualityBadge label={`Session ${linkedSession.status.replace(/_/g, " ")}`} color="#1d4ed8" />
          {linkedSession.autoIngestEnabled && (
            <QualityBadge label={`feed ${linkedSession.autoIngestStatus.replace(/_/g, " ")}`} color="#0f766e" />
          )}
        </div>
      )}
      {bills.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 13 }}>
          <span style={{ color: "#888" }}>Bills:</span>{" "}
          {bills.map((b, i) => (
            <span
              key={i}
              style={{
                background: "#e8eaf6",
                padding: "2px 6px",
                borderRadius: 4,
                marginLeft: 4,
                fontSize: 12,
              }}
            >
              {b}
            </span>
          ))}
        </div>
      )}
      {h.description && (
        <p style={{ marginTop: 8, fontSize: 13, color: "#555" }}>
          {h.description.slice(0, 300)}
        </p>
      )}
    </div>
  );
}
