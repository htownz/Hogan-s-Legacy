import { Route, Switch, Link, useLocation } from "wouter";
import { useState, useEffect, useRef, useCallback, lazy, Suspense, type ComponentType } from "react";
import { api } from "./api";
import { ErrorBoundary } from "./components/ErrorBoundary";

type PreloadableComponent<T extends ComponentType<any>> = ReturnType<typeof lazy<T>> & {
  preload: () => Promise<{ default: T }>;
};

function lazyWithPreload<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>): PreloadableComponent<T> {
  const Component = lazy(factory) as PreloadableComponent<T>;
  Component.preload = factory;
  return Component;
}

const DashboardPage = lazyWithPreload(() => import("./pages/DashboardPage").then((mod) => ({ default: mod.DashboardPage })));
const PolicyMarketPage = lazyWithPreload(() => import("./pages/PolicyMarketPage").then((mod) => ({ default: mod.PolicyMarketPage })));
const IntelligenceHubPage = lazyWithPreload(() => import("./pages/IntelligenceHubPage").then((mod) => ({ default: mod.IntelligenceHubPage })));
const PowerNetworkPage = lazyWithPreload(() => import("./pages/PowerNetworkPage").then((mod) => ({ default: mod.PowerNetworkPage })));
const CalendarPage = lazyWithPreload(() => import("./pages/CalendarPage").then((mod) => ({ default: mod.CalendarPage })));
const CommitteeIntelPage = lazyWithPreload(() => import("./pages/CommitteeIntelPage").then((mod) => ({ default: mod.CommitteeIntelPage })));
const MattersPage = lazyWithPreload(() => import("./pages/MattersPage").then((mod) => ({ default: mod.MattersPage })));
const MatterDetailPage = lazyWithPreload(() => import("./pages/MatterDetailPage").then((mod) => ({ default: mod.MatterDetailPage })));
const AlertQueuePage = lazyWithPreload(() => import("./pages/AlertQueuePage").then((mod) => ({ default: mod.AlertQueuePage })));
const AlertDetailPage = lazyWithPreload(() => import("./pages/AlertDetailPage").then((mod) => ({ default: mod.AlertDetailPage })));
const MobileAlertReviewPage = lazyWithPreload(() => import("./pages/MobileAlertReviewPage").then((mod) => ({ default: mod.MobileAlertReviewPage })));
const IssueRoomsPage = lazyWithPreload(() => import("./pages/IssueRoomsPage").then((mod) => ({ default: mod.IssueRoomsPage })));
const IssueRoomDetailPage = lazyWithPreload(() => import("./pages/IssueRoomDetailPage").then((mod) => ({ default: mod.IssueRoomDetailPage })));
const WatchlistsPage = lazyWithPreload(() => import("./pages/WatchlistsPage").then((mod) => ({ default: mod.WatchlistsPage })));
const WatchlistDetailPage = lazyWithPreload(() => import("./pages/WatchlistDetailPage").then((mod) => ({ default: mod.WatchlistDetailPage })));
const StakeholdersPage = lazyWithPreload(() => import("./pages/StakeholdersPage").then((mod) => ({ default: mod.StakeholdersPage })));
const StakeholderDetailPage = lazyWithPreload(() => import("./pages/StakeholderDetailPage").then((mod) => ({ default: mod.StakeholderDetailPage })));
const DeliverablesPage = lazyWithPreload(() => import("./pages/DeliverablesPage").then((mod) => ({ default: mod.DeliverablesPage })));
const SourceDocsPage = lazyWithPreload(() => import("./pages/SourceDocsPage").then((mod) => ({ default: mod.SourceDocsPage })));
const AnalyticsPage = lazyWithPreload(() => import("./pages/AnalyticsPage").then((mod) => ({ default: mod.AnalyticsPage })));
const DigestPage = lazyWithPreload(() => import("./pages/DigestPage").then((mod) => ({ default: mod.DigestPage })));
const SettingsPage = lazyWithPreload(() => import("./pages/SettingsPage").then((mod) => ({ default: mod.SettingsPage })));
const PredictionsPage = lazyWithPreload(() => import("./pages/PredictionsPage").then((mod) => ({ default: mod.PredictionsPage })));
const SessionPage = lazyWithPreload(() => import("./pages/SessionPage").then((mod) => ({ default: mod.SessionPage })));
const RelationshipsPage = lazyWithPreload(() => import("./pages/RelationshipsPage").then((mod) => ({ default: mod.RelationshipsPage })));
const ClientAlertPage = lazyWithPreload(() => import("./pages/ClientAlertPage").then((mod) => ({ default: mod.ClientAlertPage })));
const WeeklyReportPage = lazyWithPreload(() => import("./pages/WeeklyReportPage").then((mod) => ({ default: mod.WeeklyReportPage })));
const HearingMemoPage = lazyWithPreload(() => import("./pages/HearingMemoPage").then((mod) => ({ default: mod.HearingMemoPage })));

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
  { path: "/market", label: "📈 Policy Market" },
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
  { path: "/predictions", label: "📊 Predictions" },
  { path: "/session", label: "🗓️ Session Manager" },
  { path: "/relationships", label: "🔗 Relationships" },
  { path: "/settings", label: "Settings" },
];

