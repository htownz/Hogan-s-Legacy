# Hogan Legacy

Hogan Legacy is the transition repository for Grace & McEwan LLC's internal Texas-first policy intelligence operating system.

The repo still contains a large legacy civic-engagement monolith, but the active commercial product lane is the isolated policy-intel bounded context.

## Current product direction

- Internal lobbying and public-affairs workflow support
- Texas-first official-source monitoring
- Source-backed alerts, issue tracking, briefs, and weekly digest workflows
- Grace & McEwan as the design-center workspace

## Active implementation lane

Primary files and folders for new work:

- `server/policy-intel/`
- `shared/schema-policy-intel.ts`
- `drizzle.policy-intel.config.ts`
- `client-policy-intel/`
- `docker-compose.policy-intel.yml`
- `docker-compose.policy-intel.prod.yml`

Treat the rest of the legacy application as a parts bin unless a change is directly needed for the policy-intel product.

## Important environment note

Do not trust bundled `node_modules` from a zip snapshot or another machine.

- Always run a clean dependency install on the target machine/container.
- The policy-intel Docker flows in this repo are the canonical local runtime path.

## Local development

1. Copy `.env.policy-intel.example` to `.env.policy-intel`
2. Start the stack:

```bash
docker compose -f docker-compose.policy-intel.yml up --build
```

3. Open:

- UI: `http://localhost:5173`
- API health: `http://localhost:5050/health`
- API root: `http://localhost:5050/api/intel`
- Adminer: `http://localhost:8080`

The backend container waits for Postgres and pushes the policy-intel schema automatically during startup.

## Production-style local run

1. Copy `.env.policy-intel.prod.example` to `.env.policy-intel.prod`
2. Start the production-style stack:

```bash
docker compose --env-file .env.policy-intel.prod -f docker-compose.policy-intel.prod.yml up --build -d
```

Or use the npm runbook shortcuts:

```bash
npm run policy-intel:prod:up
npm run policy-intel:prod:ps
npm run policy-intel:prod:logs
npm run policy-intel:prod:migrate
npm run policy-intel:prod:down
```

## Validation commands

```bash
npm ci
npm run check
npm run build:policy-intel
npm run build
```

## Container vulnerability governance

The current policy-intel Docker images use the Node 22 Alpine line and can report a single upstream High CVE in scanner output.

- Temporary exception: `CVE-2026-33671`
- Exception file: `.trivyignore`
- Review cadence: weekly (or immediately after Node/Alpine base tag updates)
- Automated reminder: `.github/workflows/cve-review-reminder.yml` opens an issue when `.trivyignore` reaches its `Next review` date

CI now scans policy-intel container images and fails on new High/Critical findings outside the documented exception.

## What comes next

The next implementation phase is to turn the current monitoring scaffold into one end-to-end issue-room workflow:

`source ingest -> watchlist match -> reviewed alert -> issue room -> source-backed brief`

That work should stay inside the policy-intel bounded context and avoid expanding unrelated legacy product surfaces.