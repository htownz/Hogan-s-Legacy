/**
 * Client Deliverables Service
 *
 * Generates three types of client-facing outputs:
 *  1. Client Alert  — one-click from issue room, professional summary
 *  2. Weekly Report — from digest data, formatted for client distribution
 *  3. Hearing Memo  — auto-generated for specific committee sessions
 *
 * All output is stored in the deliverables table under the matching
 * deliverableTypeEnum value.
 */
import { eq, and, gte, lte, inArray, desc } from "drizzle-orm";
import { policyIntelDb } from "../db";
import {
  deliverables,
  issueRooms,
  issueRoomSourceDocuments,
  issueRoomUpdates,
  issueRoomStrategyOptions,
  sourceDocuments,
  alerts,
  activities,
  watchlists,
  hearingEvents,
  stakeholders,
  committeeMembers,
} from "@shared/schema-policy-intel";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ClientAlertRequest {
  issueRoomId: number;
  workspaceId: number;
  matterId?: number;
  recipientName?: string;
  firmName?: string;
}

export interface WeeklyReportRequest {
  workspaceId: number;
  matterId?: number;
  week?: string; // ISO week e.g. "2026-W13"
  recipientName?: string;
  firmName?: string;
}

export interface HearingMemoRequest {
  hearingId: number;
  workspaceId: number;
  matterId?: number;
  recipientName?: string;
  firmName?: string;
}

export interface DeliverableResult {
  deliverableId: number;
  type: string;
  title: string;
  bodyMarkdown: string;
  generatedBy: string;
}

// ── 1. Client Alert Generator ────────────────────────────────────────────────

