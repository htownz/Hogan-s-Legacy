/**
 * Client Reporting Service — branded, customizable deliverable generation
 *
 * Extends the base deliverable service with:
 * - Per-client template management
 * - Custom branding (colors, logos, confidentiality notices)
 * - Batch report generation for multi-client firms
 * - Scheduled report cadence support
 * - Executive summaries with prediction data integration
 */
import { eq, and, desc, inArray, gte, lte, sql } from "drizzle-orm";
import { policyIntelDb } from "../db";
import {
  reportTemplates,
  clientProfiles,
  deliverables,
  passagePredictions,
  issueRooms,
  alerts,
  watchlists,
  sourceDocuments,
  activities,
  stakeholders,
  type PolicyIntelReportTemplate,
  type PolicyIntelClientProfile,
} from "@shared/schema-policy-intel";
import { createLogger } from "../logger";

const log = createLogger("client-reporting");

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface ExecutiveReportRequest {
  workspaceId: number;
  clientProfileId?: number;
  period: "daily" | "weekly" | "monthly";
  includePredictions?: boolean;
  includeStakeholderIntel?: boolean;
  customSections?: string[];
}

export interface ExecutiveReport {
  deliverableId: number;
  title: string;
  bodyMarkdown: string;
  clientProfile: PolicyIntelClientProfile | null;
  template: PolicyIntelReportTemplate | null;
  generatedAt: string;
  period: string;
  stats: {
    alertsProcessed: number;
    billsTracked: number;
    predictionsGenerated: number;
    issueRoomsActive: number;
  };
}

export interface TemplateCreateRequest {
  workspaceId: number;
  name: string;
  type: "issue_brief" | "hearing_memo" | "client_alert" | "weekly_digest";
  templateMarkdown: string;
  headerHtml?: string;
  footerHtml?: string;
  brandConfig?: {
    primaryColor: string;
    accentColor: string;
    logoUrl?: string;
    firmName: string;
    confidentialityNotice?: string;
  };
  isDefault?: boolean;
}

// ── Template management ─────────────────────────────────────────────────────

export async function createReportTemplate(
  req: TemplateCreateRequest,
): Promise<PolicyIntelReportTemplate> {
  // If marking as default, unset other defaults of same type
  if (req.isDefault) {
    await policyIntelDb
      .update(reportTemplates)
      .set({ isDefault: false })
      .where(
        and(
          eq(reportTemplates.workspaceId, req.workspaceId),
          eq(reportTemplates.type, req.type),
        ),
      );
  }

  const [created] = await policyIntelDb
    .insert(reportTemplates)
    .values({
      workspaceId: req.workspaceId,
      name: req.name,
      type: req.type,
      templateMarkdown: req.templateMarkdown,
      headerHtml: req.headerHtml ?? null,
      footerHtml: req.footerHtml ?? null,
      brandConfig: req.brandConfig ?? {
        primaryColor: "#1a365d",
        accentColor: "#c53030",
        firmName: "Grace & McEwan Consulting LLC",
      },
      isDefault: req.isDefault ?? false,
    })
    .returning();

  return created;
}

export async function listReportTemplates(
  workspaceId: number,
  type?: string,
): Promise<PolicyIntelReportTemplate[]> {
  const conditions = [eq(reportTemplates.workspaceId, workspaceId)];
  if (type) {
    conditions.push(eq(reportTemplates.type, type as any));
  }

  return policyIntelDb
    .select()
    .from(reportTemplates)
    .where(and(...conditions))
    .orderBy(desc(reportTemplates.isDefault), reportTemplates.name);
}

export async function getReportTemplate(
  id: number,
): Promise<PolicyIntelReportTemplate | null> {
  const [template] = await policyIntelDb
    .select()
    .from(reportTemplates)
    .where(eq(reportTemplates.id, id));
  return template ?? null;
}

export async function updateReportTemplate(
  id: number,
  updates: Partial<TemplateCreateRequest>,
): Promise<PolicyIntelReportTemplate> {
  const setData: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.name) setData.name = updates.name;
  if (updates.templateMarkdown) setData.templateMarkdown = updates.templateMarkdown;
  if (updates.headerHtml !== undefined) setData.headerHtml = updates.headerHtml;
  if (updates.footerHtml !== undefined) setData.footerHtml = updates.footerHtml;
  if (updates.brandConfig) setData.brandConfig = updates.brandConfig;

  const [updated] = await policyIntelDb
    .update(reportTemplates)
    .set(setData)
    .where(eq(reportTemplates.id, id))
    .returning();

  if (!updated) throw new Error(`Template ${id} not found`);
  return updated;
}

export async function deleteReportTemplate(id: number): Promise<void> {
  await policyIntelDb
    .delete(reportTemplates)
    .where(eq(reportTemplates.id, id));
}

// ── Client profile management ───────────────────────────────────────────────

