# Policy Market Audit

Date: 2026-04-06

Primary UI file:

- `client-policy-intel/src/pages/PolicyMarketPage.tsx`

Primary aggregate API:

- `GET /api/intel/premium/market/dashboard`

## Audit Goal

Map the current `Policy Market` page to:

- the product spec
- the April roadmap
- the live API surfaces already available in the repo

This document distinguishes between:

- `already wired`
- `partially wired`
- `available in backend but not surfaced clearly`
- `not wired yet`

## Current Page Shape

The current page already has the core flagship structure:

- hero band
- left rail
- center focus panel
- catalyst tape
- right rail action desk
- session pulse
- network pressure
- cross-links

This means the page is not an empty shell. It is already a meaningful first pass of the flagship.

## Current Data Contract

The page currently loads one aggregate payload from:

- `api.getMarketDashboard(workspaceId, ...)`

That endpoint resolves to:

- `GET /api/intel/premium/market/dashboard?workspaceId=...`

The backend aggregates these sources into one response:

- `getPredictionDashboard(workspaceId)`
- `getSessionDashboard(workspaceId)`
- `buildNetworkGraph(workspaceId, ...)`
- `buildWorkspaceDigestPayload(workspaceId, week)`
- `listCommitteeIntelSessions({ workspaceId, from })`
- workspace issue rooms

## What Is Already Wired

### 1. Market movers rail

Status: `already wired`

Current implementation:

- bill movers from prediction dashboard
- committee movers from committee-intel sessions
- issue pressure from issue rooms

Source data:

- `GET /api/intel/premium/predictions/dashboard`
- `GET /api/intel/committee-intel/sessions`
- `GET /api/intel/issue-rooms`

Assessment:

- The left rail is already behaving like a real market selector.
- This is one of the strongest existing pieces of the page.

### 2. Center panel / selected instrument focus

Status: `already wired`

Current implementation:

- prediction focus mode
- committee focus mode
- issue-room focus mode

Assessment:

- The core interaction model from the spec is already present.
- The page changes shape based on which rail item is selected.

### 3. Catalyst tape

Status: `already wired`

Current implementation combines:

- digest recent activities
- committee session updates
- session milestones

Source data:

- `GET /api/intel/workspaces/:id/digest`
- `GET /api/intel/committee-intel/sessions`
- `GET /api/intel/premium/session/dashboard`

Assessment:

- The catalyst concept is already live.
- It still behaves more like an activity stream than a fully ranked market catalyst ladder.

### 4. Action desk

Status: `already wired`

Current implementation:

- playbook suggestions change based on selected instrument
- actions link into specialist workflows

Assessment:

- The right-side desk exists and works as a navigation and workflow bridge.
- It is not yet a true execution rail with one-click mutation flows on the market screen itself.

### 5. Session pulse

Status: `already wired`

Source data:

- `GET /api/intel/premium/session/dashboard`

Assessment:

- This already gives the flagship screen a real legislative timing layer.
- It is one of the more differentiated supporting panels.

### 6. Network pressure

Status: `already wired`, but operationally fragile

Source data:

- `GET /api/intel/premium/relationships/network`

Assessment:

- The UI is present and the backend route exists.
- Product notes indicate the live database can still be missing `policy_intel_relationships`, so this section should be considered code-complete but environment-dependent.

## What Is Only Partially Wired

### 1. Digest

Status: `partially wired`

What the page currently uses:

- digest summary counts
- recent digest activities as catalysts

What is not yet strongly surfaced:

- grouped watchlist sections
- high-priority alert breakdown
- digest as a first-class briefing panel

Assessment:

- Digest is feeding the page, but not yet as an obvious operator-facing module.

### 2. Committee/hearing focus

Status: `partially wired`

What is present:

- committee-intel sessions
- hearing-backed summaries
- focus topics
- playbook links into committee workflows

What is not yet strongly surfaced:

- direct hearing list or hearing selector
- explicit hearing state separate from committee session state
- evidence drill-down from summary to key moment to transcript segment
- member pressure cards called out in the roadmap

Assessment:

- Committee intelligence is live, but the page still leans on session summaries instead of making the committee war-room experience unmistakable.

### 3. Alerts

Status: `partially wired`

What is present:

- digest alert counts
- pending review metrics
- issue-room and workflow references

What is not present on the page as a dedicated module:

- top live alerts
- high-signal ranked alert list
- direct alert impact block
- explicit alert queue panel

Assessment:

- Alerts influence the page indirectly today.
- The flagship should surface them more directly.

### 4. Issue rooms

Status: `partially wired`

What is present:

- issue-room rail
- issue-room focus mode
- cross-links

What is still light:

- evidence stack depth
- task status rollups
- source-backed escalation framing
- direct client-output actions from the selected issue room

Assessment:

- Issue rooms are visible on the flagship, but their operating weight still feels thinner than on the specialist pages.

## What Exists In Backend But Is Not Clearly Surfaced On The Market Page

### 1. Intelligence briefing

Status: `available in backend but not surfaced clearly`

Existing route:

- `GET /api/intel/intelligence/briefing`

Current page state:

- no explicit intelligence briefing module on `PolicyMarketPage`

Assessment:

- The roadmap explicitly calls for intelligence briefing in the flagship mix.
- The page should consume and display it directly instead of relying only on cross-links or adjacent pages.

### 2. Direct hearings endpoints

Status: `available in backend but not surfaced clearly`

Existing routes:

- `GET /api/intel/hearings`
- `GET /api/intel/hearings/this-week`
- `GET /api/intel/hearings/:id`

Current page state:

- the page uses committee sessions, not hearings as a first-class market instrument source

Assessment:

- For a true committee-day workflow, hearings should be visible directly, not only after committee-intel sessions already exist.

### 3. Focused brief and post-hearing recap flows

Status: `available in backend but not surfaced clearly`

Existing routes:

- `POST /api/intel/committee-intel/sessions/:id/focused-brief`
- `POST /api/intel/committee-intel/sessions/:id/post-hearing-recap`

Current page state:

- playbook language points toward these workflows
- the actual outputs are not embedded into the flagship panel

Assessment:

- These are high-value product moments and should be pulled closer to the selected committee instrument.

## What Is Not Wired Yet

### 1. Top bar controls from the spec

Status: `not wired yet`

Missing controls:

- workspace selector
- jurisdiction selector
- view mode selector
- horizon selector
- confidence mode selector

Assessment:

- The current page is locked to the default workspace and a fixed time window.
- This is acceptable for internal development but not for the finished flagship.

### 2. Business & Commerce preset

Status: `not wired yet`

The roadmap calls for a specific preset because it is the strongest current live proof point. That preset does not appear to be surfaced directly on the current page.

### 3. One-click operational mutations on the flagship page

Status: `not wired yet`

The page currently links to downstream screens, but it does not yet act like a true desk for:

- generating a client alert from the current context
- generating a hearing memo from the current context
- opening or creating an issue room inline
- creating tasks inline
- logging stakeholder actions inline

### 4. Strong evidence drill-down

Status: `not wired yet`

Still missing as a first-class experience:

- summary
- key moment
- segment
- source evidence chain

This is especially important for committee trust.

## Overall Assessment

The flagship is already farther along than the roadmap wording implies.

Best current strengths:

- clear market-terminal layout
- multi-instrument left rail
- committee-intel integration
- issue-room integration
- session and relationship overlays

Most important gaps for the next pass:

- surface intelligence briefing directly
- surface direct hearing context directly
- surface high-signal alerts more directly
- make committee evidence drill-down and member pressure more visible
- move action desk from navigation helper toward execution surface
