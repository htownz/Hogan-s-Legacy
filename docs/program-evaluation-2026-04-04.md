# Program Evaluation - 2026-04-04

## Bottom line

This product is no longer just a bill tracker. It is much closer to a Texas-first government affairs operating system, especially when the workflow starts with a real hearing or committee event and ends with a client-ready memo, issue room, or follow-up action.

The strongest proof point is the live Senate Business & Commerce committee-intel session now in the running system:

- Hearing: Senate Business & Commerce
- Hearing date: April 1, 2026
- Session title: `Senate Business & Commerce - Grid Security Hearing`
- Transcript auto-ingest: enabled
- Auto-ingest interval: 300 seconds
- Tracked transcript segments: 10,562
- Focus topics: critical infrastructure, supply chain integrity, electric grid security, foreign entities of concern, ERCOT accountability, PUCT oversight

That is not commodity monitoring. That is a real committee-specific operating surface.

## What is genuinely differentiated

### 1. Committee hearing as a first-class object

The best feature family in the system is the committee-intel stack.

- Hearing -> committee-intel session creation is built into the API.
- Sessions support source URLs, feed sync, transcript ingestion, re-analysis, rebuild, focused briefs, and post-hearing recaps.
- The UI exposes real operations around a hearing, not just passive viewing.

This is the strongest answer to "why not use a conventional legislative monitor?"

### 2. Lobbying workflow, not just legislative data

The product does not stop at:

- hearing calendar
- bill search
- watchlist alerts

It continues into:

- stakeholder records
- meeting notes
- issue rooms
- strategy options
- tasks
- generated briefs
- client alerts
- hearing memos
- weekly reports

That workflow is the part that starts to feel more valuable than OpenGov, and more actionable than pure tracking tools.

### 3. Texas strategy overlays

The product has a real Texas public-affairs point of view:

- committee-hearing phase planning
- committee vote and substitute tracking priorities
- power network analysis
- relationship dossiers
- bill passage predictions
- session transition planning

That is a much stronger strategic posture than "AI summarize this bill."

## Strongest live proof point: Senate Business & Commerce

The current live data shows the system is doing more than storing a hearing row.

What it is doing well:

- It created a specific session for the April 1, 2026 Business & Commerce hearing.
- It pulled in official agenda and video links.
- It auto-ingested the transcript repeatedly.
- It generated topic-level coverage and post-hearing recommendations.
- It produced a focused brief on `grid reliability`.

Examples from the live recap:

- Ratepayer Impact dominated the hearing.
- Grid Reliability and Utility Regulation surfaced as major issue buckets.
- The recap produced follow-up actions, including member-specific response guidance.

That is exactly the sort of product moment that can stand out against conventional track/report systems.

## Biggest risks and weaknesses

### 1. Entity resolution quality is still the top trust risk

The live Business & Commerce data also shows the biggest current weakness:

- `Senator Shortner` appears instead of `Charles Schwertner`
- `Senator Higinbou` appears unmatched
- `Business & Commerce` itself is being treated as an entity/witness/legislator in places

This is the main thing that can make a smart system feel untrustworthy to experienced operators. The insight layer is only as credible as the speaker and entity matching underneath it.

### 2. Product sprawl

The app currently exposes a lot of surfaces in navigation:

- intelligence
- power network
- calendar
- committee intel
- matters
- alerts
- review
- issue rooms
- watchlists
- stakeholders
- briefs
- client alerts
- weekly reports
- hearing memo
- sources
- analytics
- digest
- predictions
- session
- relationships

That is a lot of value, but it also makes the product feel broader than it is opinionated. The system needs a more obvious "golden path."

### 3. Deliverables are useful but still template-heavy

The deliverable pipeline is real and valuable, but the current output architecture still reads more like structured generated markdown than a premium briefing product. It needs stronger evidence presentation and more visible source-backed credibility.

### 4. Committee war-room workflow should be even more explicit

You already have the pieces:

- hearing
- transcript
- recap
- focused brief
- stakeholder records
- issue rooms

The next step is to package those into one obvious "committee war room" mode that makes the workflow feel unavoidable and premium.

## Competitive evaluation

### Against OpenGov

OpenGov is a stronger platform for government operations, finance, procurement, permitting, and administrative workflow. It is not the same product category when compared honestly.

You stand out when the pitch is:

- public affairs
- legislative intelligence
- committee monitoring
- stakeholder strategy
- client-ready lobbying deliverables

OpenGov wins on operational maturity and broad government software coverage.
You win on legislative and committee-centered government affairs work.

### Against Telicon / LegisOK

Telicon-style systems are strong at:

- search
- track
- report
- alerts
- committee schedules
- committee reports
- legislative process discipline

You stand out if your committee-intel workflow is trustworthy, because you are offering:

- transcript-driven hearing analysis
- issue-specific focused briefs
- stakeholder drill-through
- issue-room continuity
- client deliverable generation

Telicon still has the advantage anywhere the buyer most values search rigor, tracking reliability, and battle-tested daily workflow over richer intelligence layers.

### Against newer AI-native products

Newer AI-first systems tend to be strong at:

- recommendation feeds
- triage dashboards
- automated summaries
- assistant-style questioning

You stand out when you connect AI output to:

- a specific committee hearing
- named stakeholders
- follow-up tasks
- issue-room strategy
- client-facing work product

That is a better story for a lobbying shop than generic "AI on public data."

## Strategic recommendation

If you want this product to feel unmistakably special, the center of gravity should be:

`Committee hearing -> Committee war room -> Stakeholder pressure map -> Issue room -> Client output`

That should be the signature flow.

The Senate Business & Commerce session proves you already have the bones of that workflow.

## Highest-priority next moves

1. Fix committee-intel entity resolution before adding more intelligence layers.
2. Make committee war room a first-class workflow, not just a set of adjacent pages.
3. Add stronger evidence presentation to all generated outputs.
4. Reduce visible nav sprawl by grouping advanced tools behind clearer workflow stages.
5. Build committee-specific playbooks for high-value targets like Senate Business & Commerce.

## Relevant code references

- Navigation surface: `client-policy-intel/src/App.tsx`
- Committee-intel routes: `server/policy-intel/routes.ts`
- Committee-intel service: `server/policy-intel/services/committee-intel-service.ts`
- Deliverables pipeline: `server/policy-intel/services/deliverable-service.ts`
- Relationship intelligence: `server/policy-intel/services/relationship-intelligence-service.ts`
- Session lifecycle: `server/policy-intel/services/session-lifecycle-service.ts`

## External comparison references

- OpenGov Public Service Platform: https://opengov.com/products/the-public-service-platform/
- GovSignals Public Affairs: https://www.govsignals.ai/public-affairs
- Telicon / LegisOK public seminar material: https://dingo.telicon.com/OK/library/2024/SemAg2024.pdf
