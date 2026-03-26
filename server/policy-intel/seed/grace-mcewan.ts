/**
 * Grace & McEwan LLC — Seed script
 * Creates the firm workspace, watchlists, and starter matters.
 * Run via: POST /api/intel/seed  (dev-only)
 */
import { policyIntelDb } from "../db";
import { workspaces, watchlists, matters, matterWatchlists } from "@shared/schema-policy-intel";
import { and, eq } from "drizzle-orm";

export async function seedGraceMcEwan(): Promise<{ workspace: { id: number; slug: string }; watchlistIds: number[]; matterIds: number[] }> {
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

  return { workspace, watchlistIds, matterIds };
}
