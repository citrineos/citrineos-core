#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0
#
# capture-diagnostics.sh [OUT_DIR] -- dump the mock's trace/findings/state and
# the compose logs so a failed live run can be read from the artifact alone.
# Never fails: every step is best effort. Run from the repo root.
#
#   MOCK_BASE   default http://127.0.0.1:8083
#   COMPOSE     default: both files + ocpi profile
#   COMPOSE_SERVICES  services to log, default "citrine citrineos-ocpi graphql-engine"
set -uo pipefail

out="${1:-apps/mock-msp/reports}"
base="${MOCK_BASE:-http://127.0.0.1:8083}"
COMPOSE="${COMPOSE:-docker compose -f docker-compose.yml -f docker-compose.local.yml --profile ocpi}"
services="${COMPOSE_SERVICES:-citrine citrineos-ocpi graphql-engine}"
mkdir -p "$out"

hdr=()
[ -n "${MOCK_MSP_CONTROL_SECRET:-}" ] && hdr=(-H "x-mock-control-secret: $MOCK_MSP_CONTROL_SECRET")

grab() {
  curl -fs --max-time 20 "${hdr[@]}" "$base/_mock/$1" -o "$out/$2" 2>/dev/null \
    && echo "captured $2" || echo "skipped $2"
}
grab 'exchanges?limit=10000' exchanges.json
grab findings findings.json
grab coverage coverage.json
grab state state.json
grab faults faults.json
grab 'status?fresh=1' status.json
grab health health.json

if command -v docker >/dev/null 2>&1; then
  # shellcheck disable=SC2086
  # bounded: a debug-level run with hasura query logging produces a log big
  # enough to time the upload out, which is exactly when we need it
  $COMPOSE logs --no-color --timestamps --tail 2000 $services >"$out/compose.log" 2>&1 || true
  docker ps -a >"$out/docker-ps.txt" 2>&1 || true
fi
df -h / >"$out/df.txt" 2>&1 || true
echo "capture-diagnostics: wrote $out"
