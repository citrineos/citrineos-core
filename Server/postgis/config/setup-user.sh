#!/bin/bash
set -ex

# Wait until postgres is ready
until pg_isready -U citrine; do
  sleep 1
done

# Create new users
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    ALTER USER ${POSTGRES_USER} WITH PASSWORD '${POSTGRES_PASSWORD}';
EOSQL