export async function generateClientAlert(
  req: ClientAlertRequest,
): Promise<DeliverableResult> {
  // Load issue room + related data
  const [room] = await policyIntelDb
    .select()
    .from(issueRooms)
    .where(eq(issueRooms.id, req.issueRoomId));

  if (!room) throw new Error(`Issue room ${req.issueRoomId} not found`);

  // Source documents
  const sourceLinks = await policyIntelDb
    .select()
    .from(issueRoomSourceDocuments)
    .where(eq(issueRoomSourceDocuments.issueRoomId, req.issueRoomId));

  const sourceDocs =
    sourceLinks.length > 0
      ? await policyIntelDb
          .select()
          .from(sourceDocuments)
          .where(
            inArray(
              sourceDocuments.id,
              sourceLinks.map((l) => l.sourceDocumentId),
            ),
          )
      : [];

  // Updates / notes
  const updates = await policyIntelDb
    .select()
    .from(issueRoomUpdates)
    .where(eq(issueRoomUpdates.issueRoomId, req.issueRoomId))
    .orderBy(desc(issueRoomUpdates.id));

  // Strategy options
  const strategies = await policyIntelDb
    .select()
    .from(issueRoomStrategyOptions)
    .where(eq(issueRoomStrategyOptions.issueRoomId, req.issueRoomId))
    .orderBy(issueRoomStrategyOptions.recommendationRank);

  // Related alerts
  const relatedAlerts =
    sourceDocs.length > 0
      ? await policyIntelDb
          .select()
          .from(alerts)
          .where(
            inArray(
              alerts.sourceDocumentId,
              sourceDocs.map((d) => d.id),
            ),
          )
          .orderBy(desc(alerts.relevanceScore))
          .limit(10)
      : [];

  // Build the professional client alert
  const firm = req.firmName ?? "Grace & McEwan LLP";
  const recipient = req.recipientName ?? "Client";
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const title = `Client Alert: ${room.title}`;

  const sections: string[] = [];

  // Header
  sections.push(`# ${title}\n`);
  sections.push(`**${firm}** — Government Affairs & Policy Intelligence\n`);
  sections.push(`**Date:** ${today}  `);
  sections.push(`**To:** ${recipient}  `);
  sections.push(`**Re:** ${room.title}  `);
  sections.push(`**Status:** ${(room.status ?? "active").replace(/_/g, " ").toUpperCase()}\n`);
  sections.push(`---\n`);

  // Executive Summary
  sections.push(`## Executive Summary\n`);
  if (room.summary) {
    sections.push(room.summary + "\n");
  } else {
    sections.push(
      `This alert concerns ${room.title}. ` +
        `Our monitoring system has identified ${sourceDocs.length} relevant source document(s) ` +
        `and ${relatedAlerts.length} alert(s) requiring your attention.\n`,
    );
  }

  // Issue type / jurisdiction
  if (room.issueType || room.jurisdiction) {
    sections.push(
      `**Issue Area:** ${room.issueType ?? "General"} | ` +
        `**Jurisdiction:** ${(room.jurisdiction ?? "texas").charAt(0).toUpperCase() + (room.jurisdiction ?? "texas").slice(1)}\n`,
    );
  }

  // Related Bills
  const relatedBills = (room.relatedBillIds as string[] | null) ?? [];
  if (relatedBills.length > 0) {
    sections.push(`## Related Bills\n`);
    for (const bill of relatedBills) {
      sections.push(`- **${bill}**`);
    }
    sections.push("");
  }

  // Key Findings from alerts
  if (relatedAlerts.length > 0) {
    sections.push(`## Key Findings\n`);
    for (const alert of relatedAlerts.slice(0, 5)) {
      const score = alert.relevanceScore ?? 0;
      const priority =
        score >= 70 ? "🔴 High" : score >= 40 ? "🟡 Medium" : "⚪ Low";
      sections.push(`- **${alert.title}** (${priority} Priority, Score: ${score})`);
      if (alert.whyItMatters) {
        const reason = alert.whyItMatters.split("\n")[0].slice(0, 200);
        sections.push(`  *${reason}*`);
      }
    }
    sections.push("");
  }

  // Source Evidence
  if (sourceDocs.length > 0) {
    sections.push(`## Source Evidence\n`);
    for (const doc of sourceDocs.slice(0, 10)) {
      sections.push(
        `- **${doc.title}** — ${doc.publisher} ` +
          (doc.publishedAt
            ? `(${new Date(doc.publishedAt).toLocaleDateString()})`
            : "") +
          (doc.sourceUrl ? ` [Link](${doc.sourceUrl})` : ""),
      );
      if (doc.summary) sections.push(`  ${doc.summary.slice(0, 250)}`);
    }
    sections.push("");
  }

  // Recommended Action / Strategy
  if (room.recommendedPath || strategies.length > 0) {
    sections.push(`## Recommended Action\n`);
    if (room.recommendedPath) {
      sections.push(room.recommendedPath + "\n");
    }
    if (strategies.length > 0) {
      sections.push(`### Strategic Options\n`);
      for (const s of strategies) {
        sections.push(`**${s.recommendationRank}. ${s.label}**`);
        if (s.description) sections.push(s.description);
        const pros = (s.prosJson as string[] | null) ?? [];
        const cons = (s.consJson as string[] | null) ?? [];
        if (pros.length > 0)
          sections.push(
            `  - *Advantages:* ${pros.join("; ")}`,
          );
        if (cons.length > 0)
          sections.push(
            `  - *Risks:* ${cons.join("; ")}`,
          );
        if (s.politicalFeasibility)
          sections.push(
            `  - *Political Feasibility:* ${s.politicalFeasibility}`,
          );
        sections.push("");
      }
    }
  }

  // Recent Developments
  if (updates.length > 0) {
    sections.push(`## Recent Developments\n`);
    for (const u of updates.slice(0, 5)) {
      const date = new Date(u.createdAt).toLocaleDateString();
      sections.push(`- **${date} — ${u.title}**`);
      if (u.body) sections.push(`  ${u.body.slice(0, 300)}`);
    }
    sections.push("");
  }

  // Footer
  sections.push(`---\n`);
  sections.push(
    `*This alert was prepared by ${firm} using automated policy intelligence monitoring. ` +
      `Please contact your ${firm} team for further analysis or questions.*\n`,
  );
  sections.push(
    `*Confidential — Prepared for ${recipient}. Do not distribute without authorization.*`,
  );

  const bodyMarkdown = sections.join("\n");
  const sourceDocumentIds = sourceDocs.map((d) => d.id);

  // Store deliverable
  const [deliverable] = await policyIntelDb
    .insert(deliverables)
    .values({
      workspaceId: req.workspaceId,
      matterId: req.matterId ?? room.matterId ?? null,
      type: "client_alert",
      title,
      bodyMarkdown,
      sourceDocumentIds,
      citationsJson: sourceDocs.map((d) => ({
        sourceDocumentId: d.id,
        title: d.title,
        publisher: d.publisher,
        sourceUrl: d.sourceUrl,
        accessedAt: new Date().toISOString(),
      })),
      generatedBy: "template",
    })
    .returning();

  // Log activity
  if (req.matterId || room.matterId) {
    await policyIntelDb.insert(activities).values({
      workspaceId: req.workspaceId,
      matterId: req.matterId ?? room.matterId ?? null,
      type: "brief_drafted",
      summary: `Client alert "${title}" generated from issue room #${req.issueRoomId}`,
    });
  }

  return {
    deliverableId: deliverable.id,
    type: "client_alert",
    title,
    bodyMarkdown,
    generatedBy: "template",
  };
}

