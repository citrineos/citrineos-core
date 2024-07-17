#!/bin/sh
http-server /tmp/everest_ocpp_logs -p 8888 &
chmod +x /ext/source/build/run-scripts/run-sil-ocpp201-pnc.sh
/ext/source/build/run-scripts/run-sil-ocpp201-pnc.sh