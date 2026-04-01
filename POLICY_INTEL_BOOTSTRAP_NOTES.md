# Policy Intel Bootstrap Notes

This starter keeps the legacy ActUp repo intact while carving out a clean local development lane for the new Federal + Texas policy-intelligence product.

## Included in this bootstrap

- `server/policy-intel/` isolated Express service
- `shared/schema-policy-intel.ts` clean Drizzle schema for the new product
- `drizzle.policy-intel.config.ts` separate schema-push config
- `Dockerfile.dev` local Node container
- `docker-compose.policy-intel.yml` app + Postgres + Adminer stack
- `.devcontainer/devcontainer.json` VS Code container workflow
- `.env.policy-intel.example` local environment template
- `docs/POLICY_INTEL_LOCAL_DEV.md` operator guide

## Why this path

The current app is too coupled to Replit-era assumptions and loads many optional modules at startup. This bootstrap gives you a safe build lane focused on:

- U.S. federal government
- Texas state government
- watchlists
- alerts
- evidence
- briefs
- jobs

## First commands

```bash
# optional if you want custom keys
cp .env.policy-intel.example .env.policy-intel
docker compose -f docker-compose.policy-intel.yml up --build
```

The backend container now waits for Postgres before service startup.

Schema changes should be applied via explicit migration jobs:

```bash
npm run db:migrate:policy-intel
```

Production-style migrations are guarded and require both:

- `POLICY_INTEL_MIGRATION_APPROVED=yes`
- `POLICY_INTEL_BACKUP_ID=<backup-or-snapshot-id>`

## First URLs

- `http://localhost:5173`
- `http://localhost:5050/health`
- `http://localhost:5050/api/intel`
- `http://localhost:8080`

## Suggested next coding story

Implement one source-backed issue-room workflow inside the policy-intel bounded context:

1. ingests one official Texas source item
2. stores it in `policy_intel_source_documents`
3. matches one watchlist deterministically
4. creates one alert with reasons
5. promotes that alert into an issue room with linked evidence
