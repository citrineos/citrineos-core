#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0
#
# Put Citrine's US/TST partner back to "known but not registered": drop the
# TenantPartners rows for it and insert a bare one. That is the only state
# Citrine's generate-credentials-token-a accepts, i.e. what an msp-initiated
# handshake (MOCK_MSP_AUTO_REGISTER=1, scripts/register.ts) needs.
#
#   HASURA_URL   default http://localhost:8090/v1/graphql
set -euo pipefail

HASURA_URL="${HASURA_URL:-http://localhost:8090/v1/graphql}"

HASURA_URL="$HASURA_URL" node --input-type=module - <<'EOF'
const url = process.env.HASURA_URL;
async function gql(query, variables) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(variables ? { query, variables } : { query }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}
const del = await gql(
  'mutation { delete_TenantPartners(where: {partyId: {_eq: "TST"}, countryCode: {_eq: "US"}}) { affected_rows } }',
);
const now = new Date().toISOString();
const ins = await gql(
  'mutation($obj: TenantPartners_insert_input!) { insert_TenantPartners_one(object: $obj) { id } }',
  { obj: { tenantId: 1, partyId: 'TST', countryCode: 'US', createdAt: now, updatedAt: now } },
);
console.log(
  `partner-reset: removed ${del.delete_TenantPartners.affected_rows}, bare US/TST row id ${ins.insert_TenantPartners_one.id}`,
);
EOF
