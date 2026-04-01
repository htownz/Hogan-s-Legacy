#!/bin/sh
set -eu

echo "[policy-intel-migrate] starting guarded migration run"

if [ "${POLICY_INTEL_MIGRATION_APPROVED:-}" != "yes" ]; then
  echo "[policy-intel-migrate] blocked: set POLICY_INTEL_MIGRATION_APPROVED=yes after manual review"
  exit 1
fi

if [ -z "${POLICY_INTEL_BACKUP_ID:-}" ]; then
  echo "[policy-intel-migrate] blocked: set POLICY_INTEL_BACKUP_ID to a verified database backup/snapshot identifier"
  exit 1
fi

echo "[policy-intel-migrate] using backup reference: ${POLICY_INTEL_BACKUP_ID}"
echo "[policy-intel-migrate] running versioned migrations"
npm run db:migrate:policy-intel

echo "[policy-intel-migrate] migrations completed successfully"
