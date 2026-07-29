#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

# ============================================================================
# FILE: apps/mock-msp/scripts/demo-seed.sh
#
# Seeds the running mock eMSP with a narrative-ordered burst of OCPI traffic so
# the dashboard (http://localhost:8083/) tells a story on screen.
#
#   *** WHAT THIS SCRIPT IS, SAID PLAINLY ***
#   This script PLAYS CITRINEOS'S ROLE. It is not CitrineOS. It is curl wearing
#   Citrine's hat: the same Authorization token, the same OCPI-from/to routing
#   headers, the same URLs Citrine's CPO client calls. The mock cannot tell the
#   difference -- it authenticates, validates and records this traffic exactly
#   as it would the real thing. When a real Citrine is pointed at the mock, what
#   lands on the dashboard is what you see here.
#
#   Every payload below was hand-authored for this demo. NONE of it was emitted
#   by CitrineOS. Where a payload imitates a real Citrine defect (step 4), that
#   is called out in the comment and the defect's provenance is stated: it was
#   found by a source-code audit using the mock's Zod oracle, NOT observed on
#   the wire. Do not let anyone leave the room thinking otherwise.
#
# USAGE
#   bash apps/mock-msp/scripts/demo-seed.sh [BASE_URL]
#   BASE=http://localhost:8083 bash apps/mock-msp/scripts/demo-seed.sh
#   STEP_DELAY=0 bash apps/mock-msp/scripts/demo-seed.sh   # no pauses (CI/verify)
#
# ENV
#   BASE / $1                 mock base url        (default http://localhost:8083)
#   STEP_DELAY                seconds between steps (default 1.2 -- the dashboard
#                             polls every 2s, so this fills it visibly)
#   MOCK_MSP_CLIENT_TOKEN     raw token the mock accepts inbound (default = the
#                             config bootstrap token the preregistered seed installs)
#   MOCK_MSP_CONTROL_SECRET   sent as x-mock-control-secret if the mock requires it
#
# WHAT IT PRODUCES (verified live on :8083)
#   7 inbound exchanges: 3 clean 1000s, 1 auth rejection (401/2002), 2 schema
#   drifts (validation.ok=false), 1 fault-stamped CDR forced to OCPI 3001.
#   -> 3 findings (1 auth + 2 body), 1 fault armed, 1 faulted exchange.
#
# DEPENDENCIES: bash + curl only. No jq (git-bash has no jq).
# ============================================================================
set -uo pipefail

# ---- resolve target + knobs -------------------------------------------------
BASE="${1:-${BASE:-http://localhost:8083}}"
BASE="${BASE%/}"
STEP_DELAY="${STEP_DELAY:-1.2}"
SECRET="${MOCK_MSP_CONTROL_SECRET:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCENARIO_FILE="$SCRIPT_DIR/../scenarios/preregistered.json"

# Identities. These mirror src/config.ts defaults, which mirror the seeded EMSP
# partner in apps/ocpi-server/seeders/20250806120002-default-tenant-partner.ts.
#   US/S44 = the CPO (Citrine)  -- whose role this script plays
#   US/TST = the eMSP (the mock) -- "TestMobilitySolutions"
CPO_CC="${MOCK_MSP_CPO_COUNTRY_CODE:-US}"
CPO_PARTY="${MOCK_MSP_CPO_PARTY_ID:-S44}"
MSP_CC="${MOCK_MSP_COUNTRY_CODE:-US}"
MSP_PARTY="${MOCK_MSP_PARTY_ID:-TST}"

# The token the mock accepts on inbound calls (registration.tokenWeAccept). The
# preregistered scenario installs config.bootstrapTokenWeAccept verbatim.
# On the wire OCPI carries it as `Token <base64(raw)>` -- src/core/auth.ts
# base64-DECODES inbound and compares the plaintext, mirroring Citrine's
# AuthMiddleware exactly. So we must base64-encode it here.
RAW_TOKEN="${MOCK_MSP_CLIENT_TOKEN:-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567}"
AUTH="Token $(printf '%s' "$RAW_TOKEN" | base64 | tr -d '\n')"
# A token the mock will NOT recognise, for the auth-rejection beat.
BAD_AUTH="Token $(printf '%s' 'not-the-token-you-are-looking-for' | base64 | tr -d '\n')"

TMP_BODY="$(mktemp 2>/dev/null || printf '/tmp/demo-seed-%s.json' "$$")"
trap 'rm -f "$TMP_BODY"' EXIT

