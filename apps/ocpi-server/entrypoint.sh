#!/bin/sh
set -e

# Mirrors apps/ocpp-server/entrypoint.sh for the slim image: no pnpm/corepack at
# runtime — call the locally installed sequelize-cli directly.
#
# Runs db:migrate ONLY. Never run db:seed here: the seeders upsert the default
# tenant (id=1) on every run and would overwrite a real tenant identity.
#
# OCPI_ENV selects the sequelize bridge config (docker = env-var driven);
# default to docker since this script only runs inside the container image.
OCPI_ENV=${OCPI_ENV:-docker}
export OCPI_ENV

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

(cd "$SCRIPT_DIR" && ./node_modules/.bin/sequelize-cli db:migrate --debug && echo migration completed successfully)

echo "Starting application..."
exec node "$SCRIPT_DIR/dist/index.js"
