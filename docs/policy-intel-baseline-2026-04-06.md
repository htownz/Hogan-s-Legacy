# Policy Intel Baseline

Date: 2026-04-06

## Purpose

This document is the working baseline for the active `policy-intel` product inside this repository.

Use it to answer three questions quickly:

1. What is the active product lane?
2. Where should we edit and save files?
3. What rules should we follow so future sessions do not drift?

## Active Product Lane

The active bounded context for new work is:

- `server/policy-intel/`
- `client-policy-intel/`
- `shared/schema-policy-intel.ts`
- `migrations/policy-intel/`
- `docker-compose.policy-intel.yml`
- `.devcontainer/devcontainer.json`

Treat the rest of the legacy repo as reference material unless a bridge or compatibility change is explicitly required.

## What The Product Already Contains

The current `policy-intel` product is already broader than a thin prototype.

Backend capabilities already exist for:

- workspaces
- watchlists
- source documents
- alerts
- briefs
- issue rooms
- stakeholders
- hearing and calendar data
- committee intelligence sessions
- digest generation
- client alerts
- weekly reports
- hearing memos
- premium predictions
- relationship intelligence
- session lifecycle
- client actions

Frontend navigation already exposes:

- `Dashboard`
- `Policy Market`
- `Intelligence Hub`
- `Power Network`
- `Calendar`
- `Committee Intel`
- `Matters`
- `Alert Queue`
- `Issue Rooms`
- `Watchlists`
- `Stakeholders`
- `Briefs`
- `Client Alert`
- `Weekly Report`
- `Hearing Memo`
- `Digest`
- `Predictions`
- `Session`
- `Relationships`

That means this repo is best understood as a Texas-first government-affairs operating system in progress, not just a tracker or a landing page.

## Texas-First Scope

Texas-specific infrastructure already exists in code.

Key examples:

- `server/policy-intel/connectors/texas/tlo-rss.ts`
- `server/policy-intel/connectors/texas/legiscan.ts`
- `server/policy-intel/connectors/texas/tec-filings.ts`
- `server/policy-intel/connectors/texas/houston-council.ts`
- `server/policy-intel/connectors/texas/harris-county.ts`
- `server/policy-intel/connectors/texas/metro-board.ts`
- `server/policy-intel/jobs/run-tlo-rss.ts`
- `server/policy-intel/scheduler.ts`

The current strategic center of gravity is:

`Committee hearing -> committee intelligence -> issue room -> client output`

## Canonical Editing And Save Path

Inside the dev container, the canonical workspace is:

- `/workspace`

This is not a second copy of the repo.

`docker-compose.policy-intel.yml` bind-mounts the repository root into `/workspace`, and `.devcontainer/devcontainer.json` also uses `/workspace` as the workspace folder. Saving files in the container saves files in the repo checkout.

## Source Of Truth Rules

Going forward:

- Edit only inside `/workspace`.
- Treat the repo checkout as the source of truth.
- Treat container `node_modules` as disposable runtime state, not as the source of truth.
- Prefer changes inside the `policy-intel` bounded context over broad legacy-app edits.
- Use the roadmap and current code together; some older docs understate how much is already implemented.

## Git Working Rules

Default workflow for now:

- work locally first
- do not commit unless explicitly requested
- do not push unless explicitly requested

Current git context at the time of this baseline:

- branch: `master`
- tracked remote branch: `origin/master`
- remote: `https://github.com/htownz/Hogan-s-Legacy.git`

If pushes fail, the most likely problem is authentication or credentials for the HTTPS remote, not file saving inside the container.

## Known Sources Of Confusion

### 1. Docs drift

Some project docs still describe the product like a smaller scaffold, but the codebase already includes substantial UI and premium workflow infrastructure.

### 2. Container dependencies

The source tree is shared between host and container, but `node_modules` is intentionally handled differently in container flows. Do not use dependency-folder differences as evidence that source files are not saving correctly.

### 3. Too many visible surfaces

The product already has many pages, but not all are equally central. This makes it easy to lose the main workflow.

## Current North Star

The flagship surface should be the `Policy Market` page, supported by the strongest differentiated workflow in the product:

- committee intelligence
- hearing monitoring
- issue-room operations
- evidence-backed outputs

That should be the main path used to evaluate future work.