# ---- output helpers (style matches demo-up.sh / demo-lib.sh) ----------------
STEP_N=0
FAILURES=0
say()  { printf '  %s\n' "$*"; }
ok()   { printf '  + %s\n' "$*"; }
warn() { printf '  ! %s\n' "$*" >&2; }
step() {
  STEP_N=$((STEP_N + 1))
  printf '\n[%d/7] %s\n' "$STEP_N" "$*"
}
pause() { [ "$STEP_DELAY" = "0" ] || sleep "$STEP_DELAY"; }

# check DESC ACTUAL EXPECTED -- records a failure but never aborts, so one bad
# step cannot rob the demo of the other six.
check() {
  if [ "$2" = "$3" ]; then
    ok "$1 = $2"
  else
    warn "$1 = '$2' (expected '$3')"
    FAILURES=$((FAILURES + 1))
  fi
}

# ---- json scraping without jq ----------------------------------------------
# Pulls the first "<key>": <number> out of a JSON blob. Sufficient here: we only
# ever read scalar status fields off small, flat control/envelope responses.
json_num() { printf '%s' "${2:-}" | grep -o "\"$1\"[[:space:]]*:[[:space:]]*-\?[0-9]\+" | head -1 | grep -o -- '-\?[0-9]\+$'; }
json_str() { printf '%s' "${2:-}" | grep -o "\"$1\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | head -1 | sed 's/.*:[[:space:]]*"//; s/"$//'; }
count_of() { printf '%s' "${2:-}" | grep -o "$1" | wc -l | tr -d ' '; }

# json_str takes the FIRST match, so it cannot read a nested key whose name is
# also used at the top level. /health has BOTH "status":"up" (top level) and
# "registration":{"status":"registered"} -- reading `status` naively yields "up".
# This reads the registration one specifically.
registration_status() {
  printf '%s' "${1:-}" | grep -o '"registration"[[:space:]]*:[[:space:]]*{[[:space:]]*"status"[[:space:]]*:[[:space:]]*"[^"]*"' |
    head -1 | sed 's/.*"status"[[:space:]]*:[[:space:]]*"//; s/"$//'
}

# ---- request helpers --------------------------------------------------------
reqid() { printf 'demo-seed-%s-%s' "$STEP_N" "${RANDOM}${RANDOM}"; }

# Flags on every curl call:
#   --ipv4  the mock binds 0.0.0.0 (IPv4 ONLY -- there is no [::]:8083 listener).
#           "localhost" on Windows resolves to ::1 first, so without this a call
#           can intermittently die with "Failed to connect to localhost port
#           8083". Observed exactly once during development; --ipv4 removes the
#           whole failure mode. Browsers fall back on their own, which is why the
#           dashboard at localhost:8083 is unaffected.
#   -m 10   never let a hung socket stall the demo.
CURL_COMMON=(-sS --ipv4 -m 10)

# mock METHOD PATH [BODY] -- hits the /_mock control API (plain JSON, not OCPI).
mock() {
  local method="$1" path="$2" body="${3:-}"
  local args=("${CURL_COMMON[@]}" -X "$method" -o "$TMP_BODY" -w '%{http_code}' -H 'Content-Type: application/json')
  [ -n "$SECRET" ] && args+=(-H "x-mock-control-secret: $SECRET")
  [ -n "$body" ] && args+=(--data-binary "$body")
  HTTP_CODE="$(curl "${args[@]}" "$BASE/_mock$path" 2>/dev/null)"
  RESP_BODY="$(cat "$TMP_BODY" 2>/dev/null)"
}

# ocpi_registration METHOD PATH [BODY] [AUTH]
# Registration endpoints (versions, credentials) take the token but NO OCPI
# routing headers -- src/core/routingHeaders.ts only strict-checks routing on
# functional routes. Citrine's version discovery looks exactly like this.
ocpi_registration() {
  local method="$1" path="$2" body="${3:-}" authv="${4:-$AUTH}"
  local args=("${CURL_COMMON[@]}" -X "$method" -o "$TMP_BODY" -w '%{http_code}'
    -H "Authorization: $authv"
    -H 'Content-Type: application/json'
    -H "X-Request-ID: $(reqid)"
    -H "X-Correlation-ID: $(reqid)")
  [ -n "$body" ] && args+=(--data-binary "$body")
  HTTP_CODE="$(curl "${args[@]}" "$BASE$path" 2>/dev/null)"
  RESP_BODY="$(cat "$TMP_BODY" 2>/dev/null)"
}

# ocpi_functional METHOD PATH [BODY] [AUTH]
# Functional endpoints demand the full four-header routing block, strictly
# checked: OCPI-from must be the CPO (US/S44), OCPI-to must be us (US/TST).
# Anything else is a 401 + a header Finding.
ocpi_functional() {
  local method="$1" path="$2" body="${3:-}" authv="${4:-$AUTH}"
  local args=("${CURL_COMMON[@]}" -X "$method" -o "$TMP_BODY" -w '%{http_code}'
    -H "Authorization: $authv"
    -H 'Content-Type: application/json'
    -H "X-Request-ID: $(reqid)"
    -H "X-Correlation-ID: $(reqid)"
    -H "OCPI-from-country-code: $CPO_CC"
    -H "OCPI-from-party-id: $CPO_PARTY"
    -H "OCPI-to-country-code: $MSP_CC"
    -H "OCPI-to-party-id: $MSP_PARTY")
  [ -n "$body" ] && args+=(--data-binary "$body")
  HTTP_CODE="$(curl "${args[@]}" "$BASE$path" 2>/dev/null)"
  RESP_BODY="$(cat "$TMP_BODY" 2>/dev/null)"
}

# ============================================================================
# PRE-FLIGHT
# ============================================================================
printf '=== mock-msp demo seed -> %s ===\n' "$BASE"
say "playing CitrineOS's role (US/S44) against the mock eMSP (US/TST)"
say "this is curl in Citrine's clothing -- see the header of this file"

# Retry briefly rather than failing on the first miss, so `demo-up.sh &&
# demo-seed.sh` cannot lose a race against the server finishing its bind.
for attempt in 1 2 3 4 5 6 7 8 9 10; do
  mock GET /health
  [ "$HTTP_CODE" = "200" ] && break
  [ "$attempt" = "1" ] && say "waiting for the mock to answer on $BASE ..."
  sleep 0.5
done
if [ "$HTTP_CODE" != "200" ]; then
  printf '\nFAILURE: no mock answering on %s/_mock/health (got HTTP %s).\n' "$BASE" "${HTTP_CODE:-000}" >&2
  printf 'Start it with: bash apps/mock-msp/scripts/demo-up.sh\n' >&2
  exit 1
fi
say "mock is up: $(json_str party "$RESP_BODY")/$(json_str role "$RESP_BODY")"

# ============================================================================
# STEP 0 -- clean slate (repeatable demo)
# ============================================================================
# reset wipes the recorder, domain state and armed faults. keepRegistration=true
# keeps us registered -- important, because with Docker down there is no Citrine
# to re-run the handshake against, so a lost registration cannot be restored.
#
# GOTCHA (verified in controlApi.ts:356-363): /_mock/reset ALSO calls
# resetScenarioRuntime(), which clears the active scenario. That blanks the
# dashboard's scenario badge (renderHeader emits "" when health.scenario is
# null) and makes POST /_mock/scenarios/:id/evaluate return 409 no_active_scenario.
# So we re-apply the preregistered scenario immediately after resetting. This
# leaves the mock exactly as MOCK_MSP_SCENARIO=scenarios/preregistered.json
# would have booted it.
printf '\n[0/7] reset -> clean slate (keepRegistration=true)\n'
mock POST /reset '{"keepRegistration":true}'
check 'reset http' "$HTTP_CODE" '200'

if [ -f "$SCENARIO_FILE" ]; then
  scn_args=("${CURL_COMMON[@]}" -X POST -o "$TMP_BODY" -w '%{http_code}' -H 'Content-Type: application/json')
  [ -n "$SECRET" ] && scn_args+=(-H "x-mock-control-secret: $SECRET")
  scn_args+=(--data-binary "@$SCENARIO_FILE")
  HTTP_CODE="$(curl "${scn_args[@]}" "$BASE/_mock/scenario" 2>/dev/null)"
  RESP_BODY="$(cat "$TMP_BODY" 2>/dev/null)"
  check 'scenario re-applied' "$(json_str applied "$RESP_BODY")" 'preregistered'
else
  warn "scenario file not found at $SCENARIO_FILE -- scenario badge will stay blank"
fi
pause

# ============================================================================
# STEP 1 -- version discovery: the version list
# ============================================================================
# The first thing any CPO does. Registration-scoped auth, no routing headers.
# Expect a clean OCPI 1000. On the dashboard: green http 200 + green ocpi 1000.
# The `valid` column shows a muted "—" and that is CORRECT, not a gap: a GET has
# no request body, so there is no requestSchema to check it against (dispatcher
# only sets ex.validation when route.requestSchema exists AND a body was sent).
step 'version discovery -- GET /ocpi/versions'
ocpi_registration GET /ocpi/versions
check 'http' "$HTTP_CODE" '200'
check 'ocpi status_code' "$(json_num status_code "$RESP_BODY")" '1000'
pause

# ============================================================================
# STEP 2 -- version discovery: the 2.2.1 endpoint catalog
# ============================================================================
step 'version discovery -- GET /ocpi/versions/2.2.1'
ocpi_registration GET /ocpi/versions/2.2.1
check 'http' "$HTTP_CODE" '200'
check 'ocpi status_code' "$(json_num status_code "$RESP_BODY")" '1000'
say "the mock advertised its eMSP endpoint catalog -- this is what Citrine reads"
pause

# ============================================================================
# STEP 3 -- the mock enforces auth
# ============================================================================
# A functional call carrying a token the mock does not accept. Expect HTTP 401
# + OCPI 2002 (ClientNotEnoughInformation) + an error Finding of kind 'auth'.
# This is the mock refusing to be a pushover: it is not a yes-machine that
# records whatever it is sent.
step 'unauthorized push -- PUT sessions with a token the mock does not accept'
ocpi_functional PUT "/ocpi/2.2.1/emsp/sessions/$CPO_CC/$CPO_PARTY/SESSION-DEMO-401" \
  '{"id":"SESSION-DEMO-401"}' "$BAD_AUTH"
check 'http' "$HTTP_CODE" '401'
check 'ocpi status_code' "$(json_num status_code "$RESP_BODY")" '2002'
say "-> dashboard: red 401, red 2002, an auth finding in the findings panel"
pause

# ============================================================================
# STEP 4 -- the happy path: a fully schema-valid Session
# ============================================================================
# Every field below satisfies the ocpi-base SessionSchema (the same Zod object
# Citrine itself parses with). Expect ✓ valid + green 1000 + zero findings, and
# the object lands in /_mock/state/sessions.
step 'happy path -- PUT a fully schema-valid Session'
ocpi_functional PUT "/ocpi/2.2.1/emsp/sessions/$CPO_CC/$CPO_PARTY/SESSION-DEMO-1" '{
  "country_code": "US",
  "party_id": "S44",
  "id": "SESSION-DEMO-1",
  "start_date_time": "2026-07-17T09:00:00.000Z",
  "kwh": 18.5,
  "cdr_token": {
    "uid": "04E7F5A2B37C80",
    "type": "RFID",
    "contract_id": "USTST-C-00042",
    "country_code": "US",
    "party_id": "TST"
  },
  "auth_method": "WHITELIST",
  "location_id": "LOC-DEMO-1",
  "evse_uid": "EVSE-DEMO-1",
  "connector_id": "1",
  "currency": "USD",
  "status": "ACTIVE",
  "last_updated": "2026-07-17T09:30:00.000Z"
}'
check 'http' "$HTTP_CODE" '200'
check 'ocpi status_code' "$(json_num status_code "$RESP_BODY")" '1000'
say "-> dashboard: green ✓ in the valid column. This is what conformance looks like."
pause

