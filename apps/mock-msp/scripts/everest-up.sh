#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

# ============================================================================
# FILE: apps/mock-msp/scripts/everest-up.sh
#
# Bring the EVerest SIL simulator up as the CPO-side charger for the OCPI stack,
# so the mock eMSP's OCPI commands reach a live station (cp001) instead of
# REJECTing on "Charging station is offline".
#
#   apps/mock-msp/scripts/everest-up.sh
#
# What it does (ports the proven logic from
# apps/operator-ui/tests/e2e/fixtures/everest.ts):
#   1. docker compose up the everest project (manager / mqtt / nodered).
#   2. Patch the device-model profile to OCPP20 + pin the CSMS URL, for a tree
#      whose device model was baked at OCPP21. Default OCPP_VERSION here is
#      2.0.1: core will happily accept a 2.1 connection and record the station
#      as ocpp2.1, but OCPI only maps command handlers for ocpp1.6/ocpp2.0.1,
#      so a 2.1 station fails every command with "communication failed".
#   3. Wait until Hasura reports cp001 isOnline=true.
#
# Prereqs: the main OCPI stack must already be up (pnpm citrine --ocpi --local),
# so port 8081 (OCPP) and Hasura (8090) are listening.
# ============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
# shellcheck source=./demo-lib.sh
. "$SCRIPT_DIR/demo-lib.sh"

EVEREST_DIR="$REPO_ROOT/apps/ocpp-server/everest"
OCPP_VERSION="${OCPP_VERSION:-2.0.1}"
EVEREST_IMAGE_TAG="${EVEREST_IMAGE_TAG:-2025.6.1-dt-esdp}"
HASURA_URL="${CITRINE_HASURA_URL:-http://localhost:8090/v1/graphql}"
STATION="${EVEREST_STATION:-cp001}"
MANAGER="${EVEREST_MANAGER_CONTAINER:-everest-manager-1}"
DB="/ext/dist/share/everest/modules/OCPP201/device_model_storage.db"
CSMS_URL="ws://host.docker.internal:8081/${STATION}"
ONLINE_TIMEOUT="${EVEREST_ONLINE_TIMEOUT:-180}"

command -v docker >/dev/null 2>&1 || die "docker not found on PATH"
[ -d "$EVEREST_DIR" ] || die "everest dir not found: $EVEREST_DIR"

step 1 "Starting EVerest SIL (OCPP_VERSION=$OCPP_VERSION, tag=$EVEREST_IMAGE_TAG)"
( cd "$EVEREST_DIR" && OCPP_VERSION="$OCPP_VERSION" EVEREST_IMAGE_TAG="$EVEREST_IMAGE_TAG" \
  docker compose up -d ) || die "docker compose up failed"

step 2 "Patching device-model profile to OCPP20 (CitrineOS speaks 2.0.1)"
PROFILE_JSON='[{"configurationSlot":1,"connectionData":{"messageTimeout":30,"ocppCsmsUrl":"'"$CSMS_URL"'","ocppInterface":"Wired0","ocppTransport":"JSON","ocppVersion":"OCPP20","securityProfile":1}}]'

# Wait for libocpp to materialize the device-model DB. Use a read-only probe so a
# missing DB is never created as an empty file (an empty file at this path makes
# libocpp abort on its next boot).
# MSYS_NO_PATHCONV=1: on Git Bash the container-absolute DB path (/ext/...) is
# otherwise mangled into a Windows path (C:/Program Files/Git/ext/...) before
# docker exec forwards it, so sqlite inside the container can't open it.
current=""
for _ in $(seq 1 30); do
  current="$(MSYS_NO_PATHCONV=1 docker exec "$MANAGER" sqlite3 -readonly "$DB" \
    "SELECT VALUE FROM VARIABLE_ATTRIBUTE WHERE VARIABLE_ID = (SELECT ID FROM VARIABLE WHERE NAME='NetworkConnectionProfiles');" 2>/dev/null)" \
    && [ -n "$current" ] && break
  sleep 2
done

# CRITICAL: if the DB never materialized, DO NOT fall through to the write-mode
# UPDATE below — `sqlite3 "$DB"` on a missing path CREATES an empty file that makes
# libocpp crash-loop. Bail instead so the read-only-probe safety is never defeated.
[ -n "$current" ] || die "device-model DB not ready after 60s ($MANAGER: $DB). EVerest manager may still be booting or failed to start — check 'docker logs $MANAGER'."

if printf '%s' "$current" | grep -q "host.docker.internal:8081/${STATION}" \
   && printf '%s' "$current" | grep -q '"ocppVersion":"OCPP20"'; then
  ok "profile already OCPP20 + correct CSMS URL — no patch needed"
else
  printf "UPDATE VARIABLE_ATTRIBUTE SET VALUE='%s' WHERE VARIABLE_ID = (SELECT ID FROM VARIABLE WHERE NAME='NetworkConnectionProfiles');\n" \
    "$PROFILE_JSON" | MSYS_NO_PATHCONV=1 docker exec -i "$MANAGER" sqlite3 "$DB" || die "sqlite patch failed"
  docker restart "$MANAGER" >/dev/null || warn "manager restart returned nonzero"
  ok "patched profile to OCPP20 and restarted $MANAGER"
fi

step 3 "Waiting for $STATION to come online (isOnline=true, up to ${ONLINE_TIMEOUT}s)"
Q='{"query":"query{ChargingStations(where:{ocppConnectionName:{_eq:\"'"$STATION"'\"}}){isOnline}}"}'
deadline=$(( $(date +%s) + ONLINE_TIMEOUT ))
resp=""
while [ "$(date +%s)" -lt "$deadline" ]; do
  resp="$(curl -s -X POST "$HASURA_URL" -H 'content-type: application/json' -d "$Q" 2>/dev/null || true)"
  if printf '%s' "$resp" | grep -q '"isOnline":true'; then
    succeed "$STATION is online — OCPI START_SESSION will now reach a live charger"
  fi
  sleep 3
done
die "$STATION did not come online within ${ONLINE_TIMEOUT}s (last Hasura response: ${resp:-<none>})"
