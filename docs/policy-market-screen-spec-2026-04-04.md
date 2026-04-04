# Policy Market Screen Spec

Date: 2026-04-04

## Product intent

The `Policy Market Screen` is the flagship surface for the product.

Its job is to make politics feel like a market without pretending politics is fully mechanical.

This screen should answer:

- what matters right now
- what is moving
- why it is moving
- who is moving it
- what the likely outcome is
- what we should do next

For a lobby firm, this should feel like:

- Bloomberg
- a committee war room
- a political risk desk
- a client-action terminal

all in one.

## Target users

Primary:

- lobby firms
- contract lobbyists
- senior account leads
- public affairs strategists

Secondary:

- in-house government affairs teams
- trade associations
- political intelligence researchers

## Core product promise

The screen should convert messy political process into five usable things:

1. `Instruments`
   Bills, hearings, committees, agencies, stakeholders, issue rooms, narratives

2. `Signals`
   Testimony, alerts, donor activity, calendars, transcripts, media, events, economic shifts, disasters

3. `Prices`
   Outcome odds, momentum, volatility, support depth, resistance depth

4. `Positions`
   Pass, kill, delay, amend, message-shift, coalition-build

5. `Trades`
   Meetings, briefs, testimony, amendments, memos, donor pressure, media strategy

## Screen structure

The `Policy Market Screen` should be a dense professional terminal, not a marketing dashboard.

### Top bar

Purpose:

- set workspace
- set jurisdiction
- set focus mode
- control time horizon

Controls:

- workspace selector
- jurisdiction selector
- view mode:
  - `all market`
  - `committee`
  - `bill`
  - `stakeholder`
  - `issue room`
- horizon:
  - `24h`
  - `72h`
  - `1 week`
  - `session-to-date`
- confidence mode:
  - `conservative`
  - `standard`
  - `aggressive`

### Left rail: market movers

Purpose:

- show what is actually moving right now

Cards:

- top bills by odds change
- top hearings by volatility
- top committees by signal density
- top stakeholders by influence movement
- top narratives by surge or collapse

Each row should show:

- instrument name
- current implied odds
- change from previous window
- volatility
- catalyst label
- confidence

Example:

- `SB 1421 | 64% pass | +11 pts | high vol | committee chair signal | 0.71 confidence`

### Center panel: selected instrument

This is the heart of the screen.

It changes depending on what the user clicks.

#### If selected object is a committee hearing

Show:

- committee name
- hearing status
- live or latest summary
- implied directional effect on tracked bills/issues
- issue pressure map
- key moments
- top witnesses
- top elected focus
- member pressure points
- recommended follow-up actions

This can already be partially powered by live committee-intel data.

#### If selected object is a bill

Show:

- current passage odds
- path stage
- expected next catalyst
- support depth
- resistance depth
- sponsor strength
- committee risk
- amendment risk
- timeline of odds changes
- linked hearing sessions
- linked issue rooms

#### If selected object is a stakeholder

Show:

- influence score
- relationship density
- committee footprint
- current alignment
- likely pressure sensitivity
- recent meetings/notes
- best action path

#### If selected object is an issue room

Show:

- status
- recommended path
- source-backed evidence stack
- open tasks
- top stakeholders
- linked alerts
- client-ready output actions

### Right rail: action desk

Purpose:

- convert intelligence into work

Actions:

- create client alert
- generate hearing memo
- generate weekly report
- generate focused committee brief
- open issue room
- add stakeholder note
- log meeting
- create task
- draft message/talking points
- add to watchlist

This rail should always feel one click away from execution.

### Bottom band: tape and catalysts

Purpose:

- make the system feel market-like

Two views:

1. `Political Tape`
   Chronological high-signal events

2. `Catalyst Ladder`
   Ranked upcoming events likely to move odds

Events include:

- hearing posted
- agenda updated
- transcript ingest spike
- witness anomaly
- donor move
- media surge
- executive statement
- disaster event
- economic shock
- committee substitute
- member absence

## Signature widgets

### 1. Implied odds card

This is the main visual object for bills, hearings, or issue rooms.

Must include:

- current odds
- last move
- confidence band
- volatility
- expected next move

