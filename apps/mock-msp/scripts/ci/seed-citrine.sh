#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0
#
# Run the OCPI seeders inside the running citrineos-ocpi container and check
# that the rows the mock relies on exist. The containers only migrate on boot;
# nothing seeds them, so without this step there is no US/TST partner, no
# cp001 station and no DEADBEEF token. Run from the repo root.
#
#   COMPOSE      override the compose command (default: both files + ocpi profile)
#   HASURA_URL   default http://localhost:8090/v1/graphql
set -euo pipefail

COMPOSE="${COMPOSE:-docker compose -f docker-compose.yml -f docker-compose.local.yml --profile ocpi}"
HASURA_URL="${HASURA_URL:-http://localhost:8090/v1/graphql}"

echo "seed-citrine: running db:seed in citrineos-ocpi"
$COMPOSE exec -T -e OCPI_ENV=docker citrineos-ocpi pnpm run db:seed

# The seeders insert with explicit ids, which leaves the id sequences behind:
# on a fresh DB Citrine's first own insert (e.g. the Authorization behind a
# token PUT) then collides with id 1. Move every seeded table's sequence past
# its max id.
echo "seed-citrine: bumping id sequences of the seeded tables"
$COMPOSE exec -T ocpp-db psql -q -U citrine -d citrine -v ON_ERROR_STOP=1 <<'SQL'
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['Tenants','TenantPartners','Locations','ChargingStations','Tariffs','Evses','Connectors','Authorizations'] LOOP
    EXECUTE format('SELECT setval(pg_get_serial_sequence(%L, ''id''), (SELECT COALESCE(MAX(id), 1) FROM %I))', quote_ident(t), t);
  END LOOP;
END $$;
SQL

HASURA_URL="$HASURA_URL" node --input-type=module - <<'EOF'
const query = `{
  TenantPartners(where: {partyId: {_eq: "TST"}}) { id }
  Authorizations(where: {idToken: {_eq: "DEADBEEF"}}) { id }
  ChargingStations(where: {ocppConnectionName: {_eq: "cp001"}}) { id }
  Locations(where: {id: {_eq: 1}}) { id }
}`;
const res = await fetch(process.env.HASURA_URL, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ query }),
});
const json = await res.json();
const missing = ['TenantPartners', 'Authorizations', 'ChargingStations', 'Locations'].filter(
  (k) => !Array.isArray(json.data?.[k]) || json.data[k].length === 0,
);
if (missing.length) {
  console.error(`seed-citrine: missing rows: ${missing.join(', ')}`);
  console.error(JSON.stringify(json));
  process.exit(1);
}
console.log('seed-citrine: partner US/TST, station cp001, token DEADBEEF, location 1 present');
EOF