# ============================================================================
# STEP 5 -- schema drift: coordinates that fail the GeoLocation regex
# ============================================================================
# ---------------------------------------------------------------------------
# *** PROVENANCE -- SAY THIS OUT LOUD IF YOU SHOW THIS ROW ***
# The payload below is HAND-WRITTEN BY THIS SCRIPT. It did not come from
# CitrineOS. It is a deliberate IMITATION of a real defect found in Citrine's
# OCPI code, so the dashboard can show what catching that defect looks like.
#
# The real defect (found by a SOURCE-CODE AUDIT using this mock's Zod oracle --
# NOT observed on the wire, because that run has not happened yet):
# Citrine's LocationMapper emits coordinates by calling .toString() on a number.
# A latitude of 1.0 stringifies to "1.0" -- one fractional digit. The ocpi-base
# GeoLocationSchema (packages/ocpi-base/src/model/GeoLocation.ts) requires:
#     latitude:  /-?[0-9]{1,2}\.[0-9]{5,7}/    <- 5 to 7 fractional digits
#     longitude: /-?[0-9]{1,3}\.[0-9]{5,7}/
# so "1.0" fails the regex and the Location is rejected by the eMSP.
#
# Everything else in this payload is valid on purpose: the ONLY two Zod issues
# are latitude and longitude. That keeps the demo point unambiguous -- the mock
# is not saying "this is broken", it is saying "these two fields are broken, at
# these two paths, against this exact rule".
#
# The claim to make: "the mock WOULD catch this on the wire." Not "the mock DID
# catch Citrine doing this."
# ---------------------------------------------------------------------------
step 'schema drift -- PUT a Location whose coordinates fail the GeoLocation regex'
ocpi_functional PUT "/ocpi/2.2.1/emsp/locations/$CPO_CC/$CPO_PARTY/LOC-DEMO-1" '{
  "country_code": "US",
  "party_id": "S44",
  "id": "LOC-DEMO-1",
  "publish": true,
  "name": "Demo Depot",
  "address": "1 Market St",
  "city": "San Francisco",
  "postal_code": "94105",
  "state": "CA",
  "country": "USA",
  "coordinates": { "latitude": "1.0", "longitude": "2.0" },
  "time_zone": "America/Los_Angeles",
  "last_updated": "2026-07-17T09:30:00.000Z"
}'
# Record-and-accept is the default posture: the mock still answers 1000 so a
# real CPO is not knocked over, but the drift is flagged. (The strictInbound
# scenario option flips this to an outright 2001 rejection.)
check 'http' "$HTTP_CODE" '200'
check 'ocpi status_code' "$(json_num status_code "$RESP_BODY")" '1000'
say "-> dashboard: ✗ invalid + an error finding. Expand the row to see the Zod issues."
say "   note the mock still replied 1000 -- record-and-accept, it detects without breaking the CPO"
pause