Display example:

- `Pass odds: 62%`
- `Last 24h: +8`
- `Volatility: High`
- `Confidence band: 54-68`
- `Next likely move: committee questioning`

### 2. Support depth / resistance depth

This is the policy version of order book depth.

Support depth sources:

- sponsor strength
- aligned members
- allied stakeholders
- donor support
- positive witness/testimony balance
- executive or chair tailwinds

Resistance depth sources:

- committee opposition
- donor opposition
- organized stakeholder opposition
- adverse media
- procedural choke points
- adverse macro events

### 3. Catalyst engine

Every instrument should show:

- next scheduled catalyst
- hidden catalysts
- expired catalysts
- historical impact of similar catalysts

Examples:

- upcoming hearing
- deadline
- substitute rumor
- chair statement
- press conference
- fiscal note
- disaster response
- business backlash

### 4. Pressure map

This is the most valuable committee-specific object.

For each committee member:

- top issues they pressed on
- tone:
  - support
  - oppose
  - questioning
  - neutral
- speaking share
- witness attention
- likely persuasion angle

This is where the system becomes genuinely useful to a lobbyist.

### 5. Action recommendation engine

For the selected instrument, always show:

- `best next move`
- `backup move`
- `highest-risk move`
- `who to contact first`
- `what to say`
- `what evidence to cite`

This should never read like generic AI advice.
It should read like a staff director who knows the room.

## Data architecture for V1

The screen should launch with a `V1` that uses mostly existing data.

### V1 live-capable sources

- hearings
- committee-intel sessions
- committee-intel recap
- committee-intel focused brief
- alerts
- digest
- issue rooms
- stakeholder records
- meeting notes
- deliverable generation
- intelligence briefing

### V1 computed metrics

These can be derived without waiting for a full prediction engine:

- signal density
- issue momentum
- hearing intensity
- stakeholder engagement score
- committee pressure concentration
- event recency score
- action urgency score

### V1 odds approach

Since production predictions are not yet live, V1 should not fake a true probability model.

Use:

- `directional odds indicator`
- `bias`
- `confidence band`

Example:

- `Bullish`
- `Lean pass`
- `Confidence band: medium`

This is safer and more honest than pretending the blocked prediction layer is ready.

## V1.5 data expansion

Once infrastructure is fixed:

- prediction tables live
- relationships live
- session lifecycle live

Then add:

- real implied odds
- odds history chart
- relationship-weighted influence
- session phase modifiers
- bill-specific catalyst model

## V2 outside-the-box layer

### Narrative arbitrage

Detect gaps between:

- media narrative
- committee behavior
- donor behavior
- likely actual outcome

### Political volatility

A volatility score driven by:

- issue salience
- event density
- coalition instability
- time-to-deadline
- chair uncertainty

### Scenario lab

Let firms run:

- what if member X flips
- what if witness Y lands
- what if a disaster reprioritizes the agenda
- what if donor opposition emerges

### Dark pool detector

Detect silent movement:

- unusual calendar changes
- weird witness patterns
- donor clustering
- sudden coalition overlap

## Current implementation constraints

The screen should explicitly respect current reality.

### Strong live components

- committee intel
- digest
- deliverables
- intelligence hub
- stakeholder operations

### Blocked live components

- predictions
- relationships graph
- session lifecycle premium flows

These are currently blocked by missing DB relations in the running environment and should be labeled internally as not yet market-grade.

## UX principles

1. Dense, not cluttered
2. Evidence before vibes
3. Confidence, never fake certainty
4. Actions always visible
5. Texas-first political language
6. Zero fluff

## Success metrics

The screen is successful if users can answer these within 60 seconds:

- what is moving
- why it is moving
- who matters
- what to do next
- what to tell the client

## Recommended build sequence

1. `V1`
   Committee-centric market screen with live data already available

2. `V1.5`
   Real odds once prediction infrastructure exists

3. `V2`
   Scenario lab, narrative arbitrage, dark pool detection

## Final framing

This screen should feel like:

- a trading screen for legislative outcomes
- a war room for high-value hearings
- a command center for firms that make money by being early and being right

That is the flagship.
