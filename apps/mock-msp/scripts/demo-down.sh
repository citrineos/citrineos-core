#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

# ============================================================================
# FILE: apps/mock-msp/scripts/demo-down.sh
#
# Stop the mock eMSP demo started by demo-up.sh:
#   apps/mock-msp/scripts/demo-down.sh
#
# Idempotent: succeeds whether or not anything is running. Only ever kills a
# node.exe that is LISTENING on the port -- never a client connected to it
# (your browser with the dashboard open is a connection on :8083 too), and
# never a recycled pid that a stale pid file happens to point at.
# ============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./demo-lib.sh
. "$SCRIPT_DIR/demo-lib.sh"

printf '=== mock-msp demo-down ===\n'
say "port: $PORT"

WAS_UP=0
[ -n "$(listener_pids)" ] && WAS_UP=1

# free_port stops the listener, waits for the socket to drop, and reconciles
# (never blindly trusts) the pid file.
free_port

[ -z "$(listener_pids)" ] || die "something is still listening on :$PORT"

if [ "$WAS_UP" = "1" ]; then
  succeed "mock-msp stopped; :$PORT is free"
else
  succeed "mock-msp was not running; :$PORT is free (nothing to do)"
fi