// ── 2. Weekly Client Report Builder ──────────────────────────────────────────

export async function generateWeeklyReport(
  req: WeeklyReportRequest,
): Promise<DeliverableResult> {
  // Calculate week bounds
  const now = new Date();
  let weekStart: Date;
  let weekEnd: Date;

  if (req.week) {
    const [yearStr, weekStr] = req.week.split("-W");
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = jan1.getDay();
    const daysOffset = (week - 1) * 7 + (1 - dayOfWeek);
    weekStart = new Date(year, 0, 1 + daysOffset);
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
  } else {
    const day = now.getDay();
    weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((day + 6) % 7)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
  }

  // Fetch alerts for the period
  const weekAlerts = await policyIntelDb
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.workspaceId, req.workspaceId),
        gte(alerts.createdAt, weekStart),
        lte(alerts.createdAt, weekEnd),
      ),
    )
    .orderBy(desc(alerts.relevanceScore));

  // Group alerts by watchlist
  const watchlistIds = Array.from(
    new Set(weekAlerts.filter((a) => a.watchlistId).map((a) => a.watchlistId!)),
  );
  const watchlistMap = new Map<number, string>();
  if (watchlistIds.length > 0) {
    const wlRows = await policyIntelDb
      .select({ id: watchlists.id, name: watchlists.name })
      .from(watchlists)
      .where(inArray(watchlists.id, watchlistIds));
    for (const wl of wlRows) watchlistMap.set(wl.id, wl.name);
  }

  // Fetch activities
  const weekActivities = await policyIntelDb
    .select()
    .from(activities)
    .where(
      and(
        eq(activities.workspaceId, req.workspaceId),
        gte(activities.createdAt, weekStart),
        lte(activities.createdAt, weekEnd),
      ),
    )
    .orderBy(desc(activities.createdAt));

  // Build report
  const firm = req.firmName ?? "Grace & McEwan LLP";
  const recipient = req.recipientName ?? "Client";
  const weekLabel =
    req.week ??
    `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)).padStart(2, "0")}`;
  const startDate = weekStart.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const endDate = weekEnd.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const title = `Weekly Policy Intelligence Report — ${weekLabel}`;
  const sections: string[] = [];

  // Header
  sections.push(`# ${title}\n`);
  sections.push(`**${firm}** — Government Affairs & Policy Intelligence\n`);
  sections.push(`**Period:** ${startDate} — ${endDate}  `);
  sections.push(`**Prepared for:** ${recipient}  `);
  sections.push(
    `**Generated:** ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}\n`,
  );
  sections.push(`---\n`);

  // Dashboard Summary
  const highPriority = weekAlerts.filter((a) => (a.relevanceScore ?? 0) >= 70);
  const pendingReview = weekAlerts.filter(
    (a) => a.status === "pending_review",
  );
  const reviewed = weekAlerts.filter((a) => a.status !== "pending_review");

  sections.push(`## Week at a Glance\n`);
  sections.push(`| Metric | Count |`);
  sections.push(`|--------|-------|`);
  sections.push(`| Total Alerts | ${weekAlerts.length} |`);
  sections.push(`| High Priority (≥70) | ${highPriority.length} |`);
  sections.push(`| Reviewed | ${reviewed.length} |`);
  sections.push(`| Pending Review | ${pendingReview.length} |`);
  sections.push(`| Activities Logged | ${weekActivities.length} |`);
  sections.push("");

  // High-Priority Items
  if (highPriority.length > 0) {
    sections.push(`## High-Priority Items\n`);
    sections.push(
      `The following ${highPriority.length} item(s) scored ≥70 and warrant immediate attention:\n`,
    );
    for (const a of highPriority) {
      sections.push(`### ${a.title}`);
      sections.push(`**Score:** ${a.relevanceScore} | **Status:** ${(a.status ?? "pending_review").replace(/_/g, " ")}\n`);
      if (a.whyItMatters) {
        sections.push(a.whyItMatters.split("\n\n")[0] + "\n");
      }
    }
  }

  // By Watchlist
  const watchlistGroups = new Map<string, typeof weekAlerts>();
  for (const a of weekAlerts) {
    const name = a.watchlistId
      ? watchlistMap.get(a.watchlistId) ?? `Watchlist #${a.watchlistId}`
      : "Unassigned";
    if (!watchlistGroups.has(name)) watchlistGroups.set(name, []);
    watchlistGroups.get(name)!.push(a);
  }

  if (watchlistGroups.size > 0) {
    sections.push(`## Alerts by Topic\n`);
    for (const [name, groupAlerts] of Array.from(watchlistGroups.entries())) {
      const groupHigh = groupAlerts.filter(
        (a: typeof weekAlerts[number]) => (a.relevanceScore ?? 0) >= 70,
      ).length;
      sections.push(
        `### ${name} (${groupAlerts.length} alert${groupAlerts.length !== 1 ? "s" : ""}${groupHigh > 0 ? `, ${groupHigh} high-priority` : ""})\n`,
      );
      for (const a of groupAlerts.slice(0, 8)) {
        const score = a.relevanceScore ?? 0;
        const icon = score >= 70 ? "🔴" : score >= 40 ? "🟡" : "⚪";
        sections.push(
          `- ${icon} **${a.title.slice(0, 100)}** (Score: ${score}, ${(a.status ?? "pending").replace(/_/g, " ")})`,
        );
      }
      if (groupAlerts.length > 8)
        sections.push(
          `- *...and ${groupAlerts.length - 8} more alert(s)*`,
        );
      sections.push("");
    }
  }

  // Activities
  if (weekActivities.length > 0) {
    sections.push(`## Team Activities\n`);
    for (const a of weekActivities.slice(0, 15)) {
      const date = new Date(a.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      sections.push(
        `- **${date}** — ${a.summary} *(${(a.type ?? "").replace(/_/g, " ")})*`,
      );
    }
    if (weekActivities.length > 15)
      sections.push(
        `- *...and ${weekActivities.length - 15} more*`,
      );
    sections.push("");
  }

  // Outlook
  sections.push(`## Week Ahead\n`);
  const nextWeekStart = new Date(weekEnd);
  nextWeekStart.setDate(nextWeekStart.getDate() + 1);
  const nextWeekEnd = new Date(nextWeekStart);
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6);

  const upcomingHearings = await policyIntelDb
    .select()
    .from(hearingEvents)
    .where(
      and(
        eq(hearingEvents.workspaceId, req.workspaceId),
        gte(hearingEvents.hearingDate, nextWeekStart),
        lte(hearingEvents.hearingDate, nextWeekEnd),
      ),
    )
    .orderBy(hearingEvents.hearingDate);

  if (upcomingHearings.length > 0) {
    sections.push(
      `${upcomingHearings.length} hearing(s) scheduled for next week:\n`,
    );
    for (const h of upcomingHearings.slice(0, 5)) {
      const hDate = new Date(h.hearingDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
      sections.push(
        `- **${hDate}** — ${h.committee} (${h.chamber})${h.location ? ` at ${h.location}` : ""}`,
      );
    }
  } else {
    sections.push(`No hearings currently scheduled for next week.\n`);
  }
  sections.push("");

  // Footer
  sections.push(`---\n`);
  sections.push(
    `*This report was prepared by ${firm} using automated policy intelligence. ` +
      `For detailed analysis, please contact your ${firm} representative.*\n`,
  );
  sections.push(
    `*Confidential — Prepared for ${recipient}. Do not distribute without authorization.*`,
  );

  const bodyMarkdown = sections.join("\n");

  // Store deliverable
  const [deliverable] = await policyIntelDb
    .insert(deliverables)
    .values({
      workspaceId: req.workspaceId,
      matterId: req.matterId ?? null,
      type: "weekly_digest",
      title,
      bodyMarkdown,
      sourceDocumentIds: [],
      citationsJson: [],
      generatedBy: "template",
    })
    .returning();

  // Log activity
  await policyIntelDb.insert(activities).values({
    workspaceId: req.workspaceId,
    matterId: req.matterId ?? null,
    type: "brief_drafted",
    summary: `Weekly report "${title}" generated for ${startDate} — ${endDate}`,
  });

  return {
    deliverableId: deliverable.id,
    type: "weekly_digest",
    title,
    bodyMarkdown,
    generatedBy: "template",
  };
}