export async function createClientProfile(
  data: {
    workspaceId: number;
    firmName: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    industry?: string;
    priorityTopics?: string[];
    jurisdictions?: string[];
    reportingPreferences?: PolicyIntelClientProfile["reportingPreferences"];
    scoringWeights?: PolicyIntelClientProfile["scoringWeights"];
    notificationChannels?: PolicyIntelClientProfile["notificationChannels"];
  },
): Promise<PolicyIntelClientProfile> {
  const [created] = await policyIntelDb
    .insert(clientProfiles)
    .values(data)
    .returning();
  return created;
}

export async function listClientProfiles(
  workspaceId: number,
): Promise<PolicyIntelClientProfile[]> {
  return policyIntelDb
    .select()
    .from(clientProfiles)
    .where(
      and(
        eq(clientProfiles.workspaceId, workspaceId),
        eq(clientProfiles.isActive, true),
      ),
    )
    .orderBy(clientProfiles.firmName);
}

export async function getClientProfile(
  id: number,
): Promise<PolicyIntelClientProfile | null> {
  const [profile] = await policyIntelDb
    .select()
    .from(clientProfiles)
    .where(eq(clientProfiles.id, id));
  return profile ?? null;
}

export async function updateClientProfile(
  id: number,
  updates: Partial<Omit<PolicyIntelClientProfile, "id" | "createdAt">>,
): Promise<PolicyIntelClientProfile> {
  const [updated] = await policyIntelDb
    .update(clientProfiles)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(clientProfiles.id, id))
    .returning();

  if (!updated) throw new Error(`Client profile ${id} not found`);
  return updated;
}

// ── Executive report generation ─────────────────────────────────────────────

