import { useState } from "react";
import { api, type IssueRoom, type DeliverableResult } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

export function ClientAlertPage() {
  const { data: issueRooms, loading } = useAsync(() => api.getIssueRooms());
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [recipientName, setRecipientName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DeliverableResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!selectedRoom) return;
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.generateClientAlert({
        issueRoomId: selectedRoom,
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

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>📧</span>
        <div>
          <h2 style={{ margin: 0 }}>Client Alert Generator</h2>
          <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
            One-click professional alert from any issue room
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
        <h3 style={{ margin: "0 0 16px" }}>Configure Alert</h3>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            Issue Room *
          </label>
          {loading ? (
            <p style={{ color: "#888" }}>Loading issue rooms...</p>
          ) : (
            <select
              value={selectedRoom ?? ""}
              onChange={(e) => setSelectedRoom(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid #ccc",
                fontSize: 14,
              }}
            >
              <option value="">Select an issue room...</option>
              {(issueRooms ?? []).map((ir: IssueRoom) => (
                <option key={ir.id} value={ir.id}>
                  {ir.title} ({ir.status})
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
              Recipient Name
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Mr. Johnson"
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
          disabled={!selectedRoom || generating}
          style={{
            background: selectedRoom && !generating ? "#2e7d32" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor: selectedRoom && !generating ? "pointer" : "not-allowed",
          }}
        >
          {generating ? "Generating..." : "⚡ Generate Client Alert"}
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
            border: "1px solid #c8e6c9",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#e8f5e9",
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
                  background: "#2e7d32",
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                CLIENT ALERT
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
                      `<html><head><title>${result.title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}h1{color:#1a1a1a}h2{color:#2e7d32;border-bottom:1px solid #e0e0e0;padding-bottom:4px}h3{color:#333}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}th{background:#f5f5f5}hr{border:none;border-top:1px solid #ccc;margin:20px 0}</style></head><body>${result.bodyMarkdown.replace(/\n/g, "<br>")}</body></html>`,
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
