#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0
#
# wait-for.sh URL [TIMEOUT_SECONDS] -- poll until the url answers 2xx.
set -euo pipefail

url="${1:?usage: wait-for.sh URL [TIMEOUT_SECONDS]}"
timeout="${2:-60}"
deadline=$((SECONDS + timeout))

while :; do
  if curl -fs --max-time 5 -o /dev/null "$url"; then
    echo "wait-for: $url is up"
    exit 0
  fi
  if [ "$SECONDS" -ge "$deadline" ]; then
    echo "wait-for: $url did not answer within ${timeout}s" >&2
    exit 1
  fi
  sleep 2
done
