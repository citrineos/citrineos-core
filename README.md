# Welcome to CitrineOS

CitrineOS is an open-source project aimed at providing a modular server runtime for managing Electric Vehicle (EV) charging infrastructure. This README will guide you through the process of installing and running CitrineOS.

This is the main part of CitrineOS containing the actual charging station management logic, OCPP message routing and all modules.

All other documentation and the issue tracking can be found in our main repository here: https://github.com/citrineos/citrineos.

## Overview

CitrineOS is developed in TypeScript and runs on `NodeJS` with [ws](https://github.com/websockets/ws) and [fastify](https://fastify.dev/).

The system features:

- Dynamic OCPP 2.0.1 message schema validation, prior to transmission using `AJV`
- Generated OpenAPIv3 specification for easy developer access
- Configurable logical modules with decorators
  - `@AsHandler` to handle incoming OCPP 2.0.1 messages
  - `@AsMessageEndpoint` to expose functions allowing to send messages to charging stations
  - `@AsDataEndpoint` to expose CRUD access to entities defined in `10_Data`
- Utilities to connect and extend various message broker and cache mechanisms
  - Currently supported brokers are `RabbitMQ` and Google Cloud `PubSub`
  - Currently supported caches are `In Memory` and `Redis`

For more information on the project go to [citrineos.github.io](https://citrineos.github.io).

## Getting Started

### Prerequisites

Before you begin, make sure you have the following installed on your system:

- Node.js (v18 or higher): [Download Node.js](https://nodejs.org/)
- npm (Node Package Manager): [Download npm](https://www.npmjs.com/get-npm)

### Installation

1. Clone the CitrineOS repository to your local machine:

    ```shell
    git clone https://github.com/citrineos/citrineos-core
    ```

1. Navigate to the CitrineOS Server directory:

    ```shell
    cd citrineos-core/50_Server
    ```

1. Install project dependencies:

   ```shell
   ./unix-init-install-all.sh
   ```

1. Start the server and its supporting infrastructure with:

    ```shell
    docker-compose up -d 
    ```

### Starting the Server without Docker

CitrineOS requires configuration to allow your OCPP 2.0.1 compliant charging stations to connect.

We recommend running and developing the project with the `docker-compose` set-up.

To change necessary configuration for execution outside of `docker-compose`, please adjust the configuration file at `50_Server/src/config/envs/local.ts`. Make sure any changes to the local configuration do not make it into your PR.

### Starting the Server

To start the CitrineOS server, run the following command:

```shell
npm run start-unix:local
```

This will launch the CitrineOS server with the specified configuration.

### Usage

You can now connect your OCPP 2.0.1 compliant charging stations to the CitrineOS server. Make sure to configure the charging stations to point to the server's IP address and port as specified in the config.json file.

## Information on Docker setup

You need to install
[docker](https://docs.docker.com/engine/install/#server) and
[docker-compose](https://docs.docker.com/compose/install/#install-compose).
Furthermore, [Visual Studio
Code](https://code.visualstudio.com/docs/setup/linux) might be handy as
a common integrated development environment.

Once Docker is running, the following services should be available:

-   **CitrineOS** (service name: citrineos) with ports
    -   `8080`: websocket server tcp connection
    -   `8081`: webserver http - [Swagger](http://localhost:8081)
-   **RabbitMQ Broker** (service name: amqp-broker) with ports
    -   `5672`: amqp tcp connection
    -   `15672`: RabbitMQ [management interface](http://localhost:15672)
-   **PostgreSQL** (service name: ocpp-db), PostgreSQL database for persistence
    -   `5432`: sql tcp connection
-   **Directus** (service name: directus) on port 8055 with endpoints
    -   `:8055/admin`: web interface (login = admin@citrineos.com:CitrineOS!)

These three services are defined in `50_Server/docker-compose.yml` and they
live inside the docker network `docker_default` with their respective
ports. By default these ports are directly accessible by using
`localhost:8081` for example.

So, if you want to access the **amqp-broker** default management port via your
localhost, you need to access `localhost:15672`.

## Contributing

We welcome contributions from the community. If you would like to contribute to CitrineOS, please follow our [contribution guidelines](https://github.com/citrineos/citrineos/blob/main/CONTRIBUTING.md).

## Licensing

CitrineOS and its subprojects are licensed under the Apache License, Version 2.0. See LICENSE for the full license text.

## Support and Contact

If you have any questions or need assistance, feel free to reach out to us on our community forum or create an issue on the GitHub repository.

## Roadmap

A more detailed roadmap is coming soon.

- Support for Kafka Streams
- Support for OCPP 2.0.1 Core Profile
- OCA Certification (OCPP 2.0.1 Core Profile)
- Adding plugin management
- Implementing ISO15118 Plug and Charge (PnC)
- Adding OCPP inspector for debugging
- Adding OCPI 3.0 reference implementation