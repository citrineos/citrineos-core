ARG EVEREST_IMAGE_TAG=0.0.16

# todo make tag work dynamically
FROM --platform=linux/x86_64 ghcr.io/everest/everest-demo/manager:${EVEREST_IMAGE_TAG}

ARG EVEREST_TARGET_URL=host.docker.internal/cp001
ENV EVEREST_TARGET_URL $EVEREST_TARGET_URL

WORKDIR /workspace
RUN ["/entrypoint.sh"]
RUN apk update && apk add sqlite
RUN sqlite3 /ext/source/build/dist/share/everest/modules/OCPP201/device_model_storage.db \
        "UPDATE VARIABLE_ATTRIBUTE \
        SET value = '[{\"configurationSlot\": 1, \"connectionData\": {\"messageTimeout\": 30, \"ocppCsmsUrl\": \"$EVEREST_TARGET_URL\", \"ocppInterface\": \"Wired0\", \"ocppTransport\": \"JSON\", \"ocppVersion\": \"OCPP20\", \"securityProfile\": 1}},{\"configurationSlot\": 2, \"connectionData\": {\"messageTimeout\": 30, \"ocppCsmsUrl\": \"$EVEREST_TARGET_URL\", \"ocppInterface\": \"Wired0\", \"ocppTransport\": \"JSON\", \"ocppVersion\": \"OCPP20\", \"securityProfile\": 1}}]' \
        WHERE \
        variable_Id IN ( \
        SELECT id FROM VARIABLE \
        WHERE name = 'NetworkConnectionProfiles' \
        );"

RUN rm /ext/source/build/dist/etc/everest/certs/ca/v2g/*.*

RUN chmod +x /ext/source/build/run-scripts/run-sil-ocpp201-pnc.sh
CMD ["/ext/source/build/run-scripts/run-sil-ocpp201-pnc.sh"]
