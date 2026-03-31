import { useState } from "react";
import { Link } from "wouter";
import { api } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

export function DigestPage() {
  // Default to workspace 2 (Grace & McEwan)
  const { data: digest, loading, error, refetch } = useAsync(() => api.getDigest(DEFAULT_WORKSPACE_ID));
  const [copied, setCopied] = useState(false);

  if (loading) return <p>Loading digest...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;
  if (!digest) return <p>No digest available</p>;

  function formatDigestText(): string {
    const lines: string[] = [];
    lines.push(`POLICY INTEL WEEKLY DIGEST`);
    lines.push(`${new Date(digest!.period.start).toLocaleDateString()} — ${new Date(digest!.period.end).toLocaleDateString()} (${digest!.period.week})`);
    lines.push("");
    lines.push(`SUMMARY: ${digest!.summary.totalAlerts} alerts | ${digest!.summary.highPriority} high priority | ${digest!.summary.pendingReview} pending | ${digest!.summary.reviewed} reviewed | ${digest!.summary.activitiesLogged} activities`);
    lines.push("");
    for (const section of digest!.sections) {
      lines.push(`── ${section.watchlist} (${section.alertCount} alerts, ${section.highPriority} high-priority) ──`);
      for (const a of section.alerts) {
        lines.push(`  [${a.score}] ${a.title} (${a.status})`);
        if (a.whyItMatters) lines.push(`        ${a.whyItMatters.slice(0, 200)}`);
      }
      lines.push("");
    }
    if (digest!.recentActivities.length > 0) {
      lines.push("── Recent Activities ──");
      for (const a of digest!.recentActivities) {
        lines.push(`  ${a.summary} (${a.type.replace(/_/g, " ")}, ${new Date(a.createdAt).toLocaleString()})`);
      }
    }
    return lines.join("\n");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(formatDigestText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Copy failed — please select and copy manually");
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Weekly Digest</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleCopy} style={{
            padding: "6px 14px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, background: copied ? "#27ae60" : "#fff",
            color: copied ? "#fff" : "#555", cursor: "pointer", fontWeight: 500, transition: "all 0.2s",
          }}>
            {copied ? "Copied!" : "Copy as Text"}
          </button>
          <button onClick={handlePrint} style={{
            padding: "6px 14px", fontSize: 12, border: "1px solid #ddd", borderRadius: 6, background: "#fff", color: "#555", cursor: "pointer", fontWeight: 500,
          }}>
            Print / PDF
          </button>
          <Link href="/weekly-report">
            <span style={{
              padding: "6px 14px", fontSize: 12, border: "none", borderRadius: 6, background: "#e65100", color: "#fff", cursor: "pointer", fontWeight: 600, display: "inline-block",
            }}>
              📊 Generate Client Report
            </span>
          </Link>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>
        {new Date(digest.period.start).toLocaleDateString()} — {new Date(digest.period.end).toLocaleDateString()}
        {" "}({digest.period.week})
      </p>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
        <MiniStat label="Total Alerts" value={digest.summary.totalAlerts} />
        <MiniStat label="High Priority" value={digest.summary.highPriority} color="#e74c3c" />
        <MiniStat label="Pending" value={digest.summary.pendingReview} color="#e67e22" />
        <MiniStat label="Reviewed" value={digest.summary.reviewed} color="#27ae60" />
        <MiniStat label="Activities" value={digest.summary.activitiesLogged} color="#3498db" />
      </div>

      {/* Sections by watchlist */}
      <h2 style={{ fontSize: 16, marginBottom: 12 }}>By Watchlist</h2>
      {digest.sections.map((section, i) => (
        <div key={i} style={{
          background: "#fff",
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600 }}>{section.watchlist}</h3>
            <span style={{ fontSize: 12, color: "#888" }}>
              {section.alertCount} alert(s) · {section.highPriority} high-priority
            </span>
          </div>
          {section.alerts.map((a) => (
            <div key={a.id} style={{
              padding: "6px 10px",
              marginBottom: 4,
              borderLeft: `2px solid ${a.score >= 70 ? "#e74c3c" : a.score >= 40 ? "#e67e22" : "#ddd"}`,
              fontSize: 13,
            }}>
              <span style={{ fontWeight: 500 }}>{a.title.slice(0, 80)}</span>
              <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>({a.score}) {a.status}</span>
            </div>
          ))}
        </div>
      ))}

      {digest.sections.length === 0 && (
        <p style={{ color: "#888" }}>No alerts in this period.</p>
      )}

      {/* Recent Activities */}
      {digest.recentActivities.length > 0 && (
        <>
          <h2 style={{ fontSize: 16, marginTop: 24, marginBottom: 12 }}>Recent Activities</h2>
          <div style={{ display: "grid", gap: 6 }}>
            {digest.recentActivities.map((a) => (
              <div key={a.id} style={{ background: "#fff", borderRadius: 6, padding: "8px 14px", fontSize: 13 }}>
                <span style={{ fontWeight: 500 }}>{a.summary}</span>
                <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>
                  {a.type.replace(/_/g, " ")} · {new Date(a.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div style={{ background: "#fff", borderRadius: 6, padding: "12px 14px", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color ?? "#2c3e50" }}>{value}</div>
      <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{label}</div>
    </div>
  );
}