# ============================================================================
# STEP 6 -- schema drift: an authorize call with an empty body
# ============================================================================
# tokens/authorize takes an OPTIONAL LocationReferences body: absent is legal
# (requestSchema is LocationReferencesSchema.optional()). But `{}` is a PRESENT
# body that is not a valid LocationReferences -- location_id and evse_uids are
# both missing. That is the distinction the oracle draws, and it draws it for
# free because it is Citrine's own schema.
step 'schema drift -- POST tokens/authorize with an empty body'
ocpi_functional POST '/ocpi/2.2.1/emsp/tokens/04E7F5A2B37C80/authorize?type=RFID' '{}'
check 'http' "$HTTP_CODE" '200'
check 'ocpi status_code' "$(json_num status_code "$RESP_BODY")" '1000'
check 'authorize decision' "$(json_str allowed "$RESP_BODY")" 'ALLOWED'
say "-> ✗ invalid on the body, yet the mock still answered a well-formed ALLOWED"
pause

# ============================================================================
# STEP 7 -- the Adversary: arm a fault, then trip it
# ============================================================================
# The mock does not only observe -- it can misbehave on purpose, to test how
# Citrine copes. Here: force every inbound CDR to come back OCPI 3001
# (UnableToUseApi) even though the mock's own baseline reply was a clean 1000.
#
# The ordering detail worth knowing (ocpi/dispatcher.ts finalize()): the mock
# SELF-CHECKS its clean baseline response against the response schema FIRST, and
# only THEN lets the fault engine corrupt it. So arming a fault never trips the
# mock's own "mock bug" warning -- it certifies its output, then deliberately
# breaks it.
step 'adversary -- arm cdrs->3001, then POST a CDR so it trips'
mock POST /fault '{
  "id": "demo-cdr-3001",
  "match": { "module": "cdrs", "direction": "inbound" },
  "action": { "kind": "ocpiStatus", "status_code": 3001, "status_message": "mock forced 3001 (demo)" }
}'
check 'fault armed' "$(json_str armed "$RESP_BODY")" 'demo-cdr-3001'
pause

