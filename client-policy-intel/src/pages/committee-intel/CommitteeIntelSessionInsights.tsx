import { type FormEvent, type CSSProperties, type ReactNode } from "react";
import { Link } from "wouter";
import {
  type CommitteeIntelFocusedBrief,
  type CommitteeIntelPostHearingRecap,
  type CommitteeIntelSessionDetail,
} from "../../api";

const STATUS_COLORS: Record<string, string> = {
  planned: "#2563eb",
  monitoring: "#059669",
  paused: "#d97706",
  completed: "#6b7280",
};

const POSITION_COLORS: Record<string, string> = {
  support: "#047857",
  oppose: "#b91c1c",
  questioning: "#b45309",
  neutral: "#1d4ed8",
  monitoring: "#6b7280",
  unknown: "#6b7280",
};

interface CommitteeIntelSessionInsightsProps {
  primarySession: CommitteeIntelSessionDetail["session"];
  sessionDetail: CommitteeIntelSessionDetail;
  displayedRecap: CommitteeIntelPostHearingRecap | null;
  brief: CommitteeIntelFocusedBrief | null;
  briefIssue: string;
  onBriefIssueChange: (value: string) => void;
  onGenerateBrief: () => void | Promise<void>;
  generatingBrief: boolean;
  onGenerateRecap: () => void | Promise<void>;
  generatingRecap: boolean;
}

