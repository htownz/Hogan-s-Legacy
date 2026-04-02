/**
 * Session Lifecycle Manager — manages the full legislative cycle
 *
 * Handles the complete workflow from interim to session to post-session:
 * - Session phase tracking (interim → pre-filing → committee → floor → enrollment)
 * - Milestone management with automatic deadline reminders
 * - Client priority intake during interim
 * - Calendar-driven task generation
 * - Phase transition intelligence (what to prepare for next)
 *
 * For firms like Grace & McEwan: never miss a deadline, always know
 * what's coming next, and be prepared for every phase transition.
 */
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { policyIntelDb } from "../db";
import {
  legislativeSessions,
  sessionMilestones,
  clientActions,
  clientProfiles,
  matters,
  issueRooms,
  watchlists,
  type PolicyIntelLegislativeSession,
  type InsertPolicyIntelLegislativeSession,
  type PolicyIntelSessionMilestone,
  type InsertPolicyIntelSessionMilestone,
  type PolicyIntelClientAction,
  type InsertPolicyIntelClientAction,
} from "@shared/schema-policy-intel";
import { createLogger } from "../logger";

const log = createLogger("session-lifecycle");

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface SessionDashboard {
  session: PolicyIntelLegislativeSession;
  currentPhase: string;
  daysRemaining: number | null;
  milestones: PolicyIntelSessionMilestone[];
  upcomingMilestones: PolicyIntelSessionMilestone[];
  overdueMilestones: PolicyIntelSessionMilestone[];
  activeActions: PolicyIntelClientAction[];
  phaseGuidance: {
    currentPhaseDescription: string;
    nextPhase: string | null;
    nextPhaseDate: string | null;
    keyPriorities: string[];
    warnings: string[];
  };
  stats: {
    totalMilestones: number;
    completedMilestones: number;
    totalActions: number;
    completedActions: number;
    pendingActions: number;
  };
}

export interface PhaseTransitionPlan {
  fromPhase: string;
  toPhase: string;
  generatedTasks: InsertPolicyIntelClientAction[];
  milestones: InsertPolicyIntelSessionMilestone[];
  briefing: string;
}

// ── Session CRUD ────────────────────────────────────────────────────────────

export async function createSession(
  data: InsertPolicyIntelLegislativeSession,
): Promise<PolicyIntelLegislativeSession> {
  const [created] = await policyIntelDb
    .insert(legislativeSessions)
    .values(data)
    .returning();
  return created;
}

export async function getActiveSession(
  workspaceId: number,
): Promise<PolicyIntelLegislativeSession | null> {
  const [session] = await policyIntelDb
    .select()
    .from(legislativeSessions)
    .where(
      and(
        eq(legislativeSessions.workspaceId, workspaceId),
        eq(legislativeSessions.isActive, true),
      ),
    )
    .orderBy(desc(legislativeSessions.sessionNumber))
    .limit(1);
  return session ?? null;
}

export async function listSessions(
  workspaceId: number,
): Promise<PolicyIntelLegislativeSession[]> {
  return policyIntelDb
    .select()
    .from(legislativeSessions)
    .where(eq(legislativeSessions.workspaceId, workspaceId))
    .orderBy(desc(legislativeSessions.sessionNumber));
}

export async function updateSessionPhase(
  sessionId: number,
  phase: PolicyIntelLegislativeSession["currentPhase"],
): Promise<PolicyIntelLegislativeSession> {
  const [updated] = await policyIntelDb
    .update(legislativeSessions)
    .set({ currentPhase: phase, updatedAt: new Date() })
    .where(eq(legislativeSessions.id, sessionId))
    .returning();

  if (!updated) throw new Error(`Session ${sessionId} not found`);
  log.info(`Session ${sessionId} phase updated to: ${phase}`);
  return updated;
}

// ── Milestone CRUD ──────────────────────────────────────────────────────────

export async function createMilestone(
  data: InsertPolicyIntelSessionMilestone,
): Promise<PolicyIntelSessionMilestone> {
  const [created] = await policyIntelDb
    .insert(sessionMilestones)
    .values(data)
    .returning();
  return created;
}

