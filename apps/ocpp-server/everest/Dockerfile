ARG EVEREST_IMAGE_TAG="2025.6.1-dt-esdp"
FROM ghcr.io/everest/everest-demo/manager:${EVEREST_IMAGE_TAG}

WORKDIR /workspace

RUN npm i -g http-server
EXPOSE 8888

COPY ./start.sh /tmp/start.sh
RUN chmod +x /tmp/start.sh
ENTRYPOINT ["/tmp/start.sh"]