#!/bin/sh
/entrypoint.sh
http-server /tmp/everest_ocpp_logs -p 8888 &
rm /ext/dist/share/everest/modules/OCPP201/component_config/custom/EVSE_2.json
rm /ext/dist/share/everest/modules/OCPP201/component_config/custom/Connector_2_1.json
chmod +x /ext/build/run-scripts/run-sil-ocpp201-pnc.sh
/ext/build/run-scripts/run-sil-ocpp201-pnc.sh