# This CDR is FULLY schema-valid. That is deliberate: it means the 3001 on screen
# cannot be blamed on a bad payload. The row will read ✓ valid AND red 3001 --
# proving the status came from the adversary, not from the data.
ocpi_functional POST '/ocpi/2.2.1/emsp/cdrs' '{
  "country_code": "US",
  "party_id": "S44",
  "id": "CDR-DEMO-1",
  "start_date_time": "2026-07-17T09:00:00.000Z",
  "end_date_time": "2026-07-17T10:00:00.000Z",
  "session_id": "SESSION-DEMO-1",
  "cdr_token": {
    "uid": "04E7F5A2B37C80",
    "type": "RFID",
    "contract_id": "USTST-C-00042",
    "country_code": "US",
    "party_id": "TST"
  },
  "auth_method": "WHITELIST",
  "authorization_reference": "AUTH-DEMO-0001",
  "cdr_location": {
    "id": "LOC-DEMO-1",
    "name": "Demo Depot",
    "address": "1 Market St",
    "city": "San Francisco",
    "postal_code": "94105",
    "state": "CA",
    "country": "USA",
    "coordinates": { "latitude": "37.774929", "longitude": "-122.419418" },
    "evse_uid": "EVSE-DEMO-1",
    "evse_id": "US*S44*E00001",
    "connector_id": "1",
    "connector_standard": "IEC_62196_T2",
    "connector_format": "SOCKET",
    "connector_power_type": "AC_3_PHASE"
  },
  "currency": "USD",
  "charging_periods": [
    {
      "start_date_time": "2026-07-17T09:00:00.000Z",
      "dimensions": [ { "type": "ENERGY", "volume": 18.5 } ]
    }
  ],
  "total_cost": { "excl_vat": 7.25, "incl_vat": 8.7 },
  "total_energy": 18.5,
  "total_time": 1,
  "last_updated": "2026-07-17T10:00:05.000Z"
}'
check 'http' "$HTTP_CODE" '200'
check 'ocpi status_code (forced by the fault)' "$(json_num status_code "$RESP_BODY")" '3001'
say "-> dashboard: the row is tinted dark red, flags show fault:ocpiStatus, ocpi is a red 3001"
say "   ...and the valid column still says ✓ -- the payload was perfect, the mock lied on purpose"
pause

