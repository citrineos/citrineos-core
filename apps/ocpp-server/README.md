<!--
SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project

SPDX-License-Identifier: Apache-2.0
-->

![CitrineOS Logo](../../logo_white.png#gh-dark-mode-only)
![CitrineOS Logo](../../logo_black.png#gh-light-mode-only)

# CitrineOS Server (`@citrineos/ocpp-server`)

This is the OCPP server application for CitrineOS — the runnable entrypoint that wires together
[`@citrineos/base`](../../packages/base) and [`@citrineos/ocpp`](../../packages/ocpp) into a deployable
service. It hosts the WebSocket endpoints that charging stations connect to, the OCPP message router, the
HTTP/REST Data and Message APIs, and the Sequelize database migrations.

It is one workspace member of the `citrineos-core` pnpm monorepo. For repository-wide setup (cloning,
`pnpm install`, building, the full-stack Docker Compose files, and the operator UI), see the
[root README](../../README.md).

The server class itself lives in `@citrineos/core` as
[`CitrineOSServer`](../../packages/core/src/server/CitrineOSServer.ts); this app is only the
entrypoint that loads config and runs it. Downstream distributions should subclass that class rather
than copy it — see [Extending `CitrineOSServer`](../../packages/core/src/server/README.md).

How the server wires its dependencies — the Awilix container, module/service registration, and the
bootstrap sequence — is documented in
[`DEPENDENCY_INJECTION.md`](../../packages/core/src/server/DEPENDENCY_INJECTION.md), alongside the
server class it describes.

## Table of Contents

- [Running the Server](#running-the-server)
  - [With Docker (backend only)](#with-docker-backend-only)
  - [Without Docker](#without-docker)
- [Attaching a Debugger](#attaching-a-debugger)
- [Server Ports](#server-ports)
- [Database Migrations](#database-migrations)
  - [Table Partitioning](#table-partitioning)
- [Configuration](#configuration)
  - [Naming](#naming)
  - [Server and logging](#server-and-logging)
  - [Database](#database)
  - [Message broker and cache](#message-broker-and-cache)
  - [File access](#file-access)
  - [Websocket servers](#websocket-servers)
  - [OCPP behaviour](#ocpp-behaviour)
  - [Timeouts](#timeouts)
  - [Modules](#modules)
  - [API authentication](#api-authentication)
  - [Certificate authorities](#certificate-authorities)
  - [Running several instances side by side](#running-several-instances-side-by-side)
- [Generating OCPP Interfaces](#generating-ocpp-interfaces)
- [Validating Custom OCPP DataTransfer Messages](#validating-custom-ocpp-datatransfer-messages)
- [Allow Unknown Charging Stations & Auto-Commissioning](#allow-unknown-charging-stations--auto-commissioning)
- [Hasura Metadata](#hasura-metadata)
- [Testing with EVerest](#testing-with-everest)

## Running the Server

Make sure the workspace has been installed and built first (from the repository root: `pnpm install && pnpm run build`).

### With Docker (backend only)

From the repository root, the `--solo` flag brings up the server plus its supporting services — RabbitMQ, PostgreSQL,
MinIO, and Hasura — but **not** the operator UI:

```shell
pnpm citrine --solo            # from published images
pnpm citrine --solo --local    # built from local source
```

To run the full stack including the operator UI (or to add the OCPI server), drop `--solo` or add `--ocpi` — see the
[root README](../../README.md#running-the-full-stack-with-docker). For live-reload development against the source tree,
run the server directly with pnpm instead (below).

### Without Docker

To start the server directly with pnpm, run from the repository root:

```shell
pnpm run start
```

Or from this directory:

```shell
cd apps/ocpp-server
pnpm run start
```

This launches the server via `nodemon` (see `nodemon.json`), which builds the workspace, runs database migrations,
and then starts the process with the Node.js inspector listening on port 9229.

The schema defaults are the local-development values, so this needs no configuration to come up. To change how your
OCPP 1.6 and 2.0.1 charging stations connect, set the environment variables described under
[Configuration](#configuration), or edit [`src/assets/websocket-servers.json`](./src/assets/websocket-servers.json)
for the websocket endpoints themselves. Make sure local-only changes to that file do not make it into your PR.

## Attaching a Debugger

Whether you run the application with Docker or locally with pnpm, you can attach a debugger to port 9229 and set
breakpoints in the TypeScript code directly from your IDE.

To make the process **wait for the debugger to attach** before executing, modify the `nodemon.json` exec command from:

```shell
pnpm run build --prefix ../../ && pnpm run db:migrate && node --inspect=0.0.0.0:9229 ./dist/index.js
```

to:

```shell
pnpm run build --prefix ../../ && pnpm run db:migrate && node --inspect-brk=0.0.0.0:9229 ./dist/index.js
```

## Server Ports

When running, the server container exposes the following ports (see the root `docker-compose.yml`):

- `8080`: webserver HTTP — [Swagger](http://localhost:8080/docs)
- `8081`: websocket server, security profile 0 (no auth)
- `8082`: websocket server, security profile 1 (basic HTTP auth)
- `8443`: websocket server, security profile 2 (TLS)
- `8444`: websocket server, security profile 3 (mTLS)
- `9229`: Node.js debugger

The websocket ports come from [`src/assets/websocket-servers.json`](./src/assets/websocket-servers.json); change that
file and the published ports in `docker-compose.yml` together.

## Database Migrations

CitrineOS uses Sequelize migrations to manage database schema changes. The `pnpm run db:migrate` script — run
automatically on start via `nodemon.json`, and on container start via `entrypoint.sh` — applies any pending
migrations.

### Table Partitioning

`OCPPMessages` is range partitioned on `createdAt`, one partition per ISO week, keeping a rolling retention window.
Migration `20260813120000-partition-ocpp-messages` performs the conversion: it copies only the rows inside the
retention window into the partitioned table. Everything older is left behind in
`OCPPMessages_old` for you to archive and drop — that is how old data leaves the live table.

Two things to know when working with the model:

- The primary key is the composite `(id, "createdAt")`, since a unique constraint on a partitioned table must contain
  the partition key. `id` alone is no longer database-enforced unique — only the shared sequence keeps it so, so never
  supply `id` explicitly outside a migration.
- `requestMessageId` has no foreign key: a foreign key must target a complete unique key, and `(id)` is no longer one.
  The link is maintained solely by the correlation triggers.

There is deliberately no `DEFAULT` partition, so an insert whose `createdAt` falls outside every provisioned week fails
outright. `rotate_ocpp_messages_partitions(retain_weeks, future_weeks, dry_run)` provisions upcoming weeks and drops
expired ones; `entrypoint.sh` calls it on every start to provision only, never to drop when running locally.

All week boundaries are computed in UTC. Every component that creates partitions must agree on the timezone, or a new
partition's lower bound will not meet the previous partition's upper bound.

```shell
# provision upcoming partitions by hand (never drops anything)
pnpm run db:partitions
```

## Configuration

Configuration comes from environment variables, validated on startup against the Zod schema in
[`packages/types/src/config/types.ts`](../../packages/types/src/config/types.ts). That schema is the authoritative
reference — the tables below list the settings most people need, not every field.

Two things are not environment variables: the [websocket servers](#websocket-servers) come from a mounted JSON file,
and `APP_NAME` selects what the process runs (`all`, `router`, `modules`, or a single module name).

If you are coming from a checkout that used `src/config/envs/local.ts` and `docker.ts`, see
[Migrating from the Old Configuration](../../README.md#migrating-from-the-old-configuration) in the root README for a
field-by-field mapping.

### Naming

Take `CITRINEOS_` and append the path to the field, uppercased, with one underscore per level:

| Setting                            | Variable                                     |
| ---------------------------------- | -------------------------------------------- |
| `logLevel`                         | `CITRINEOS_LOGLEVEL`                         |
| `database.host`                    | `CITRINEOS_DATABASE_HOST`                    |
| `messageBroker.amqp.url`           | `CITRINEOS_MESSAGEBROKER_AMQP_URL`           |
| `timeouts.maxCallLengthSeconds`    | `CITRINEOS_TIMEOUTS_MAXCALLLENGTHSECONDS`    |
| `fileAccess.local.defaultFilePath` | `CITRINEOS_FILEACCESS_LOCAL_DEFAULTFILEPATH` |

The underscore separates **levels, not words** — a camelCase field name stays one segment. Names are matched
case-insensitively, so `citrineos_database_host` works too.

Values are parsed as JSON when they can be and used as a raw string otherwise, so numbers and booleans need no
quoting, an object can set a whole block at once (`CITRINEOS_DATABASE='{"host":"db","port":5432}'`), and `'{}'` opts
into an optional block using all of its defaults.

Anything you do not set takes its schema default, and the defaults are the local-development values — so running
outside Docker generally needs no environment at all. A variable that does not resolve to a schema field is reported
at startup as `refers to unknown configuration field '<segment>'` and ignored, so check the first lines of output
after changing configuration.

### Server and logging

| Variable                     | Default               | Notes                                                 |
| ---------------------------- | --------------------- | ----------------------------------------------------- |
| `CITRINEOS_ENV`              | `development`         | `development` or `production`; affects log formatting |
| `CITRINEOS_HOST`             | `0.0.0.0`             | HTTP bind address                                     |
| `CITRINEOS_PORT`             | `8080`                | HTTP port                                             |
| `CITRINEOS_LOGLEVEL`         | `2`                   | 0–6; 2 is debug                                       |
| `CITRINEOS_SWAGGER_ENABLED`  | `true`                | Set `false` to stop serving the docs                  |
| `CITRINEOS_SWAGGER_PATH`     | `/docs`               | Where the docs are mounted                            |
| `CITRINEOS_SWAGGER_LOGOPATH` | `src/assets/logo.png` | Resolved from the working directory, not `fileAccess` |

### Database

| Variable                        | Default     |
| ------------------------------- | ----------- |
| `CITRINEOS_DATABASE_HOST`       | `localhost` |
| `CITRINEOS_DATABASE_PORT`       | `5432`      |
| `CITRINEOS_DATABASE_DATABASE`   | `citrine`   |
| `CITRINEOS_DATABASE_USERNAME`   | `citrine`   |
| `CITRINEOS_DATABASE_PASSWORD`   | `citrine`   |
| `CITRINEOS_DATABASE_DIALECT`    | `postgres`  |
| `CITRINEOS_DATABASE_SYNC`       | `false`     |
| `CITRINEOS_DATABASE_ALTER`      | `false`     |
| `CITRINEOS_DATABASE_FORCE`      | `false`     |
| `CITRINEOS_DATABASE_MAXRETRIES` | `3`         |
| `CITRINEOS_DATABASE_RETRYDELAY` | `1000`      |

Connection pooling and TLS are optional blocks: `CITRINEOS_DATABASE_POOL_MAX`, `..._POOL_MIN`, `..._POOL_ACQUIRE`,
`..._POOL_IDLE`, and `CITRINEOS_DATABASE_SSL_REQUIRE`, `..._SSL_REJECTUNAUTHORIZED`, `..._SSL_CA`.

The migration runner reads the same variables, through
[`src/config/sequelize-bridge.config.ts`](./src/config/sequelize-bridge.config.ts) — so `pnpm run db:migrate` and the
server always agree on which database they are talking to.

### Message broker and cache

| Variable                                                | Default                             |
| ------------------------------------------------------- | ----------------------------------- |
| `CITRINEOS_MESSAGEBROKER_AMQP_URL`                      | `amqp://guest:guest@localhost:5672` |
| `CITRINEOS_MESSAGEBROKER_AMQP_EXCHANGE`                 | `citrineos`                         |
| `CITRINEOS_MESSAGEBROKER_AMQP_MAXRECONNECTDELAYSECONDS` | `30`                                |
| `CITRINEOS_MESSAGEBROKER_AMQP_INSTANCEIDENTIFIER`       | unset                               |
| `CITRINEOS_CACHE_TYPE`                                  | `memory`                            |

For Redis, set `CITRINEOS_CACHE_TYPE=redis` and `CITRINEOS_CACHE_URL` to a `redis://` or `rediss://` URL. There is no
host/port form.

### File access

`fileAccess` is the storage the server reads its runtime files through — the websocket servers file, TLS material, the
ACME account key, RBAC rules. Keys inside it resolve against the configured root.

| Variable                    | Default                               |
| --------------------------- | ------------------------------------- |
| `CITRINEOS_FILEACCESS_TYPE` | `local` — one of `local`, `s3`, `gcp` |

When `local`:

- `CITRINEOS_FILEACCESS_LOCAL_DEFAULTFILEPATH` — root directory, relative to the process working directory
  (default `src/assets`). The working directory differs between setups: running with pnpm from this package it is
  `apps/ocpp-server`, while in the Docker image it is the repository root, which is why `docker-compose.yml` sets this
  to `apps/ocpp-server/src/assets`.

When `s3`:

- `CITRINEOS_FILEACCESS_S3_REGION` — AWS region (optional)
- `CITRINEOS_FILEACCESS_S3_ENDPOINT` — endpoint URL, for MinIO or a custom S3
- `CITRINEOS_FILEACCESS_S3_DEFAULTBUCKETNAME` — bucket name (default `citrineos-s3-bucket`)
- `CITRINEOS_FILEACCESS_S3_S3FORCEPATHSTYLE` — force path style (default `true`)
- `CITRINEOS_FILEACCESS_S3_ACCESSKEYID` / `CITRINEOS_FILEACCESS_S3_SECRETACCESSKEY` — credentials; the AWS SDK's own
  `AWS_*` variables also work

When `gcp`:

- `CITRINEOS_FILEACCESS_GCP_PROJECTID` — project ID (required)
- `CITRINEOS_FILEACCESS_GCP_DEFAULTBUCKETNAME` — bucket name (default `citrineos-s3-bucket`)
- `CITRINEOS_FILEACCESS_GCP_CREDENTIALS` — credentials object as JSON. If unset, Application Default Credentials are
  used (`GOOGLE_APPLICATION_CREDENTIALS`, or gcloud CLI credentials)

### Websocket servers

The websocket endpoints charging stations connect to are listed in a JSON file read through `fileAccess`, not in
environment variables — [`src/assets/websocket-servers.json`](./src/assets/websocket-servers.json) by default,
relocatable with `CITRINEOS_WEBSOCKETSERVERCONFIGFILE`.

Each entry requires `id` (unique), `host`, `port`, `protocols`, `securityProfile`, and **exactly one** of `tenantId`
or `dynamicTenantResolution`. Security profiles 2 and 3 additionally require TLS material — `tlsKeyFilePath` and
`tlsCertificateChainFilePath`, plus `mtlsCertificateAuthorityKeyFilePath` for profile 3. Those paths resolve against
the `fileAccess` root, so they are written as `certificates/leafKey.pem`.

The file is validated on startup and a bad entry stops the server with the failing index and reason.

### OCPP behaviour

| Variable                                   | Default    | Notes                                                                    |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------ |
| `CITRINEOS_OCPP_HEARTBEATINTERVAL`         | `60`       | Seconds, sent to stations on boot                                        |
| `CITRINEOS_OCPP_BOOTRETRYINTERVAL`         | `15`       | Seconds, sent when a boot is Pending or Rejected                         |
| `CITRINEOS_OCPP_UNKNOWNCHARGERSTATUS`      | `Accepted` | `Accepted`, `Pending` or `Rejected`, for stations with no BootConfig row |
| `CITRINEOS_OCPP_GETBASEREPORTONPENDING`    | `true`     |                                                                          |
| `CITRINEOS_OCPP_BOOTWITHREJECTEDVARIABLES` | `false`    |                                                                          |
| `CITRINEOS_OCPP_AUTOACCEPT`                | `true`     | When `false`, boot status is never promoted automatically                |

These apply to every OCPP version; there is no longer a per-protocol split. See
[Allow Unknown Charging Stations & Auto-Commissioning](#allow-unknown-charging-stations--auto-commissioning) for how
they interact with station provisioning.

### Timeouts

| Variable                                               | Default |
| ------------------------------------------------------ | ------- |
| `CITRINEOS_TIMEOUTS_MAXCALLLENGTHSECONDS`              | `20`    |
| `CITRINEOS_TIMEOUTS_MAXCACHINGSECONDS`                 | `30`    |
| `CITRINEOS_TIMEOUTS_SHUTDOWNGRACEPERIODSECONDS`        | `30`    |
| `CITRINEOS_TIMEOUTS_REALTIMEAUTHDEFAULTTIMEOUTSECONDS` | `15`    |
| `CITRINEOS_TIMEOUTS_NOTREADYTHRESHOLDSECONDS`          | `60`    |
| `CITRINEOS_TIMEOUTS_STALECALLMAXAGESECONDS`            | unset   |

`maxCachingSeconds` may not be lower than `maxCallLengthSeconds`; the schema rejects that combination.

### Modules

| Variable                                                         | Default |
| ---------------------------------------------------------------- | ------- |
| `CITRINEOS_TRANSACTIONS_COSTUPDATEDINTERVAL`                     | `60`    |
| `CITRINEOS_TRANSACTIONS_SENDCOSTUPDATEDONMETERVALUE`             | unset   |
| `CITRINEOS_TRANSACTIONS_RECEIPTBASEURL`                          | unset   |
| `CITRINEOS_EVDRIVER_ENABLEGETCHARGINGPROFILESONSTARTTRANSACTION` | `false` |

Exactly one of `costUpdatedInterval` or `sendCostUpdatedOnMeterValue` must be set. Signed meter values are an optional
block: `CITRINEOS_TRANSACTIONS_SIGNEDMETERVALUES_PUBLICKEYFILEID`, `..._SIGNINGMETHOD`,
`..._REJECTUNSUPPORTEDSIGNEDMETERVALUES`.

### API authentication

`auth.localBypass` defaults to `true`, which accepts every request and is intended for development only. For OIDC,
set `CITRINEOS_AUTH_LOCALBYPASS=false` and the OIDC block:

- `CITRINEOS_AUTH_OIDC_JWKSURI`, `CITRINEOS_AUTH_OIDC_ISSUER`, `CITRINEOS_AUTH_OIDC_AUDIENCE`
- `CITRINEOS_AUTH_OIDC_CACHETIMESECONDS`, `CITRINEOS_AUTH_OIDC_RATELIMIT` (optional)

Either the OIDC block or `localBypass` must be present. Role rules are loaded from a file under `fileAccess`:
`CITRINEOS_RBAC_RULESFILENAME` (default `rbac-rules.json`) and `CITRINEOS_RBAC_RULESDIR`.

### Certificate authorities

Both CAs are opt-in and off by default. Each is zero-config once enabled, so an empty object is enough:

```shell
CITRINEOS_INTEGRATIONS_V2GCA='{}'              # Hubject test PKI
CITRINEOS_INTEGRATIONS_CHARGINGSTATIONCA='{}'  # ACME, Let's Encrypt staging
```

Override individual fields as needed — `CITRINEOS_INTEGRATIONS_V2GCA_HUBJECT_CLIENTID` and `..._CLIENTSECRET` (the
defaults are placeholders and cannot issue anything real), or
`CITRINEOS_INTEGRATIONS_CHARGINGSTATIONCA_ACME_ENV` (`staging` / `production`), `..._ACME_EMAIL` and
`..._ACME_ACCOUNTKEYFILEPATH` (default `certificates/acme_account_key.pem`, resolved against the `fileAccess` root).

With neither enabled, the certificate-signing endpoints and the Certificates module's CA-backed operations raise an
error when used; everything else runs normally.

### Running several instances side by side

The prefix itself can be changed by passing `--env-prefix=` to the server process:

```shell
node dist/index.js --env-prefix=instance1_
```

That instance then reads `INSTANCE1_*` variables. The flag **replaces** the prefix rather than adding one, so
`CITRINEOS_*` names are ignored for that process.

## Generating OCPP Interfaces

All CitrineOS interfaces for OCPP 1.6, 2.0.1, and 2.1-defined schemas were procedurally generated using a processing
script. Schemas are sourced from official OCPP JSON files.
As of release 1.8.0, the schema files used by CitrineOS are not the raw output of this function; we have added
field-level validation that the official schemas lack.

## Validating Custom OCPP DataTransfer Messages

It is possible to add custom JSON schemas to validate the data fields of DataTransfer messages, which are supported by
all OCPP versions.
<<<<<<< HEAD
The OCPP message validator is created in `packages/core/src/server/CitrineOSServer.ts`. Register a DataTransfer schema by
=======
The OCPP message validator is created in `apps/ocpp-server/src/citrine-os-server.ts`. Register a DataTransfer schema by
>>>>>>> next
compiling it onto that validator's AJV and passing it in:

```ts
const ocppAjv = OCPPValidator.createValidatorAjvInstance();
ocppAjv.compile(MyDataTransferRequestSchema);
```

Note: The schema's `$id` field must follow this format:

```
${protocol}-${dataTransferRequest.vendorId}${dataTransferRequest.messageId ? `-${dataTransferRequest.messageId}` : ''}
```

'Protocol' is the OCPP websocket subprotocol, i.e. "ocpp1.6", "ocpp2.0.1", or so on.

CitrineOS's validation logic assumes that the data field is a string field with JSON structure, and uses `JSON.parse`
before validation. Other approaches to custom DataTransfer message types are not supported.

## Allow Unknown Charging Stations & Auto-Commissioning

The System Configuration defines websocket servers with certain properties, one of which is 'Allow Unknown Charging
Stations', a boolean that permits charging stations which are not commissioned to connect to CitrineOS.
This triggers an auto-commissioning flow: the moment any client connects to such a websocket server, a `ChargingStations` row is created for it (recording its online state and OCPP protocol), and evses and connectors are created for that station in response to StatusNotifications.
This is not recommended for production; it is exclusively for testing and is enabled by the default configuration only
on the websocket server at port 8081 — which also has no security.
Since not all information on the charger is necessarily available in the OCPP messages, commissioning may be wrong and
will be incomplete. In 1.6 in particular, multi-evse stations will not commission properly because 1.6 does not have a
concept of 'evses'. This will lead to improper behavior if a 1.6 station with multiple evses is auto-commissioned:
CitrineOS will assume each new transaction is on the same evse and will automatically mark older transactions on that
evse as inactive, leading to an inconsistent state with the charging station.

> [!WARNING]
> **`allowUnknownChargingStations` is intended for development and testing only. DO NOT USE IN PRODUCTION ENVIRONMENTS.**
> When enabled, CitrineOS automatically creates a `ChargingStations` record immediately upon websocket connection.

## Hasura Metadata

In order for Hasura to track the existing Citrine tables and relationships, this repository comes with Hasura metadata
already exported into the `apps/ocpp-server/hasura-metadata` folder.
Running the Docker container will automatically import this metadata and track all tables and relationships.

Unfortunately, Hasura doesn't currently support importing metadata from a JSON (which is the format if you export your
metadata from the Hasura UI or API).
Refer to this issue for more information: https://github.com/hasura/graphql-engine/issues/8423#issuecomment-1115996153.

Therefore, you must use the Hasura CLI to re-export your metadata, should something change with it. As explained in the
Hasura docs https://hasura.io/docs/2.0/migrations-metadata-seeds/auto-apply-migrations/#auto-apply-metadata,
Hasura provides an image called `hasura/graphql-engine:<version>.cli-migrations-v3` that will process and import the
metadata first before starting the server and runs the Hasura CLI internally. This is the image CitrineOS normally uses
in order to automatically load accurate metadata. However, if you want to capture the current state of your database,
you should use a normal version tag (such as `v2.40.3` instead of `v2.40.3.cli-migrations-v3`). Then proceed to the
Hasura console at `localhost:8090`, go to the data tab, use the sidebar to navigate to the database schema at
default>public, and track all of the tables, relationships, and functions you need. Then proceed with the below
instructions.

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

- Export the metadata by executing this command in the `graphql-engine` container:

```
hasura-cli metadata export
OR
hasura metadata export
```

- Find the exported files in the `graphql-engine` container's files in the metadata filepath `<name of project i.e. citrine>/metadata` and pull that metadata backup onto your local machine
- Copy the contents of the copied `metadata` folder into the `apps/ocpp-server/hasura-metadata` folder in this repository

## Testing with EVerest

In case you don't have a charger that supports OCPP to experiment with, you can run the EVerest charger simulator
locally and point it at CitrineOS. Helper scripts (`pnpm run start:everest` and `pnpm run start:everest:16`) and full
instructions live in [`everest/README.md`](./everest/README.md).
