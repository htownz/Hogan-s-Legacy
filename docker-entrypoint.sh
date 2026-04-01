#!/bin/sh
set -e

echo "[policy-intel] waiting for postgres to accept connections..."
until pg_isready -h postgres -U postgres -d actup_policy_intel -q; do
  sleep 1
done
echo "[policy-intel] postgres ready"

exec "$@"
