#!/bin/sh
set -e

# Default to migrate if DB_STRATEGY is not set
DB_STRATEGY=${DB_STRATEGY:-migrate}

echo "Executing DB strategy: $DB_STRATEGY"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ "$DB_STRATEGY" = "migrate" ]; then
    (cd "$SCRIPT_DIR" && pnpm run db:migrate)
    MIGRATIONS_RAN=1
elif [ "$DB_STRATEGY" = "none" ]; then
    echo "Skipping DB initialization."
    MIGRATIONS_RAN=0
else
    echo "Unknown DB_STRATEGY: $DB_STRATEGY. Defaulting to migrate."
    (cd "$SCRIPT_DIR" && pnpm run db:migrate)
    MIGRATIONS_RAN=1
fi

# Issues DDL, so it must respect DB_STRATEGY rather than run unconditionally.
if [ "$MIGRATIONS_RAN" = "1" ]; then
    node "$SCRIPT_DIR/dist/scripts/provision-partitions.js"
fi

echo "Starting application..."
exec node "$SCRIPT_DIR/dist/index.js"

