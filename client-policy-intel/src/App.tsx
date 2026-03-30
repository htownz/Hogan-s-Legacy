import { Route, Switch, Link, useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { api } from "./api";
import { MattersPage } from "./pages/MattersPage";
import { MatterDetailPage } from "./pages/MatterDetailPage";
import { AlertQueuePage } from "./pages/AlertQueuePage";
import { SourceDocsPage } from "./pages/SourceDocsPage";
import { DigestPage } from "./pages/DigestPage";
import { DashboardPage } from "./pages/DashboardPage";
import { IssueRoomsPage } from "./pages/IssueRoomsPage";
import { IssueRoomDetailPage } from "./pages/IssueRoomDetailPage";
import { WatchlistsPage } from "./pages/WatchlistsPage";
import { StakeholdersPage } from "./pages/StakeholdersPage";
import { StakeholderDetailPage } from "./pages/StakeholderDetailPage";
import { DeliverablesPage } from "./pages/DeliverablesPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AlertDetailPage } from "./pages/AlertDetailPage";
import { WatchlistDetailPage } from "./pages/WatchlistDetailPage";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard" },
  { path: "/matters", label: "Matters" },
  { path: "/alerts", label: "Alert Queue" },
  { path: "/issue-rooms", label: "Issue Rooms" },
  { path: "/watchlists", label: "Watchlists" },
  { path: "/stakeholders", label: "Stakeholders" },
  { path: "/deliverables", label: "Briefs" },
  { path: "/sources", label: "Sources" },
  { path: "/analytics", label: "Analytics" },
  { path: "/digest", label: "Digest" },
  { path: "/settings", label: "Settings" },
];

export function App() {
  const [location, setLocation] = useLocation();
  const [toast, setToast] = useState<{ message: string; count: number } | null>(null);
  const lastPending = useRef<number | null>(null);

  // Poll for new high-priority alerts every 30 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    async function poll() {
      try {
        const stats = await api.getDashboardStats();
        if (lastPending.current !== null && stats.pendingReview > lastPending.current) {
          const newCount = stats.pendingReview - lastPending.current;
          setToast({ message: `${newCount} new alert${newCount !== 1 ? "s" : ""} pending review`, count: newCount });
          setTimeout(() => setToast(null), 8000);
        }
        lastPending.current = stats.pendingReview;
      } catch { /* silent */ }
    }
    poll();
    timer = setInterval(poll, 30_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <nav style={{
        width: 220,
        background: "#16213e",
        color: "#e8e8e8",
        padding: "24px 0",
        flexShrink: 0,
      }}>
        <div style={{ padding: "0 20px", marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Policy Intel</h2>
          <p style={{ fontSize: 11, color: "#7f8c9b", marginTop: 4 }}>Grace &amp; McEwan</p>
        </div>
        {NAV_ITEMS.map((item) => {
          const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
          return (
            <Link key={item.path} href={item.path}>
              <div style={{
                padding: "10px 20px",
                fontSize: 14,
                cursor: "pointer",
                background: active ? "#1a3a5c" : "transparent",
                borderLeft: active ? "3px solid #4da8da" : "3px solid transparent",
                color: active ? "#fff" : "#b0bec5",
              }}>
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Main content */}
      <main style={{ flex: 1, padding: "24px 32px", overflow: "auto", position: "relative" }}>
        {/* Notification toast */}
        {toast && (
          <div
            onClick={() => { setToast(null); setLocation("/alerts"); }}
            style={{
              position: "fixed", top: 16, right: 24, zIndex: 1000,
              background: "#16213e", color: "#fff", padding: "12px 20px", borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 500,
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <span style={{ background: "#e74c3c", borderRadius: "50%", width: 8, height: 8, display: "inline-block" }} />
            {toast.message}
            <span style={{ fontSize: 11, color: "#7f8c9b", marginLeft: 4 }}>Click to view</span>
          </div>
        )}
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/matters" component={MattersPage} />
          <Route path="/matters/:id">{(params) => <MatterDetailPage id={Number(params.id)} />}</Route>
          <Route path="/alerts" component={AlertQueuePage} />
          <Route path="/alerts/:id" component={AlertDetailPage} />
          <Route path="/issue-rooms" component={IssueRoomsPage} />
          <Route path="/issue-rooms/:id">{(params) => <IssueRoomDetailPage id={Number(params.id)} />}</Route>
          <Route path="/watchlists" component={WatchlistsPage} />
          <Route path="/watchlists/:id" component={WatchlistDetailPage} />
          <Route path="/stakeholders" component={StakeholdersPage} />
          <Route path="/stakeholders/:id" component={StakeholderDetailPage} />
          <Route path="/deliverables" component={DeliverablesPage} />
          <Route path="/sources" component={SourceDocsPage} />
          <Route path="/analytics" component={AnalyticsPage} />
          <Route path="/digest" component={DigestPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route>
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Page not found</div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
