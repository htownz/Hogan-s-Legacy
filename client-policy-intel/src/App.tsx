import { Route, Switch, Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { CalendarPage } from "./pages/CalendarPage";
import { MobileAlertReviewPage } from "./pages/MobileAlertReviewPage";
import { ClientAlertPage } from "./pages/ClientAlertPage";
import { WeeklyReportPage } from "./pages/WeeklyReportPage";
import { HearingMemoPage } from "./pages/HearingMemoPage";
import { IntelligenceHubPage } from "./pages/IntelligenceHubPage";
import { PowerNetworkPage } from "./pages/PowerNetworkPage";
import { CommitteeIntelPage } from "./pages/CommitteeIntelPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );
  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

const NAV_ITEMS = [
  { path: "/", label: "Dashboard" },
  { path: "/intelligence", label: "🧠 Intelligence Hub" },
  { path: "/power-network", label: "🏛️ Power Network" },
  { path: "/calendar", label: "Calendar" },
  { path: "/committee-intel", label: "Committee Intel" },
  { path: "/matters", label: "Matters" },
  { path: "/alerts", label: "Alert Queue" },
  { path: "/review", label: "📱 Mobile Review" },
  { path: "/issue-rooms", label: "Issue Rooms" },
  { path: "/watchlists", label: "Watchlists" },
  { path: "/stakeholders", label: "Stakeholders" },
  { path: "/deliverables", label: "Briefs" },
  { path: "/client-alerts", label: "📧 Client Alert" },
  { path: "/weekly-report", label: "📊 Weekly Report" },
  { path: "/hearing-memo", label: "🏛️ Hearing Memo" },
  { path: "/sources", label: "Sources" },
  { path: "/analytics", label: "Analytics" },
  { path: "/digest", label: "Digest" },
  { path: "/settings", label: "Settings" },
];

export function App() {
  const [location, setLocation] = useLocation();
  const [toast, setToast] = useState<{ message: string; count: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastPending = useRef<number | null>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Close menu on navigation
  const closeMenu = useCallback(() => setMenuOpen(false), []);

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
      {/* Mobile hamburger header */}
      {isMobile && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          background: "#16213e",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 1001,
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
        }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: 22,
              cursor: "pointer",
              padding: "4px 8px",
              lineHeight: 1,
            }}
            aria-label="Toggle menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>Policy Intel</span>
          <Link href="/review" onClick={closeMenu}>
            <span style={{
              fontSize: 12,
              background: "#e74c3c",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}>Review</span>
          </Link>
        </div>
      )}

      {/* Sidebar / Mobile overlay menu */}
      {(!isMobile || menuOpen) && (
        <>
          {/* Backdrop on mobile */}
          {isMobile && (
            <div
              onClick={closeMenu}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                zIndex: 1002,
              }}
            />
          )}
          <nav style={{
            width: 220,
            background: "#16213e",
            color: "#e8e8e8",
            padding: isMobile ? "60px 0 24px" : "24px 0",
            flexShrink: 0,
            ...(isMobile ? {
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: 1003,
              overflowY: "auto",
              boxShadow: "4px 0 16px rgba(0,0,0,0.2)",
            } : {}),
          }}>
            {!isMobile && (
              <div style={{ padding: "0 20px", marginBottom: 32 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: "#fff", margin: 0 }}>Policy Intel</h2>
                <p style={{ fontSize: 11, color: "#7f8c9b", marginTop: 4 }}>Grace &amp; McEwan</p>
              </div>
            )}
            {NAV_ITEMS.map((item) => {
              const active = item.path === "/" ? location === "/" : location.startsWith(item.path);
              return (
                <Link key={item.path} href={item.path} onClick={closeMenu}>
                  <div style={{
                    padding: isMobile ? "12px 20px" : "10px 20px",
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
        </>
      )}

      {/* Main content */}
      <main style={{
        flex: 1,
        padding: isMobile ? "60px 12px 16px" : "24px 32px",
        overflow: "auto",
        position: "relative",
        minWidth: 0,
      }}>
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
        <ErrorBoundary>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/intelligence" component={IntelligenceHubPage} />
          <Route path="/power-network" component={PowerNetworkPage} />
          <Route path="/calendar" component={CalendarPage} />
          <Route path="/committee-intel"><CommitteeIntelPage /></Route>
          <Route path="/committee-intel/hearing/:id">{(params) => <CommitteeIntelPage hearingId={Number(params.id)} />}</Route>
          <Route path="/committee-intel/session/:id">{(params) => <CommitteeIntelPage sessionId={Number(params.id)} />}</Route>
          <Route path="/matters" component={MattersPage} />
          <Route path="/matters/:id">{(params) => <MatterDetailPage id={Number(params.id)} />}</Route>
          <Route path="/alerts" component={AlertQueuePage} />
          <Route path="/alerts/:id" component={AlertDetailPage} />
          <Route path="/review" component={MobileAlertReviewPage} />
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
          <Route path="/client-alerts" component={ClientAlertPage} />
          <Route path="/weekly-report" component={WeeklyReportPage} />
          <Route path="/hearing-memo" component={HearingMemoPage} />
          <Route>
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Page not found</div>
          </Route>
        </Switch>
        </ErrorBoundary>
      </main>
    </div>
  );
}