export async function listMilestones(
  sessionId: number,
  phase?: string,
): Promise<PolicyIntelSessionMilestone[]> {
  const conditions = [eq(sessionMilestones.sessionId, sessionId)];
  if (phase) {
    conditions.push(eq(sessionMilestones.phase, phase as any));
  }
  return policyIntelDb
    .select()
    .from(sessionMilestones)
    .where(and(...conditions))
    .orderBy(sessionMilestones.dueDate);
}

export async function updateMilestoneStatus(
  milestoneId: number,
  status: PolicyIntelSessionMilestone["status"],
): Promise<PolicyIntelSessionMilestone> {
  const setData: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  if (status === "completed") {
    setData.completedAt = new Date();
  }

  const [updated] = await policyIntelDb
    .update(sessionMilestones)
    .set(setData)
    .where(eq(sessionMilestones.id, milestoneId))
    .returning();

  if (!updated) throw new Error(`Milestone ${milestoneId} not found`);
  return updated;
}

// ── Client Actions CRUD ─────────────────────────────────────────────────────

export async function createClientAction(
  data: InsertPolicyIntelClientAction,
): Promise<PolicyIntelClientAction> {
  const [created] = await policyIntelDb
    .insert(clientActions)
    .values(data)
    .returning();
  return created;
}

export async function listClientActions(
  workspaceId: number,
  filters?: {
    status?: string;
    matterId?: number;
    assignee?: string;
    dueBefore?: Date;
  },
): Promise<PolicyIntelClientAction[]> {
  const conditions = [eq(clientActions.workspaceId, workspaceId)];
  if (filters?.status) {
    conditions.push(eq(clientActions.status, filters.status as any));
  }
  if (filters?.matterId) {
    conditions.push(eq(clientActions.matterId, filters.matterId));
  }
  if (filters?.assignee) {
    conditions.push(eq(clientActions.assignee, filters.assignee));
  }
  if (filters?.dueBefore) {
    conditions.push(lte(clientActions.dueDate, filters.dueBefore));
  }

  return policyIntelDb
    .select()
    .from(clientActions)
    .where(and(...conditions))
    .orderBy(clientActions.dueDate);
}

export async function updateClientAction(
  actionId: number,
  updates: Partial<{
    status: PolicyIntelClientAction["status"];
    outcome: string;
    assignee: string;
    dueDate: Date;
  }>,
): Promise<PolicyIntelClientAction> {
  const setData: Record<string, unknown> = { ...updates, updatedAt: new Date() };
  if (updates.status === "completed") {
    setData.completedAt = new Date();
  }

  const [updated] = await policyIntelDb
    .update(clientActions)
    .set(setData)
    .where(eq(clientActions.id, actionId))
    .returning();

  if (!updated) throw new Error(`Client action ${actionId} not found`);
  return updated;
}

// ── Session Dashboard ───────────────────────────────────────────────────────

export async function getSessionDashboard(
  workspaceId: number,
): Promise<SessionDashboard | null> {
  const session = await getActiveSession(workspaceId);
  if (!session) return null;

  const now = new Date();

  const [milestones, actions] = await Promise.all([
    listMilestones(session.id),
    listClientActions(workspaceId),
  ]);

  const upcomingMilestones = milestones.filter(
    (m) => m.status === "upcoming" && new Date(m.dueDate) > now,
  );
  const overdueMilestones = milestones.filter(
    (m) =>
      (m.status === "upcoming" || m.status === "in_progress") &&
      new Date(m.dueDate) < now,
  );
  const activeActions = actions.filter(
    (a) => a.status === "pending" || a.status === "in_progress",
  );

  // Days remaining in session
  const daysRemaining = session.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(session.endDate).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : null;

  // Phase guidance
  const phaseGuidance = generatePhaseGuidance(
    session.currentPhase,
    daysRemaining,
    overdueMilestones.length,
    activeActions.length,
  );

  return {
    session,
    currentPhase: session.currentPhase,
    daysRemaining,
    milestones,
    upcomingMilestones,
    overdueMilestones,
    activeActions,
    phaseGuidance,
    stats: {
      totalMilestones: milestones.length,
      completedMilestones: milestones.filter((m) => m.status === "completed")
        .length,
      totalActions: actions.length,
      completedActions: actions.filter((a) => a.status === "completed").length,
      pendingActions: activeActions.length,
    },
  };
}

// ── Phase transition planning ───────────────────────────────────────────────

