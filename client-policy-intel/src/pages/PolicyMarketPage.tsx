import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import {
  api,
  type CommitteeIntelSession,
  type Digest,
  type IssueRoom,
  type NetworkGraph,
  type PredictionDashboard,
  type PredictionResult,
  type SessionDashboard,
} from "../api";
import { DEFAULT_WORKSPACE_ID } from "../constants";
import { useAsync } from "../hooks";

const SURFACE = "#ffffff";
const INK = "#10233f";
const MUTED = "#5f7086";
const BORDER = "#dbe5f0";
const NAVY = "#102a43";
const SKY = "#2f80ed";
const MINT = "#1f9d72";
const GOLD = "#c69214";
const CRIMSON = "#cf433f";

const PREDICTION_META: Record<string, { label: string; color: string }> = {
  likely_pass: { label: "Likely Pass", color: MINT },
  lean_pass: { label: "Lean Pass", color: "#31b97c" },
  toss_up: { label: "Toss-Up", color: GOLD },
  lean_fail: { label: "Lean Fail", color: "#d97706" },
  likely_fail: { label: "Likely Fail", color: CRIMSON },
  dead: { label: "Dead", color: "#7b8794" },
};

const SESSION_PHASE_META: Record<string, { label: string; color: string }> = {
  interim: { label: "Interim", color: "#7b8794" },
  pre_filing: { label: "Pre-Filing", color: "#2d6cdf" },
  filing_period: { label: "Filing Period", color: "#2251cc" },
  committee_hearings: { label: "Committee Hearings", color: GOLD },
  floor_action: { label: "Floor Action", color: CRIMSON },
  conference: { label: "Conference", color: "#7c3aed" },
  enrollment: { label: "Enrollment", color: MINT },
  post_session: { label: "Post-Session", color: NAVY },
  special_session: { label: "Special Session", color: "#b42318" },
};

const COMMITTEE_STATUS_META: Record<string, { label: string; color: string }> = {
  planned: { label: "Planned", color: SKY },
  monitoring: { label: "Monitoring", color: MINT },
  paused: { label: "Paused", color: GOLD },
  completed: { label: "Completed", color: "#7b8794" },
};

const ISSUE_ROOM_META: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: MINT },
  watching: { label: "Watching", color: GOLD },
  resolved: { label: "Resolved", color: SKY },
  archived: { label: "Archived", color: "#7b8794" },
};

type MarketFocusItem =
  | {
      key: string;
      kind: "prediction";
      title: string;
      subtitle: string;
      href: string;
      toneColor: string;
      prediction: PredictionResult;
    }
  | {
      key: string;
      kind: "committee";
      title: string;
      subtitle: string;
      href: string;
      toneColor: string;
      session: CommitteeIntelSession;
    }
  | {
      key: string;
      kind: "issueRoom";
      title: string;
      subtitle: string;
      href: string;
      toneColor: string;
      issueRoom: IssueRoom;
    };

type PredictionFocusItem = Extract<MarketFocusItem, { kind: "prediction" }>;
type CommitteeFocusItem = Extract<MarketFocusItem, { kind: "committee" }>;
type IssueRoomFocusItem = Extract<MarketFocusItem, { kind: "issueRoom" }>;

type CatalystItem = {
  id: string;
  title: string;
  detail: string;
  at: string;
  kind: string;
  toneColor: string;
  href?: string;
};

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener("change", handler);
    setMatches(mql.matches);
    return () => mql.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

function isSessionDashboard(value: SessionDashboard | { session: null } | null): value is SessionDashboard {
  return Boolean(value && value.session);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(value: string | null | undefined): string {
  if (!value) return "Unknown";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatRelative(value: string | null | undefined): string {
  if (!value) return "No timestamp";
  const deltaMs = new Date(value).getTime() - Date.now();
  const minutes = Math.round(deltaMs / 60000);
  const absMinutes = Math.abs(minutes);
  if (absMinutes < 60) return minutes >= 0 ? `in ${absMinutes}m` : `${absMinutes}m ago`;
  const hours = Math.round(absMinutes / 60);
  if (hours < 48) return minutes >= 0 ? `in ${hours}h` : `${hours}h ago`;
  const days = Math.round(hours / 24);
  return minutes >= 0 ? `in ${days}d` : `${days}d ago`;
}

function percent(value: number | null | undefined): string {
  return `${Math.round((value ?? 0) * 100)}%`;
}

function predictionLabel(prediction: string): string {
  return PREDICTION_META[prediction]?.label ?? prediction.replace(/_/g, " ");
}

function niceLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function sortByDateDesc<T extends { at: string }>(items: T[]): T[] {
  return [...items].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
}

function Panel(props: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <section
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 18px 48px rgba(16, 35, 63, 0.08)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14, alignItems: "flex-start" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 17, color: INK }}>{props.title}</h2>
          {props.subtitle ? <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED }}>{props.subtitle}</p> : null}
        </div>
        {props.actions}
      </div>
      {props.children}
    </section>
  );
}

function TonePill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "5px 10px",
        borderRadius: 999,
        background: `${color}18`,
        color,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 0.4,
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  );
}

