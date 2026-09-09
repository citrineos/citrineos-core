#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

# ============================================================================
# FILE: apps/mock-msp/scripts/everest-plug.sh
#
# Drive the EVerest car simulator (connector 1) over its internal MQTT broker.
# This is the container-mode fallback for the /_mock/everest/plug|unplug control
# routes — use it when the mock runs inside its container and cannot reach the
# docker socket itself.
#
#   apps/mock-msp/scripts/everest-plug.sh          # plug in + request charging
#   apps/mock-msp/scripts/everest-plug.sh unplug   # end the session
#
# Plug-in parks the car at iec_wait_pwr_ready, giving the Auth window (~120s) to
# drive START_SESSION before it times out.
# ============================================================================
set -uo pipefail

MQTT="${EVEREST_MQTT_CONTAINER:-everest-mqtt-server-1}"
PREFIX="everest_external/nodered/1/carsim/cmd"
PLUG_CMD='sleep 1;iec_wait_pwr_ready;sleep 1;draw_power_regulated 16,3;sleep 3600'

command -v docker >/dev/null 2>&1 || { echo "FAILURE: docker not found on PATH" >&2; exit 1; }

pub() { docker exec "$MQTT" mosquitto_pub -t "$1" -m "$2"; }

if [ "${1:-plug}" = "unplug" ]; then
  pub "$PREFIX/modify_charging_session" "unplug" || { echo "FAILURE: unplug publish failed" >&2; exit 1; }
  echo "SUCCESS: unplugged (connector 1)"
else
  pub "$PREFIX/enable" "false" || { echo "FAILURE: enable=false publish failed (is EVerest up?)" >&2; exit 1; }
  sleep 2
  pub "$PREFIX/enable" "true" || { echo "FAILURE: enable=true publish failed" >&2; exit 1; }
  sleep 1
  pub "$PREFIX/execute_charging_session" "$PLUG_CMD" || { echo "FAILURE: charge-session publish failed" >&2; exit 1; }
  echo "SUCCESS: plugged in (connector 1); parked at iec_wait_pwr_ready — start charging within ~120s"
fi