export async function generateExecutiveReport(
  req: ExecutiveReportRequest,
): Promise<ExecutiveReport> {
  // Load client profile if specified
  let profile: PolicyIntelClientProfile | null = null;
  if (req.clientProfileId) {
    profile = await getClientProfile(req.clientProfileId);
  }

  // Load default template for weekly_digest
  const [template] = await policyIntelDb
    .select()
    .from(reportTemplates)
    .where(
      and(
        eq(reportTemplates.workspaceId, req.workspaceId),
        eq(reportTemplates.type, "weekly_digest"),
        eq(reportTemplates.isDefault, true),
      ),
    )
    .limit(1);

  // Determine date range
  const now = new Date();
  let periodStart: Date;
  let periodLabel: string;
  switch (req.period) {
    case "daily":
      periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      periodLabel = now.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
      break;
    case "monthly":
      periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      periodLabel = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      break;
    default: // weekly
      periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      periodLabel = `Week of ${periodStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }

  // Gather data
  const [recentAlerts, predictions, activeRooms, recentActivities] =
    await Promise.all([
      policyIntelDb
        .select()
        .from(alerts)
        .where(
          and(
            eq(alerts.workspaceId, req.workspaceId),
            gte(alerts.createdAt, periodStart),
          ),
        )
        .orderBy(desc(alerts.relevanceScore))
        .limit(50),

      req.includePredictions !== false
        ? policyIntelDb
            .select()
            .from(passagePredictions)
            .where(eq(passagePredictions.workspaceId, req.workspaceId))
            .orderBy(desc(passagePredictions.probability))
        : Promise.resolve([]),

      policyIntelDb
        .select()
        .from(issueRooms)
        .where(
          and(
            eq(issueRooms.workspaceId, req.workspaceId),
            eq(issueRooms.status, "active"),
          ),
        ),

      policyIntelDb
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.workspaceId, req.workspaceId),
            gte(activities.createdAt, periodStart),
          ),
        )
        .orderBy(desc(activities.createdAt))
        .limit(50),
    ]);

  // Build the report
  const firmName =
    profile?.firmName ??
    (template?.brandConfig as any)?.firmName ??
    "Grace & McEwan Consulting LLC";
  const brandColor =
    (template?.brandConfig as any)?.primaryColor ?? "#1a365d";
  const confidentiality =
    (template?.brandConfig as any)?.confidentialityNotice ??
    "CONFIDENTIAL — For client use only. Do not distribute.";

  const sections: string[] = [];

  // Header
  sections.push(`# Executive Legislative Intelligence Report`);
  sections.push(`## ${periodLabel}\n`);
  sections.push(`**Prepared by:** ${firmName}`);
  sections.push(`**Date:** ${now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`);
  if (profile) {
    sections.push(`**Prepared for:** ${profile.contactName ?? profile.firmName}`);
  }
  sections.push(`\n*${confidentiality}*\n`);
  sections.push(`---\n`);

  // Executive Summary
  sections.push(`## Executive Summary\n`);
  const highPriorityAlerts = recentAlerts.filter(
    (a) => (a.relevanceScore ?? 0) >= 70,
  );
  const likelyPassBills = predictions.filter(
    (p) => p.probability >= 0.6,
  );
  const atRiskBills = predictions.filter(
    (p) => p.probability >= 0.4 && p.probability < 0.6,
  );

  sections.push(
    `This ${req.period} report covers **${recentAlerts.length}** legislative developments, ` +
      `**${predictions.length}** bills under prediction monitoring, and ` +
      `**${activeRooms.length}** active issue rooms requiring attention.\n`,
  );

  if (highPriorityAlerts.length > 0) {
    sections.push(
      `⚠️ **${highPriorityAlerts.length}** high-priority alerts require immediate attention.\n`,
    );
  }

  // Prediction Overview
  if (predictions.length > 0 && req.includePredictions !== false) {
    sections.push(`## Bill Passage Predictions\n`);
    sections.push(`| Bill | Probability | Prediction | Stage | Trend |`);
    sections.push(`|------|------------|------------|-------|-------|`);
    for (const p of predictions.slice(0, 15)) {
      const trendIcon =
        (p.probabilityDelta ?? 0) > 0.05
          ? "📈"
          : (p.probabilityDelta ?? 0) < -0.05
            ? "📉"
            : "➡️";
      sections.push(
        `| ${p.billId} | ${(p.probability * 100).toFixed(0)}% | ${p.prediction} | ${p.currentStage ?? "-"} | ${trendIcon} ${p.probabilityDelta !== null ? `${p.probabilityDelta > 0 ? "+" : ""}${(p.probabilityDelta * 100).toFixed(0)}%` : ""} |`,
      );
    }
    sections.push("");

    if (likelyPassBills.length > 0) {
      sections.push(`### Likely to Pass (≥60% probability)\n`);
      for (const b of likelyPassBills.slice(0, 5)) {
        sections.push(
          `- **${b.billId}** (${(b.probability * 100).toFixed(0)}%) — ${b.billTitle ?? "Title pending"} — Next: ${b.nextMilestone ?? "Unknown"}`,
        );
      }
      sections.push("");
    }

    if (atRiskBills.length > 0) {
      sections.push(`### Toss-Up Bills (40-60% probability)\n`);
      for (const b of atRiskBills.slice(0, 5)) {
        sections.push(
          `- **${b.billId}** (${(b.probability * 100).toFixed(0)}%) — ${b.billTitle ?? "Title pending"} — Stage: ${b.currentStage ?? "Unknown"}`,
        );
      }
      sections.push("");
    }
  }

  // High-Priority Alerts
  if (highPriorityAlerts.length > 0) {
    sections.push(`## High-Priority Alerts\n`);
    for (const a of highPriorityAlerts.slice(0, 10)) {
      sections.push(
        `### ${a.title} (Score: ${a.relevanceScore})\n`,
      );
      if (a.whyItMatters) {
        sections.push(a.whyItMatters.split("\n")[0].slice(0, 500) + "\n");
      }
    }
  }

  // Active Issue Rooms
  if (activeRooms.length > 0) {
    sections.push(`## Active Issue Rooms\n`);
    sections.push(`| Issue | Status | Bills | Jurisdiction |`);
    sections.push(`|-------|--------|-------|-------------|`);
    for (const room of activeRooms.slice(0, 10)) {
      const bills = (room.relatedBillIds as string[] | null) ?? [];
      sections.push(
        `| ${room.title} | ${room.status} | ${bills.join(", ") || "—"} | ${room.jurisdiction ?? "TX"} |`,
      );
    }
    sections.push("");
  }

  // Priority topics for client
  if (profile?.priorityTopics && profile.priorityTopics.length > 0) {
    sections.push(`## Your Priority Topics\n`);
    for (const topic of profile.priorityTopics) {
      const topicAlerts = recentAlerts.filter(
        (a) =>
          (a.title ?? "").toLowerCase().includes(topic.toLowerCase()) ||
          (a.whyItMatters ?? "").toLowerCase().includes(topic.toLowerCase()),
      );
      sections.push(
        `- **${topic}**: ${topicAlerts.length} alert(s) this ${req.period}` +
          (topicAlerts.length > 0
            ? ` — Latest: ${topicAlerts[0].title}`
            : " — No new activity"),
      );
    }
    sections.push("");
  }

  // Footer
  sections.push(`---\n`);
  sections.push(
    `*Report generated by Act Up Policy Intelligence Platform — ${firmName}*\n`,
  );
  sections.push(`*${confidentiality}*`);

  const bodyMarkdown = sections.join("\n");
  const title = `Executive Report — ${periodLabel}`;

  // Store as deliverable
  const [stored] = await policyIntelDb
    .insert(deliverables)
    .values({
      workspaceId: req.workspaceId,
      type: "weekly_digest",
      title,
      bodyMarkdown,
      generatedBy: "client-reporting-service",
      matterId: null,
    })
    .returning();

  log.info(`Generated executive report: ${title} (${recentAlerts.length} alerts, ${predictions.length} predictions)`);

  return {
    deliverableId: stored.id,
    title,
    bodyMarkdown,
    clientProfile: profile,
    template: template ?? null,
    generatedAt: new Date().toISOString(),
    period: req.period,
    stats: {
      alertsProcessed: recentAlerts.length,
      billsTracked: predictions.length,
      predictionsGenerated: predictions.filter(
        (p) => p.probability > 0,
      ).length,
      issueRoomsActive: activeRooms.length,
    },
  };
}
