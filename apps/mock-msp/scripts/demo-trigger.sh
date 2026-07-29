#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

# ============================================================================
# demo-trigger.sh — make LIVE CitrineOS push real OCPI traffic to the mock eMSP.
#
# Adds a charging Location to CitrineOS. Citrine's LocationNotification pgNotify
# trigger fires, the OCPI server broadcasts the new Location to every registered
# roaming partner — which is the mock eMSP on :8083. The mock validates the
# payload against @citrineos/ocpi-base's own Zod schemas and records the result.
#
# This is REAL Citrine traffic, not a simulation.
#
# Usage:  bash apps/mock-msp/scripts/demo-trigger.sh [id] [name]
# ============================================================================
set -uo pipefail
export MSYS_NO_PATHCONV=1

DB_CONTAINER="${DB_CONTAINER:-citrineos-core-ocpp-db-1}"
MOCK="${MOCK:-http://localhost:8083}"
ID="${1:-}"
NAME="${2:-Demo Hub $(date +%H%M%S)}"

# Pick a free id if none supplied.
if [ -z "$ID" ]; then
  ID=$(docker exec "$DB_CONTAINER" psql -U citrine -d citrine -t -A \
        -c 'select coalesce(max(id),0)+1 from "Locations";' 2>/dev/null | tr -d '[:space:]')
  [ -z "$ID" ] && ID=99
fi

echo "→ Adding Location id=$ID \"$NAME\" to CitrineOS..."

docker exec "$DB_CONTAINER" psql -U citrine -d citrine -c "
insert into \"Locations\"
  (id,name,address,city,\"postalCode\",state,country,\"timeZone\",
   \"publishUpstream\",\"parkingType\",facilities,coordinates,\"openingHours\",
   \"tenantId\",\"createdAt\",\"updatedAt\")
values
  ($ID,'$NAME','9 Volt Way','Oakland','94607','CA','USA','America/Los_Angeles',
   true,'AlongMotorway','[\"Cafe\"]',
   '{\"type\":\"Point\",\"coordinates\":[-122.4194,37.7749]}',
   '{\"twentyfourSeven\":true}',1,now(),now());" >/dev/null 2>&1 \
  && echo "  ✓ Location added to Citrine" \
  || { echo "  ✗ insert failed (id $ID may exist — pass a different id)"; exit 1; }

echo "→ Waiting for Citrine to broadcast it over OCPI..."
for i in $(seq 1 20); do
  n=$(curl -s -m 3 "$MOCK/_mock/exchanges?module=locations&direction=inbound" 2>/dev/null \
      | grep -o '"seq"' | wc -l | tr -d '[:space:]')
  [ "${n:-0}" -gt 0 ] && break
  sleep 0.5
done

echo ""
curl -s -m 5 "$MOCK/_mock/exchanges?module=locations&direction=inbound" 2>/dev/null | python -c "
import json,sys
try: xs=json.load(sys.stdin)
except Exception: print('  (no exchanges — is the mock up on :8083?)'); sys.exit()
if not xs: print('  (nothing arrived yet — give it a moment and refresh the dashboard)'); sys.exit()
x=xs[-1]; req=x.get('request',{}); val=x.get('validation',{})
print('  Citrine ->  %s %s' % (req.get('method'), req.get('path')))
c=(req.get('body') or {}).get('coordinates')
if c: print('  coordinates sent : %s' % json.dumps(c))
print('  schema valid     : %s' % val.get('ok'))
for i in (val.get('issues') or [])[:4]:
    print('    ✗ %s  ->  %s' % ('.'.join(str(p) for p in i.get('path',[])), i.get('message')))
" 2>/dev/null

echo ""
echo "→ Dashboard: $MOCK"
