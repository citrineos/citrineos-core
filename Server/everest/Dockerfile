ARG EVEREST_IMAGE_TAG=0.0.23

FROM --platform=linux/x86_64 ghcr.io/everest/everest-demo/manager:${EVEREST_IMAGE_TAG}

ARG EVEREST_TARGET_URL=host.docker.internal/cp001
ENV EVEREST_TARGET_URL $EVEREST_TARGET_URL

WORKDIR /workspace

RUN apt-get update && apt-get install -y sqlite3
RUN sqlite3 /ext/dist/share/everest/modules/OCPP201/device_model_storage.db \
        "UPDATE VARIABLE_ATTRIBUTE \
        SET value = '[{\"configurationSlot\": 1, \"connectionData\": {\"messageTimeout\": 30, \"ocppCsmsUrl\": \"$EVEREST_TARGET_URL\", \"ocppInterface\": \"Wired0\", \"ocppTransport\": \"JSON\", \"ocppVersion\": \"OCPP20\", \"securityProfile\": 1}},{\"configurationSlot\": 2, \"connectionData\": {\"messageTimeout\": 30, \"ocppCsmsUrl\": \"$EVEREST_TARGET_URL\", \"ocppInterface\": \"Wired0\", \"ocppTransport\": \"JSON\", \"ocppVersion\": \"OCPP20\", \"securityProfile\": 1}}]' \
        WHERE \
        variable_Id IN ( \
        SELECT id FROM VARIABLE \
        WHERE name = 'NetworkConnectionProfiles' \
        );"

RUN npm i -g http-server
EXPOSE 8888

COPY ./start.sh /tmp/start.sh
RUN chmod +x /tmp/start.sh
ENTRYPOINT ["/tmp/start.sh"]