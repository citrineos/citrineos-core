# Testing with EVerest

In the case you don't have a charger that supports OCPP 2.0.1 to experiment with, we can recommend using the Linux
Foundation Energy project EVerest. [See here](https://github.com/EVerest) for the repository. They have built an open source version of
charger firmware and also allow for using it as a simulator. They support OCPP 2.0.1 which makes it a great testing
opportunity with CitrineOS. For the long route of setting up EVerst you can follow their documentation and build
the project yourself. [See here for Docs](https://everest.github.io/latest/general/03_quick_start_guide.html)

# Running EVerest

In order to alleviate some of the complexities that may arise when starting EVerest, we have created
some helpful commands that should help in getting the EVerest charger simulator running locally and targeting
CitrineOS.

You will notice in `/Server/everest` directory the files created to support running EVerest within Docker.
In addition, we created some helpful NPM commands:

- `npm run start-everest`
- and
- `npm run start-everest-windows`

Both of which in essence do the same thing which is to trigger the `docker compose up` command (below) from within
the `/Server/everest` directory so that it can pick up the `Dockerfile` and the `docker-compose.yml` files.

You will notice that there are two args that are configurable:

- `EVEREST_IMAGE_TAG` - The image tag that will be used for the EVerest image (ghcr.io/everest/everest-demo/manager).
- `EVEREST_TARGET_URL` - The CSMS URL that EVerest will connect to. Defaults to `host.docker.internal` assuming CitrineOS will run on same machine, since `localhost` won't work within Docker.

After running `npm run start-everest` (or the Windows alternative), you should see 3 running EVerest containers
and the `manager` container should have the appropriate EVerest logs.


### Running EVerest on Mac ARM64 (M1/M2)

If you're on a Mac with an ARM64 processor (like an M1 or M2 chip), you may run into some architecture compatibility issues. Here’s how to set up EVerest so it runs seamlessly on macOS ARM64 devices.

To get started, make a few adjustments to the docker-compose.yml and Dockerfile:

Specify Platform Compatibility
Since EVerest images are typically built for AMD64, we need to add `platform: linux/amd64` under each service in `docker-compose.yml.` This setting enables Docker to run the containers in AMD64 emulation mode, making them compatible with ARM64 hardware.

Hardcode Environment Variables
If dynamic build arguments aren’t used, you can directly specify values for `EVEREST_IMAGE_TAG` and `EVEREST_TARGET_URL` under each service’s environment section. This keeps things simple without needing extra configuration steps.

In the manager service of your docker-compose.yml, use context: . to specify the current directory as the build context. This tells Docker to locate the Dockerfile and any other required files within this directory. Set up your manager service as follows:

- manager:
    build:
      context: .
      dockerfile: Dockerfile
    ...

Network Bridge Setup
To make sure all EVerest services communicate correctly, define a bridge network. You can do this by adding a networks section to `docker-compose.yml`, like so:



- networks:
  everest-net:
    driver: bridge
Then link each service to this bridge by adding networks: - everest-net under each service.

Final docker-compose.yml Example

- Here’s an example of the updated docker-compose.yml file for Mac ARM64:

version: '3.8'

services:
  mqtt-server:
    image: ghcr.io/everest/everest-demo/mqtt-server:0.0.16
    platform: linux/amd64
    networks:
      - everest-net
    logging:
      driver: none

  manager:
    build:
      context: .
      dockerfile: Dockerfile
    platform: linux/amd64
    ports:
      - 8888:8888
    networks:
      - everest-net
    depends_on:
      - mqtt-server
    environment:
      - MQTT_SERVER_ADDRESS=mqtt-server
      - EVEREST_TARGET_URL=ws://host.docker.internal:8081/cp001
      - EVEREST_IMAGE_TAG=0.0.16
    sysctls:
      - net.ipv6.conf.all.disable_ipv6=0
    extra_hosts:
      - 'host.docker.internal:host-gateway'

  nodered:
    image: ghcr.io/everest/everest-demo/nodered:0.0.16
    platform: linux/amd64
    networks:
      - everest-net
    depends_on:
      - mqtt-server
    ports:
      - 1880:1880
    environment:
      - MQTT_SERVER_ADDRESS=mqtt-server
      - FLOWS=/config/config-sil-two-evse-flow.json

networks:
  everest-net:
    driver: bridge

- Here’s an example of the updated DockerFile file for Mac ARM64:

ARG EVEREST_IMAGE_TAG=0.0.16


FROM --platform=linux/amd64 ghcr.io/everest/everest-demo/manager:${EVEREST_IMAGE_TAG}

ARG EVEREST_TARGET_URL=ws://host.docker.internal:8081/cp001
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

RUN npm i -g http-server
EXPOSE 8888

COPY ./start.sh /tmp/start.sh
RUN chmod +x /tmp/start.sh
CMD ["sh", "-c", "/tmp/start.sh"]

Finally just run `docker compose up --build`

### EVerest UI

Now that the 3 containers are running in Docker, you should be able to navigate to `[localhost|ip]:1880/ui/` to view
the EVerest simulator UI. There, you should be able to simulate the pause/resume and plug/unplug events among others.

### EVerest NodeRed

You can also view the EVerest NodeRed UI `[localhost|ip]:1880/`, but it is not advisable to make any adjustments here
unless you have a good understanding of this configuration.

### Viewing OCPP logs in EVerest

To view the OCPP logs in EVerest, we have utilized Node `http-server`, which you will see being initialized
in the Dockerfile. We initialize a simple HTTP server on port `8888` and expose this port so that it is
mapped in the compose file allowing you to navigate to `localhost:8888`. This HTTP server is configured to
serve the contents of the `/tmp/everest_ocpp_logs` which is where EVerest stores the OCPP logs in the
Docker container. Conveniently, the logs are in HTML format, so we can easily view them in the browser.

# Running EVerest Manually

You can also use their demo repository that hosts a Docker packaged EVerest image. [See here for Github Repo](https://github.com/EVerest/everest-demo)

To get EVerest running on the side while developing and making changes, you can follow the steps below.

1. Run your CitrineOS instance locally with `docker compose up -d` in the CitrineOS repository.
1. Clone the [EVerest Demo](https://github.com/EVerest/everest-demo) repository and `cd` into the repo.
1. With CitrineOS running execute an "add charger" script at `./citrineos/add-charger.sh` This adds a charger, location and password for the charger to CitrineOS.
1. Bring up EVerest with `docker compose --project-name everest-ac-demo --file "docker-compose.ocpp201.yml" up -d`.
1. Copy over the appropriate device model with `docker cp manager/device_model_storage_citrineos_sp1.db \
everest-ac-demo-manager-1:/ext/source/build/dist/share/everest/modules/OCPP201/device_model_storage.db`.
1. Start EVerst having OCPP2.0.1 support with `docker exec everest-ac-demo-manager-1 sh /ext/source/build/run-scripts/run-sil-ocpp201.sh`.
