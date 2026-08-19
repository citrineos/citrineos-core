#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0
#
# Fails when a workspace package was rebuilt without tsc-alias, i.e. its dist
# still carries bare path aliases that node cannot resolve at runtime.
# Run from the repo root after the build.
set -euo pipefail

ALIAS_RE="['\"]@(interfaces|ocpp|config|base-util|dal|modules|util)/|['\"]@/"

broken="$(grep -rlE "$ALIAS_RE" packages/base/dist packages/core/dist --include=*.js 2>/dev/null || true)"
if [ -n "$broken" ]; then
  echo "bare path aliases left in emitted js (tsc-alias did not run):" >&2
  echo "$broken" | head -20 >&2
  echo 'rebuild with: pnpm --filter "@citrineos/mock-msp..." build' >&2
  exit 1
fi
echo "alias-guard: ok"
