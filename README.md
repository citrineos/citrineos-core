![CitrineOS Logo](logo_white.png#gh-dark-mode-only)
![CitrineOS Logo](logo_black.png#gh-light-mode-only)

<div align="center">
<img src="OCPP_201_Logo_core_and_advanced_security.png" alt="CitrineOS Certification Logo" width="200" height="100" />
</div>

# Welcome to CitrineOS

CitrineOS is an open-source project aimed at providing a modular server runtime for managing Electric Vehicle (EV)
charging infrastructure. This README will guide you through the process of installing and running CitrineOS.

This is the main part of CitrineOS containing the actual charging station management logic, OCPP message routing and all
modules.

All other documentation and the issue tracking can be found in our main repository
here: <https://github.com/citrineos/citrineos>.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Starting the Server without Docker](#starting-the-server-without-docker)
- [Attaching Debugger](#attaching-debugger)
- [Usage](#usage)
- [Testing with EVerest](#testing-with-everest)
- [Running clean and fresh](#running-clean-and-fresh)
- [Linting and Prettier](#linting-and-prettier)
- [Information on Docker setup](#information-on-docker-setup)
- [Generating OCPP Interfaces](#generating-ocpp-interfaces)
- [Hasura Metadata](#hasura-metadata)
- [Contributing](#contributing)
- [Licensing](#licensing)
- [Support and contact](#support-and-contact)
- [Roadmap](#roadmap)

## Overview

CitrineOS is developed in TypeScript and runs on `NodeJS` with [ws](https://github.com/websockets/ws)
and [fastify](https://fastify.dev/).

The system features:

- Dynamic OCPP 2.0.1 message schema validation, prior to transmission using `AJV`
- Generated OpenAPIv3 specification for easy developer access
- Configurable logical modules with decorators
  - `@AsHandler` to handle incoming OCPP 2.0.1 messages
  - `@AsMessageEndpoint` to expose functions allowing to send messages to charging stations
  - `@AsDataEndpoint` to expose CRUD access to entities defined in `01_Data`
- Utilities to connect and extend various message broker and cache mechanisms
  - Currently supported brokers are `RabbitMQ` and `Kafka`
  - Currently supported caches are `In Memory` and `Redis`

For more information on the project go to [citrineos.github.io](https://citrineos.github.io).

### Prerequisites

Before you begin, make sure you have the following installed on your system:

- Node.js (v22.11 or higher): [Download Node.js](https://nodejs.org/)
- npm (Node Package Manager): [Download npm](https://www.npmjs.com/get-npm)
- Docker (Optional). Version >= 20.10: [Download Docker](https://docs.docker.com/get-docker/)

### Installation

1. Clone the CitrineOS repository to your local machine:

   ```shell
   git clone https://github.com/citrineos/citrineos-core
   ```

1. Install project dependencies from root dir:

   ```shell
   npm run install-all
   ```

1. Build project from root dir:

   ```shell
   npm run build
   ```

1. The docker container should be initialized from `cd /Server` by running `docker-compose -f ./docker-compose.yml up -d` or
   by using the IntelliJ `Server` Run Configuration which was created for this purpose.

1. Running `docker-compose.yml` will ensure that the container is configured to expose the `:9229` debugging
   port for the underlying NodeJS process. A variety of tools can be utilized to establish a debugger connection
   with the exposed localhost 9229 port which is forwarded to the NodeJS service running within docker. The IntelliJ
   `Attach Debugger` Run Configuration was made to attach to a debugging session.

### Runtime configuration

Values from configuration files (`local.ts`, `docker.ts`, `swarm.docker.ts`) may be overridden at runtime via environment variables. Environment variables prefixed with `citrineos_` and hierarchically separated by an underscore will result in overriding said value. For example, the amqp URL:

```json
util: {
    (...)
    messageBroker: {
        amqp: {
            url: 'amqp://guest:guest@localhost:5672'
            (...)
        }
        (...)
    }
    (...)
}
```

may be overridden by setting the environment variable `CITRINEOS_util_messageBroker_amqp_url` (case-insensitive).

### Starting the Server without Docker

CitrineOS requires configuration to allow your OCPP 2.0.1 compliant charging stations to connect.

We recommend running and developing the project with the `docker-compose` set-up via the existing Run Configurations.
Additional Run Configurations should be made for other IDEs (ex VSCode).

To change necessary configuration for execution outside of `docker-compose`, please adjust the configuration file
at `Server/src/config/envs/local.ts`. Make sure any changes to the local configuration do not make it into your PR.

## Starting the Server

To start the CitrineOS server, run the following command:

```shell
cd Server
npm run start
```

This will launch the CitrineOS server with the specified configuration. The debugger will be available
on port 9229.

### Attaching Debugger

Whether you run the application with Docker or locally with npm, you should be able to attach a debugger.
With debugger attached you should be able to set breakpoints in the TS code right from your IDE and debug
with ease.

## Attaching Debugger before execution using `--inspect-brk`

You can modify `nodemon.json` exec command from:

```shell
npm run build --prefix ../ && node --inspect=0.0.0.0:9229 ./dist/index.js
```

to

```shell
npm run build --prefix ../ && node --inspect-brk=0.0.0.0:9229 ./dist/index.js
```

which will wait for the debugger to attach before proceeding with execution.

## Usage

You can now connect your OCPP 2.0.1 compliant charging stations to the CitrineOS server. Make sure to configure the
charging stations to point to the server's IP address and port as specified in the config.json file.

## Testing with EVerest

This [README](./Server/everest/README.md)

## Running `clean` and `fresh`

Our current module structure consists of multiple `npm` submodules that are loaded as dependencies
running the application. This results in the need to rebuild modules that have any file changes. In
some cases, in particular when switching between branches, especially when there are changes in the
package.json, the already built `dist` as well as the already generated `package-lock.json` may
become invalid.

To alleviate the above, we created the `npm run fresh` and the `npm run clean` commands.

`npm run fresh` - will delete all `node_modules`, `dist`, `tsbuildinfo`, `package-lock.json` and clear cache
`npm run clean` - sub set of `npm run fresh` will only delete the build files `dist` and `tsbuildinfo`

## Linting and Prettier

Eslint and Prettier have been configured to help support syntactical consistency throughout the codebase.

`npm run prettier` - will run prettier and format the files
`npm run lint` - will run linter
`npm run lint-fix` - will run prettier and linter -fix flag which will attempt to resolve any linting issues.

## Information on Docker setup

You need to install
[docker](https://docs.docker.com/engine/install/#server) (>= 20.10) and
[docker-compose](https://docs.docker.com/compose/install/#install-compose).
Furthermore, [Visual Studio
Code](https://code.visualstudio.com/docs/setup/linux) might be handy as
a common integrated development environment.

### ARM64 (Apple Silicon) Compatibility

If you're running on Apple Silicon Macs (ARM64 architecture), use the ARM64-compatible docker-compose file:

```shell
cd Server
docker-compose -f docker-compose.arm64.yml up -d
```

The `docker-compose.arm64.yml` file includes platform specifications (`platform: linux/amd64`) and compatible image versions for:

- RabbitMQ (uses version 3.12-management for better emulation compatibility)
- PostGIS/PostgreSQL
- MinIO and MinIO client
- Hasura GraphQL Engine

**Note:** The ARM64 version runs these services through x86_64 emulation, which may have slightly reduced performance but provides full compatibility.

For regular x86_64 systems, continue using the standard `docker-compose.yml`:

```shell
cd Server
docker-compose up -d
```

Once Docker is running, the following services should be available:

- **CitrineOS** (service name: citrineos) with ports
  - `8080`: webserver http - [Swagger](http://localhost:8080/docs)
  - `8081`: websocket server tcp connection without auth
  - `8082`: websocket server tcp connection with basic http auth
- **RabbitMQ Broker** (service name: amqp-broker) with ports
  - `5672`: amqp tcp connection
  - `15672`: RabbitMQ [management interface](http://localhost:15672)
- **PostgreSQL** (service name: ocpp-db), PostgreSQL database for persistence
  - `5432`: sql tcp connection
- **Directus** (service name: directus) on port 8055 with endpoints
  - `:8055/admin`: web interface (login = admin@citrineos.com:CitrineOS!)
- **Localstack** (service name: localstack) on port 4566 for mocking aws services
  - `:4566`: unified AWS service endpoint

These three services are defined in `docker-compose.yml` and they
live inside the docker network `docker_default` with their respective
ports. By default these ports are directly accessible by using
`localhost:8080` for example.

So, if you want to access the **amqp-broker** default management port via your
localhost, you need to access `localhost:15672`.

# Bootstrap Configuration Environment Variables

All environment variables use the `CITRINEOS_` prefix.
Additional prefixes can be added by passing the --env-prefix argument to nodemon (see "start:instance1" in Server/package.json)
Here's the complete list of environment variables that are used in bootstrapping the application (this is not the full system configuration):

## Basic Bootstrap Configuration

- `BOOTSTRAP_CITRINEOS_CONFIG_FILENAME` - Name of the main config file (default: `config.json`)
- `BOOTSTRAP_CITRINEOS_CONFIG_DIR` - Directory containing the config file (optional)
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE` - Type of file access: `local`, `s3`, or `directus`

## Database Configuration

Database connection details (moved from system config to bootstrap config for better security and 12-factor compliance):

- `BOOTSTRAP_CITRINEOS_DATABASE_HOST` - Database host (default: `localhost`)
- `BOOTSTRAP_CITRINEOS_DATABASE_PORT` - Database port (default: `5432`)
- `BOOTSTRAP_CITRINEOS_DATABASE_NAME` - Database name (default: `citrine`)
- `BOOTSTRAP_CITRINEOS_DATABASE_DIALECT` - Database dialect (default: `postgres`)
- `BOOTSTRAP_CITRINEOS_DATABASE_USERNAME` - Database username (optional)
- `BOOTSTRAP_CITRINEOS_DATABASE_PASSWORD` - Database password (optional)
- `BOOTSTRAP_CITRINEOS_DATABASE_SYNC` - Enable database sync (via sequelize) (true/false, default: `false`)
- `BOOTSTRAP_CITRINEOS_DATABASE_ALTER` - Enable database alter (via sequelize) (true/false, default: `false`)
- `BOOTSTRAP_CITRINEOS_DATABASE_MAX_RETRIES` - Maximum connection retries (default: `3`)
- `BOOTSTRAP_CITRINEOS_DATABASE_RETRY_DELAY` - Retry delay in milliseconds (default: `1000`)

## Local File Access

When `BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE=local`:

- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH` - Default file path (default: `/data`)

## S3 File Access

When `BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE=s3`:

- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_S3_REGION` - AWS region (optional)
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_S3_ENDPOINT` - S3 endpoint URL (for MinIO or custom S3)
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_S3_DEFAULT_BUCKET_NAME` - S3 bucket name (default: `citrineos-s3-bucket`)
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_S3_FORCE_PATH_STYLE` - Force path style (true/false, default: `true`)
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_S3_ACCESS_KEY_ID` - S3 access key ID
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_S3_SECRET_ACCESS_KEY` - S3 secret access key

## Directus File Access

When `CITRINEOS_FILE_ACCESS_TYPE=directus`:

- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_DIRECTUS_HOST` - Directus host (default: `localhost`)
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_DIRECTUS_PORT` - Directus port (default: `8055`)
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_DIRECTUS_TOKEN` - Directus API token
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_DIRECTUS_USERNAME` - Directus username
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_DIRECTUS_PASSWORD` - Directus password
- `BOOTSTRAP_CITRINEOS_FILE_ACCESS_DIRECTUS_GENERATE_FLOWS` - Generate flows (true/false, default: `false`)

## Generating OCPP Interfaces

All CitrineOS interfaces for OCPP 2.0.1-defined schemas were procedurally generated using the script in
00_Base/json-schema-processor.js.
It can be rerun:

```shell
npm run generate-interfaces -- ../../Path/To/OCPP-2.0.1_part3_JSON_schemas
```

This will replace all the files in `00_Base/src/ocpp/model/`,

## Hasura Metadata

In order for Hasura to track the existing Citrine tables and relationships, this repository comes with Hasura metadata already exported into the `hasura-metadata` folder.
Running the Docker container will automatically import this metadata and track all tables and relationships.

Unfortunately, Hasura doesn't currently support importing metadata from a JSON (which is the format if you export your metadata from the Hasura UI or API).
Refer to this issue for more information: https://github.com/hasura/graphql-engine/issues/8423#issuecomment-1115996153.

Therefore, you must use the Hasura CLI to re-export your metadata, should something change with it. As explained in the Hasura docs https://hasura.io/docs/2.0/migrations-metadata-seeds/auto-apply-migrations/#auto-apply-metadata,
Hasura provides an image called `hasura/graphql-engine:<version>.cli-migrations-v3` that will process and import the metadata first before starting the server and
runs the Hasura CLI internally. This is the image CitrineOS normally uses in order to automatically load accurate metadata. However, if you want to capture the current state of your database, you should use a normal version tag (such as `v2.40.3` instead of `v2.40.3.cli-migrations-v3`). Then proceed to the hasura console at `localhost:8090`, go to the data tab, use the sidebar to navigate to the database schema at default>public, and track all of the tables, relationships, and functions you need. Then proceed with the below instructions.

You can follow these steps to re-export your metadata via the Hasura CLI in the `graphql-engine` container:

- (if the hasura cli isn't installed):

```
curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash
```

- (If not yet initialized) Initialize the Hasura project in the `graphql-engine` container (you can do this via the Docker Desktop `exec` view):

```
hasura-cli init
OR
hasura init

enter any name you wish for the project (i.e. citrine)
```

- Export the metadata by executing this command in `graphql-engine` container:

```
hasura-cli metadata export
OR
hasura metadata export
```

- Find the exported files in the `graphql-engine` container's files in the metadata filepath `<name of project i.e. citrine>/metadata` and pull that metadata backup onto your local machine
- Copy the contents of the copied `metadata` folder into the `hasura-metadata` folder in this repository

## Contributing

We welcome contributions from the community. If you would like to contribute to CitrineOS, please follow
our [contribution guidelines](https://github.com/citrineos/citrineos/blob/main/CONTRIBUTING.md).

## Licensing

CitrineOS and its subprojects are licensed under the Apache License, Version 2.0. See LICENSE for the full license text.

## Support and Contact

If you have any questions or need assistance, feel free to reach out to us on our community forum or create an issue on
the GitHub repository.

## Roadmap

[Roadmap](https://citrineos.github.io/docs/roadmap.html)