export async function generatePhaseTransitionPlan(
  workspaceId: number,
  toPhase: string,
): Promise<PhaseTransitionPlan> {
  const session = await getActiveSession(workspaceId);
  if (!session) throw new Error("No active session");

  const fromPhase = session.currentPhase;

  // Generate phase-specific tasks and milestones
  const planTemplates: Record<
    string,
    { tasks: Partial<InsertPolicyIntelClientAction>[]; milestones: Partial<InsertPolicyIntelSessionMilestone>[]; briefing: string }
  > = {
    pre_filing: {
      briefing:
        "**Pre-Filing Period** — Bill drafts are being prepared. This is the critical window for:\n" +
        "- Identifying client priority issues and potential legislation\n" +
        "- Building coalitions before bills are officially filed\n" +
        "- Scheduling meetings with committee chairs and key sponsors\n" +
        "- Preparing testimony and position papers\n",
      tasks: [
        { actionType: "client_briefing", title: "Client priority intake meeting", priority: "high" },
        { actionType: "coalition_outreach", title: "Pre-session coalition building", priority: "high" },
        { actionType: "legislator_meeting", title: "Key sponsor meetings", priority: "medium" },
        { actionType: "opposition_research", title: "Opposition landscape analysis", priority: "medium" },
      ],
      milestones: [
        { title: "Client priorities finalized", phase: "pre_filing" as const },
        { title: "Watchlists configured", phase: "pre_filing" as const },
        { title: "Key legislator meetings scheduled", phase: "pre_filing" as const },
      ],
    },
    filing_period: {
      briefing:
        "**Filing Period** — Bills are being officially filed. Critical activities:\n" +
        "- Monitor every bill filing for client-relevant legislation\n" +
        "- Run immediate passage probability analysis on new filings\n" +
        "- Track companion bills (House/Senate versions)\n" +
        "- Alert clients on high-priority new filings within 24 hours\n",
      tasks: [
        { actionType: "client_briefing", title: "Daily new filing briefings", priority: "critical" },
        { actionType: "opposition_research", title: "Track adverse filings", priority: "high" },
        { actionType: "amendment_draft", title: "Draft amendment language for priority bills", priority: "high" },
      ],
      milestones: [
        { title: "All priority bills identified and tracked", phase: "filing_period" as const },
        { title: "Passage predictions live for all tracked bills", phase: "filing_period" as const },
      ],
    },
    committee_hearings: {
      briefing:
        "**Committee Hearings** — Bills are being heard. Maximum engagement required:\n" +
        "- Prepare testimony for every relevant hearing\n" +
        "- Coordinate witnesses and stakeholders\n" +
        "- Monitor committee substitutes and amendments\n" +
        "- Real-time briefing from hearing outcomes\n",
      tasks: [
        { actionType: "testimony_prep", title: "Prepare hearing testimony", priority: "critical" },
        { actionType: "witness_coordination", title: "Coordinate hearing witnesses", priority: "high" },
        { actionType: "client_briefing", title: "Post-hearing client briefings", priority: "high" },
        { actionType: "amendment_draft", title: "Monitor committee substitutes", priority: "medium" },
      ],
      milestones: [
        { title: "All priority bill hearings attended", phase: "committee_hearings" as const },
        { title: "Committee vote tracking active", phase: "committee_hearings" as const },
      ],
    },
    floor_action: {
      briefing:
        "**Floor Action** — Bills are being debated and voted on. Fast-paced environment:\n" +
        "- Real-time floor vote monitoring\n" +
        "- Track amendments offered on the floor\n" +
        "- Emergency client alerts for unexpected votes\n" +
        "- Prepare conference committee contingencies\n",
      tasks: [
        { actionType: "client_briefing", title: "Real-time floor action updates", priority: "critical" },
        { actionType: "strategy_pivot", title: "Assess floor amendment impacts", priority: "high" },
        { actionType: "grassroots_activation", title: "Grassroots activation if needed", priority: "medium" },
      ],
      milestones: [
        { title: "Floor calendar monitoring active", phase: "floor_action" as const },
        { title: "Conference committee preparations ready", phase: "floor_action" as const },
      ],
    },
    post_session: {
      briefing:
        "**Post-Session** — Session has ended. Time for assessment and preparation:\n" +
        "- Generate final session reports for clients\n" +
        "- Track governor action on enrolled bills\n" +
        "- Begin interim charge monitoring\n" +
        "- Plan advocacy strategy for next session\n",
      tasks: [
        { actionType: "client_briefing", title: "Final session report for clients", priority: "high" },
        { actionType: "strategy_pivot", title: "Next session strategy planning", priority: "medium" },
        { actionType: "opposition_research", title: "Interim charge analysis", priority: "medium" },
      ],
      milestones: [
        { title: "Governor action tracking complete", phase: "post_session" as const },
        { title: "Client session reports delivered", phase: "post_session" as const },
        { title: "Interim charge monitoring started", phase: "post_session" as const },
      ],
    },
  };

  const plan = planTemplates[toPhase] ?? {
    briefing: `Transitioning to ${toPhase} phase.`,
    tasks: [],
    milestones: [],
  };

  const now = new Date();
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const generatedTasks: InsertPolicyIntelClientAction[] = plan.tasks.map(
    (t) => ({
      workspaceId,
      actionType: t.actionType!,
      title: t.title!,
      status: "pending" as const,
      priority: t.priority! as any,
      dueDate: twoWeeks,
    }),
  );

  const generatedMilestones: InsertPolicyIntelSessionMilestone[] =
    plan.milestones.map((m) => ({
      sessionId: session.id,
      title: m.title!,
      phase: m.phase!,
      dueDate: twoWeeks,
      status: "upcoming" as const,
    }));

  return {
    fromPhase,
    toPhase,
    generatedTasks,
    milestones: generatedMilestones,
    briefing: plan.briefing,
  };
}

