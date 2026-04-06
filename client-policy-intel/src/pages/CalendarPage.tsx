import { useState, useMemo } from "react";
import { Link } from "wouter";
import { api, type HearingEvent } from "../api";
import { useAsync } from "../hooks";
import { DEFAULT_WORKSPACE_ID } from "../constants";

const CHAMBER_COLORS: Record<string, string> = {
  House: "#2980b9",
  Senate: "#8e44ad",
  Joint: "#e67e22",
};

const STATUS_COLORS: Record<string, string> = {
  scheduled: "#27ae60",
  in_progress: "#3498db",
  completed: "#95a5a6",
  cancelled: "#e74c3c",
  postponed: "#f39c12",
};

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - (day === 0 ? 6 : day - 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekDays(startMonday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startMonday);
    d.setDate(startMonday.getDate() + i);
    return d;
  });
}

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const start = new Date(first);
  start.setDate(1 - (startDay === 0 ? 6 : startDay - 1));
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function CalendarPage() {
  const [view, setView] = useState<"week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chamberFilter, setChamberFilter] = useState<string>("all");
  const [selectedHearing, setSelectedHearing] = useState<HearingEvent | null>(null);
  const [billQuery, setBillQuery] = useState("");
  const [billResult, setBillResult] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  // Fetch all hearings for the visible period
  const dateRange = useMemo(() => {
    if (view === "week") {
      const monday = getMonday(currentDate);
      const end = new Date(monday);
      end.setDate(monday.getDate() + 7);
      return { from: monday.toISOString(), to: end.toISOString() };
    }
    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const last = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 7);
    const startDay = first.getDay();
    const start = new Date(first);
    start.setDate(1 - (startDay === 0 ? 6 : startDay - 1));
    return { from: start.toISOString(), to: last.toISOString() };
  }, [view, currentDate]);

  const { data: hearings, loading } = useAsync(
    () => api.getHearings({ workspaceId: DEFAULT_WORKSPACE_ID, from: dateRange.from, to: dateRange.to }),
    [dateRange.from, dateRange.to],
  );

  const filteredHearings = useMemo(() => {
    if (!hearings) return [];
    if (chamberFilter === "all") return hearings;
    return hearings.filter((h) => h.chamber === chamberFilter);
  }, [hearings, chamberFilter]);

  const hearingsByDate = useMemo(() => {
    const map = new Map<string, HearingEvent[]>();
    for (const h of filteredHearings) {
      const key = new Date(h.hearingDate).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    }
    return map;
  }, [filteredHearings]);

  function navigate(dir: number) {
    const next = new Date(currentDate);
    if (view === "week") {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setMonth(next.getMonth() + dir);
    }
    setCurrentDate(next);
  }

  async function handleBillSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!billQuery.trim()) return;
    setSearching(true);
    setBillResult(null);
    try {
      const result = await api.getStakeholdersForBill(billQuery.trim());
      setBillResult(result);
    } catch (err: unknown) {
      setBillResult({ error: err instanceof Error ? err.message : String(err) });
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, margin: 0 }}>Hearing Calendar</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <select
            value={chamberFilter}
            onChange={(e) => setChamberFilter(e.target.value)}
            style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13 }}
          >
            <option value="all">All Chambers</option>
            <option value="House">House</option>
            <option value="Senate">Senate</option>
            <option value="Joint">Joint</option>
          </select>
          <button
            onClick={() => setView(view === "week" ? "month" : "week")}
            style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #ddd", fontSize: 13, cursor: "pointer", background: "#fff" }}
          >
            {view === "week" ? "Month View" : "Week View"}
          </button>
          <Link href="/hearing-memo">
            <span style={{
              padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 13, cursor: "pointer", background: "#6a1b9a", color: "#fff", fontWeight: 600, display: "inline-block",
            }}>
              🏛️ Hearing Memo
            </span>
          </Link>
          <Link href="/committee-intel">
            <span style={{
              padding: "6px 14px", borderRadius: 6, border: "none", fontSize: 13, cursor: "pointer", background: "#0f766e", color: "#fff", fontWeight: 600, display: "inline-block",
            }}>
              Committee Intel
            </span>
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <button onClick={() => navigate(-1)} style={navBtnStyle}>←</button>
        <h2 style={{ fontSize: 16, margin: 0, minWidth: 200, textAlign: "center" }}>
          {view === "week"
            ? `Week of ${formatDate(getMonday(currentDate))}`
            : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
          }
        </h2>
        <button onClick={() => navigate(1)} style={navBtnStyle}>→</button>
        <button
          onClick={() => setCurrentDate(new Date())}
          style={{ ...navBtnStyle, fontSize: 12, padding: "4px 12px" }}
        >
          Today
        </button>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "#888" }}>
          {filteredHearings.length} hearing{filteredHearings.length !== 1 ? "s" : ""}
          {loading && " (loading...)"}
        </span>
      </div>

      {/* Calendar Grid */}
      {view === "month" ? (
        <MonthGrid
          year={currentDate.getFullYear()}
          month={currentDate.getMonth()}
          hearingsByDate={hearingsByDate}
          onSelect={setSelectedHearing}
        />
      ) : (
        <WeekGrid
          monday={getMonday(currentDate)}
          hearingsByDate={hearingsByDate}
          onSelect={setSelectedHearing}
        />
      )}

      {/* Selected Hearing Detail */}
      {selectedHearing && (
        <div style={{
          marginTop: 24,
          background: "#fff",
          borderRadius: 10,
          padding: 20,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          borderLeft: `4px solid ${CHAMBER_COLORS[selectedHearing.chamber] ?? "#555"}`,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>{selectedHearing.committee}</h3>
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: (CHAMBER_COLORS[selectedHearing.chamber] ?? "#555") + "18", color: CHAMBER_COLORS[selectedHearing.chamber] ?? "#555", fontWeight: 600 }}>
                  {selectedHearing.chamber}
                </span>
                <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: (STATUS_COLORS[selectedHearing.status] ?? "#555") + "18", color: STATUS_COLORS[selectedHearing.status] ?? "#555", fontWeight: 600 }}>
                  {selectedHearing.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedHearing(null)} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "#888" }}>×</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginTop: 14 }}>
            <div>
              <div style={{ fontSize: 11, color: "#888" }}>Date</div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{new Date(selectedHearing.hearingDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
            {selectedHearing.timeDescription && (
              <div>
                <div style={{ fontSize: 11, color: "#888" }}>Time</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedHearing.timeDescription}</div>
              </div>
            )}
            {selectedHearing.location && (
              <div>
                <div style={{ fontSize: 11, color: "#888" }}>Location</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedHearing.location}</div>
              </div>
            )}
          </div>
          {selectedHearing.description && (
            <p style={{ fontSize: 13, color: "#555", marginTop: 12, marginBottom: 0 }}>{selectedHearing.description}</p>
          )}
          {selectedHearing.relatedBillIds.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <span style={{ fontSize: 11, color: "#888" }}>Related Bills: </span>
              {selectedHearing.relatedBillIds.map((b) => (
                <span key={b} style={{ fontSize: 12, padding: "2px 8px", borderRadius: 10, background: "#e8f4fd", color: "#2980b9", marginRight: 4, fontWeight: 500 }}>{b}</span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <Link href={`/committee-intel/hearing/${selectedHearing.id}`}>
              <span style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 13,
                cursor: "pointer",
                background: "#0f766e",
                color: "#fff",
                fontWeight: 600,
                display: "inline-block",
              }}>
                Launch Committee Intel
              </span>
            </Link>
            <Link href="/hearing-memo">
              <span style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid #d8b4fe",
                fontSize: 13,
                cursor: "pointer",
                background: "#faf5ff",
                color: "#6a1b9a",
                fontWeight: 600,
                display: "inline-block",
              }}>
                Open Hearing Memo
              </span>
            </Link>
          </div>
        </div>
      )}

      {/* Bill Stakeholder Lookup */}
      <div style={{ marginTop: 32, background: "#fff", borderRadius: 10, padding: 20, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        <h3 style={{ fontSize: 15, margin: "0 0 12px" }}>Who do I need to talk to about a bill?</h3>
        <form onSubmit={handleBillSearch} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input
            value={billQuery}
            onChange={(e) => setBillQuery(e.target.value)}
            placeholder="Enter bill ID (e.g. HB 1234, SB 56)"
            style={{ flex: 1, padding: "8px 12px", border: "1px solid #ddd", borderRadius: 6, fontSize: 13 }}
          />
          <button type="submit" disabled={searching || !billQuery.trim()}
            style={{ padding: "8px 16px", fontSize: 13, background: "#16213e", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, opacity: searching || !billQuery.trim() ? 0.6 : 1 }}>
            {searching ? "Searching..." : "Search"}
          </button>
        </form>

        {billResult && !billResult.error && (
          <div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 8 }}>
              <strong>{billResult.billId}</strong>
              {billResult.committees.length > 0
                ? ` — Committees: ${billResult.committees.join(", ")}`
                : " — No committee data found yet"}
            </div>
            {billResult.committeeMembers.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 6 }}>Committee Members</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 8 }}>
                  {billResult.committeeMembers.map((m: any) => (
                    <Link key={m.committeeMemberId} href={`/stakeholders/${m.stakeholderId}`}>
                      <div style={{ padding: "8px 12px", background: "#f8f9fa", borderRadius: 6, cursor: "pointer", borderLeft: `3px solid ${CHAMBER_COLORS[m.chamber] ?? "#555"}` }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: "#888" }}>
                          {m.role.replace(/_/g, " ")} · {m.party} · {m.committeeName}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {billResult.relatedStakeholders.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#333", marginBottom: 6 }}>Stakeholders with Related Observations</div>
                {billResult.relatedStakeholders.map((s: any) => (
                  <Link key={s.stakeholderId} href={`/stakeholders/${s.stakeholderId}`}>
                    <div style={{ padding: "8px 12px", background: "#f8f9fa", borderRadius: 6, cursor: "pointer", marginBottom: 6, borderLeft: "3px solid #e67e22" }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{s.observationText.slice(0, 120)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {billResult.committeeMembers.length === 0 && billResult.relatedStakeholders.length === 0 && (
              <p style={{ fontSize: 13, color: "#888" }}>
                No stakeholders linked to this bill yet. Add committee membership data or observations to connect legislators.
              </p>
            )}
          </div>
        )}
        {billResult?.error && (
          <p style={{ color: "#e74c3c", fontSize: 13 }}>{billResult.error}</p>
        )}
      </div>
    </div>
  );
}

// ── Month Grid ────────────────────────────────────────────────────────────────

function MonthGrid({
  year, month, hearingsByDate, onSelect,
}: {
  year: number;
  month: number;
  hearingsByDate: Map<string, HearingEvent[]>;
  onSelect: (h: HearingEvent) => void;
}) {
  const days = getMonthDays(year, month);
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date().toDateString();

  return (
    <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
        {weekDays.map((d) => (
          <div key={d} style={{ padding: "8px 4px", textAlign: "center", fontSize: 11, fontWeight: 600, color: "#888", background: "#f8f9fa", borderBottom: "1px solid #eee" }}>
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          const isCurrentMonth = day.getMonth() === month;
          const isToday = day.toDateString() === today;
          const dayHearings = hearingsByDate.get(day.toDateString()) ?? [];

          return (
            <div key={i} style={{
              padding: "4px 6px",
              minHeight: 80,
              borderRight: (i + 1) % 7 !== 0 ? "1px solid #f0f0f0" : "none",
              borderBottom: i < 35 ? "1px solid #f0f0f0" : "none",
              background: isToday ? "#eaf6ff" : isCurrentMonth ? "#fff" : "#fafafa",
            }}>
              <div style={{
                fontSize: 12,
                fontWeight: isToday ? 700 : 400,
                color: isCurrentMonth ? (isToday ? "#2980b9" : "#333") : "#ccc",
                marginBottom: 2,
              }}>
                {day.getDate()}
              </div>
              {dayHearings.slice(0, 3).map((h) => (
                <div
                  key={h.id}
                  onClick={() => onSelect(h)}
                  style={{
                    fontSize: 10,
                    padding: "2px 4px",
                    borderRadius: 3,
                    background: (CHAMBER_COLORS[h.chamber] ?? "#555") + "18",
                    color: CHAMBER_COLORS[h.chamber] ?? "#555",
                    marginBottom: 2,
                    cursor: "pointer",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    fontWeight: 500,
                  }}
                >
                  {h.timeDescription ? h.timeDescription + " " : ""}{h.committee}
                </div>
              ))}
              {dayHearings.length > 3 && (
                <div style={{ fontSize: 10, color: "#888" }}>+{dayHearings.length - 3} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Week Grid ─────────────────────────────────────────────────────────────────

function WeekGrid({
  monday, hearingsByDate, onSelect,
}: {
  monday: Date;
  hearingsByDate: Map<string, HearingEvent[]>;
  onSelect: (h: HearingEvent) => void;
}) {
  const days = getWeekDays(monday);
  const today = new Date().toDateString();

  return (
    <div style={{ background: "#fff", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
      {days.map((day, i) => {
        const isToday = day.toDateString() === today;
        const dayHearings = hearingsByDate.get(day.toDateString()) ?? [];
        const dayName = day.toLocaleDateString("en-US", { weekday: "long" });

        return (
          <div key={i} style={{
            padding: "12px 16px",
            borderBottom: i < 6 ? "1px solid #f0f0f0" : "none",
            background: isToday ? "#eaf6ff" : "#fff",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: dayHearings.length > 0 ? 8 : 0 }}>
              <span style={{ fontSize: 14, fontWeight: isToday ? 700 : 500, color: isToday ? "#2980b9" : "#333" }}>
                {dayName}
              </span>
              <span style={{ fontSize: 12, color: "#888" }}>{formatDate(day)}</span>
              {isToday && (
                <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 8, background: "#2980b9", color: "#fff", fontWeight: 600 }}>TODAY</span>
              )}
              {dayHearings.length > 0 && (
                <span style={{ fontSize: 11, color: "#888" }}>({dayHearings.length} hearing{dayHearings.length !== 1 ? "s" : ""})</span>
              )}
            </div>
            {dayHearings.map((h) => (
              <div
                key={h.id}
                onClick={() => onSelect(h)}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  background: "#f8f9fa",
                  marginBottom: 6,
                  cursor: "pointer",
                  borderLeft: `3px solid ${CHAMBER_COLORS[h.chamber] ?? "#555"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{h.committee}</div>
                  <div style={{ fontSize: 11, color: "#888" }}>
                    {h.timeDescription ?? "TBD"} · {h.location ?? "TBD"}
                  </div>
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: (CHAMBER_COLORS[h.chamber] ?? "#555") + "18", color: CHAMBER_COLORS[h.chamber] ?? "#555", fontWeight: 600 }}>
                  {h.chamber}
                </span>
              </div>
            ))}
            {dayHearings.length === 0 && (
              <div style={{ fontSize: 12, color: "#ccc", fontStyle: "italic" }}>No hearings scheduled</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  padding: "6px 12px",
  borderRadius: 6,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
};
