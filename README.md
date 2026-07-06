![CitrineOS Logo](logo_white.png#gh-dark-mode-only)
![CitrineOS Logo](logo_black.png#gh-light-mode-only)

<div align="center">
<img src="OCPP_201_Logo_core_and_advanced_security.png" alt="CitrineOS Certification Logo" width="200" height="100" />
</div>

# Welcome to CitrineOS

CitrineOS is an open-source project aimed at providing a modular server runtime for managing Electric Vehicle (EV)
charging infrastructure. This repository (`citrineos-core`) is a **pnpm monorepo** containing the charging station
management logic, OCPP message routing, the related services, and the operator-facing web UI.

This README covers the repository as a whole: how it is structured, how to install and build it, and how to run the
full stack. Each application and package also has its own README with deeper, component-specific documentation —
see [Repository Structure](#repository-structure) and [Component Documentation](#component-documentation).

All other documentation and the issue tracking can be found in our main repository
here: <https://github.com/citrineos/citrineos>.

## Table of Contents

- [Overview](#overview)
- [Architecture Flow](#architecture-flow)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Full Stack with Docker](#running-the-full-stack-with-docker)
- [Information on Docker Setup](#information-on-docker-setup)
- [Workspace Scripts](#workspace-scripts)
- [Component Documentation](#component-documentation)
- [Contributing](#contributing)
- [Licensing](#licensing)
- [Support and Contact](#support-and-contact)
- [Roadmap](#roadmap)

## Overview

CitrineOS is developed in TypeScript and runs on `NodeJS` with [ws](https://github.com/websockets/ws)
and [fastify](https://fastify.dev/). The operator UI is built with [Next.js](https://nextjs.org/) and
[Refine](https://refine.dev/).

The system features:

- Dynamic **OCPP 1.6 and 2.0.1** message schema validation, prior to transmission using `AJV`
- Generated OpenAPIv3 specification for easy developer access
- Configurable logical modules with decorators
  - `@AsHandler` to handle incoming OCPP messages (1.6 or 2.0.1)
  - `@AsMessageEndpoint` to expose functions allowing sending messages to charging stations
  - `@AsDataEndpoint` to expose CRUD access to data entities
- Utilities to connect and extend various message broker and cache mechanisms
  - Currently supported broker is **RabbitMQ**
  - Currently supported caches are **In Memory** and **Redis**
- A web-based **Operator UI** for managing locations, stations, transactions, and authorizations

For more information on the project go to [citrineos.github.io](https://citrineos.github.io).

## Architecture Flow

Here's a **flowchart-style overview** of CitrineOS architecture and message flow:

```text
┌───────────────────┐                         ┌───────────────────┐
│ Charging Stations │                         │   Operator UI     │
│  (OCPP 1.6 &      │                         │ (Next.js + Refine)│
│   2.0.1)          │                         └───┬───────────┬───┘
└────────┬──────────┘                  REST (Data │           │ GraphQL
         │ WebSocket                & Message API)│           │
         ▼                                        ▼           ▼
┌───────────────────┐                 ┌───────────────────┐ ┌──────────────┐
│  CitrineOS Server │                 │  CitrineOS Server │ │   Hasura     │
│  (OCPP Router +   │                 │   (HTTP / REST)   │ │GraphQL Engine│
│   Modules)        │                 └───────────────────┘ └──────┬───────┘
└────────┬──────────┘                                              │
         │                                                         │
   ┌─────┴─────────┐                    ┌─────────────┐            │
   ▼               ▼                    │ File Storage│            ▼
┌─────────────┐ ┌─────────────┐         │ (S3 / GCS / │      ┌─────────────┐
│ Message     │ │ PostgreSQL  │         │  MinIO)     │      │ PostgreSQL  │
│ Broker      │ │ (PostGIS)   │         └─────────────┘      │ (PostGIS)   │
│ (RabbitMQ)  │ │ Persistence │                              │ (same DB)   │
└─────────────┘ └─────────────┘                              └─────────────┘
```

### Flow Overview

1. **Charging Stations** send messages using **OCPP 1.6** or **OCPP 2.0.1**.
2. **CitrineOS Server** receives and routes messages via **WebSocket** to the **OCPP Router**.
3. The **Message Broker (RabbitMQ)** handles **inter-module communication**, enabling asynchronous processing between the OCPP Router and other server modules.
4. Operational and configuration data are persisted in **PostgreSQL** (with the PostGIS extension).
5. Files and assets are stored in **Amazon S3** or **Google Cloud Storage (GCS)** in supported environments. **MinIO** is used for **local development**, providing **S3-compatible storage**. Local development does **not** support a GCS-compatible storage backend.
6. The **Operator UI** reads data through the **Hasura GraphQL Engine** (which queries the same PostgreSQL database) and sends commands and manages entities through the server's **REST Data and Message APIs**.

## Repository Structure

This repository is a **pnpm monorepo** with the following workspace members:

```
citrineos-core/
├── apps/
│   ├── ocpp-server/          # OCPP server entrypoint, Docker setup, migrations (@citrineos/ocpp-server)
│   ├── ocpi-server/          # OCPI server (@citrineos/ocpi-server)
│   └── operator-ui/     # Operator web UI — Next.js + Refine (@citrineos/operator-ui)
├── packages/
│   ├── base/            # Shared types, interfaces, and utilities (@citrineos/base)
│   └── core/            # Core OCPP modules and logic (@citrineos/core)
├── scripts/
│   └── stack.mjs             # Docker stack launcher (selects compose files + profiles)
├── docker-compose.yml        # Base stack — published ghcr.io images, ui/ocpi profiles
├── docker-compose.local.yml  # Override: build server + UI from local source (--local)
├── package.json              # Root workspace scripts
└── pnpm-workspace.yaml        # pnpm workspace configuration
```

Each workspace member documents itself:

- **Server** — running the server, configuration, bootstrap env vars, migrations, OCPP interfaces, EVerest testing: [`apps/ocpp-server/README.md`](./apps/ocpp-server/README.md)
- **OCPI Server** — running the OCPI server and its configuration: [`apps/ocpi-server/README.md`](./apps/ocpi-server/README.md)
- **Operator UI** — running and developing the web UI, bringing a station online end-to-end: [`apps/operator-ui/README.MD`](./apps/operator-ui/README.MD)

## Prerequisites

Before you begin, make sure you have the following installed on your system:

- Node.js (v24.16.0 or higher): [Download Node.js](https://nodejs.org/)
- pnpm (the workspace's package manager): [Download pnpm](https://pnpm.io/installation)
- Docker (Optional). Version >= 20.10: [Download Docker](https://docs.docker.com/get-docker/)

## Installation

1. Clone the CitrineOS repository to your local machine:

   ```shell
   git clone https://github.com/citrineos/citrineos-core
   ```

1. Install all workspace dependencies from the root directory:

   ```shell
   pnpm install
   ```

1. Build all packages from the root directory:

   ```shell
   pnpm run build
   ```

## Running the Full Stack with Docker

The quickest way to get a complete environment running is the launcher at the repository root, which starts the
server, the operator UI, RabbitMQ, PostgreSQL, MinIO, and Hasura together. It picks the right Compose files and
profiles for you based on a few flags:

```shell
pnpm citrine            # ocpp-server + operator UI, from published ghcr.io images
pnpm citrine --local    # build the server and UI from local source instead of pulling
pnpm citrine --solo     # ocpp-server only (no operator UI)
pnpm citrine --ocpi     # also run the OCPI server
pnpm citrine --local --ocpi   # flags combine freely
pnpm citrine down       # stop the stack (pass the same flags you started it with)
```

Published images are the default because most issues users hit come from stale local builds; reach for `--local` when
you are working on the code itself. The OCPI image is published starting with the first release tag — until that tag
exists, run `--ocpi` together with `--local` so it builds from source instead of trying to pull.

Once everything is up, the operator UI is available at [http://localhost:3000](http://localhost:3000) and the server's
Swagger docs at [http://localhost:8080/docs](http://localhost:8080/docs).

To run the server directly with pnpm for development, see the [Server README](./apps/ocpp-server/README.md). To develop
the UI on its own, see the [Operator UI README](./apps/operator-ui/README.MD).

## Information on Docker Setup

You need to install
[docker](https://docs.docker.com/engine/install/#server) (>= 20.10) and
[docker-compose](https://docs.docker.com/compose/install/#install-compose).
Furthermore, [Visual Studio Code](https://code.visualstudio.com/docs/setup/linux) might be handy as a common
integrated development environment.

The stack is defined by two Compose files at the repository root, driven by the `scripts/stack.mjs` launcher:

- `docker-compose.yml` — the base stack from published `ghcr.io` images. The operator UI (`ui`) and OCPI server
  (`ocpi`) are gated behind [Compose profiles](https://docs.docker.com/compose/profiles/); the infrastructure and the
  OCPP server are always on.
- `docker-compose.local.yml` — an override (merged on top of the base) that builds the server and operator UI from
  local source. Applied by the launcher's `--local` flag.

You can call `docker compose` directly if you prefer, but the launcher saves you from remembering the file/profile
matrix — e.g. `pnpm citrine --local --ocpi` expands to
`docker compose -f docker-compose.yml -f docker-compose.local.yml --profile ui --profile ocpi up -d --build`.

Once a stack is running, the following services should be available:

- **CitrineOS Server** (service name: citrine)
  - `8080`: webserver HTTP - [Swagger](http://localhost:8080/docs)
  - `8081`: websocket server TCP connection without auth
  - `8082`: websocket server TCP connection with basic HTTP auth
  - `8083`: additional websocket server
  - `8443` / `8444`: TLS websocket servers
  - `9229`: Node.js debugger
- **Operator UI** (service name: citrine-ui) — `ui` profile, on by default (omitted with `--solo`)
  - `3000`: [Operator UI](http://localhost:3000)
- **OCPI Server** (service name: citrineos-ocpi) — `ocpi` profile, added with `--ocpi`
  - `8085`: OCPI HTTP API
- **RabbitMQ Broker** (service name: amqp-broker)
  - `5672`: AMQP TCP connection
  - `15672`: RabbitMQ [management interface](http://localhost:15672)
- **PostgreSQL** (service name: ocpp-db), PostGIS-enabled PostgreSQL database for persistence
  - `5432`: SQL TCP connection
- **MinIO** (service name: minio) for S3-compatible local file storage
  - `9000`: S3 API endpoint
  - `9001`: MinIO [web console](http://localhost:9001)
- **Hasura GraphQL Engine** (service name: graphql-engine)
  - `8090`: [Hasura console](http://localhost:8090)

These services live inside the docker network with their respective ports. By default these ports are directly
accessible using `localhost:8080` for example.

## Workspace Scripts

These scripts are run from the repository root and operate across the whole workspace.

### Building

- `pnpm run build` - builds all packages
- `pnpm citrine` - brings the Docker stack up (see [Running the Full Stack with Docker](#running-the-full-stack-with-docker) above)

To run an individual app directly, use its own `start` script — e.g. `pnpm --filter @citrineos/ocpp-server run start`,
or `cd apps/ocpp-server && pnpm start`. See each app's README for details.

### Running `clean` and `fresh`

The workspace consists of multiple `pnpm` packages that are loaded as dependencies when running the application. This
means packages need to be rebuilt when their files change. In some cases — in particular when switching between
branches, especially when there are changes in a `package.json` — the already built `dist` as well as the generated
`pnpm-lock.yaml` may become invalid.

To alleviate the above, we created the following commands (run from the root directory):

- `pnpm run clean` - deletes build artifacts across the workspace (`dist`, `.next`, and `tsconfig.tsbuildinfo`)
- `pnpm run fresh` - runs `clean`, then also removes every `node_modules` and `pnpm-lock.yaml` and clears the pnpm cache
- `pnpm run fresh:install` - convenience command that runs `fresh` followed by `pnpm install`

These operate across the whole workspace from the root, so individual packages no longer carry their own `clean` scripts.

### Linting and Prettier

ESLint and Prettier have been configured to help support syntactical consistency throughout the codebase.

- `pnpm run prettier` - runs Prettier and formats the files
- `pnpm run lint` - runs the linter
- `pnpm run lint:fix` - runs the linter with the `--fix` flag, which attempts to resolve any linting issues

### Testing

- `pnpm run test` - runs the test suite with Vitest
- `pnpm run test:coverage` - runs the test suite with coverage

## Component Documentation

- [CitrineOS Server (`@citrineos/ocpp-server`)](./apps/ocpp-server/README.md) — running the server, configuration, bootstrap
  environment variables, database migrations, OCPP interface generation, custom DataTransfer validation,
  auto-commissioning, Hasura metadata, and EVerest testing.
- [CitrineOS Operator UI (`@citrineos/operator-ui`)](./apps/operator-ui/README.MD) — running and developing the web UI,
  and a step-by-step guide to bringing a charging station online end-to-end.
- [CitrineOS OCPI Server](./apps/ocpi-server/README.md) — running the OCPI server alongside Core, the OCPI modules and
  endpoints it exposes, and how it connects to the OCPP server stack.
- [Testing with EVerest](./apps/ocpp-server/everest/README.md) — running the EVerest charger simulator against CitrineOS.

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
