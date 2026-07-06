<!--
SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project

SPDX-License-Identifier: Apache-2.0
-->

![CitrineOS Logo](../../logo_white.png#gh-dark-mode-only)
![CitrineOS Logo](../../logo_black.png#gh-light-mode-only)

# CitrineOS OCPI Server (`@citrineos/ocpi-demo`)

The **CitrineOS OCPI Server** is the runnable application that exposes the
[Open Charge Point Interface (OCPI)](https://evroaming.org/ocpi/) APIs for **CitrineOS**, an open-source, modular
backend platform for managing Electric Vehicle (EV) charging infrastructure.

It hosts the OCPI HTTP endpoints (versions, credentials, locations, sessions, CDRs, tokens, tariffs, charging
profiles, and commands) and bridges them to the rest of CitrineOS. It is designed to run **alongside CitrineOS Core**,
which provides the OCPP message handling, charging station management, persistence layer, and GraphQL APIs.

> ⚠️ **Important:**
> The OCPI Server **does not run standalone**.
> A running instance of **CitrineOS Core** (the OCPP server stack, including PostgreSQL, RabbitMQ, and Hasura) is
> required. See [Getting Started](#getting-started).

This app is one workspace member of the `citrineos-core` pnpm monorepo. For repository-wide setup and for running the
full stack (server + UI + Hasura) together, see the [root README](../../README.md).

---

## Table of Contents

- [Overview](#overview)
- [Architecture & Data Flow](#architecture--data-flow)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Start CitrineOS Core (the OCPP server)](#1-start-citrineos-core-the-ocpp-server)
  - [2. Start the OCPI Server](#2-start-the-ocpi-server)
    - [Running with Docker](#running-with-docker-recommended)
    - [Running with pnpm (Local Development)](#running-with-pnpm-local-development)
- [How the OCPI Server Connects to Core](#how-the-ocpi-server-connects-to-core)
- [Server Ports & Endpoints](#server-ports--endpoints)
- [Working with workspace packages](#working-with-workspace-packages)
- [Configuration](#configuration)
- [Related Documentation](#related-documentation)
- [Contributing](#contributing)
- [Licensing](#licensing)
- [Support & Contact](#support--contact)

---

## Overview

The CitrineOS OCPI Server provides:

- A standards-compliant **OCPI** interface for roaming and interoperability with other EV charging networks
- The OCPI modules: **Versions, Credentials, Locations, Sessions, CDRs, Tokens, Tariffs, Charging Profiles, and
  Commands**
- A bridge that forwards OCPI commands (e.g. remote start/stop) to **CitrineOS Core**'s OCPP Message APIs

The OCPI Server consumes:

- **CitrineOS Core's PostgreSQL database** for shared persistence
- **CitrineOS Core's RabbitMQ broker** for messaging
- **CitrineOS Core's Message APIs** to dispatch commands to charging stations
- **Hasura GraphQL Engine** for data access

---

## Architecture & Data Flow

```text
+-------------------+      OCPI (REST)      +----------------------+
|                   |  <----------------->  |                      |
|  Roaming Partner  |                       |  OCPI Server         |
|  / eMSP / CPO     |                       |  (port 8085)         |
|                   |                       |                      |
+-------------------+                       +----------+-----------+
                                                       |
                          Message APIs / AMQP / SQL    |
                                                       |
                                            +----------v-----------+
                                            |                      |
                                            |  CitrineOS Core      |
                                            |  (OCPP 1.6 & 2.0.1)  |
                                            |  + PostgreSQL        |
                                            |  + RabbitMQ          |
                                            |  + Hasura            |
                                            +----------------------+
```

## Prerequisites

Before starting, ensure the following tools are installed:

- **Node.js** (v24.16.0 or higher)
  [Link](https://nodejs.org)

- **pnpm**
  [Link](https://pnpm.io/installation) — the workspace's package manager

- **Docker & Docker Compose** (recommended)
  [Link](https://www.docker.com/products/docker-desktop/)

The following service must be running before starting the OCPI Server:

- **CitrineOS Core** (the OCPP server stack)
  Provides PostgreSQL, RabbitMQ, the OCPP Message APIs, and Hasura. See the
  [Server README](../ocpp-server/README.md).

## Getting Started

Install all workspace dependencies once from the repository root, then build the workspace:

```bash
# from the repository root
pnpm install
pnpm run build
```

### Running with Docker (Recommended)

The OCPI Server runs as part of the unified stack. From the repository root, the `--ocpi` flag brings up CitrineOS Core
(`citrine`, PostgreSQL, RabbitMQ, MinIO, Hasura), the operator UI, and the OCPI Server together:

```bash
pnpm citrine --ocpi
```

All three services use published `ghcr.io` images by default; pass `--local` to build them from source instead. The
OCPI image (`ghcr.io/citrineos/citrineos-ocpi`) is published starting with the first release tag (see
`.github/workflows/push-release-tagged-ocpi.yml`) — until that tag exists, run `--ocpi --local` so the OCPI Server
builds from source instead of trying to pull. The OCPI Server is then available at
[http://localhost:8085](http://localhost:8085). For the full flag matrix, see the
[root README](../../README.md#running-the-full-stack-with-docker).

### Running with pnpm (Local Development)

You can also run the OCPI Server directly with pnpm. Bring up Core first for its database, broker, and APIs
(`pnpm citrine --solo` from the repository root), then from this directory:

```bash
cd apps/ocpi-server
pnpm run start
```

This launches the OCPI Server via `nodemon` (see `nodemon.json`), which builds the workspace, runs database
migrations, and starts the process with the Node.js inspector listening on port `9229`. Hot reload is enabled for
`src` and the workspace packages it depends on.

To change the configuration used outside of Docker, adjust `src/config/envs/local.ts`. Make sure any changes to the
local configuration do not make it into your PR.

## How the OCPI Server Connects to Core

The OCPI Server does not own a database, broker, or Hasura instance. It runs in the same Compose project as Core (the
root `docker-compose.yml`, under the `ocpi` profile) and reaches Core's services by their Compose service names over
the shared `citrineos` network:

- `ocpp-db` — PostgreSQL (shared persistence)
- `amqp-broker` — RabbitMQ, on the shared `citrineos` exchange
- `citrine` — the OCPP server's Message APIs (for remote start/stop, unlock connector)
- `graphql-engine` — Hasura GraphQL Engine

Because they share a Compose project, the OCPI service declares `depends_on` these services and the launcher starts
everything together — there is no separate "start Core first" step when you use `pnpm citrine --ocpi`.

## Server Ports & Endpoints

When running, the OCPI Server exposes:

- `8085`: OCPI HTTP server — endpoints are served under `/ocpi`
- `9229`: Node.js debugger (commented out in the root `docker-compose.yml`; uncomment the `citrineos-ocpi` port mapping to attach)

The following OCPI modules are mounted:

| Module            | Endpoint prefix     |
| ----------------- | ------------------- |
| Versions          | `/versions`         |
| Credentials       | `/credentials`      |
| Locations         | `/locations`        |
| Sessions          | `/sessions`         |
| CDRs              | `/cdrs`             |
| Tokens            | `/tokens`           |
| Tariffs           | `/tariffs`          |
| Charging Profiles | `/chargingprofiles` |
| Commands          | `/commands`         |

## Working with workspace packages

The OCPI Server depends on `@citrineos/base`, `@citrineos/core`, and `@citrineos/ocpi-base` via `workspace:*`
dependencies, so pnpm resolves them from the local `packages/` directory automatically — no `npm link` step is
required. Just build the workspace packages so the compiled output is available:

```bash
# from the repository root
pnpm run build
```

## Configuration

Configuration is defined per environment under `src/config/envs/`:

- `local.ts` — used when running with pnpm (`APP_ENV=local`); defaults to `localhost` for the database and Hasura.
- `docker.ts` — used inside Docker (`APP_ENV=docker`); points at Core's Compose service names (`ocpp-db`,
  `graphql-engine`, `amqp-broker`, `citrine`).

Most values can be overridden at runtime via environment variables (see the `citrineos-ocpi` `environment` block in the
root `docker-compose.yml`
and the `process.env.*` fallbacks in the config files), including `DB_HOST`, `DB_PORT`, `AMQP_URL`, `AMQP_EXCHANGE`,
`GRAPHQL_ENDPOINT`, and the OCPI server `PORT`.

## Related Documentation

- **CitrineOS Core / OCPP Server**
  - [Server README](../ocpp-server/README.md)
- **CitrineOS Operator UI**
  - [Operator UI README](../operator-ui/README.MD)
- **CitrineOS Project Docs**
  - [Docs](https://citrineos.github.io)
- **OCPI Specification**
  - [EV Roaming Foundation](https://evroaming.org/ocpi/)

## Contributing

We welcome contributions from the community. If you would like to contribute to CitrineOS, please follow
our [contribution guidelines](https://github.com/citrineos/citrineos/blob/main/CONTRIBUTING.md).

## Licensing

CitrineOS and its subprojects are licensed under the Apache License, Version 2.0.

## Support and Contact

If you need help or want to report an issue:

- Open an issue on GitHub
- Reach out via the CitrineOS community channels
