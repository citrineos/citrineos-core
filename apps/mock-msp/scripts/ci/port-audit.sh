#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0
#
# port-audit.sh PORT [PORT...] -- exit 1 if anything already listens on one of
# them. A leftover listener on the runner otherwise shows up later as a
# confusing EADDRINUSE or, worse, as tests talking to the wrong process.
set -euo pipefail

[ $# -gt 0 ] || { echo "usage: port-audit.sh PORT [PORT...]" >&2; exit 2; }

busy=0
for port in "$@"; do
  if ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE "[:.]${port}\$"; then
    echo "port $port is already in use:" >&2
    ss -ltnp 2>/dev/null | grep -E "[:.]${port} " >&2 || true
    busy=1
  fi
done
[ "$busy" = 0 ] && echo "port-audit: $* free"
exit "$busy"
