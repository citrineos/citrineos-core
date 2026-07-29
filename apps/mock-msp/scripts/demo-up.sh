#!/usr/bin/env bash
# ============================================================================
# FILE: apps/mock-msp/scripts/demo-up.sh
#
# One command to bring the mock eMSP demo up from cold:
#   apps/mock-msp/scripts/demo-up.sh
#
# Repairs the tsc-alias landmine if present, builds, restarts the service on
# :8083 with the preregistered scenario, waits for /_mock/health, and prints
# the dashboard URL. Idempotent: re-running restarts cleanly.
#
# NOTE: this brings up the MOCK only. CitrineOS itself is NOT started here
# (it needs Docker). With Citrine down, the mock is fully functional but the
# dashboard's outbound actions (Register / Push token / Send command) will
# fail with ECONNREFUSED -- that is expected, not a bug in the mock.
# ============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
# shellcheck source=./demo-lib.sh
. "$SCRIPT_DIR/demo-lib.sh"

cd "$REPO_ROOT" || die "cannot cd to repo root $REPO_ROOT"

# Installed node is v22 but the repo declares engines >=24.16. Every pnpm/npx
# step needs this or it refuses to run.
export npm_config_engine_strict=false

# Scenario is passed RELATIVE to the repo root: loadScenario() does a bare
# readFileSync(path), so it resolves against the process cwd (= REPO_ROOT).
# A /c/... git-bash path would not be understood by node here.
SCENARIO="${MOCK_MSP_SCENARIO:-apps/mock-msp/scenarios/preregistered.json}"
HEALTH_TIMEOUT="${MSP_HEALTH_TIMEOUT:-60}"
HEALTH_URL="http://127.0.0.1:${PORT}/_mock/health"
DASH_URL="http://localhost:${PORT}/"

# Path aliases that tsc-alias is responsible for rewriting in the emitted JS.
# base: @ocpp @config @interfaces @base-util | core: @ @dal @modules @util
# Deliberately does NOT match real package specifiers like '@citrineos/base'.
ALIAS_RE="['\"]@(interfaces|ocpp|config|base-util|dal|modules|util)/|['\"]@/"

alias_broken_files() {
  grep -rlE "$ALIAS_RE" packages/base/dist packages/core/dist \
    --include=*.js 2>/dev/null || true
}

# The documented recovery is `npx tsc-alias -p packages/{base,core,ocpi-base}/tsconfig.json`,
# but tsc-alias -p accepts ONE project: brace expansion silently drops core and
# ocpi-base. Run it once per project instead.
repair_aliases() {
  local p
  for p in base core ocpi-base; do
    say "tsc-alias -p packages/$p/tsconfig.json"
    npx tsc-alias -p "packages/$p/tsconfig.json" ||
      die "tsc-alias failed for packages/$p"
  done
}

# Verifies emitted JS has no bare aliases; auto-repairs if it does.
# Called BEFORE the build (to catch a pre-broken tree) and AFTER it (because a
# `tsc -b` that decides packages/base is stale will rebuild it and clobber the
# rewrite -- which is the actual mechanism behind ERR_MODULE_NOT_FOUND).
check_aliases() {
  local phase="$1" broken
  broken="$(alias_broken_files)"
  if [ -z "$broken" ]; then
    ok "path aliases already rewritten ($phase)"
    return 0
  fi
  warn "bare path aliases found in emitted JS ($phase) - node would die with ERR_MODULE_NOT_FOUND:"
  printf '      %s\n' $(echo "$broken" | head -5)
  say "auto-repairing with tsc-alias..."
  repair_aliases
  broken="$(alias_broken_files)"
  [ -n "$broken" ] && die "aliases still bare after tsc-alias repair: $(echo "$broken" | head -1)"
  ok "aliases repaired ($phase)"
}

printf '=== mock-msp demo-up ===\n'
say "repo   : $REPO_ROOT"
say "node   : $(node -v)  (engine-strict disabled)"
say "port   : $PORT"
say "scenario: $SCENARIO"

[ -f "$SCENARIO" ] || die "scenario file not found: $SCENARIO"

step 1/5 "Checking emitted path aliases (pre-build)"
check_aliases "pre-build"