function MetricCard(props: { label: string; value: string | number; toneColor: string; detail?: string }) {
  return (
    <div
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #f7fbff 100%)",
        border: `1px solid ${BORDER}`,
        borderRadius: 16,
        padding: 16,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: MUTED }}>{props.label}</div>
      <div style={{ marginTop: 10, fontSize: 28, fontWeight: 700, color: props.toneColor }}>{props.value}</div>
      {props.detail ? <div style={{ marginTop: 6, fontSize: 12, color: MUTED }}>{props.detail}</div> : null}
    </div>
  );
}

function ProgressBar({ label, value, toneColor }: { label: string; value: number; toneColor: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: MUTED, marginBottom: 6 }}>
        <span>{label}</span>
        <strong style={{ color: INK }}>{Math.round(value * 100)}%</strong>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: "#e7eef5", overflow: "hidden" }}>
        <div style={{ width: `${Math.max(4, Math.round(value * 100))}%`, height: "100%", background: toneColor }} />
      </div>
    </div>
  );
}

function EmptyPanelState(props: { title: string; detail: string; href?: string; actionLabel?: string }) {
  return (
    <div style={{ padding: 18, borderRadius: 14, background: "#f7fbff", border: `1px dashed ${BORDER}` }}>
      <div style={{ fontWeight: 700, color: INK }}>{props.title}</div>
      <div style={{ marginTop: 6, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{props.detail}</div>
      {props.href && props.actionLabel ? (
        <div style={{ marginTop: 12 }}>
          <Link href={props.href}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 999,
                background: NAVY,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {props.actionLabel}
            </span>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function RailItem(props: {
  title: string;
  subtitle: string;
  meta: string;
  toneColor: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={props.onClick}
      style={{
        width: "100%",
        textAlign: "left",
        background: props.selected ? "#edf5ff" : "#fff",
        border: props.selected ? `1px solid ${props.toneColor}` : `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: 14,
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: INK }}>{props.title}</div>
          <div style={{ marginTop: 4, fontSize: 12, color: MUTED, lineHeight: 1.45 }}>{props.subtitle}</div>
        </div>
        <span style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, background: props.toneColor, marginTop: 4 }} />
      </div>
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", color: props.toneColor }}>{props.meta}</div>
    </button>
  );
}

function FocusHero({ item }: { item: MarketFocusItem }) {
  if (item.kind === "prediction") {
    const meta = PREDICTION_META[item.prediction.prediction] ?? { label: item.prediction.prediction, color: item.toneColor };
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <TonePill label={meta.label} color={meta.color} />
            <h1 style={{ margin: "14px 0 0", fontSize: 30, color: INK }}>{item.prediction.billId}</h1>
            <p style={{ margin: "8px 0 0", fontSize: 15, color: MUTED, maxWidth: 720, lineHeight: 1.6 }}>
              {item.prediction.billTitle || "No bill title captured yet."}
            </p>
          </div>
          <div style={{ minWidth: 170, textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED }}>Market Odds</div>
            <div style={{ marginTop: 8, fontSize: 42, fontWeight: 800, color: meta.color }}>{percent(item.prediction.probability)}</div>
            <div style={{ fontSize: 12, color: MUTED }}>Confidence {percent(item.prediction.confidence)}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 20 }}>
          <MetricCard label="Current Stage" value={item.prediction.currentStage || "Unknown"} toneColor={INK} detail={item.prediction.regime} />
          <MetricCard label="Next Milestone" value={item.prediction.nextMilestone || "None"} toneColor={GOLD} detail={formatDate(item.prediction.nextMilestoneDate)} />
          <MetricCard label="Sponsor Strength" value={percent(item.prediction.sponsorStrength)} toneColor={MINT} detail="Political muscle" />
          <MetricCard label="Committee Alignment" value={percent(item.prediction.committeeAlignment)} toneColor={SKY} detail="Current committee fit" />
        </div>
      </>
    );
  }

  if (item.kind === "committee") {
    const meta = COMMITTEE_STATUS_META[item.session.status] ?? { label: niceLabel(item.session.status), color: item.toneColor };
    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <TonePill label={meta.label} color={meta.color} />
            <h1 style={{ margin: "14px 0 0", fontSize: 30, color: INK }}>{item.session.title}</h1>
            <p style={{ margin: "8px 0 0", fontSize: 15, color: MUTED, maxWidth: 720, lineHeight: 1.6 }}>
              {item.session.chamber} {item.session.committee} · {formatDate(item.session.hearingDate)}
            </p>
          </div>
          <div style={{ minWidth: 170, textAlign: "right" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED }}>Feed Status</div>
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 700, color: item.session.autoIngestEnabled ? MINT : GOLD }}>
              {item.session.autoIngestEnabled ? "Auto-Ingest On" : "Manual Feed"}
            </div>
            <div style={{ fontSize: 12, color: MUTED }}>{item.session.lastAutoIngestedAt ? `Updated ${formatRelative(item.session.lastAutoIngestedAt)}` : "Awaiting ingest"}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 20 }}>
          <MetricCard label="Focus Topics" value={item.session.focusTopicsJson.length} toneColor={SKY} detail={item.session.focusTopicsJson.slice(0, 2).join(" · ") || "Set topics"} />
          <MetricCard label="Interim Charges" value={item.session.interimChargesJson.length} toneColor={GOLD} detail={item.session.interimChargesJson.slice(0, 1).join(" · ") || "No charge focus yet"} />
          <MetricCard label="Transcript Source" value={niceLabel(item.session.transcriptSourceType)} toneColor={INK} detail={item.session.transcriptSourceUrl ? "Live source configured" : "Source is local / official"} />
          <MetricCard label="Analysis Pulse" value={item.session.lastAnalyzedAt ? formatRelative(item.session.lastAnalyzedAt) : "Pending"} toneColor={MINT} detail={item.session.autoIngestError || "No ingest warnings"} />
        </div>
      </>
    );
  }

  const meta = ISSUE_ROOM_META[item.issueRoom.status] ?? { label: niceLabel(item.issueRoom.status), color: item.toneColor };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <TonePill label={meta.label} color={meta.color} />
          <h1 style={{ margin: "14px 0 0", fontSize: 30, color: INK }}>{item.issueRoom.title}</h1>
          <p style={{ margin: "8px 0 0", fontSize: 15, color: MUTED, maxWidth: 720, lineHeight: 1.6 }}>
            {item.issueRoom.summary || "No summary yet. This issue room needs a sharper market thesis and operating line."}
          </p>
        </div>
        <div style={{ minWidth: 170, textAlign: "right" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED }}>Updated</div>
          <div style={{ marginTop: 8, fontSize: 18, fontWeight: 700, color: meta.color }}>{formatRelative(item.issueRoom.updatedAt)}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{item.issueRoom.issueType ? niceLabel(item.issueRoom.issueType) : "General policy room"}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 20 }}>
        <MetricCard label="Jurisdiction" value={niceLabel(item.issueRoom.jurisdiction)} toneColor={INK} detail="Current market" />
        <MetricCard label="Linked Bills" value={item.issueRoom.relatedBillIds.length} toneColor={SKY} detail={item.issueRoom.relatedBillIds.slice(0, 2).join(" · ") || "Attach bills as thesis sharpens"} />
        <MetricCard label="Recommended Path" value={item.issueRoom.recommendedPath || "Not set"} toneColor={GOLD} detail="Client operating line" />
        <MetricCard label="Matter" value={item.issueRoom.matterId ?? "Unlinked"} toneColor={MINT} detail="Attach to a tracked matter when ready" />
      </div>
    </>
  );
}

function FocusDetail(props: {
  item: MarketFocusItem;
  digest: Digest | null;
  sessionDashboard: SessionDashboard | null;
  stacked: boolean;
}) {
  const detailColumns = props.stacked ? "1fr" : "1.2fr 1fr";
  const splitColumns = props.stacked ? "1fr" : "1fr 1fr";

  if (props.item.kind === "prediction") {
    const p = props.item.prediction;
    return (
      <div style={{ display: "grid", gridTemplateColumns: detailColumns, gap: 18, marginTop: 20 }}>
        <Panel title="Signal Stack" subtitle="What is pushing the odds right now">
          <div style={{ display: "grid", gap: 14 }}>
            <ProgressBar label="Probability" value={p.probability} toneColor={props.item.toneColor} />
            <ProgressBar label="Confidence" value={p.confidence} toneColor={NAVY} />
            <ProgressBar label="Sponsor Strength" value={p.sponsorStrength} toneColor={MINT} />
            <ProgressBar label="Committee Alignment" value={p.committeeAlignment} toneColor={SKY} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: splitColumns, gap: 14, marginTop: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: MINT }}>Support Signals</div>
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {p.supportSignals.slice(0, 5).map((signal, index) => (
                  <div key={`${signal.signal}-${index}`} style={{ padding: 10, borderRadius: 12, background: "#effaf5", color: INK, fontSize: 13 }}>
                    <strong>{signal.signal}</strong>
                    <div style={{ marginTop: 3, color: MUTED }}>{signal.source}</div>
                  </div>
                ))}
                {p.supportSignals.length === 0 ? <EmptyPanelState title="No support signals yet" detail="Run bill discovery or enrich this bill with committee and network data." /> : null}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: CRIMSON }}>Opposition Signals</div>
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {p.oppositionSignals.slice(0, 5).map((signal, index) => (
                  <div key={`${signal.signal}-${index}`} style={{ padding: 10, borderRadius: 12, background: "#fff3f2", color: INK, fontSize: 13 }}>
                    <strong>{signal.signal}</strong>
                    <div style={{ marginTop: 3, color: MUTED }}>{signal.source}</div>
                  </div>
                ))}
                {p.oppositionSignals.length === 0 ? <EmptyPanelState title="No opposition signals yet" detail="That could mean whitespace or just missing evidence. Treat it as unknown, not safe." /> : null}
              </div>
            </div>
          </div>
        </Panel>
        <Panel title="Risk Register" subtitle="The reasons this trade can still break against you">
          <div style={{ display: "grid", gap: 10 }}>
            {p.riskFactors.slice(0, 6).map((risk, index) => (
              <div key={`${risk.factor}-${index}`} style={{ padding: 12, borderRadius: 12, border: `1px solid ${BORDER}`, background: "#fbfdff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                  <strong style={{ color: INK }}>{risk.factor}</strong>
                  <span style={{ color: risk.impact === "positive" ? MINT : risk.impact === "negative" ? CRIMSON : GOLD, fontWeight: 700 }}>{niceLabel(risk.impact)}</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{risk.detail}</div>
              </div>
            ))}
            {p.riskFactors.length === 0 ? <EmptyPanelState title="No risk factors yet" detail="This is where procedural, sponsor, coalition, donor, and media pressure should stack into a decision-grade thesis." /> : null}
          </div>
          {p.historicalComps.length > 0 ? (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED }}>Historical Comps</div>
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {p.historicalComps.slice(0, 3).map((comp) => (
                  <div key={`${comp.billId}-${comp.session}`} style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: 10, borderRadius: 12, background: "#f7fbff" }}>
                    <div>
                      <strong style={{ color: INK }}>{comp.billId}</strong>
                      <div style={{ fontSize: 12, color: MUTED }}>{comp.session}</div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12, color: MUTED }}>
                      <div>{Math.round(comp.similarity * 100)}% match</div>
                      <div>{comp.outcome}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Panel>
      </div>
    );
  }

  if (props.item.kind === "committee") {
    const s = props.item.session;
    return (
      <div style={{ display: "grid", gridTemplateColumns: detailColumns, gap: 18, marginTop: 20 }}>
        <Panel title="Committee Readout" subtitle="What this hearing is about and why it matters now">
          <div style={{ fontSize: 14, lineHeight: 1.7, color: MUTED }}>
            {s.liveSummary || s.clientContext || "No live summary yet. Run the committee analysis and focused brief workflow to make this market-ready."}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: splitColumns, gap: 14, marginTop: 18 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: SKY }}>Focus Topics</div>
              <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {s.focusTopicsJson.map((topic) => <TonePill key={topic} label={topic} color={SKY} />)}
                {s.focusTopicsJson.length === 0 ? <span style={{ fontSize: 13, color: MUTED }}>No focus topics</span> : null}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: GOLD }}>Interim Charges</div>
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                {s.interimChargesJson.slice(0, 4).map((charge) => (
                  <div key={charge} style={{ padding: 10, borderRadius: 12, background: "#fff8ea", fontSize: 13, color: INK }}>{charge}</div>
                ))}
                {s.interimChargesJson.length === 0 ? <span style={{ fontSize: 13, color: MUTED }}>No charges captured</span> : null}
              </div>
            </div>
          </div>
        </Panel>
        <Panel title="Operating Context" subtitle="Readiness, ingestion, and follow-through">
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
              <strong style={{ color: INK }}>Agenda</strong>
              <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>{s.agendaUrl || "No agenda link yet"}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
              <strong style={{ color: INK }}>Video</strong>
              <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>{s.videoUrl || "No video link yet"}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
              <strong style={{ color: INK }}>Monitoring Notes</strong>
              <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>{s.monitoringNotes || "No operator notes yet"}</div>
            </div>
          </div>
        </Panel>
      </div>
    );
  }

  const room = props.item.issueRoom;
  return (
    <div style={{ display: "grid", gridTemplateColumns: detailColumns, gap: 18, marginTop: 20 }}>
      <Panel title="Issue Thesis" subtitle="What we think is happening and how we plan to play it">
        <div style={{ fontSize: 14, lineHeight: 1.7, color: MUTED }}>
          {room.summary || "This issue room exists, but it still needs a sharper thesis, timeline, and probability posture."}
        </div>
        <div style={{ marginTop: 18, padding: 14, borderRadius: 14, background: "#f7fbff" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED }}>Recommended Path</div>
          <div style={{ marginTop: 8, fontSize: 15, color: INK }}>{room.recommendedPath || "Define the offensive or defensive path for this room."}</div>
        </div>
      </Panel>
      <Panel title="Market Context" subtitle="Signals this room should pull into the next memo">
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
            <strong style={{ color: INK }}>Digest Pressure</strong>
            <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>
              {props.digest ? `${props.digest.summary.totalAlerts} alerts this week, ${props.digest.summary.pendingReview} still pending review.` : "Digest not loaded."}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
            <strong style={{ color: INK }}>Session Overlay</strong>
            <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>
              {props.sessionDashboard ? `${SESSION_PHASE_META[props.sessionDashboard.currentPhase]?.label ?? props.sessionDashboard.currentPhase} phase with ${props.sessionDashboard.stats.pendingActions} pending actions.` : "No active session context yet."}
            </div>
          </div>
          <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
            <strong style={{ color: INK }}>Related Bills</strong>
            <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>
              {room.relatedBillIds.length > 0 ? room.relatedBillIds.join(", ") : "Attach related legislation to turn this into a tradeable issue room."}
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function buildPlaybook(item: MarketFocusItem, sessionDashboard: SessionDashboard | null): Array<{ title: string; detail: string; href: string }> {
  const sessionPhase = sessionDashboard ? SESSION_PHASE_META[sessionDashboard.currentPhase]?.label ?? sessionDashboard.currentPhase : "current phase";
  if (item.kind === "prediction") {
    if (item.prediction.probability >= 0.65) {
      return [
        { title: "Press the advantage", detail: `Lean into sponsor, committee, and coalition support while the bill sits in ${item.prediction.currentStage || sessionPhase}.`, href: "/predictions" },
        { title: "Write the client memo", detail: "Capture why the odds have improved, who moved them, and which catalyst could still reverse the trade.", href: "/weekly-report" },
        { title: "Link it to an issue room", detail: "Turn the forecast into assignments, coalition outreach, and a visible operator workflow.", href: "/issue-rooms" },
      ];
    }
    return [
      { title: "Hunt the missing pressure", detail: "Map which stakeholder, committee, or donor signal is holding the bill below conviction level.", href: "/relationships" },
      { title: "Build the defense case", detail: "Document the most credible failure path so the client does not confuse hope with probability.", href: "/hearing-memo" },
      { title: "Re-price after the next catalyst", detail: "Re-run passage prediction after the next hearing, amendment, or leadership move.", href: "/predictions" },
    ];
  }

  if (item.kind === "committee") {
    return [
      { title: "Run focused brief", detail: "Convert the hearing feed into an issue-specific readout you can send the same day.", href: item.href },
      { title: "Queue witness and member follow-up", detail: "Translate live signals into meetings, testimony prep, or amendment asks for the next phase.", href: "/session" },
      { title: "Fold this into the relationship graph", detail: "Tag who spoke, who aligned, and where pressure or alliance is forming behind the dais.", href: "/relationships" },
    ];
  }

  return [
    { title: "Sharpen the thesis", detail: "Rewrite the room around what wins, what kills, and which people or processes move the result.", href: item.href },
    { title: "Attach measurable catalysts", detail: "Tie this room to hearing dates, bill movement, and session milestones so it behaves like a live market instrument.", href: "/session" },
    { title: "Create the client-facing output", detail: "Turn the issue room into a memo, alert, or defensive playbook while the context is fresh.", href: "/client-alerts" },
  ];
}

export function PolicyMarketPage() {
  const workspaceId = DEFAULT_WORKSPACE_ID;
  const stackedLayout = useMediaQuery("(max-width: 1180px)");
  const hearingWindowStart = useMemo(() => {
    const from = new Date();
    from.setDate(from.getDate() - 14);
    return from.toISOString();
  }, []);

  const { data: predictionDashboard, loading: predictionLoading, error: predictionError, refetch: refetchPredictions } = useAsync<PredictionDashboard>(
    () => api.getPredictionDashboard(workspaceId),
    [workspaceId],
  );
  const { data: sessionResponse, loading: sessionLoading, error: sessionError, refetch: refetchSession } = useAsync<SessionDashboard | { session: null }>(
    () => api.getSessionDashboard(workspaceId),
    [workspaceId],
  );
  const { data: network, loading: networkLoading, error: networkError, refetch: refetchNetwork } = useAsync<NetworkGraph>(
    () => api.getRelationshipNetwork(workspaceId, { minStrength: 0.35 }),
    [workspaceId],
  );
  const { data: digest, loading: digestLoading, error: digestError, refetch: refetchDigest } = useAsync<Digest>(
    () => api.getDigest(workspaceId),
    [workspaceId],
  );
  const { data: committeeSessions, loading: committeeLoading, error: committeeError, refetch: refetchCommittee } = useAsync<CommitteeIntelSession[]>(
    () => api.getCommitteeIntelSessions({ workspaceId, from: hearingWindowStart }),
    [workspaceId, hearingWindowStart],
  );
  const { data: issueRooms, loading: issueRoomLoading, error: issueRoomError, refetch: refetchIssueRooms } = useAsync<IssueRoom[]>(
    () => api.getIssueRooms(workspaceId),
    [workspaceId],
  );

  const sessionDashboard: SessionDashboard | null = isSessionDashboard(sessionResponse) ? sessionResponse : null;
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const predictionItems = useMemo<PredictionFocusItem[]>(() => {
    const dashboard = predictionDashboard;
    if (!dashboard) return [];
    const movers = [...dashboard.topOpportunities, ...dashboard.topRisks].slice(0, 8);
    return movers.map((prediction) => ({
      key: `prediction:${prediction.billId}`,
      kind: "prediction",
      title: prediction.billId,
      subtitle: prediction.billTitle || prediction.currentStage || "Tracked bill",
      href: "/predictions",
      toneColor: PREDICTION_META[prediction.prediction]?.color ?? NAVY,
      prediction,
    }));
  }, [predictionDashboard]);

  const committeeItems = useMemo<CommitteeFocusItem[]>(() => {
    return [...(committeeSessions ?? [])]
      .sort((left, right) => new Date(right.hearingDate).getTime() - new Date(left.hearingDate).getTime())
      .slice(0, 6)
      .map((session) => ({
        key: `committee:${session.id}`,
        kind: "committee",
        title: session.committee,
        subtitle: session.title,
        href: `/committee-intel/session/${session.id}`,
        toneColor: COMMITTEE_STATUS_META[session.status]?.color ?? SKY,
        session,
      }));
  }, [committeeSessions]);

  const issueRoomItems = useMemo<IssueRoomFocusItem[]>(() => {
    return [...(issueRooms ?? [])]
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
      .slice(0, 6)
      .map((issueRoom) => ({
        key: `issue-room:${issueRoom.id}`,
        kind: "issueRoom",
        title: issueRoom.title,
        subtitle: issueRoom.issueType ? niceLabel(issueRoom.issueType) : "Issue room",
        href: `/issue-rooms/${issueRoom.id}`,
        toneColor: ISSUE_ROOM_META[issueRoom.status]?.color ?? GOLD,
        issueRoom,
      }));
  }, [issueRooms]);

  const allItems = useMemo(() => [...predictionItems, ...committeeItems, ...issueRoomItems], [predictionItems, committeeItems, issueRoomItems]);
  const selectedItem = useMemo(() => allItems.find((item) => item.key === selectedKey) ?? allItems[0] ?? null, [allItems, selectedKey]);

  useEffect(() => {
    if (!allItems.length) {
      if (selectedKey !== null) setSelectedKey(null);
      return;
    }
    if (!selectedKey || !allItems.some((item) => item.key === selectedKey)) {
      setSelectedKey(allItems[0].key);
    }
  }, [allItems, selectedKey]);

  const catalysts = useMemo(() => {
    const digestCatalysts: CatalystItem[] = sortByDateDesc(
      (digest?.recentActivities ?? []).map((activity) => ({
        id: `activity:${activity.id}`,
        title: activity.summary,
        detail: activity.type,
        at: activity.createdAt,
        kind: "Activity",
        toneColor: SKY,
      })),
    );

    const committeeCatalysts: CatalystItem[] = (committeeSessions ?? []).slice(0, 6).map((session) => ({
      id: `committee:${session.id}`,
      title: session.title,
      detail: `${session.chamber} ${session.committee} · ${COMMITTEE_STATUS_META[session.status]?.label ?? niceLabel(session.status)}`,
      at: session.lastAutoIngestedAt || session.hearingDate,
      kind: "Committee",
      toneColor: COMMITTEE_STATUS_META[session.status]?.color ?? SKY,
      href: `/committee-intel/session/${session.id}`,
    }));

    const milestoneCatalysts: CatalystItem[] = (sessionDashboard?.upcomingMilestones ?? []).slice(0, 6).map((milestone) => ({
      id: `milestone:${milestone.id}`,
      title: milestone.title,
      detail: SESSION_PHASE_META[milestone.phase]?.label ?? niceLabel(milestone.phase),
      at: milestone.dueDate,
      kind: "Milestone",
      toneColor: SESSION_PHASE_META[milestone.phase]?.color ?? GOLD,
      href: "/session",
    }));

    return sortByDateDesc([...digestCatalysts, ...committeeCatalysts, ...milestoneCatalysts]).slice(0, 12);
  }, [committeeSessions, digest, sessionDashboard]);

  const refreshAll = useCallback(() => {
    refetchPredictions();
    refetchSession();
    refetchNetwork();
    refetchDigest();
    refetchCommittee();
    refetchIssueRooms();
  }, [refetchCommittee, refetchDigest, refetchIssueRooms, refetchNetwork, refetchPredictions, refetchSession]);

  const topMetrics = useMemo(() => {
    const tracked = (predictionDashboard?.totalTracked ?? 0) + (committeeSessions?.length ?? 0) + (issueRooms?.length ?? 0);
    const pendingActions = sessionDashboard?.stats.pendingActions ?? 0;
    const nextPhase = sessionDashboard ? (SESSION_PHASE_META[sessionDashboard.currentPhase]?.label ?? niceLabel(sessionDashboard.currentPhase)) : "Not initialized";
    return [
      { label: "Tracked Instruments", value: tracked, detail: `${predictionDashboard?.totalTracked ?? 0} bills · ${committeeSessions?.length ?? 0} hearings · ${issueRooms?.length ?? 0} issue rooms`, toneColor: NAVY },
      { label: "Market Catalysts", value: catalysts.length, detail: `${digest?.summary.totalAlerts ?? 0} digest alerts this week`, toneColor: SKY },
      { label: "Network Edges", value: network?.stats.totalEdges ?? 0, detail: network?.stats.mostConnected ? `Most connected: ${network.stats.mostConnected.name}` : "Run relationship discovery to enrich", toneColor: MINT },
      { label: "Action Queue", value: pendingActions, detail: nextPhase, toneColor: GOLD },
    ];
  }, [catalysts.length, committeeSessions?.length, digest?.summary.totalAlerts, issueRooms?.length, network?.stats.mostConnected, network?.stats.totalEdges, predictionDashboard?.totalTracked, sessionDashboard]);

  const playbook = selectedItem ? buildPlaybook(selectedItem, sessionDashboard) : [];
  const initialLoading = predictionLoading && committeeLoading && issueRoomLoading && digestLoading && networkLoading && sessionLoading;
  const hardFailure = !selectedItem && [predictionError, committeeError, issueRoomError, digestError, networkError].every(Boolean);

  if (initialLoading) {
    return <div style={{ padding: 32, color: MUTED }}>Loading policy market...</div>;
  }

  if (hardFailure) {
    return <div style={{ padding: 32, color: CRIMSON }}>The market screen could not load. Refresh the page and re-check the premium services.</div>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <section
        style={{
          background: "linear-gradient(135deg, #0f1f33 0%, #163b5d 52%, #102a43 100%)",
          color: "#f5fbff",
          borderRadius: 24,
          padding: 24,
          boxShadow: "0 22px 54px rgba(16, 35, 63, 0.22)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: "#9ec8ff" }}>Policy Market Screen</div>
            <h1 style={{ margin: "10px 0 0", fontSize: 34, lineHeight: 1.15 }}>Texas political markets, priced through hearings, relationships, and operating signals.</h1>
            <p style={{ margin: "12px 0 0", maxWidth: 860, fontSize: 15, lineHeight: 1.7, color: "#d5e8fb" }}>
              This screen turns the current product into a terminal: left rail for movers, center focus for the active instrument, right rail for the playbook, and a catalyst tape along the bottom.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={refreshAll}
              style={{ padding: "10px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.24)", background: "rgba(255,255,255,0.08)", color: "#fff", fontWeight: 700, cursor: "pointer" }}
            >
              Refresh Market
            </button>
            <Link href="/committee-intel">
              <span style={{ display: "inline-flex", alignItems: "center", padding: "10px 14px", borderRadius: 999, background: "#fff", color: NAVY, fontWeight: 700, cursor: "pointer" }}>
                Open Committee Intel
              </span>
            </Link>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginTop: 20 }}>
          {topMetrics.map((metric) => (
            <div key={metric.label} style={{ padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: "#d5e8fb" }}>{metric.label}</div>
              <div style={{ marginTop: 10, fontSize: 28, fontWeight: 800, color: "#fff" }}>{metric.value}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: "#c8ddf4" }}>{metric.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <div style={{ display: "grid", gridTemplateColumns: stackedLayout ? "1fr" : "320px minmax(0, 1fr) 320px", gap: 20, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 18 }}>
          <Panel title="Market Movers" subtitle="Bills with the sharpest current odds signal">
            {predictionItems.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {predictionItems.slice(0, 5).map((item) => {
                  const prediction = item.prediction;
                  return (
                    <RailItem
                      key={item.key}
                      title={`${prediction.billId} · ${percent(prediction.probability)}`}
                      subtitle={prediction.billTitle || prediction.currentStage || "Tracked bill"}
                      meta={`${predictionLabel(prediction.prediction)} · ${prediction.trend || "stable"}`}
                      toneColor={item.toneColor}
                      selected={selectedItem?.key === item.key}
                      onClick={() => setSelectedKey(item.key)}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyPanelState title="No priced instruments yet" detail="The predictions infrastructure is live now. Start discovery to populate bills and implied odds here." href="/predictions" actionLabel="Open Predictions" />
            )}
          </Panel>

          <Panel title="Committee Tape" subtitle="Hearings and feed-backed committee instruments">
            {committeeItems.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {committeeItems.map((item) => (
                  <RailItem
                    key={item.key}
                    title={item.title}
                    subtitle={`${formatShortDate(item.session.hearingDate)} · ${item.session.title}`}
                    meta={`${COMMITTEE_STATUS_META[item.session.status]?.label ?? niceLabel(item.session.status)} · ${item.session.focusTopicsJson.length} focus topics`}
                    toneColor={item.toneColor}
                    selected={selectedItem?.key === item.key}
                    onClick={() => setSelectedKey(item.key)}
                  />
                ))}
              </div>
            ) : (
              <EmptyPanelState title="No committee instruments" detail="Committee Intel is one of the strongest parts of the product. Surface more of those sessions here as market objects." href="/committee-intel" actionLabel="Open Committee Intel" />
            )}
          </Panel>

          <Panel title="Issue Pressure" subtitle="Current rooms that can become market positions">
            {issueRoomItems.length > 0 ? (
              <div style={{ display: "grid", gap: 10 }}>
                {issueRoomItems.map((item) => (
                  <RailItem
                    key={item.key}
                    title={item.title}
                    subtitle={item.issueRoom.summary || item.subtitle}
                    meta={`${ISSUE_ROOM_META[item.issueRoom.status]?.label ?? niceLabel(item.issueRoom.status)} · ${formatRelative(item.issueRoom.updatedAt)}`}
                    toneColor={item.toneColor}
                    selected={selectedItem?.key === item.key}
                    onClick={() => setSelectedKey(item.key)}
                  />
                ))}
              </div>
            ) : (
              <EmptyPanelState title="No active issue rooms" detail="Issue rooms are where the product stops being a tracker and starts being an operating desk." href="/issue-rooms" actionLabel="Open Issue Rooms" />
            )}
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          {selectedItem ? (
            <Panel
              title="Instrument Focus"
              subtitle={`Selected ${selectedItem.kind === "prediction" ? "bill" : selectedItem.kind === "committee" ? "committee session" : "issue room"}`}
              actions={
                <Link href={selectedItem.href}>
                  <span style={{ display: "inline-flex", alignItems: "center", padding: "8px 12px", borderRadius: 999, background: NAVY, color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Open Source View
                  </span>
                </Link>
              }
            >
              <FocusHero item={selectedItem} />
              <FocusDetail item={selectedItem} digest={digest ?? null} sessionDashboard={sessionDashboard} stacked={stackedLayout} />
            </Panel>
          ) : (
            <Panel title="Instrument Focus" subtitle="Select a mover from the left rail">
              <EmptyPanelState title="No market focus yet" detail="Once predictions, committee sessions, or issue rooms exist, this center rail becomes the main pricing and thesis area." />
            </Panel>
          )}

          <Panel title="Catalyst Tape" subtitle="Recent events and near-term catalysts across the stack">
            {catalysts.length > 0 ? (
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
                {catalysts.map((catalyst) => {
                  const content = (
                    <div style={{ minWidth: 240, maxWidth: 280, padding: 14, borderRadius: 16, border: `1px solid ${BORDER}`, background: "#fbfdff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
                        <TonePill label={catalyst.kind} color={catalyst.toneColor} />
                        <span style={{ fontSize: 11, color: MUTED }}>{formatRelative(catalyst.at)}</span>
                      </div>
                      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 700, color: INK }}>{catalyst.title}</div>
                      <div style={{ marginTop: 6, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{catalyst.detail}</div>
                      <div style={{ marginTop: 10, fontSize: 11, color: MUTED }}>{formatDate(catalyst.at)}</div>
                    </div>
                  );
                  return catalyst.href ? (
                    <Link key={catalyst.id} href={catalyst.href}>{content}</Link>
                  ) : (
                    <div key={catalyst.id}>{content}</div>
                  );
                })}
              </div>
            ) : (
              <EmptyPanelState title="No catalysts yet" detail="Feed in digest activities, committee updates, and session milestones so this tape becomes the heartbeat of the market." />
            )}
          </Panel>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <Panel title="Action Desk" subtitle="What to do next based on the selected instrument">
            {playbook.length > 0 ? (
              <div style={{ display: "grid", gap: 12 }}>
                {playbook.map((step) => (
                  <Link key={step.title} href={step.href}>
                    <div style={{ padding: 14, borderRadius: 14, border: `1px solid ${BORDER}`, background: "#fbfdff", cursor: "pointer" }}>
                      <div style={{ fontWeight: 700, color: INK }}>{step.title}</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{step.detail}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyPanelState title="No playbook yet" detail="Select a bill, committee session, or issue room to see the recommended next moves." />
            )}
          </Panel>

          <Panel title="Session Pulse" subtitle="Where the broader session puts pressure on decisions">
            {sessionDashboard ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: INK }}>Texas {sessionDashboard.session.sessionNumber}</div>
                    <div style={{ marginTop: 4, fontSize: 13, color: MUTED }}>{sessionDashboard.session.sessionType} session</div>
                  </div>
                  <TonePill label={SESSION_PHASE_META[sessionDashboard.currentPhase]?.label ?? niceLabel(sessionDashboard.currentPhase)} color={SESSION_PHASE_META[sessionDashboard.currentPhase]?.color ?? NAVY} />
                </div>
                <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                  <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
                    <strong style={{ color: INK }}>{sessionDashboard.phaseGuidance.currentPhaseDescription}</strong>
                    <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>{sessionDashboard.phaseGuidance.keyPriorities.join(" · ") || "No priorities generated yet"}</div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <MetricCard label="Pending Actions" value={sessionDashboard.stats.pendingActions} toneColor={GOLD} />
                    <MetricCard label="Upcoming Milestones" value={sessionDashboard.upcomingMilestones.length} toneColor={SKY} />
                  </div>
                  {sessionDashboard.phaseGuidance.warnings.length > 0 ? (
                    <div style={{ padding: 12, borderRadius: 12, background: "#fff4ef", color: INK }}>
                      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: CRIMSON }}>Warnings</div>
                      <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>{sessionDashboard.phaseGuidance.warnings.join(" · ")}</div>
                    </div>
                  ) : null}
                </div>
              </>
            ) : (
              <EmptyPanelState title="No active session" detail="The session infrastructure is fixed now, but this workspace still needs an initialized session to unlock phase-aware planning." href="/session" actionLabel="Initialize Session" />
            )}
          </Panel>

          <Panel title="Network Pressure" subtitle="Who is central enough to move outcomes">
            {network ? (
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <MetricCard label="Nodes" value={network.stats.totalNodes} toneColor={NAVY} />
                  <MetricCard label="Edges" value={network.stats.totalEdges} toneColor={MINT} />
                </div>
                <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED }}>Most Connected</div>
                  <div style={{ marginTop: 8, fontSize: 15, color: INK }}>{network.stats.mostConnected?.name || "Not enough relationship data yet"}</div>
                  <div style={{ marginTop: 4, fontSize: 13, color: MUTED }}>
                    {network.stats.mostConnected ? `${network.stats.mostConnected.connections} connections` : "Run relationship discovery to surface the real centers of gravity."}
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 12, background: "#f7fbff" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", color: MUTED }}>Network Shape</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: MUTED }}>
                    Avg connections {network.stats.avgConnections.toFixed(1)} · {network.stats.clusters} clusters detected
                  </div>
                </div>
              </div>
            ) : (
              <EmptyPanelState title="No network pressure yet" detail="The relationships service is live again. Use it to map donors, allies, staff, co-sponsors, and opposition into an actual influence graph." href="/relationships" actionLabel="Open Relationships" />
            )}
          </Panel>

          <Panel title="Cross-Links" subtitle="Jump straight into the specialist workflows">
            <div style={{ display: "grid", gap: 10 }}>
              {[
                { href: "/predictions", label: "Predictions Desk", detail: predictionError || `${predictionDashboard?.totalTracked ?? 0} bills priced` },
                { href: "/committee-intel", label: "Committee Intel", detail: committeeError || `${committeeSessions?.length ?? 0} committee sessions` },
                { href: "/relationships", label: "Relationship Intelligence", detail: networkError || `${network?.stats.totalEdges ?? 0} edges mapped` },
                { href: "/session", label: "Session Manager", detail: sessionError || (sessionDashboard ? `${sessionDashboard.stats.pendingActions} pending actions` : "Needs initialization") },
                { href: "/issue-rooms", label: "Issue Rooms", detail: issueRoomError || `${issueRooms?.length ?? 0} rooms active` },
              ].map((link) => (
                <Link key={link.href} href={link.href}>
                  <div style={{ padding: 12, borderRadius: 14, border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer" }}>
                    <div style={{ fontWeight: 700, color: INK }}>{link.label}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: MUTED }}>{link.detail}</div>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
