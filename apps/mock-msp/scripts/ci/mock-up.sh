#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0
#
# Start the mock eMSP natively from an already built tree and wait until it
# answers. Run from the repo root. Configuration is the mock's own env
# (MOCK_MSP_*, CITRINE_*); the defaults below only fill in what CI needs.
#
#   MOCK_MSP_PORT       default 8083
#   MOCK_MSP_SCENARIO   default apps/mock-msp/scenarios/preregistered.json
#   MOCK_LOG            default apps/mock-msp/reports/mock-msp.log
#   MOCK_PID            default apps/mock-msp/reports/mock-msp.pid
#   MOCK_UP_TIMEOUT     seconds to wait for /_mock/health, default 60
set -euo pipefail

[ -f apps/mock-msp/dist/index.js ] || {
  echo 'apps/mock-msp/dist/index.js missing -- run: pnpm --filter "@citrineos/mock-msp..." build' >&2
  exit 1
}

export MOCK_MSP_PORT="${MOCK_MSP_PORT:-8083}"
export MOCK_MSP_SCENARIO="${MOCK_MSP_SCENARIO:-apps/mock-msp/scenarios/preregistered.json}"
log="${MOCK_LOG:-apps/mock-msp/reports/mock-msp.log}"
pidfile="${MOCK_PID:-apps/mock-msp/reports/mock-msp.pid}"
timeout="${MOCK_UP_TIMEOUT:-60}"
base="http://127.0.0.1:${MOCK_MSP_PORT}"

mkdir -p "$(dirname "$log")"
if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
  echo "mock already running (pid $(cat "$pidfile"))" >&2
  exit 1
fi

nohup node apps/mock-msp/dist/index.js >"$log" 2>&1 &
echo $! >"$pidfile"
echo "mock-up: pid $(cat "$pidfile"), log $log"

hdr=()
[ -n "${MOCK_MSP_CONTROL_SECRET:-}" ] && hdr=(-H "x-mock-control-secret: $MOCK_MSP_CONTROL_SECRET")

deadline=$((SECONDS + timeout))
until curl -fs --max-time 3 "${hdr[@]}" "$base/_mock/health" >/dev/null 2>&1; do
  if ! kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    echo "mock-up: process exited early" >&2
    tail -50 "$log" >&2 || true
    exit 1
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "mock-up: no answer on $base/_mock/health after ${timeout}s" >&2
    tail -50 "$log" >&2 || true
    exit 1
  fi
  sleep 1
done

if ! curl -fs --max-time 5 "$base/" | grep -q 'id="covGrid"'; then
  echo "mock-up: dashboard did not render (GET / lacks covGrid)" >&2
  exit 1
fi

curl -fs "${hdr[@]}" "$base/_mock/health"
echo
echo "mock-up: ready on $base"
