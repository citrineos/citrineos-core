#!/bin/sh
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

set -e

APP_ENV=${APP_ENV:-docker}
export APP_ENV

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Core's migrations have to have run: the payment tables reference Core's.
node "$SCRIPT_DIR/dist/db/migrate-cli.js"

echo "Starting application..."
exec node "$SCRIPT_DIR/dist/index.js"
