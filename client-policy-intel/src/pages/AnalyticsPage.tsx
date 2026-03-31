import { api, type DashboardAnalytics } from "../api";
import { useAsync } from "../hooks";

export function AnalyticsPage() {
  const { data, loading, error, refetch } = useAsync(() => api.getDashboardAnalytics());

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <div><p style={{ color: "red" }}>{error}</p><button onClick={refetch} style={{ padding: "6px 14px", cursor: "pointer" }}>Retry</button></div>;
  if (!data) return null;

  return (
    <div>
      <h1 style={{ fontSize: 22, marginBottom: 20 }}>Analytics</h1>
      <div style={{ display: "grid", gap: 20 }}>
        <ScoreDistributionChart data={data.scoreDistribution} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <SourceBreakdown data={data.sourceTypeBreakdown} />
          <DailyVolume data={data.dailyAlertVolume} />
        </div>
      </div>
    </div>
  );
}

function ScoreDistributionChart({ data }: { data: DashboardAnalytics["scoreDistribution"] }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 16px" }}>Alert Score Distribution</h3>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 180 }}>
        {data.map((d) => {
          const h = Math.max(4, (d.count / max) * 160);
          const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : "0";
          const color = barColor(d.bucket);
          return (
            <div key={d.bucket} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 10, color: "#888" }}>{d.count.toLocaleString()}</div>
              <div
                title={`${d.bucket}: ${d.count.toLocaleString()} (${pct}%)`}
                style={{ width: "100%", height: h, background: color, borderRadius: "4px 4px 0 0", cursor: "help", transition: "height 0.3s" }}
              />
              <div style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap" }}>{d.bucket}</div>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#888", marginTop: 10, textAlign: "center" }}>
        Total: {total.toLocaleString()} alerts
      </div>
    </div>
  );
}

function barColor(bucket: string): string {
  const n = parseInt(bucket);
  if (n >= 70) return "#e74c3c";
  if (n >= 40) return "#e67e22";
  if (n >= 20) return "#f1c40f";
  return "#95a5a6";
}

function SourceBreakdown({ data }: { data: DashboardAnalytics["sourceTypeBreakdown"] }) {
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Source Type Breakdown</h3>
      <div style={{ display: "grid", gap: 8 }}>
        {data.map((d) => {
          const pct = total > 0 ? (d.count / total) * 100 : 0;
          return (
            <div key={d.source_type}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                <span style={{ color: "#555" }}>{d.source_type.replace(/_/g, " ")}</span>
                <span style={{ color: "#888" }}>{d.count.toLocaleString()} ({pct.toFixed(1)}%)</span>
              </div>
              <div style={{ height: 6, background: "#eee", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "#3498db", borderRadius: 3, transition: "width 0.3s" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DailyVolume({ data }: { data: DashboardAnalytics["dailyAlertVolume"] }) {
  if (data.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Daily Alert Volume (30d)</h3>
        <p style={{ fontSize: 13, color: "#888" }}>No data in the last 30 days.</p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.count), 1);

  return (
    <div style={{ background: "#fff", borderRadius: 8, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>Daily Alert Volume (30d)</h3>
      <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 100 }}>
        {data.map((d) => {
          const h = Math.max(2, (d.count / max) * 90);
          const label = new Date(d.day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
          return (
            <div key={d.day} title={`${label}: ${d.count}`} style={{ flex: 1, height: h, background: "#27ae60", borderRadius: "2px 2px 0 0", cursor: "help" }} />
          );
        })}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#aaa", marginTop: 4 }}>
        <span>{new Date(data[0].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        <span>{new Date(data[data.length - 1].day).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
      </div>
    </div>
  );
}