export async function executePhaseTransition(
  workspaceId: number,
  toPhase: string,
): Promise<{
  session: PolicyIntelLegislativeSession;
  tasksCreated: number;
  milestonesCreated: number;
}> {
  const plan = await generatePhaseTransitionPlan(workspaceId, toPhase);
  const session = await getActiveSession(workspaceId);
  if (!session) throw new Error("No active session");

  // Update session phase
  const updatedSession = await updateSessionPhase(session.id, toPhase as any);

  // Create tasks
  let tasksCreated = 0;
  for (const task of plan.generatedTasks) {
    await createClientAction(task);
    tasksCreated++;
  }

  // Create milestones
  let milestonesCreated = 0;
  for (const milestone of plan.milestones) {
    await createMilestone(milestone);
    milestonesCreated++;
  }

  log.info(
    `Phase transition: ${plan.fromPhase} → ${toPhase} | ${tasksCreated} tasks, ${milestonesCreated} milestones created`,
  );

  return { session: updatedSession, tasksCreated, milestonesCreated };
}

// ── Phase guidance helper ───────────────────────────────────────────────────

function generatePhaseGuidance(
  currentPhase: string,
  daysRemaining: number | null,
  overdueCount: number,
  pendingActions: number,
): SessionDashboard["phaseGuidance"] {
  const phaseDescriptions: Record<string, string> = {
    interim:
      "The Legislature is not in session. Focus on interim charge monitoring, " +
      "relationship building, and preparing client advocacy strategies for the next session.",
    pre_filing:
      "Bill drafts are being prepared. This is the most strategic window — " +
      "work with sponsors on bill language, build coalitions, and prepare clients.",
    filing_period:
      "Bills are being officially filed. Monitor every filing for client-relevant legislation " +
      "and run immediate analysis on new filings.",
    committee_hearings:
      "Bills are being heard in committee. Prepare testimony, coordinate witnesses, " +
      "and track committee substitutes and amendments.",
    floor_action:
      "Bills are being debated on the floor. Fast-paced environment requiring " +
      "real-time monitoring, emergency alerts, and strategic response.",
    conference:
      "Conference committees are reconciling House and Senate versions. " +
      "Track compromise language and assess impacts on client positions.",
    enrollment:
      "Bills are being enrolled and sent to the Governor. Track signing and veto dynamics.",
    post_session:
      "Session has ended. Generate final reports, track governor action, " +
      "and begin planning for the next session.",
    special_session:
      "Special session is active. Limited agenda but high intensity. " +
      "Focus on the Governor's call items.",
  };

  const phaseOrder = [
    "interim",
    "pre_filing",
    "filing_period",
    "committee_hearings",
    "floor_action",
    "conference",
    "enrollment",
    "post_session",
  ];
  const currentIdx = phaseOrder.indexOf(currentPhase);
  const nextPhase = currentIdx >= 0 && currentIdx < phaseOrder.length - 1
    ? phaseOrder[currentIdx + 1]
    : null;

  const warnings: string[] = [];
  if (overdueCount > 0) {
    warnings.push(`${overdueCount} milestone(s) are overdue — immediate attention required`);
  }
  if (daysRemaining !== null && daysRemaining < 30) {
    warnings.push(`Only ${daysRemaining} days remaining in session`);
  }
  if (pendingActions > 10) {
    warnings.push(`${pendingActions} pending actions — consider prioritization review`);
  }

  const keyPriorities: string[] = [];
  switch (currentPhase) {
    case "interim":
      keyPriorities.push("Monitor interim charges");
      keyPriorities.push("Build legislator relationships");
      keyPriorities.push("Update client priority matrices");
      break;
    case "pre_filing":
      keyPriorities.push("Finalize client priorities");
      keyPriorities.push("Configure bill watchlists");
      keyPriorities.push("Schedule key legislator meetings");
      break;
    case "filing_period":
      keyPriorities.push("Track all new filings daily");
      keyPriorities.push("Run passage predictions on priority bills");
      keyPriorities.push("Alert clients on adverse filings within 24 hours");
      break;
    case "committee_hearings":
      keyPriorities.push("Prepare and deliver testimony");
      keyPriorities.push("Track committee votes and substitutes");
      keyPriorities.push("Brief clients after every key hearing");
      break;
    case "floor_action":
      keyPriorities.push("Monitor floor calendar daily");
      keyPriorities.push("Track floor amendments in real-time");
      keyPriorities.push("Emergency alerts for unexpected developments");
      break;
    default:
      keyPriorities.push("Review current phase objectives");
  }

  return {
    currentPhaseDescription: phaseDescriptions[currentPhase] ?? `Phase: ${currentPhase}`,
    nextPhase,
    nextPhaseDate: null,
    keyPriorities,
    warnings,
  };
}

