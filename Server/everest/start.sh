#!/bin/sh
# SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
#
# SPDX-License-Identifier: Apache-2.0

_OCPP_VERSION=$OCPP_VERSION
OCPP_VERSION_ENUM="OCPP201"
EVEREST_TARGET_URL="ws://host.docker.internal:8081/cp001"

case "$_OCPP_VERSION" in
  "1.6")
    OCPP_VERSION_ENUM="OCPP16"
    EVEREST_TARGET_URL="ws://host.docker.internal:8092/"
    ;;
"2.0.1")
    OCPP_VERSION_ENUM="OCPP201"
    ;;
"2.1")
    OCPP_VERSION_ENUM="OCPP21"
    EVEREST_TARGET_URL="ws://host.docker.internal:8083/cp001"
    ;;
  *)
    # NOT in the list
    _OCPP_VERSION="2.0.1"
    OCPP_VERSION_ENUM="OCPP201"
    ;;
esac

if [ "$_OCPP_VERSION" != "1.6" ]; then
    #There are two different configs in Everest that default their settings that we need to override for Citrine.
    #The first is a temp file that may or may not be used by Everest, but to be safe we change the config there.
    #The second is the config used by Everest when setting up their image, and this is the primary driver for the configuration of the image.

    CONFIG="$(cat <<JSON
[{"configurationSlot": 1, "connectionData": {"messageTimeout": 30, "ocppCsmsUrl": "$EVEREST_TARGET_URL", "ocppInterface": "Wired0", "ocppTransport": "JSON", "ocppVersion": "$OCPP_VERSION_ENUM", "securityProfile": 1}}, {"configurationSlot": 2, "connectionData": {"messageTimeout": 30, "ocppCsmsUrl": "$EVEREST_TARGET_URL", "ocppInterface": "Wired0", "ocppTransport": "JSON", "ocppVersion": "$OCPP_VERSION_ENUM", "securityProfile": 2}}]
JSON
 )"

    chmod +x /tmp/config.json
    jq --argjson config "$CONFIG" '
    (.[] 
        | select(.name == "InternalCtrlr") 
        | .variables.NetworkConnectionProfiles.attributes.Actual
    ) = $config
    ' "/tmp/config.json" > /tmp/config_citrine.json && mv /tmp/config_citrine.json "/tmp/config.json"
    chmod -x /tmp/config.json

    chmod +x /ext/dist/share/everest/modules/OCPP201/component_config/standardized/InternalCtrlr.json
    jq --argjson config "$CONFIG" '
    (. 
        | .properties 
        | .NetworkConnectionProfiles 
        | .attributes[] 
        | select(.type == "Actual") 
        | .value
    ) = $config
    ' "/ext/dist/share/everest/modules/OCPP201/component_config/standardized/InternalCtrlr.json" \
    > /tmp/config_citrine_dist.json && mv /tmp/config_citrine_dist.json "/ext/dist/share/everest/modules/OCPP201/component_config/standardized/InternalCtrlr.json"
    chmod -x /ext/dist/share/everest/modules/OCPP201/component_config/standardized/InternalCtrlr.json
fi

/entrypoint.sh
http-server /tmp/everest_ocpp_logs -p 8888 &

if [ "$_OCPP_VERSION" = "1.6" ]; then
    chmod +x /ext/build/run-scripts/run-sil-ocpp.sh
    sed -i "0,/127.0.0.1:8180\/steve\/websocket\/CentralSystemService\// s|127.0.0.1:8180/steve/websocket/CentralSystemService/|${EVEREST_TARGET_URL}|" /ext/dist/share/everest/modules/OCPP/config-docker.json
    /ext/build/run-scripts/run-sil-ocpp.sh
else
    #Works for all 2.x versions
    rm /ext/dist/share/everest/modules/OCPP201/component_config/custom/EVSE_2.json
    rm /ext/dist/share/everest/modules/OCPP201/component_config/custom/Connector_2_1.json
    chmod +x /ext/build/run-scripts/run-sil-ocpp201-pnc.sh
    /ext/build/run-scripts/run-sil-ocpp201-pnc.sh
fi