# ============================================================================
# VERIFY -- confirm the intended mix actually landed
# ============================================================================
printf '\n=== verifying the seeded mix ===\n'

mock GET '/exchanges?limit=500'
EX_JSON="$RESP_BODY"
check 'inbound exchanges recorded' "$(count_of '"direction":"inbound"' "$EX_JSON")" '7'
check 'schema-invalid exchanges' "$(count_of '"ok":false' "$EX_JSON")" '2'
check 'fault-stamped exchanges' "$(count_of '"ruleId":"demo-cdr-3001"' "$EX_JSON")" '1'

mock GET /findings
check 'auth findings' "$(count_of '"kind":"auth"' "$RESP_BODY")" '1'
check 'body-drift findings' "$(count_of '"kind":"body"' "$RESP_BODY")" '2'

mock GET /health
HEALTH="$RESP_BODY"
check 'health.exchanges' "$(json_num exchanges "$HEALTH")" '7'
check 'health.findings' "$(json_num findings "$HEALTH")" '3'
check 'health.faults' "$(json_num faults "$HEALTH")" '1'
check 'health.status' "$(json_str status "$HEALTH")" 'up'
check 'health.registration' "$(registration_status "$HEALTH")" 'registered'
check 'health.scenario' "$(json_str scenario "$HEALTH")" 'preregistered'

# ============================================================================
# SUMMARY
# ============================================================================
printf '\n=== health ===\n%s\n' "$HEALTH"

printf '\n=== the story now on the dashboard (%s) ===\n' "$BASE"
# NB: the trace sorts newest-first, and the `#` column is the recorder's
# monotonic seq -- it does NOT restart at 1 on reset (store.reset keeps the
# counter), so on screen these will read e.g. #36..#42, not #1..#7. Listed here
# top-of-table down to match what is actually on screen.
say 'Wire trace, top row down (newest first):'
say '  cdrs.post          ✓ valid  BUT red 3001 + fault:ocpiStatus  <- the adversary'
say '  tokens.authorize   ✗ invalid (empty body is not LocationReferences)'
say '  locations.put      ✗ invalid (coordinates "1.0"/"2.0" fail the regex)'
say '  sessions.put       ✓ valid, clean 1000                       <- the happy path'
say '  sessions.put       401 / 2002 + auth finding                 <- auth enforced'
say '  versions.details   clean 1000'
say '  versions.list      clean 1000'
say ''
say 'Findings: 3 (1 auth, 2 schema drift).  Faults armed: 1.'
say 'Reminder: this traffic came from THIS SCRIPT playing Citrine, not from CitrineOS.'

if [ "$FAILURES" -ne 0 ]; then
  printf '\nFAILURE: %d check(s) did not match the expected demo state.\n' "$FAILURES" >&2
  exit 1
fi
printf '\nSUCCESS: dashboard seeded -- open %s and take the screen share.\n' "$BASE"
