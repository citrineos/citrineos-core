ARG EVEREST_IMAGE_TAG=0.0.23
FROM --platform=linux/x86_64 ghcr.io/everest/everest-demo/manager:${EVEREST_IMAGE_TAG}

WORKDIR /workspace

RUN npm i -g http-server
EXPOSE 8888

COPY ./start.sh /tmp/start.sh
RUN chmod +x /tmp/start.sh
ENTRYPOINT ["/tmp/start.sh"]