// ── 3. Hearing Memo Generator ────────────────────────────────────────────────

export async function generateHearingMemo(
  req: HearingMemoRequest,
): Promise<DeliverableResult> {
  // Load hearing
  const [hearing] = await policyIntelDb
    .select()
    .from(hearingEvents)
    .where(eq(hearingEvents.id, req.hearingId));

  if (!hearing) throw new Error(`Hearing ${req.hearingId} not found`);

  // Related bills → source documents
  const relatedBills = (hearing.relatedBillIds as string[] | null) ?? [];
  let relatedDocs: (typeof sourceDocuments.$inferSelect)[] = [];
  if (relatedBills.length > 0) {
    // Search for source documents mentioning these bill IDs
    const conditions = relatedBills.map((bill) =>
      eq(sourceDocuments.title, bill),
    );
    // Use a broader search: bills in title
    const allDocs = await policyIntelDb
      .select()
      .from(sourceDocuments)
      .limit(500);
    relatedDocs = allDocs.filter((d) =>
      relatedBills.some(
        (bill) =>
          d.title.toLowerCase().includes(bill.toLowerCase()) ||
          (d.normalizedText ?? "").toLowerCase().includes(bill.toLowerCase()),
      ),
    );
  }

  // Committee members
  const members = await policyIntelDb
    .select()
    .from(committeeMembers)
    .where(eq(committeeMembers.committeeName, hearing.committee));

  // Load stakeholders for committee members
  const memberStakeholderIds = members
    .filter((m) => m.stakeholderId)
    .map((m) => m.stakeholderId!);
  const memberStakeholders =
    memberStakeholderIds.length > 0
      ? await policyIntelDb
          .select()
          .from(stakeholders)
          .where(inArray(stakeholders.id, memberStakeholderIds))
      : [];

  // Related alerts
  const billAlerts =
    relatedDocs.length > 0
      ? await policyIntelDb
          .select()
          .from(alerts)
          .where(
            inArray(
              alerts.sourceDocumentId,
              relatedDocs.map((d) => d.id),
            ),
          )
          .orderBy(desc(alerts.relevanceScore))
          .limit(10)
      : [];

  // Build memo
  const firm = req.firmName ?? "Grace & McEwan LLP";
  const recipient = req.recipientName ?? "Client";
  const hearingDate = new Date(hearing.hearingDate).toLocaleDateString(
    "en-US",
    { weekday: "long", month: "long", day: "numeric", year: "numeric" },
  );
  const title = `Hearing Memo: ${hearing.committee} — ${hearingDate}`;

  const sections: string[] = [];

  // Header
  sections.push(`# ${title}\n`);
  sections.push(`**${firm}** — Government Affairs & Policy Intelligence\n`);
  sections.push(`**Committee:** ${hearing.committee}  `);
  sections.push(`**Chamber:** ${hearing.chamber}  `);
  sections.push(`**Date:** ${hearingDate}  `);
  if (hearing.timeDescription)
    sections.push(`**Time:** ${hearing.timeDescription}  `);
  if (hearing.location) sections.push(`**Location:** ${hearing.location}  `);
  sections.push(`**Status:** ${(hearing.status ?? "scheduled").replace(/_/g, " ").toUpperCase()}  `);
  sections.push(`**Prepared for:** ${recipient}\n`);
  sections.push(`---\n`);

  // Hearing Overview
  sections.push(`## Hearing Overview\n`);
  if (hearing.description) {
    sections.push(hearing.description + "\n");
  } else {
    sections.push(
      `The ${hearing.committee} (${hearing.chamber}) will convene on ${hearingDate}` +
        (hearing.location ? ` at ${hearing.location}` : "") +
        `. ${relatedBills.length > 0 ? `${relatedBills.length} bill(s) are on the agenda.` : "Agenda details to follow."}\n`,
    );
  }

  // Bills on Agenda
  if (relatedBills.length > 0) {
    sections.push(`## Bills on Agenda\n`);
    for (const bill of relatedBills) {
      const doc = relatedDocs.find(
        (d) =>
          d.title.toLowerCase().includes(bill.toLowerCase()),
      );
      sections.push(`### ${bill}`);
      if (doc) {
        sections.push(`**Title:** ${doc.title}  `);
        if (doc.summary) sections.push(`**Summary:** ${doc.summary.slice(0, 400)}\n`);
        if (doc.sourceUrl) sections.push(`**Source:** [${doc.publisher}](${doc.sourceUrl})\n`);
      } else {
        sections.push(`*No source document on file for this bill.*\n`);
      }
    }
  }

  // Alert Intelligence
  if (billAlerts.length > 0) {
    sections.push(`## Intelligence from Alert Pipeline\n`);
    sections.push(
      `Our monitoring system has flagged ${billAlerts.length} alert(s) related to bills on this agenda:\n`,
    );
    for (const a of billAlerts.slice(0, 5)) {
      const score = a.relevanceScore ?? 0;
      const priority =
        score >= 70 ? "🔴 High" : score >= 40 ? "🟡 Medium" : "⚪ Low";
      sections.push(`- **${a.title}** (${priority}, Score: ${score})`);
      if (a.whyItMatters) {
        const reason = a.whyItMatters.split("\n")[0].slice(0, 250);
        sections.push(`  *${reason}*`);
      }
    }
    sections.push("");
  }

  // Committee Composition
  if (members.length > 0) {
    sections.push(`## Committee Composition\n`);
    sections.push(`| Role | Member | Party |`);
    sections.push(`|------|--------|-------|`);
    for (const m of members) {
      const s = memberStakeholders.find(
        (st) => st.id === m.stakeholderId,
      );
      const name = s?.name ?? "Unknown";
      const party = s?.tagsJson ? ((s.tagsJson as string[]).find((t: string) => t === "R" || t === "D" || t === "I") ?? "") : "";
      sections.push(
        `| ${m.role.charAt(0).toUpperCase() + m.role.slice(1)} | ${name} | ${party} |`,
      );
    }
    sections.push("");
  }

  // Preparation Notes
  sections.push(`## Preparation Notes\n`);
  sections.push(`1. Review the bills listed above for specific language affecting client interests`);
  sections.push(`2. Identify potential testimony opportunities or witness registration deadlines`);
  sections.push(`3. Note any amendments or substitutes that may be offered`);
  if (members.length > 0) {
    const chair = members.find(
      (m) => (m.role ?? "").toLowerCase().includes("chair"),
    );
    if (chair) {
      const chairName =
        memberStakeholders.find((s) => s.id === chair.stakeholderId)
          ?.name ?? "the Chair";
      sections.push(
        `4. ${chairName} chairs this committee — review voting history and stated positions`,
      );
    }
  }
  sections.push("");

  // Footer
  sections.push(`---\n`);
  sections.push(
    `*This memo was prepared by ${firm} using automated policy intelligence monitoring. ` +
      `Contact your ${firm} team for hearing attendance strategy or testimony preparation.*\n`,
  );
  sections.push(
    `*Confidential — Prepared for ${recipient}. Do not distribute without authorization.*`,
  );

  const bodyMarkdown = sections.join("\n");
  const sourceDocumentIds = relatedDocs.map((d) => d.id);

  // Store deliverable
  const [deliverable] = await policyIntelDb
    .insert(deliverables)
    .values({
      workspaceId: req.workspaceId,
      matterId: req.matterId ?? null,
      type: "hearing_memo",
      title,
      bodyMarkdown,
      sourceDocumentIds,
      citationsJson: relatedDocs.map((d) => ({
        sourceDocumentId: d.id,
        title: d.title,
        publisher: d.publisher,
        sourceUrl: d.sourceUrl,
        accessedAt: new Date().toISOString(),
      })),
      generatedBy: "template",
    })
    .returning();

  // Log activity
  await policyIntelDb.insert(activities).values({
    workspaceId: req.workspaceId,
    matterId: req.matterId ?? null,
    type: "brief_drafted",
    summary: `Hearing memo generated for ${hearing.committee} on ${hearingDate}`,
  });

  return {
    deliverableId: deliverable.id,
    type: "hearing_memo",
    title,
    bodyMarkdown,
    generatedBy: "template",
  };
}
