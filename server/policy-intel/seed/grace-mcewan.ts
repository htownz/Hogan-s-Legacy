/**
 * Grace & McEwan LLC — Seed script
 * Creates the firm workspace, watchlists, starter matters, and a canonical issue room.
 * Run via: POST /api/intel/seed  (dev-only)
 */
import { policyIntelDb } from "../db";
import {
  issueRoomStrategyOptions,
  issueRoomTasks,
  issueRoomUpdates,
  issueRooms,
  matters,
  matterWatchlists,
  stakeholders,
  watchlists,
  workspaces,
} from "@shared/schema-policy-intel";
import { and, eq } from "drizzle-orm";

export async function seedGraceMcEwan(): Promise<{ workspace: { id: number; slug: string }; watchlistIds: number[]; matterIds: number[]; issueRoomIds: number[] }> {
  // ── 1. Upsert workspace ───────────────────────────────────────────────
  let workspace: { id: number; slug: string };

  const existing = await policyIntelDb
    .select({ id: workspaces.id, slug: workspaces.slug })
    .from(workspaces)
    .where(eq(workspaces.slug, "grace-mcewan"));

  if (existing.length > 0) {
    workspace = existing[0];
  } else {
    const [created] = await policyIntelDb
      .insert(workspaces)
      .values({
        slug: "grace-mcewan",
        name: "Grace & McEwan LLC",
        jurisdictionScope: "texas_houston",
      })
      .returning({ id: workspaces.id, slug: workspaces.slug });
    workspace = created;
  }

  // ── 2. Seed watchlists (skip if already present) ─────────────────────
  const watchlistDefs = [
    {
      name: "Transportation / Infrastructure / Mobility",
      topic: "transportation",
      description:
        "TxDOT, METRO, freight corridors, mobility projects, and road/transit procurement in Texas and Houston.",
      rulesJson: {
        keywords: [
          "TxDOT",
          "METRO",
          "freight",
          "mobility",
          "right-of-way",
          "procurement",
          "highway",
          "tollway",
          "transit",
          "infrastructure",
          "SH 288",
          "US 290",
          "Loop 610",
          "Beltway 8",
          "I-45",
          "corridor",
        ],
        committees: ["Transportation"],
        agencies: ["TxDOT", "METRO", "TTC"],
        jurisdictions: ["texas", "houston", "harris_county"],
        billPrefixes: ["HB", "SB"],
      },
    },
    {
      name: "Houston Local Government / Procurement",
      topic: "local_government",
      description:
        "Houston City Council, Harris County, METRO board, and local procurement actions relevant to firm clients.",
      rulesJson: {
        keywords: [
          "Houston City Council",
          "HCCC",
          "Harris County",
          "Beacon",
          "city contracts",
          "METRO board",
          "procurement",
          "RFP",
          "RFQ",
          "vendor",
          "contract award",
          "public improvement district",
          "PID",
          "TIF",
        ],
        committees: ["Municipal Affairs", "Local Government"],
        agencies: ["City of Houston", "Harris County", "METRO"],
        jurisdictions: ["houston", "harris_county"],
        billPrefixes: ["HB", "SB"],
      },
    },
    {
      name: "Workforce / Education / Technology",
      topic: "workforce_edtech",
      description:
        "TEA, workforce development, broadband, AI policy, and economic development initiatives in Texas.",
      rulesJson: {
        keywords: [
          "TEA",
          "workforce",
          "education",
          "AI",
          "artificial intelligence",
          "technology",
          "broadband",
          "economic development",
          "STEM",
          "apprenticeship",
          "career and technical",
          "CTE",
          "data privacy",
          "cybersecurity",
          "innovation",
          "startup",
        ],
        committees: ["Education", "Technology", "Economic Development"],
        agencies: ["TEA", "TWC", "TexasEDC"],
        jurisdictions: ["texas"],
        billPrefixes: ["HB", "SB"],
      },
    },
  ];

  const watchlistIds: number[] = [];

  for (const def of watchlistDefs) {
    const existing = await policyIntelDb
      .select({ id: watchlists.id })
      .from(watchlists)
      .where(eq(watchlists.name, def.name));

    if (existing.length > 0) {
      watchlistIds.push(existing[0].id);
      continue;
    }

    const [created] = await policyIntelDb
      .insert(watchlists)
      .values({
        workspaceId: workspace.id,
        name: def.name,
        topic: def.topic,
        description: def.description,
        rulesJson: def.rulesJson,
        isActive: true,
      })
      .returning({ id: watchlists.id });

    watchlistIds.push(created.id);
  }

  // ── 3. Seed matters + link to watchlists ─────────────────────────────
  const matterDefs = [
    {
      slug: "txdot-mobility-89r",
      name: "TxDOT & Mobility — 89th Legislature",
      clientName: "Grace & McEwan (internal)",
      practiceArea: "Transportation & Infrastructure",
      description: "Monitoring all 89R bills, hearings, and agency actions related to TxDOT, METRO, and Texas mobility corridor projects.",
      tagsJson: ["txdot", "metro", "89R", "transportation"],
      linkWatchlist: "Transportation / Infrastructure / Mobility",
    },
    {
      slug: "houston-procurement-89r",
      name: "Houston & Harris County Procurement",
      clientName: "Grace & McEwan (internal)",
      practiceArea: "Local Government Affairs",
      description: "Track City of Houston, Harris County, and METRO procurement opportunities and policy actions.",
      tagsJson: ["houston", "procurement", "harris_county"],
      linkWatchlist: "Houston Local Government / Procurement",
    },
    {
      slug: "workforce-edtech-89r",
      name: "Workforce & EdTech — 89th Legislature",
      clientName: "Grace & McEwan (internal)",
      practiceArea: "Education & Technology Policy",
      description: "Monitor TEA, workforce, broadband, AI policy, and economic development initiatives for the 89th Legislature.",
      tagsJson: ["workforce", "education", "AI", "89R"],
      linkWatchlist: "Workforce / Education / Technology",
    },
  ];

  const matterIds: number[] = [];

  for (const def of matterDefs) {
    const existingMatter = await policyIntelDb
      .select({ id: matters.id })
      .from(matters)
      .where(and(eq(matters.workspaceId, workspace.id), eq(matters.slug, def.slug)));

    let matterId: number;
    if (existingMatter.length > 0) {
      matterId = existingMatter[0].id;
    } else {
      const [created] = await policyIntelDb
        .insert(matters)
        .values({
          workspaceId: workspace.id,
          slug: def.slug,
          name: def.name,
          clientName: def.clientName,
          practiceArea: def.practiceArea,
          description: def.description,
          tagsJson: def.tagsJson,
        })
        .returning({ id: matters.id });
      matterId = created.id;
    }
    matterIds.push(matterId);

    // Link matter → watchlist
    const targetWl = watchlistIds[matterDefs.indexOf(def)];
    if (targetWl) {
      const existingLink = await policyIntelDb
        .select({ id: matterWatchlists.id })
        .from(matterWatchlists)
        .where(and(eq(matterWatchlists.matterId, matterId), eq(matterWatchlists.watchlistId, targetWl)));

      if (existingLink.length === 0) {
        await policyIntelDb
          .insert(matterWatchlists)
          .values({ matterId, watchlistId: targetWl });
      }
    }
  }

  // ── 4. Seed a canonical issue room and starter artifacts ──────────────
  const issueRoomMatterId = matterIds[matterDefs.findIndex((matter) => matter.slug === "workforce-edtech-89r")] ?? null;

  const existingIssueRoom = await policyIntelDb
    .select({ id: issueRooms.id })
    .from(issueRooms)
    .where(and(eq(issueRooms.workspaceId, workspace.id), eq(issueRooms.slug, "hisd-tea-sb-1882")));

  let issueRoomId: number;
  if (existingIssueRoom.length > 0) {
    issueRoomId = existingIssueRoom[0].id;
  } else {
    const [createdIssueRoom] = await policyIntelDb
      .insert(issueRooms)
      .values({
        workspaceId: workspace.id,
        matterId: issueRoomMatterId,
        slug: "hisd-tea-sb-1882",
        title: "HISD / TEA / SB 1882 Governance",
        issueType: "education_governance",
        jurisdiction: "texas",
        status: "active",
        summary:
          "Track Texas education authority shifts, HISD governance actions, SB 1882-style partnership implications, and operational consequences for public-sector stakeholders.",
        recommendedPath:
          "Maintain one source-backed issue room that consolidates governance actions, implementation risk, and partner-facing strategic options.",
        relatedBillIds: ["SB 1882"],
      })
      .returning({ id: issueRooms.id });
    issueRoomId = createdIssueRoom.id;
  }

  const existingUpdates = await policyIntelDb
    .select({ id: issueRoomUpdates.id })
    .from(issueRoomUpdates)
    .where(eq(issueRoomUpdates.issueRoomId, issueRoomId));

  if (existingUpdates.length === 0) {
    await policyIntelDb.insert(issueRoomUpdates).values({
      issueRoomId,
      title: "Initial monitoring frame",
      body:
        "Use this issue room to track changes in TEA authority, HISD governance, partnership models, and implementation consequences. Future recommendations should cite stored source documents.",
      updateType: "analysis",
    });
  }

  const existingOptions = await policyIntelDb
    .select({ id: issueRoomStrategyOptions.id })
    .from(issueRoomStrategyOptions)
    .where(eq(issueRoomStrategyOptions.issueRoomId, issueRoomId));

  if (existingOptions.length === 0) {
    await policyIntelDb.insert(issueRoomStrategyOptions).values([
      {
        issueRoomId,
        label: "Monitor and brief",
        description: "Maintain a disciplined evidence room and produce partner-ready updates as governance changes occur.",
        prosJson: ["Lowest execution risk", "Improves partner awareness quickly"],
        consJson: ["Limited direct influence without additional engagement"],
        politicalFeasibility: "high",
        legalDurability: "high",
        implementationComplexity: "low",
        recommendationRank: 1,
      },
      {
        issueRoomId,
        label: "Stakeholder engagement plan",
        description: "Map agencies, operators, and district actors before recommending direct outreach or coalition activity.",
        prosJson: ["Improves situational awareness", "Clarifies leverage points"],
        consJson: ["Requires disciplined stakeholder validation"],
        politicalFeasibility: "medium",
        legalDurability: "medium",
        implementationComplexity: "medium",
        recommendationRank: 2,
      },
    ]);
  }

  const existingTasks = await policyIntelDb
    .select({ id: issueRoomTasks.id })
    .from(issueRoomTasks)
    .where(eq(issueRoomTasks.issueRoomId, issueRoomId));

  if (existingTasks.length === 0) {
    await policyIntelDb.insert(issueRoomTasks).values([
      {
        issueRoomId,
        title: "Review latest TEA and HISD source documents",
        description: "Confirm which recent official actions materially affect governance or implementation authority.",
        status: "todo",
        priority: "high",
        assignee: "Grace & McEwan analyst",
      },
      {
        issueRoomId,
        title: "Draft partner briefing outline",
        description: "Prepare a short issue-room brief once the first relevant alert cluster is linked.",
        status: "todo",
        priority: "medium",
        assignee: "Grace & McEwan analyst",
      },
    ]);
  }

  const existingStakeholders = await policyIntelDb
    .select({ id: stakeholders.id })
    .from(stakeholders)
    .where(eq(stakeholders.issueRoomId, issueRoomId));

  if (existingStakeholders.length === 0) {
    await policyIntelDb.insert(stakeholders).values([
      {
        workspaceId: workspace.id,
        issueRoomId,
        type: "agency_official",
        name: "Texas Education Agency",
        organization: "TEA",
        jurisdiction: "texas",
        tagsJson: ["agency", "education"],
        sourceSummary: "Primary state-level authority and implementation signal source for the issue room.",
      },
      {
        workspaceId: workspace.id,
        issueRoomId,
        type: "organization",
        name: "Houston Independent School District",
        organization: "HISD",
        jurisdiction: "houston",
        tagsJson: ["district", "education"],
        sourceSummary: "Local district actor affected by governance and partnership changes.",
      },
    ]);
  }

  return { workspace, watchlistIds, matterIds, issueRoomIds: [issueRoomId] };
}
