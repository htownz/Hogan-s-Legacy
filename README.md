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

**Environment file (important):** Docker Compose reads **only** `.env.policy-intel`. The `.example` file is a safe template with no secrets. Putting API keys in `*.example` does not configure the app and risks leaking credentials if that file is committed.

1. Create your local env file (once): `npm run policy-intel:env`  
   This copies `.env.policy-intel.example` → `.env.policy-intel` if the latter does not exist.
2. Edit **`.env.policy-intel`** and set at least:
   - `OPENAI_API_KEY` (committee transcription, etc.)
   - `ANTHROPIC_API_KEY` (LLM-enhanced briefs)
   - `LEGISCAN_API_KEY` (Texas bills)
   - `OPENSTATES_API_KEY` (OpenStates-backed imports)
3. Leave `POLICY_INTEL_API_TOKEN` empty for local dev unless you want to test bearer auth.
4. Start the stack:

```bash
docker compose -f docker-compose.policy-intel.yml up --build
```

3. Open:

- UI: `http://localhost:5173`
- API health: `http://localhost:5050/health`
- API root: `http://localhost:5050/api/intel`
- Adminer: `http://localhost:8080`

The backend container waits for Postgres before service startup.
The dev stack no longer auto-runs schema changes during startup, so a destructive Drizzle prompt cannot block the backend or devcontainer from loading.

If you need to create or reconcile the local schema, run:

```bash
docker compose -f docker-compose.policy-intel.yml run --rm policy-intel-migrate
```

This dev helper now runs the checked-in versioned policy-intel migrations from your current workspace.

## Main App to Policy Intel Bridge

The legacy main app now exposes integration bridge endpoints that proxy key policy-intel signals:

- `GET /api/integrations/policy-intel/status`
- `GET /api/integrations/policy-intel/briefing`
- `GET /api/integrations/policy-intel/automation/status`
- `GET /api/integrations/policy-intel/automation/jobs`
- `GET /api/integrations/policy-intel/automation/events`
- `POST /api/integrations/policy-intel/automation/intel-briefing/run`
- `POST /api/integrations/policy-intel/automation/jobs/:jobName/run`

Automation trigger options:

- `force=true` in JSON body or query string bypasses cooldown checks for the selected job.

Automation events endpoint query params:

- `limit` (optional, default server-side limit)
- `jobs` (optional, comma-separated job names)
- `status` (optional: `all`, `success`, `error`; default `all`)

Set these environment variables in the main app runtime when connecting to a separate policy-intel service:

- `POLICY_INTEL_INTERNAL_URL` (default: `http://localhost:5050`)
- `POLICY_INTEL_REQUEST_TIMEOUT_MS` (optional, default: `12000`)
- `POLICY_INTEL_API_TOKEN` (required when policy-intel auth is enabled)
- `POLICY_INTEL_STATUS_CACHE_TTL_MS` (optional, default: `30000`)
- `POLICY_INTEL_BRIEFING_CACHE_TTL_MS` (optional, default: `60000`)
- `POLICY_INTEL_AUTOMATION_CACHE_TTL_MS` (optional, default: `15000`)
- `POLICY_INTEL_AUTOMATION_EVENTS_CACHE_TTL_MS` (optional, default: `15000`)
- `POLICY_INTEL_AUTOMATION_TRIGGER_COOLDOWN_MS` (optional, default: `120000`)

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

Production migration runs are guarded and require:

- `POLICY_INTEL_MIGRATION_APPROVED=yes`
- `POLICY_INTEL_BACKUP_ID=<verified-backup-or-snapshot-id>`

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

Workflow safety is additionally enforced by `.github/workflows/workflow-lint.yml`, which lint-checks all workflow files on push and pull request.

## What comes next

The next implementation phase is to turn the current monitoring scaffold into one end-to-end issue-room workflow:

`source ingest -> watchlist match -> reviewed alert -> issue room -> source-backed brief`

That work should stay inside the policy-intel bounded context and avoid expanding unrelated legacy product surfaces.
