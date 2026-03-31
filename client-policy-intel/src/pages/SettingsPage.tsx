import { useState } from "react";
import { api } from "../api";
import { DEFAULT_WORKSPACE_ID } from "../constants";

export function SettingsPage() {
  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Settings &amp; Admin</h1>
      <div style={{ display: "grid", gap: 20 }}>
        <SlackSection />
        <LegislatorImportSection />
        <SystemInfoSection />
      </div>
    </div>
  );
}

function SlackSection() {
  const [result, setResult] = useState<{ sent: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function handleTest() {
    try {
      setTesting(true);
      const r = await api.testSlack();
      setResult(r);
    } catch (e: unknown) {
      setResult({ sent: false, message: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card title="Slack Notifications">
      <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
        High-priority alerts (score &ge; 60) are sent to Slack automatically when <code>SLACK_WEBHOOK_URL</code> is configured.
      </p>
      <button onClick={handleTest} disabled={testing} style={btnStyle("#3498db")}>
        {testing ? "Sending..." : "Send Test Notification"}
      </button>
      {result && (
        <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 6, fontSize: 13, background: result.sent ? "#e8f5e9" : "#fff3e0", color: result.sent ? "#2e7d32" : "#e65100" }}>
          {result.message}
        </div>
      )}
    </Card>
  );
}

function LegislatorImportSection() {
  const [running, setRunning] = useState(false);
  const [importResult, setImportResult] = useState<{ sessionName: string; totalPeople: number; created: number; existing: number } | null>(null);

  async function handleImport() {
    try {
      setRunning(true);
      const r = await api.importLegislators({ workspaceId: DEFAULT_WORKSPACE_ID });
      setImportResult(r);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      window.alert("Import failed: " + msg);
    } finally {
      setRunning(false);
    }
  }

  return (
    <Card title="Texas Legislator Directory">
      <p style={{ fontSize: 13, color: "#555", marginBottom: 12 }}>
        Import current Texas legislators from LegiScan into the stakeholder directory. Requires <code>LEGISCAN_API_KEY</code>.
      </p>
      <button onClick={handleImport} disabled={running} style={btnStyle("#16213e")}>
        {running ? "Importing..." : "Import Legislators"}
      </button>
      {importResult && (
        <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 6, fontSize: 13, background: "#e8f5e9" }}>
          <strong>{importResult.sessionName}</strong>: {importResult.totalPeople} legislators found, {importResult.created} new, {importResult.existing} already tracked.
        </div>
      )}
    </Card>
  );
}

function SystemInfoSection() {
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheck() {
    try {
      setLoading(true);
      const [health, stats, scheduler, environment] = await Promise.all([
        api.health(),
        api.getDashboardStats(),
        api.getSchedulerStatus(),
        api.getEnvironmentStatus(),
      ]);
      setInfo({ ...health, ...stats, scheduler, environment });
    } catch (e: unknown) {
      window.alert("Error: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card title="System Status">
      <button onClick={handleCheck} disabled={loading} style={btnStyle("#7f8c8d")}>
        {loading ? "Checking..." : "Check System"}
      </button>
      {info && (
        <div style={{ marginTop: 12 }}>
          <InfoGrid data={{
            "Service": String((info as any).service ?? "unknown"),
            "Total Alerts": Number((info as any).totalAlerts ?? 0).toLocaleString(),
            "Pending Review": Number((info as any).pendingReview ?? 0).toLocaleString(),
            "High Priority": Number((info as any).highPriority ?? 0).toLocaleString(),
            "Total Documents": Number((info as any).totalDocuments ?? 0).toLocaleString(),
            "Active Watchlists": String((info as any).activeWatchlists ?? 0),
            "Active Matters": String((info as any).activeMatters ?? 0),
            "Env Configured": `${Number((info as any).environment?.counts?.configured ?? 0)} / ${Number((info as any).environment?.counts?.total ?? 0)}`,
            "Missing Required Env": String(Number((info as any).environment?.counts?.missingRequired ?? 0)),
          }} />
          {(info as any).scheduler && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Scheduler Jobs</div>
              {((info as any).scheduler.jobs ?? []).map((j: any) => (
                <div key={j.name} style={{ fontSize: 12, color: "#666", padding: "2px 0" }}>
                  <strong>{j.name}</strong>: {j.cronExpression} · last: {j.lastRun?.finishedAt ? new Date(j.lastRun.finishedAt).toLocaleString() : "never"} · failures: {j.consecutiveFailures ?? 0}
                </div>
              ))}
            </div>
          )}
          {(info as any).environment?.variables?.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 6 }}>Environment Configuration</div>
              {((info as any).environment.variables ?? []).map((entry: any) => (
                <div key={entry.key} style={{ fontSize: 12, color: entry.configured ? "#2e7d32" : entry.required ? "#c62828" : "#666", padding: "2px 0" }}>
                  <strong>{entry.key}</strong>: {entry.configured ? "configured" : entry.required ? "missing (required)" : "not configured"}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>{title}</h3>
      {children}
    </div>
  );
}

function InfoGrid({ data }: { data: Record<string, string> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
      {Object.entries(data).map(([k, v]) => (
        <div key={k} style={{ fontSize: 12 }}>
          <span style={{ color: "#888" }}>{k}: </span>
          <strong>{v}</strong>
        </div>
      ))}
    </div>
  );
}

function btnStyle(bg: string): React.CSSProperties {
  return { padding: "8px 18px", fontSize: 13, background: bg, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 };
}
