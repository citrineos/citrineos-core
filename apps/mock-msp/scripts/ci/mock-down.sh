#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0
#
# Stop the mock started by mock-up.sh. Idempotent.
set -euo pipefail

pidfile="${MOCK_PID:-apps/mock-msp/reports/mock-msp.pid}"
[ -f "$pidfile" ] || { echo "mock-down: nothing to stop"; exit 0; }

pid="$(cat "$pidfile")"
if kill -0 "$pid" 2>/dev/null; then
  kill "$pid" || true
  for _ in $(seq 1 20); do
    kill -0 "$pid" 2>/dev/null || break
    sleep 0.5
  done
  kill -0 "$pid" 2>/dev/null && kill -9 "$pid" || true
  echo "mock-down: stopped pid $pid"
else
  echo "mock-down: pid $pid was not running"
fi
rm -f "$pidfile"
