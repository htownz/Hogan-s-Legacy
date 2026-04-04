# Policy Market Screen Layout

Primary file:
- `client-policy-intel/src/pages/PolicyMarketPage.tsx`

Route:
- `/market`

## Screen Thesis
The page is designed as a political market terminal, not a report page.

Desktop layout:
- Left rail: ranked movers and selectable instruments
- Center rail: selected instrument focus and evidence stack
- Right rail: action desk, session pressure, and network pressure
- Bottom center tape: catalysts across digest, committee, and session timelines

Mobile layout:
- Single-column stack with the same sections collapsed into one flow
- The core focus panel remains readable before drilling into specialist pages

## Component Hierarchy
- `PolicyMarketPage`
- `Panel`
- `TonePill`
- `MetricCard`
- `ProgressBar`
- `EmptyPanelState`
- `RailItem`
- `FocusHero`
- `FocusDetail`
- `buildPlaybook()`

## Data Sources Used In V1
- `GET /api/intel/premium/predictions/dashboard`
- `GET /api/intel/premium/session/dashboard`
- `GET /api/intel/premium/relationships/network`
- `GET /api/intel/workspaces/:workspaceId/digest`
- `GET /api/intel/committee-intel/sessions`
- `GET /api/intel/issue-rooms`

## Exact Regions
- Hero band:
  - market identity
  - refresh action
  - top metrics for tracked instruments, catalysts, network edges, and action queue
- Left rail:
  - `Market Movers`
  - `Committee Tape`
  - `Issue Pressure`
- Center rail:
  - `Instrument Focus`
  - prediction mode: probability, confidence, sponsor strength, committee alignment, support/opposition signals, risks, historical comps
  - committee mode: hearing readout, focus topics, interim charges, agenda/video/notes
  - issue room mode: thesis, recommended path, digest pressure, session overlay, related bills
  - `Catalyst Tape`
- Right rail:
  - `Action Desk`
  - `Session Pulse`
  - `Network Pressure`
  - `Cross-Links`

## Interaction Model
- Any row in the left rail becomes the selected market instrument.
- The center rail changes shape based on instrument type.
- The right rail changes its recommended playbook based on the same selection.
- Specialist pages remain the source of truth for editing and deep operations.

## Why This Matters
This is the first screen in the product that makes bills, hearings, and issue rooms behave like market instruments with:
- implied odds
- catalysts
- pressure context
- operator actions
- cross-linked specialist workflows