step 2/5 "Building (tsc -b, never --force)"
if npx tsc -b apps/mock-msp/tsconfig.json; then
  ok "build clean"
else
  die "tsc -b failed. Do NOT retry with --force: it rebuilds @citrineos/base and clobbers the tsc-alias rewrite."
fi
# A build that touched packages/base re-emits bare aliases -- re-check.
check_aliases "post-build"
[ -f apps/mock-msp/dist/index.js ] || die "build produced no apps/mock-msp/dist/index.js"

step 3/5 "Freeing port :$PORT"
free_port

step 4/5 "Starting mock-msp"
: >"$LOG_FILE" || die "cannot write log file $LOG_FILE"
# Run the COMPILED entrypoint. tsx/dev breaks under node 22 via a
# @peculiar/webcrypto ESM interop issue pulled in through @citrineos/core.
MOCK_MSP_PORT="$PORT" MOCK_MSP_SCENARIO="$SCENARIO" \
  nohup node apps/mock-msp/dist/index.js >>"$LOG_FILE" 2>&1 &
JOB_PID=$!
disown "$JOB_PID" 2>/dev/null || true
say "launched (bash job $JOB_PID; real Windows pid resolved once listening)"
say "logs   : $LOG_FILE"

step 5/5 "Waiting for health on $HEALTH_URL"
HEALTH_JSON=""
deadline=$((SECONDS + HEALTH_TIMEOUT))
while :; do
  HEALTH_JSON="$(curl -fsS --max-time 2 "$HEALTH_URL" 2>/dev/null)" && [ -n "$HEALTH_JSON" ] && break
  # Fail fast if the process died rather than burning the whole timeout.
  if ! kill -0 "$JOB_PID" 2>/dev/null && [ -z "$(listener_pids)" ]; then
    printf '\n--- last 25 log lines (%s) ---\n' "$LOG_FILE" >&2
    tail -25 "$LOG_FILE" >&2
    die "mock-msp exited during startup (see log above)"
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    printf '\n--- last 25 log lines (%s) ---\n' "$LOG_FILE" >&2
    tail -25 "$LOG_FILE" >&2
    die "timed out after ${HEALTH_TIMEOUT}s waiting for $HEALTH_URL"
  fi
  sleep 0.5
done
ok "health responded"

# Resolve and persist the REAL Windows pid (see demo-lib.sh header: $! is not it).
WIN_PID="$(listener_pids | head -1)"
if [ -n "$WIN_PID" ]; then
  printf '%s\n' "$WIN_PID" >"$PID_FILE"
  ok "pid $WIN_PID ($(image_of "$WIN_PID")) -> $PID_FILE"
else
  warn "healthy but could not resolve listener pid from netstat; demo-down will still find it"
fi

# The dashboard is the demo centerpiece: prove it actually serves, don't assume.
DASH_CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$DASH_URL" 2>/dev/null)"
[ "$DASH_CODE" = "200" ] || die "health is up but dashboard GET / returned HTTP $DASH_CODE"
ok "dashboard GET / -> HTTP 200"

printf '\nhealth: %s\n' "$HEALTH_JSON"
case "$HEALTH_JSON" in
  *'"scenario":"preregistered"'*)
    ok 'scenario badge will read "scenario: preregistered"'
    ;;
  *'"scenario":null'*)
    # Health reports null when MOCK_MSP_SCENARIO was never set: the header badge
    # renders empty and POST /_mock/scenarios/:id/evaluate 409s.
    warn 'scenario is null - the header badge will be INVISIBLE and evaluate will 409'
    ;;
esac

printf '\n  Dashboard : %s\n' "$DASH_URL"
printf '  Also at   : http://localhost:%s/_mock/ui\n' "$PORT"
printf '  Health    : %s\n' "$HEALTH_URL"
printf '  Logs      : %s\n' "$LOG_FILE"
printf '  Stop with : apps/mock-msp/scripts/demo-down.sh\n'
printf '\n  Reminder: CitrineOS is not started by this script. Register / Push token /\n'
printf '            Send command will ECONNREFUSED until the Docker stack is up.\n'

succeed "mock-msp is up and healthy on :$PORT (scenario: $SCENARIO)"
