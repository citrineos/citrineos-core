#!/bin/sh
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

set -e

OCPI_ENV=${OCPI_ENV:-docker}
export OCPI_ENV

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

(cd "$SCRIPT_DIR" && ./node_modules/.bin/sequelize-cli db:migrate --debug && echo migration completed successfully)

echo "Starting application..."
exec node "$SCRIPT_DIR/dist/index.js"