// ── Initialize Texas 89R session with standard milestones ───────────────────

export async function initializeTexasSession(
  workspaceId: number,
  sessionNumber: number = 89,
): Promise<{
  session: PolicyIntelLegislativeSession;
  milestones: PolicyIntelSessionMilestone[];
}> {
  // Check if session already exists
  const existing = await getActiveSession(workspaceId);
  if (existing && existing.sessionNumber === sessionNumber) {
    const milestones = await listMilestones(existing.id);
    return { session: existing, milestones };
  }

  // Create session
  const session = await createSession({
    workspaceId,
    sessionNumber,
    sessionType: "regular",
    startDate: new Date("2025-01-14"), // 89R start date
    endDate: new Date("2025-06-02"), // sine die
    currentPhase: "committee_hearings", // current phase as of mid-2025
    isActive: true,
  });

  // Create standard Texas Legislature milestones
  const standardMilestones: Partial<InsertPolicyIntelSessionMilestone>[] = [
    { title: "Session Convenes", phase: "filing_period" as const, dueDate: new Date("2025-01-14") },
    { title: "Bill Filing Deadline (60-day)", phase: "filing_period" as const, dueDate: new Date("2025-03-14") },
    { title: "Committee Hearing Deadline", phase: "committee_hearings" as const, dueDate: new Date("2025-04-30") },
    { title: "House Floor Deadline", phase: "floor_action" as const, dueDate: new Date("2025-05-09") },
    { title: "Senate Floor Deadline", phase: "floor_action" as const, dueDate: new Date("2025-05-16") },
    { title: "Conference Committee Deadline", phase: "conference" as const, dueDate: new Date("2025-05-26") },
    { title: "Sine Die", phase: "enrollment" as const, dueDate: new Date("2025-06-02") },
    { title: "Governor Signing Deadline", phase: "post_session" as const, dueDate: new Date("2025-06-22") },
  ];

  const createdMilestones: PolicyIntelSessionMilestone[] = [];
  for (const m of standardMilestones) {
    const now = new Date();
    const status =
      m.dueDate && m.dueDate < now ? "completed" : "upcoming";

    const created = await createMilestone({
      sessionId: session.id,
      title: m.title!,
      phase: m.phase!,
      dueDate: m.dueDate!,
      status: status as any,
    });
    createdMilestones.push(created);
  }

  log.info(
    `Initialized Texas ${sessionNumber}R session with ${createdMilestones.length} milestones`,
  );
  return { session, milestones: createdMilestones };
}
