import { useState } from "react";
import { api, type HearingEvent, type DeliverableResult } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

export function HearingMemoPage() {
  const { data: hearings, loading } = useAsync(() => api.getHearings());
  const [selectedHearing, setSelectedHearing] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DeliverableResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // Group hearings by upcoming first
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
        <h3 style={{ margin: "0 0 16px" }}>Select Hearing</h3>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            Committee Hearing *
          </label>
          {loading ? (
            <p style={{ color: "#888" }}>Loading hearings...</p>
          ) : sorted.length === 0 ? (
            <p style={{ color: "#888" }}>No hearings available. Sync hearings from the Calendar page first.</p>
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
          <HearingPreview hearingId={selectedHearing} hearings={sorted} />
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
}: {
  hearingId: number;
  hearings: HearingEvent[];
}) {
  const h = hearings.find((x) => x.id === hearingId);
  if (!h) return null;

  const bills = (h.relatedBillIds as string[] | null) ?? [];

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