const NAV_PREFETCHERS: Record<string, () => Promise<unknown>> = {
  "/": DashboardPage.preload,
  "/market": PolicyMarketPage.preload,
  "/intelligence": IntelligenceHubPage.preload,
  "/power-network": PowerNetworkPage.preload,
  "/calendar": CalendarPage.preload,
  "/committee-intel": CommitteeIntelPage.preload,
  "/matters": MattersPage.preload,
  "/alerts": AlertQueuePage.preload,
  "/review": MobileAlertReviewPage.preload,
  "/issue-rooms": IssueRoomsPage.preload,
  "/watchlists": WatchlistsPage.preload,
  "/stakeholders": StakeholdersPage.preload,
  "/deliverables": DeliverablesPage.preload,
  "/client-alerts": ClientAlertPage.preload,
  "/weekly-report": WeeklyReportPage.preload,
  "/hearing-memo": HearingMemoPage.preload,
  "/sources": SourceDocsPage.preload,
  "/analytics": AnalyticsPage.preload,
  "/digest": DigestPage.preload,
  "/predictions": PredictionsPage.preload,
  "/session": SessionPage.preload,
  "/relationships": RelationshipsPage.preload,
};

function RouteLoadingState() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 240,
        color: "#5f7086",
        fontSize: 14,
      }}
    >
      Loading page...
    </div>
  );
}

export function App() {
  const [location, setLocation] = useLocation();
  const [toast, setToast] = useState<{ message: string; count: number } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const lastPending = useRef<number | null>(null);
  const prefetchedRoutes = useRef(new Set<string>());
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Close menu on navigation
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const prefetchRoute = useCallback((path: string) => {
    const preload = NAV_PREFETCHERS[path];
    if (!preload || prefetchedRoutes.current.has(path)) return;

    prefetchedRoutes.current.add(path);
    void preload().catch(() => {
      prefetchedRoutes.current.delete(path);
    });
  }, []);

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
          <Link href="/review" onClick={closeMenu} onMouseEnter={() => prefetchRoute("/review")} onFocus={() => prefetchRoute("/review")} onTouchStart={() => prefetchRoute("/review")}>
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
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={closeMenu}
                  onMouseEnter={() => prefetchRoute(item.path)}
                  onFocus={() => prefetchRoute(item.path)}
                  onTouchStart={() => prefetchRoute(item.path)}
                >
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
          <Suspense fallback={<RouteLoadingState />}>
            <Switch>
              <Route path="/" component={DashboardPage} />
              <Route path="/market" component={PolicyMarketPage} />
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
              <Route path="/predictions" component={PredictionsPage} />
              <Route path="/session" component={SessionPage} />
              <Route path="/relationships" component={RelationshipsPage} />
              <Route path="/client-alerts" component={ClientAlertPage} />
              <Route path="/weekly-report" component={WeeklyReportPage} />
              <Route path="/hearing-memo" component={HearingMemoPage} />
              <Route>
                <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Page not found</div>
              </Route>
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}