export function CommitteeIntelSessionInsights(props: CommitteeIntelSessionInsightsProps) {
  const {
    primarySession,
    sessionDetail,
    displayedRecap,
    brief,
    briefIssue,
    onBriefIssueChange,
    onGenerateBrief,
    generatingBrief,
    onGenerateRecap,
    generatingRecap,
  } = props;

  function handleBriefSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void onGenerateBrief();
  }

  return (
    <>
      <SectionCard
        title={primarySession.title}
        subtitle={`${primarySession.committee} · ${primarySession.chamber} · ${formatHearingDate(primarySession.hearingDate)}`}
        actions={<Badge label={statusLabel(primarySession.status)} color={STATUS_COLORS[primarySession.status] ?? "#475569"} />}
      >
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 }}>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Segments</div>
            <div style={statValueStyle}>{sessionDetail.analysis.totalSegments}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Signals</div>
            <div style={statValueStyle}>{sessionDetail.analysis.totalSignals}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Tracked Entities</div>
            <div style={statValueStyle}>{sessionDetail.analysis.trackedEntities}</div>
          </div>
          <div style={statCardStyle}>
            <div style={statLabelStyle}>Invited Witnesses</div>
            <div style={statValueStyle}>{sessionDetail.analysis.invitedWitnessCount}</div>
          </div>
        </div>

        <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>{sessionDetail.analysis.summary}</div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
          <Badge label={`feed ${statusLabel(primarySession.autoIngestStatus)}`} color={primarySession.autoIngestStatus === "error" ? "#b91c1c" : primarySession.autoIngestEnabled ? "#0f766e" : "#64748b"} />
          {primarySession.autoIngestEnabled && <Badge label={`every ${primarySession.autoIngestIntervalSeconds}s`} color="#1d4ed8" />}
          {primarySession.transcriptSourceType !== "manual" && <Badge label={primarySession.transcriptSourceType} color="#0f766e" />}
        </div>

        {(primarySession.agendaUrl || primarySession.videoUrl) && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            {primarySession.agendaUrl && (
              <a href={primarySession.agendaUrl} target="_blank" rel="noreferrer" style={secondaryLinkStyle}>
                Open Agenda
              </a>
            )}
            {primarySession.videoUrl && (
              <a href={primarySession.videoUrl} target="_blank" rel="noreferrer" style={secondaryLinkStyle}>
                Open Video
              </a>
            )}
          </div>
        )}
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
        <SectionCard title="Top Issues" subtitle="What the hearing is orbiting around right now">
          <div style={{ display: "grid", gap: 10 }}>
            {sessionDetail.analysis.issueCoverage.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>No issue clusters have been extracted yet.</div>
            )}
            {sessionDetail.analysis.issueCoverage.slice(0, 8).map((issue) => (
              <div key={issue.issueTag} style={{ background: "#f8fafc", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{issue.label}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{issue.mentionCount} mentions</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                  <Badge label={`support ${issue.supportCount}`} color="#047857" />
                  <Badge label={`oppose ${issue.opposeCount}`} color="#b91c1c" />
                  <Badge label={`questions ${issue.questioningCount}`} color="#b45309" />
                </div>
                {issue.keyEntities.length > 0 && (
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 8, lineHeight: 1.5 }}>{issue.keyEntities.join(", ")}</div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Focused Brief" subtitle="Generate an issue-specific client readout from the live session">
          <form onSubmit={handleBriefSubmit} style={{ display: "grid", gap: 12 }}>
            <label style={labelStyle}>
              Issue
              <input
                value={briefIssue}
                onChange={(event) => onBriefIssueChange(event.target.value)}
                placeholder="electric grid security"
                style={inputStyle}
              />
            </label>
            <button type="submit" disabled={generatingBrief || !briefIssue.trim()} style={primaryButtonStyle}>
              {generatingBrief ? "Building Brief..." : "Generate Focused Brief"}
            </button>
          </form>
          {brief && (
            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              <div style={{ background: "#f8fafc", borderRadius: 12, padding: 12, border: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{brief.issue}</div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{brief.summary}</div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {brief.recommendations.map((recommendation) => (
                  <div key={recommendation} style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, padding: 10, borderRadius: 10, background: "#ecfeff", border: "1px solid #bae6fd" }}>
                    {recommendation}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Post-Hearing Recap"
        subtitle="A ready-to-send readout once the hearing record is populated"
        actions={(
          <button type="button" onClick={() => void onGenerateRecap()} disabled={generatingRecap} style={secondaryButtonStyle}>
            {generatingRecap ? "Generating..." : "Generate Recap"}
          </button>
        )}
      >
        {!displayedRecap && (
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
            No recap is available yet. Add transcript or feed-synced segments, then generate a recap for a post-hearing client readout.
          </div>
        )}
        {displayedRecap && (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{displayedRecap.headline}</div>
              <div style={{ fontSize: 13, color: "#334155", marginTop: 8, lineHeight: 1.6 }}>{displayedRecap.overview}</div>
            </div>

            {displayedRecap.issueHighlights.length > 0 && (
              <div style={{ display: "grid", gap: 8 }}>
                {displayedRecap.issueHighlights.map((highlight) => (
                  <div key={highlight} style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, padding: 12, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0" }}>
                    {highlight}
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14 }}>
              <RecapListCard title="Member Pressure Points" items={displayedRecap.memberPressurePoints} emptyLabel="No member pressure points isolated yet." />
              <RecapListCard title="Agency Commitments" items={displayedRecap.agencyCommitments} emptyLabel="No explicit commitments or next steps captured yet." />
              <RecapListCard title="Follow-Up Actions" items={displayedRecap.followUpActions} emptyLabel="No follow-up actions generated yet." />
            </div>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Key Moments" subtitle="High-signal segments to review or clip for follow-up">
        <div style={{ display: "grid", gap: 10 }}>
          {sessionDetail.analysis.keyMoments.length === 0 && (
            <div style={{ fontSize: 13, color: "#64748b" }}>No high-signal moments have been extracted yet.</div>
          )}
          {sessionDetail.analysis.keyMoments.map((moment) => (
            <div key={moment.segmentId} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <Badge label={moment.timestampLabel} color="#1d4ed8" />
                  <Badge label={positionLabel(moment.position)} color={POSITION_COLORS[moment.position] ?? "#475569"} />
                  <Badge label={`impact ${moment.importance}`} color="#0f766e" />
                </div>
                {moment.speakerName && <div style={{ fontSize: 12, color: "#64748b" }}>{moment.speakerName}</div>}
              </div>
              <div style={{ marginTop: 10, fontSize: 13, color: "#0f172a", lineHeight: 1.6 }}>{moment.summary}</div>
              {moment.issueTags.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {moment.issueTags.map((tag) => (
                    <Badge key={tag} label={statusLabel(tag)} color="#0f766e" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
        <SectionCard title="Elected Focus" subtitle="Which members are pressing hardest on the issues">
          <div style={{ display: "grid", gap: 10 }}>
            {sessionDetail.analysis.electedFocus.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>No member questioning or positioning has been isolated yet.</div>
            )}
            {sessionDetail.analysis.electedFocus.map((entry) => (
              <EntitySummaryCard key={`${entry.entityName}-${entry.entityType}`} entry={entry} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Witness Ranking" subtitle="Who carried the most weight in testimony or agency updates">
          <div style={{ display: "grid", gap: 10 }}>
            {sessionDetail.analysis.witnessRankings.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>No witness or agency rankings are available yet.</div>
            )}
            {sessionDetail.analysis.witnessRankings.map((entry) => (
              <div key={`${entry.entityName}-${entry.rank}`} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>#{entry.rank} {entry.entityName}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      {entry.entityType}
                      {entry.affiliation ? ` · ${entry.affiliation}` : ""}
                      {entry.invited ? " · invited" : ""}
                    </div>
                  </div>
                  <Badge label={`score ${entry.score}`} color="#0f766e" />
                </div>
                <div style={{ fontSize: 12, color: "#334155", marginTop: 8, lineHeight: 1.6 }}>{entry.summary}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  <Badge label={positionLabel(entry.dominantPosition)} color={POSITION_COLORS[entry.dominantPosition] ?? "#475569"} />
                  <Badge label={`${entry.mentionCount} mentions`} color="#1d4ed8" />
                  <Badge label={`${entry.issueBreadth} issues`} color="#b45309" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Witness and Agency Activity" subtitle="Who is testifying, updating, or shaping the record">
          <div style={{ display: "grid", gap: 10 }}>
            {sessionDetail.analysis.activeWitnesses.length === 0 && (
              <div style={{ fontSize: 13, color: "#64748b" }}>No witnesses or agencies have been isolated yet.</div>
            )}
            {sessionDetail.analysis.activeWitnesses.map((entry) => (
              <EntitySummaryCard key={`${entry.entityName}-${entry.entityType}`} entry={entry} />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Position Map" subtitle="Who is lining up where, issue by issue">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", color: "#64748b", fontSize: 12 }}>
                <th style={tableHeadStyle}>Entity</th>
                <th style={tableHeadStyle}>Issue</th>
                <th style={tableHeadStyle}>Position</th>
                <th style={tableHeadStyle}>Confidence</th>
                <th style={tableHeadStyle}>Mentions</th>
              </tr>
            </thead>
            <tbody>
              {sessionDetail.analysis.positionMap.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 14, fontSize: 13, color: "#64748b" }}>No position signals have been extracted yet.</td>
                </tr>
              )}
              {sessionDetail.analysis.positionMap.map((row, index) => (
                <tr key={`${row.entityName}-${row.issueTag}-${index}`} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tableCellStyle}>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>{row.entityName}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>{row.entityType}{row.invited ? " · invited" : ""}</div>
                  </td>
                  <td style={tableCellStyle}>{row.label}</td>
                  <td style={tableCellStyle}>
                    <Badge label={positionLabel(row.position)} color={POSITION_COLORS[row.position] ?? "#475569"} />
                  </td>
                  <td style={tableCellStyle}>{row.confidence.toFixed(2)}</td>
                  <td style={tableCellStyle}>{row.mentionCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Transcript Timeline" subtitle="Most recent ingested hearing segments">
        <div style={{ display: "grid", gap: 10 }}>
          {sessionDetail.segments.length === 0 && (
            <div style={{ fontSize: 13, color: "#64748b" }}>No transcript has been ingested yet.</div>
          )}
          {sessionDetail.segments.slice().reverse().slice(0, 12).map((segment) => (
            <div key={segment.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
                    {segment.speakerName || segment.affiliation || "Unknown speaker"}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    {new Date(segment.capturedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    {segment.affiliation ? ` · ${segment.affiliation}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Badge label={statusLabel(segment.speakerRole)} color="#1d4ed8" />
                  <Badge label={positionLabel(segment.position)} color={POSITION_COLORS[segment.position] ?? "#475569"} />
                </div>
              </div>
              {segment.summary && <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, marginTop: 10 }}>{segment.summary}</div>}
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginTop: 10 }}>{segment.transcriptText}</div>
              {segment.issueTagsJson.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                  {segment.issueTagsJson.map((tag) => (
                    <Badge key={tag} label={statusLabel(tag)} color="#0f766e" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </>
  );
}

function formatHearingDate(value: string): string {
  return new Date(value).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function positionLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function SectionCard(props: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <section
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
        padding: 18,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>{props.title}</h3>
          {props.subtitle && <div style={{ marginTop: 4, fontSize: 12, color: "#64748b" }}>{props.subtitle}</div>}
        </div>
        {props.actions}
      </div>
      {props.children}
    </section>
  );
}

function Badge(props: { label: string; color: string; background?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 9px",
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        color: props.color,
        background: props.background ?? `${props.color}15`,
        textTransform: "uppercase",
        letterSpacing: 0.4,
      }}
    >
      {props.label}
    </span>
  );
}

function EntitySummaryCard(props: { entry: CommitteeIntelSessionDetail["analysis"]["electedFocus"][number] }) {
  const entry = props.entry;
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{entry.entityName}</div>
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
            {entry.entityType}
            {entry.affiliation ? ` · ${entry.affiliation}` : ""}
            {entry.invited ? " · invited" : ""}
          </div>
        </div>
        <Badge label={`${entry.mentionCount} mentions`} color="#0f766e" />
      </div>

      {entry.primaryIssues.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {entry.primaryIssues.map((issue) => (
            <Badge key={issue} label={issue} color="#1d4ed8" />
          ))}
        </div>
      )}

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {entry.positions.slice(0, 3).map((position) => (
          <div key={`${entry.entityName}-${position.issueTag}`} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12, color: "#334155" }}>
            <span>{position.label}</span>
            <span style={{ color: POSITION_COLORS[position.position] ?? "#475569", fontWeight: 700 }}>
              {positionLabel(position.position)} · {position.mentionCount}
            </span>
          </div>
        ))}
      </div>

      {entry.stakeholderId && (
        <div style={{ marginTop: 10 }}>
          <Link href={`/stakeholders/${entry.stakeholderId}`}>
            <span style={{ fontSize: 12, color: "#0f766e", fontWeight: 700, cursor: "pointer" }}>Open stakeholder record</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function RecapListCard(props: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12, background: "#f8fafc" }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>{props.title}</div>
      {props.items.length === 0 && <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{props.emptyLabel}</div>}
      {props.items.length > 0 && (
        <div style={{ display: "grid", gap: 8 }}>
          {props.items.map((item) => (
            <div key={item} style={{ fontSize: 12, color: "#334155", lineHeight: 1.6 }}>{item}</div>
          ))}
        </div>
      )}
    </div>
  );
}

const labelStyle: CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#334155",
};

const inputStyle: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  borderRadius: 10,
  border: "1px solid #cbd5e1",
  padding: "10px 12px",
  fontSize: 13,
  background: "#fff",
};

const primaryButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 10,
  background: "linear-gradient(135deg, #0f766e 0%, #0f172a 100%)",
  color: "#fff",
  padding: "11px 16px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: CSSProperties = {
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  color: "#0f172a",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#fff",
  color: "#0f172a",
  padding: "10px 14px",
  fontSize: 13,
  fontWeight: 700,
  textDecoration: "none",
};

const statCardStyle: CSSProperties = {
  padding: 12,
  borderRadius: 12,
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
};

const statLabelStyle: CSSProperties = {
  fontSize: 11,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};

const statValueStyle: CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "#0f172a",
  marginTop: 6,
};

const tableHeadStyle: CSSProperties = {
  padding: "10px 12px",
  fontWeight: 700,
};

const tableCellStyle: CSSProperties = {
  padding: "12px",
  fontSize: 13,
  color: "#334155",
  verticalAlign: "top",
};
