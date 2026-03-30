import { Route, Switch, Link, useLocation } from "wouter";
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
import { DeliverablesPage } from "./pages/DeliverablesPage";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard" },
  { path: "/matters", label: "Matters" },
  { path: "/alerts", label: "Alert Queue" },
  { path: "/issue-rooms", label: "Issue Rooms" },
  { path: "/watchlists", label: "Watchlists" },
  { path: "/stakeholders", label: "Stakeholders" },
  { path: "/deliverables", label: "Briefs" },
  { path: "/sources", label: "Sources" },
  { path: "/digest", label: "Digest" },
];

export function App() {
  const [location] = useLocation();

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
      <main style={{ flex: 1, padding: "24px 32px", overflow: "auto" }}>
        <Switch>
          <Route path="/" component={DashboardPage} />
          <Route path="/matters" component={MattersPage} />
          <Route path="/matters/:id">{(params) => <MatterDetailPage id={Number(params.id)} />}</Route>
          <Route path="/alerts" component={AlertQueuePage} />
          <Route path="/issue-rooms" component={IssueRoomsPage} />
          <Route path="/issue-rooms/:id">{(params) => <IssueRoomDetailPage id={Number(params.id)} />}</Route>
          <Route path="/watchlists" component={WatchlistsPage} />
          <Route path="/stakeholders" component={StakeholdersPage} />
          <Route path="/deliverables" component={DeliverablesPage} />
          <Route path="/sources" component={SourceDocsPage} />
          <Route path="/digest" component={DigestPage} />
          <Route>
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>Page not found</div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
