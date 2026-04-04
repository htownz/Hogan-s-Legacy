# Product Evaluation and Market Thesis

Date: 2026-04-04

## Product thesis

The right product is not "AI for politics."

The right product is:

`A Texas-first market intelligence terminal for government affairs operators.`

That means:

- outcome odds
- money and influence mapping
- committee and stakeholder pressure analysis
- action recommendations
- client-ready outputs
- customization for the operating rhythm of lobby firms

If Bloomberg made a politics terminal for firms trying to pass or kill legislation, this is the lane.

## Current feature evaluation

### 1. Calendar and hearing tracking

Status: strong

What works now:

- hearing calendar is live
- committee hearing detail exists
- Senate Business & Commerce hearing exists in the live system
- hearing memo generation works from live hearings

What it means:

- this is already better than generic bill dashboards because hearings are where a lot of real signal starts to matter

Enhancements:

- pre-hearing "market open" card for every major hearing
- implied odds shift once an agenda posts, witnesses register, substitutes appear, or a chair signals intent
- volatility meter for each hearing based on agenda changes, member participation, public interest, and sponsor behavior

Outside-the-box idea:

- `Committee Tape`
- a ticker-like interface that shows hearings minute-by-minute like market tape with issue momentum, who is speaking, and real-time odds changes

### 2. Committee Intel

Status: best feature in the product

What works now:

- committee-intel sessions are real live objects
- sessions can be created from hearings
- sessions support transcript sync, manual segments, analysis, rebuild, focused briefs, and post-hearing recap
- the live Senate Business & Commerce session has over 10,000 tracked transcript segments and generated recap/brief output

Why it stands out:

- this is the clearest non-commodity feature in the product
- it is operational, not decorative

Weakness:

- entity resolution and speaker matching are still too noisy for fully trusted high-stakes use
- examples from the live system show malformed or unmatched speaker names

Enhancements:

- better speaker identity resolution using committee rosters, invited witness lists, known legislator alias maps, and phonetic matching
- committee member "pressure maps" showing what each member seems to care about most
- amendment/surrogate/substitute watch
- hearing-to-follow-up workflow that auto-builds tasks, member targets, and talking points

Outside-the-box idea:

- `Committee War Room`
- one screen with transcript, live issue moves, witness leaderboard, member pressure map, odds changes, and instant client talking points

### 3. Watchlists and alerts

Status: solid foundation, not yet elite

What works now:

- watchlists are live
- alerts feed digest and deliverables
- scheduler and ingest jobs exist

Weakness:

- current alerting still reads more like a structured monitoring product than a predictive trading system
- relevance is present, but not yet an "alpha" experience

Enhancements:

- event impact scoring
- alert importance based on historical downstream effect, not just keyword/rule match
- committee-specific risk flags
- "dark horse" alerting when a low-noise event historically precedes a major move

Outside-the-box idea:

- `Political Alpha Feed`
- a ranked stream of events with labels like `quiet accumulation`, `chair signal`, `opposition formation`, `late-session squeeze`, `media head fake`

### 4. Stakeholders, observations, and meeting notes

Status: strong operational foundation

What works now:

- stakeholder records exist
- observations and meeting notes exist
- full stakeholder pages exist
- stakeholder-to-bill and stakeholder-to-issue-room flows exist

Why it matters:

- this is the CRM layer that makes the product usable by real firms rather than researchers

Weakness:

- still more like structured notes than a true political edge engine

Enhancements:

- stakeholder reliability scoring
- responsiveness scoring
- influence by venue: committee, floor, agency, donor, media, caucus
- contact memory and persuasion patterning
- "what has worked on this person before" summaries

Outside-the-box idea:

- `Stakeholder Options Chain`
- each stakeholder gets a profile of likely movement under different triggers: donor pressure, district issues, caucus pressure, business backlash, media scrutiny, executive signal

### 5. Issue rooms, matters, and briefs

Status: very strong for firm workflow

What works now:

- issue rooms are live and linked to alerts, strategy options, tasks, stakeholders, and source docs
- brief generation works
- client alert generation works
- weekly report generation works
- hearing memo generation works

Why it matters:

- this is the operational bridge from intelligence to client work product

Weakness:

- outputs are useful but still template-heavy
- they need more evidence hierarchy, sharper audience adaptation, and stronger strategic tone control

Enhancements:

- memo styles by firm, client, issue, and urgency
- "board-ready", "lobbyist-ready", "GC-ready", "CEO-ready" output modes
- argument testing against likely opposition
- cite-locked evidence blocks
- comms and testimony drafting linked to the same evidence trail

Outside-the-box idea:

- `Auto Chief of Staff`
- every issue room gets a continuously updated recommended path, next actions, draft messaging, and escalation triggers

### 6. Digest and intelligence hub

Status: live and promising

What works now:

- digest works
- intelligence briefing endpoint is live
- intelligence hub is generating substantial output
- live system returned 60 insights and 34 anomalies in under 3 seconds

Weakness:

- "lots of insights" is not the same as decision advantage
- it needs stronger prioritization and more direct ties to action

Enhancements:

- decision-first briefing modes
- one-click "what do I do before noon?"
- confidence-adjusted insight ranking
- "if this were my client, what would I tell them now?" mode

Outside-the-box idea:

- `Political Regime Dashboard`
- detect when the operating environment has shifted from normal process to crisis politics, donor politics, governor-driven politics, disaster politics, or media-surge politics

### 7. Power network

Status: compelling concept, needs live reliability

What works now:

- the page exists
- the conceptual model is right
- this is one of the most differentiated feature families if it becomes real

Current live problem:

- the live relationships endpoint is blocked because `policy_intel_relationships` does not exist in the running database

What that means:

- this is not production-real yet even if the UX is present

Enhancements:

- donor -> lobbyist -> caucus -> committee -> bill influence chains
- hidden coalition mapping
- district pressure overlays
- committee chair dependency analysis
- ally/adversary cluster drift over time

Outside-the-box idea:

- `Influence Order Book`
- a market-style ladder showing where support, resistance, leverage, and pressure are concentrated by member, donor, media actor, and institutional player

### 8. Predictions

Status: vision is right, live implementation is blocked

What works now:

- prediction UI exists
- prediction concept is on-strategy

Current live problem:

- the live predictions dashboard fails because `policy_intel_passage_predictions` does not exist in the running database

What that means:

- today this is not a real product capability in the running environment

Enhancements:

- conservative probability scoring first
- event-driven re-rating model
- confidence intervals, not fake precision
- committee-specific win odds
- amendment risk
- delay risk
- "sponsor quality" and "coalition durability" indexes

Outside-the-box idea:

- `Policy Market Screen`
- every tracked bill gets:
  - current implied odds
  - momentum
  - support depth
  - resistance depth
  - event catalysts
  - volatility
  - expected next move

### 9. Session lifecycle

Status: excellent concept, not live in current DB

What works now:

- session management architecture is smart and aligned with real lobbying workflow
- committee-hearing phase logic is especially valuable

Current live problem:

- the live session dashboard fails because `policy_intel_legislative_sessions` does not exist in the running database

What that means:

- this is also aspirational until migrations are applied and real data is loaded

Enhancements:

- session phase change alerts
- deadline squeeze forecasting
- "what matters this week" planner for each client
- phase-specific playbooks by firm practice area

Outside-the-box idea:

- `Legislative Seasonality Engine`
- politics as a recurring market with seasonal patterns, deadline effects, fiscal cycles, election-year distortions, and crisis overlays

### 10. Relationships and premium dossiers

Status: high upside, currently blocked live

What works now:

- the service design is exactly right for lobby firms
- dossier thinking is strong

Current live problem:

- the live endpoint fails because `policy_intel_relationships` does not exist

Enhancements:

- relationship confidence
- freshness scores
- evidence-backed edge scoring
- "who can move whom"
- influence chain simulation

Outside-the-box idea:

- `Shadow Governance Map`
- a ranked graph of who actually influences issue outcomes behind the formal process

## What is strongest today

1. Committee Intel
2. Issue rooms + briefs/memos
3. Stakeholder ops layer
4. Digest + intelligence hub
5. Hearing workflow

## What is weakest today

1. Predictions are not live due to missing DB relation
2. Session lifecycle is not live due to missing DB relation
3. Relationships/power graph are not live due to missing DB relation
4. Entity resolution inside committee intel still weakens trust
5. Alerting is useful but not yet "market-grade"

## The real opportunity

You do not need to be "another legislative tracker."

You should become:

`the terminal where public-affairs operators price political outcomes`

That means the product eventually revolves around five core objects:

1. Instruments
   Bills, hearings, committees, agencies, stakeholders, narratives, issue rooms

2. Prices
   Implied odds, movement risk, coalition strength, opposition depth, volatility

3. Signals
   Testimony, contributions, calendars, media, social networks, district events, economic shocks, disasters, executive actions

4. Positions
   Pass, kill, delay, amend, neutralize, coalition-build, narrative-shift

5. Trades
   Meetings, testimony, pressure campaigns, memos, donor alignment, media strategy, amendment drafting

## Best outside-the-box product ideas

### Political Bloomberg Terminal

One screen:

- live odds
- issue movers
- committee tape
- stakeholder order book
- narrative volatility
- top anomalies
- next catalyst

### Policy Quant Lab

Advanced sandbox where a firm can run:

- what if this donor moves
- what if this chair posts late
- what if a disaster shifts salience
- what if media spikes
- what if an agency letter drops

### Legislative Options Desk

Every bill gets structured strategic paths:

- aggressive push
- quiet coalition
- amendment-first path
- procedural kill path
- delay path
- message-war path

Each path gets estimated odds, required moves, and known risk points.

### Narrative Arbitrage Engine

Detect when:

- public framing says one thing
- donor behavior says another
- committee behavior says another
- actual likely outcome says another

This becomes a major premium feature.

### Influence VaR

Borrowed from finance:

- "Value at Risk" becomes "Influence at Risk"
- how likely is a client's position to lose ground in the next 72 hours?
- where is exposure concentrated?

### Political Dark Pool Detector

When quiet movement is happening without obvious public narrative:

- sudden donor alignment
- calendar shifts
- witness registration patterns
- committee substitutions
- unusual meeting clustering

That is alpha if you can surface it correctly.

## Recommendation for next build order

1. Make predictions, session lifecycle, and relationships real by fixing missing schema/migrations.
2. Harden entity resolution and credibility in Committee Intel.
3. Build a single flagship screen: Committee War Room or Policy Market Screen.
4. Add event-driven probability movement, not static prediction.
5. Add customizable firm modes and output styles.
6. Add scenario simulation and recommended action flows.

## Final view

The product already has the bones of something special.

The core insight is this:

It becomes truly differentiated when it stops acting like a database with AI attached and starts acting like a market terminal for political outcomes.

That future is not fantasy. The committee-intel work proves you already have the right center of gravity.
