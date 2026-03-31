import { useState } from "react";
import { api, type DeliverableResult } from "../api";
import { DEFAULT_WORKSPACE_ID } from "../constants";

export function WeeklyReportPage() {
  const [week, setWeek] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [firmName, setFirmName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<DeliverableResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    try {
      const r = await api.generateWeeklyReport({
        workspaceId: DEFAULT_WORKSPACE_ID,
        week: week || undefined,
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

  // Generate ISO week options for last 8 weeks
  const weekOptions: { label: string; value: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const year = d.getFullYear();
    const jan1 = new Date(year, 0, 1);
    const dayOfYear = Math.floor(
      (d.getTime() - jan1.getTime()) / 86400000,
    ) + 1;
    const weekNum = Math.ceil((dayOfYear + jan1.getDay()) / 7);
    const wk = `${year}-W${String(weekNum).padStart(2, "0")}`;
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const label = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} — ${weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    weekOptions.push({ label: `${wk}  (${label})`, value: wk });
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <span style={{ fontSize: 28 }}>📊</span>
        <div>
          <h2 style={{ margin: 0 }}>Weekly Client Report Builder</h2>
          <p style={{ margin: 0, color: "#666", fontSize: 14 }}>
            Generate a professional weekly intelligence report from digest data
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
        <h3 style={{ margin: "0 0 16px" }}>Configure Report</h3>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4, fontSize: 13 }}>
            Week Period
          </label>
          <select
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 10px",
              borderRadius: 6,
              border: "1px solid #ccc",
              fontSize: 14,
            }}
          >
            <option value="">Current week</option>
            {weekOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
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
              placeholder="e.g. Susan Brennan"
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
          disabled={generating}
          style={{
            background: !generating ? "#e65100" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            padding: "10px 24px",
            fontSize: 15,
            fontWeight: 600,
            cursor: !generating ? "pointer" : "not-allowed",
          }}
        >
          {generating ? "Generating..." : "📊 Generate Weekly Report"}
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
            border: "1px solid #ffe0b2",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              background: "#fff3e0",
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
                  background: "#e65100",
                  color: "#fff",
                  padding: "2px 8px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                WEEKLY REPORT
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
                      `<html><head><title>${result.title}</title><style>body{font-family:Georgia,serif;max-width:800px;margin:40px auto;padding:20px;line-height:1.6}h1{color:#1a1a1a}h2{color:#e65100;border-bottom:1px solid #e0e0e0;padding-bottom:4px}h3{color:#333}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ddd;padding:6px 10px;text-align:left}th{background:#f5f5f5}hr{border:none;border-top:1px solid #ccc;margin:20px 0}</style></head><body>${result.bodyMarkdown.replace(/\n/g, "<br>")}</body></html>`,
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
