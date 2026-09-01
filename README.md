![CitrineOS Logo](logo_white.png#gh-dark-mode-only)
![CitrineOS Logo](logo_black.png#gh-light-mode-only)

<div align="center">
<img src="OCPP_201_Logo_core_and_advanced_security.png" alt="CitrineOS Certification Logo" width="200" height="100" />
</div>

# Welcome to CitrineOS

CitrineOS is an open-source project aimed at providing a modular server runtime for managing Electric Vehicle (EV)
charging infrastructure. This repository (`citrineos-core`) is a **pnpm monorepo** containing the charging station
management logic, OCPP message routing, the related services, and the operator-facing web UI.

This README covers the repository as a whole: how it is structured, how to install and build it, and how to run the full
stack. Each application and package also has its own README with deeper, component-specific documentation —
see [Repository Structure](#repository-structure) and [Component Documentation](#component-documentation).

All other documentation and the issue tracking can be found in our main repository
here: <https://github.com/citrineos/citrineos>.

## Table of Contents

- [Overview](#overview)
- [Architecture Flow](#architecture-flow)
- [Repository Structure](#repository-structure)
- [HTTP API Surfaces](#http-api-surfaces)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Full Stack with Docker](#running-the-full-stack-with-docker)
- [Information on Docker Setup](#information-on-docker-setup)
- [Migrating from the Old Configuration](#migrating-from-the-old-configuration)
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
- Configurable logical modules
  - `@AsRequestHandler` / `@AsResponseHandler` to declare a handler class for an incoming OCPP message
  - A dedicated `Api` module exposing every HTTP surface, kept separate from message handling
    - `AbstractMessageEndpoint` classes under `/ocpp/<version>/…` to send messages to charging stations
    - `AbstractEndpoint` classes under `/commands` for CitrineOS-native admin operations
  - Each endpoint declares its route as a static `route` and is listed in its module's `register.ts`
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
│   └── core/            # Core OCPP modules and logic (@citrineos/ocpp)
├── scripts/
│   └── stack.mjs             # Docker stack launcher (selects compose files + profiles)
├── docker-compose.yml        # Base stack — published ghcr.io images, ui/ocpi profiles
├── docker-compose.local.yml  # Override: build server + UI from local source (--local)
├── package.json              # Root workspace scripts
└── pnpm-workspace.yaml        # pnpm workspace configuration
```

Each workspace member documents itself:

- **Server** — running the server, configuration, migrations, OCPP interfaces, EVerest testing: [`apps/ocpp-server/README.md`](./apps/ocpp-server/README.md)
- **OCPI Server** — running the OCPI server and its configuration: [`apps/ocpi-server/README.md`](./apps/ocpi-server/README.md)
- **Operator UI** — running and developing the web UI, bringing a station online end-to-end: [`apps/operator-ui/README.MD`](./apps/operator-ui/README.MD)

## HTTP API Surfaces

The server exposes three REST surfaces, each behind its own prefix:

- **`/ocpp/<version>/<module>/<action>`** — sends an OCPP message to one or more charging stations, e.g.
  `POST /ocpp/1.6/configuration/changeAvailability?identifier=cs001`. The `<version>` segment selects the
  protocol (`1.6`, `2.0.1`, `2.1`, etc.); `<module>` comes from that module's configured `endpointPrefix`.
- **`/commands/<command>`** — CitrineOS-native operations that are not a single OCPP message, e.g.
  `POST /commands/setStationPassword`.
- **`/ocpprouter/<resource>`** — router administration: websocket server configuration, tenant path
  mappings, subscriptions, TLS reload and the live system config, e.g. `DELETE /ocpprouter/connection`.

Endpoints are classes with a static `route` declaring their method, path and schemas, listed in their
package's `register.ts` — `AbstractMessageEndpoint` for the OCPP surface, `AbstractEndpoint` for the
other two.

### How endpoints become routes

Each package lists its endpoint classes in `register.ts` and registers a builder over that list:

```ts
messageEndpoints: asFunction((cradle: EndpointResolverCradle) =>
  buildMessageEndpoints(cradle.moduleScope, MESSAGE_ENDPOINTS),
).scoped(),
```

`buildEndpoints` and `buildMessageEndpoints` resolve each class through the module's DI scope and pair
the instance with its static `route`. Two things follow from that:

- An endpoint declares its dependencies as constructor properties exactly like a service — nothing is
  wired by hand at the call site.
- The resulting array is injected into the API class, whose constructor registers one Fastify route per
  entry. For message endpoints that means one route per protocol in `route.protocols`, skipped when the
  action has no schema for that version.

Which builder applies follows from the surface:

- `buildEndpoints` takes `EndpointClass` — an `AbstractEndpoint` whose static route is an
  `ICommandEndpointMetadata` (`method`, `path`) — and backs `/commands` and `/ocpprouter`.
- `buildMessageEndpoints` takes `MessageEndpointClass` — an `AbstractMessageEndpoint` whose static route
  is an `IMessageEndpointMetadata` (`action`, `protocols`, `eventGroup`) — and backs `/ocpp/<version>/…`.

Each list is declared with `satisfies ReadonlyArray<EndpointClass>` (or `MessageEndpointClass`), so
handing a class to the wrong builder is a compile error rather than a route that quietly never appears.

### Endpoints you don't have to write

Most OCPP routes need no logic of their own — validate the body, send it to each station as a Call.
`forwardMessageEndpoint` builds one of those from route metadata alone, so it is declared inline instead
of as a class. Both styles sit in the same list:

```ts
const ocpp2 = (action: OCPP_CallAction, schemaName: string) =>
  forwardMessageEndpoint({
    action,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.Transactions,
    bodySchema: ocpp2Schema(schemaName),
  });

export const TRANSACTIONS_MESSAGE_ENDPOINTS = [
  ocpp2(OCPP_CallAction.CostUpdated, 'CostUpdatedRequestSchema'),
  ocpp2(OCPP_CallAction.GetTransactionStatus, 'GetTransactionStatusRequestSchema'),
  SetDefaultTariffEndpoint,
] satisfies ReadonlyArray<MessageEndpointClass>;
```

Nothing in that list registers itself. Here is how the `CostUpdated` entry above becomes a Call on a
charging station:

1. `register.ts` hands the list to `buildMessageEndpoints`, which instantiates each class through the DI
   scope and keeps its static route beside the instance.
2. `OcppMessageApi` receives those pairs and registers one Fastify POST per entry, per protocol. The
   event group supplies the third path segment and the action's first letter is lowercased, so
   `CostUpdated` under `EventGroup.Transactions` becomes `/ocpp/2.0.1/transactions/costUpdated` and
   `/ocpp/2.1/transactions/costUpdated`.
3. A request arrives and Fastify validates it — the body against the declared `bodySchema` for that
   version, the querystring against `IMessageQuerystringSchema`. A body missing a required field is a
   400 and never reaches the code.
4. The framework handler takes `identifier`, `tenantId` and `callbackUrl` off the querystring, turns a
   single identifier into an array, and calls
   `endpoint.handle(identifiers, body, callbackUrl, tenantId, version, extraQueries)`. Anything declared
   in `optionalQuerystrings` arrives as `extraQueries`.
5. `handle` does the work. A forwarder sends one `sendCall` per identifier, and `OcppSender` finds that
   station's live WebSocket connection and writes the Call to it.
6. The `IMessageConfirmation[]` it returns becomes the HTTP response, one entry per identifier.

A confirmation means the Call was sent, not that the station obeyed it. The station's CallResult comes
back over its WebSocket to the owning module's response handler, or is POSTed to `callbackUrl` when the
caller supplied one.

Write an `AbstractMessageEndpoint` subclass only when something has to happen before or instead of that
send: reading a repository first, rewriting the payload, or splitting one request into several Calls —
as `SetVariablesEndpoint` does when it chunks a long variable list per station.

### Calling them from the Operator UI

Each surface has its own helper in `messages.utils.tsx`. The helper supplies the prefix, so the `url`
you pass is relative to it:

```ts
// → /ocpp/1.6/configuration/changeAvailability?identifier=cs001
triggerMessageAndHandleResponse({
  url: '/configuration/changeAvailability?identifier=cs001',
  ocppVersion: OCPPVersion.OCPP1_6,
  ...
});

// → /commands/setStationPassword
triggerCommandAndHandleResponse({ url: '/setStationPassword', ... });

// → /ocpprouter/connection?ocppConnectionName=cs001
triggerAdminAndHandleResponse({
  url: '/connection?ocppConnectionName=cs001',
  method: HttpMethod.Delete,
  ...
});
```

All three wrap `BaseRestClient`, which is constructed with the base path it prepends —
`ocppApiPath(version)`, `COMMANDS_API_PATH` or `ADMIN_API_PATH`, defined in `BaseRestClient.ts`.
Choosing the helper is what selects the surface, so the prefix never appears in a call site.

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
pnpm citrine                  # ocpp-server + operator UI, from published ghcr.io images
pnpm citrine --local          # build the server and UI from local source instead of pulling
pnpm citrine --solo           # ocpp-server only (no operator UI)
pnpm citrine --ocpi           # also run the OCPI server
pnpm citrine --everest        # also run EVerest with OCPP 2.x (mutually exclusive with --everest16)
pnpm citrine --everest16      # also run EVerest with OCPP 1.6 (mutually exclusive with --everest)
pnpm citrine --local --ocpi   # flags combine freely
pnpm citrine down             # stop the stack (pass the same flags you started it with)
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
  - `8081`: websocket server, security profile 0 (no auth)
  - `8082`: websocket server, security profile 1 (basic HTTP auth)
  - `8443` / `8444`: websocket servers, security profiles 2 (TLS) and 3 (mTLS)
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

## Migrating from the Old Configuration

Configuration was reworked into a single, environment-driven schema. If you are coming from a checkout that predates
that change, your existing settings will not be picked up — this section maps them across.

### What changed

Configuration used to arrive from three places at once:

| Old source                                                      | What it held                                                                                |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `apps/ocpp-server/src/config/envs/local.ts` and `docker.ts`     | the entire `SystemConfig`, hand-authored in TypeScript and selected by `APP_ENV`            |
| `config.json` in file storage                                   | a persisted copy of the above, written on first boot and preferred over the file afterwards |
| `BOOTSTRAP_CITRINEOS_*` and `CITRINEOS_*` environment variables | database and file access up front; overrides for everything else                            |

There is now one source: environment variables, validated against the Zod schema in
[`packages/types/src/config/types.ts`](./packages/types/src/config/types.ts). The `envs` directory, the `config.json`
round trip and the `BOOTSTRAP_` prefix are all gone, and the websocket server list moved into a file of its own.

Three consequences worth knowing before you start:

- **Nothing is persisted any more.** Config cannot go stale, and `CONFIG_CITRINEOS_WIPE_FILE_ON_START` no longer
  exists because there is no saved copy to wipe.
- **The schema defaults are the local-development values.** Anything you do not set takes its default, so a plain
  `pnpm start` needs no environment at all. Docker overrides only what genuinely differs — see the `citrine` service
  in `docker-compose.yml` for the complete list.
- **Typos are reported.** Any `CITRINEOS_*` variable that does not resolve to a field in the schema logs
  `refers to unknown configuration field '<segment>'` at startup and is ignored, so a misspelling is visible rather
  than quietly doing nothing. Check the first lines of the server's output after changing configuration.

### Step 1 — retire your env files

`createLocalConfig()` and `createDockerConfig()` are gone along with the directory that held them. If you kept local
edits there, translate them into environment variables using the tables below; if you had only tweaked values that
matched `local.ts`, you likely need nothing at all, since those values are now the defaults.

### Step 2 — move your websocket servers into their own file

`util.networkConnection.websocketServers` is no longer part of the system config. The list now lives in a JSON file
read through file storage — `apps/ocpp-server/src/assets/websocket-servers.json` by default, relocatable with
`CITRINEOS_WEBSOCKETSERVERCONFIGFILE`. Being a mounted file rather than env vars, it is the one part of configuration
that is not set through the environment.

The field names are unchanged, so the old array can be moved across as it stands, but validation is stricter than the
schema it came from and will reject entries the old one accepted:

- `id`, `host`, `port`, `protocols` and `securityProfile` are now **required**. They previously had defaults, so any
  entry that leant on those needs the values written out.
- **Exactly one** of `tenantId` or `dynamicTenantResolution` must be set. An entry with neither — which used to be
  valid, since `tenantId` was optional and `dynamicTenantResolution` defaulted to `false` — is now an error.
- `id` values must be unique across the array.

Paths inside the file (`tlsKeyFilePath`, `tlsCertificateChainFilePath`, and so on) resolve relative to the file
storage root, not to the repository — so they are written as `certificates/leafKey.pem`, not
`apps/ocpp-server/src/assets/certificates/leafKey.pem`.

### Step 3 — name your environment variables

Take `CITRINEOS_` and append the path to the field, uppercased, with one underscore per level:

```
timeouts.maxCallLengthSeconds   ->  CITRINEOS_TIMEOUTS_MAXCALLLENGTHSECONDS
messageBroker.amqp.url          ->  CITRINEOS_MESSAGEBROKER_AMQP_URL
fileAccess.local.defaultFilePath ->  CITRINEOS_FILEACCESS_LOCAL_DEFAULTFILEPATH
```

The underscore separates **levels, not words** — a camelCase field name stays a single segment. This is the easiest
thing to get wrong when porting the old snake_cased `BOOTSTRAP_CITRINEOS_DATABASE_MAX_RETRIES` style names, which did
split on words.

Values are parsed as JSON when they can be and treated as a raw string otherwise, so numbers and booleans need no
special handling, and an empty object switches a whole optional block on with its defaults:

```yaml
CITRINEOS_LOGLEVEL: '1'
CITRINEOS_OCPP_AUTOACCEPT: 'false'
CITRINEOS_INTEGRATIONS_V2GCA: '{}' # opt in to the Hubject test PKI
```

Pass `--env-prefix=<prefix>` on the command line if you need something other than `CITRINEOS_`.

### Field mapping

Top-level settings:

| Old path                            | New path                                      |
| ----------------------------------- | --------------------------------------------- |
| `centralSystem.host`                | `host`                                        |
| `centralSystem.port`                | `port`                                        |
| `maxCallLengthSeconds`              | `timeouts.maxCallLengthSeconds`               |
| `maxCachingSeconds`                 | `timeouts.maxCachingSeconds`                  |
| `staleCallMaxAgeSeconds`            | `timeouts.staleCallMaxAgeSeconds`             |
| `shutdownGracePeriodSeconds`        | `timeouts.shutdownGracePeriodSeconds`         |
| `realTimeAuthDefaultTimeoutSeconds` | `timeouts.realTimeAuthDefaultTimeoutSeconds`  |
| `notReadyThresholdSeconds`          | `timeouts.notReadyThresholdSeconds`           |
| `maxReconnectDelay`                 | `messageBroker.amqp.maxReconnectDelaySeconds` |
| `rbacRulesFileName`                 | `rbac.rulesFileName`                          |
| `rbacRulesDir`                      | `rbac.rulesDir`                               |
| `env`, `logLevel`, `oidcClient`     | unchanged                                     |

The `util` block was flattened away:

| Old path                                      | New path                                                         |
| --------------------------------------------- | ---------------------------------------------------------------- |
| `util.cache.memory: true`                     | `cache.type: 'memory'`                                           |
| `util.cache.redis.url`                        | `cache.type: 'redis'` plus `cache.url`                           |
| `util.cache.redis.host` / `.port`             | removed — supply a `redis://` or `rediss://` URL instead         |
| `util.messageBroker.amqp.*`                   | `messageBroker.amqp.*`                                           |
| `util.authProvider.localByPass`               | `auth.localBypass` (note the changed spelling)                   |
| `util.authProvider.oidc.*`                    | `auth.oidc.*`, with `cacheTime` (ms) becoming `cacheTimeSeconds` |
| `util.swagger.*`                              | `swagger.*`, joined by a new `swagger.enabled` toggle            |
| `util.networkConnection.websocketServers`     | the JSON file from Step 2                                        |
| `util.certificateAuthority.v2gCA`             | `integrations.v2gCA`                                             |
| `util.certificateAuthority.chargingStationCA` | `integrations.chargingStationCA`                                 |

So was `modules` — module settings are now top-level, keyed by what they configure rather than by which module reads
them:

| Old path                                                        | New path                                                  |
| --------------------------------------------------------------- | --------------------------------------------------------- |
| `modules.configuration.heartbeatInterval`                       | `ocpp.heartbeatInterval`                                  |
| `modules.configuration.bootRetryInterval`                       | `ocpp.bootRetryInterval`                                  |
| `modules.configuration.ocpp2_0_1.*`, `.ocpp2_1.*`, `.ocpp1_6.*` | `ocpp.*` — one set of values shared by every OCPP version |
| `modules.evdriver.enableGetChargingProfilesOnStartTransaction`  | `evdriver.enableGetChargingProfilesOnStartTransaction`    |
| `modules.transactions.costUpdatedInterval`                      | `transactions.costUpdatedInterval`                        |
| `modules.transactions.sendCostUpdatedOnMeterValue`              | `transactions.sendCostUpdatedOnMeterValue`                |
| `modules.transactions.receiptBaseUrl`                           | `transactions.receiptBaseUrl`                             |
| `modules.transactions.signedMeterValuesConfiguration`           | `transactions.signedMeterValues`                          |

Because the three per-protocol boot blocks collapsed into one `ocpp` block, a setup that deliberately treated OCPP
1.6 and 2.0.1 chargers differently on boot cannot be expressed by config any more.

### Environment variable renames

The `BOOTSTRAP_` prefix is gone, and the surviving names re-split on levels rather than words:

| Old variable                                              | New variable                                 |
| --------------------------------------------------------- | -------------------------------------------- |
| `BOOTSTRAP_CITRINEOS_DATABASE_HOST`                       | `CITRINEOS_DATABASE_HOST`                    |
| `BOOTSTRAP_CITRINEOS_DATABASE_NAME`                       | `CITRINEOS_DATABASE_DATABASE`                |
| `BOOTSTRAP_CITRINEOS_DATABASE_MAX_RETRIES`                | `CITRINEOS_DATABASE_MAXRETRIES`              |
| `BOOTSTRAP_CITRINEOS_DATABASE_RETRY_DELAY`                | `CITRINEOS_DATABASE_RETRYDELAY`              |
| `BOOTSTRAP_CITRINEOS_DATABASE_POOL_MAX`                   | `CITRINEOS_DATABASE_POOL_MAX`                |
| `BOOTSTRAP_CITRINEOS_DATABASE_SSL_REJECT_UNAUTHORIZED`    | `CITRINEOS_DATABASE_SSL_REJECTUNAUTHORIZED`  |
| `BOOTSTRAP_CITRINEOS_FILE_ACCESS_TYPE`                    | `CITRINEOS_FILEACCESS_TYPE`                  |
| `BOOTSTRAP_CITRINEOS_FILE_ACCESS_LOCAL_DEFAULT_FILE_PATH` | `CITRINEOS_FILEACCESS_LOCAL_DEFAULTFILEPATH` |
| `BOOTSTRAP_CITRINEOS_FILE_ACCESS_S3_ACCESS_KEY_ID`        | `CITRINEOS_FILEACCESS_S3_ACCESSKEYID`        |
| `BOOTSTRAP_CITRINEOS_FILE_ACCESS_S3_DEFAULT_BUCKET_NAME`  | `CITRINEOS_FILEACCESS_S3_DEFAULTBUCKETNAME`  |

`BOOTSTRAP_CITRINEOS_CONFIG_FILENAME`, `BOOTSTRAP_CITRINEOS_CONFIG_BUCKET` and
`CONFIG_CITRINEOS_WIPE_FILE_ON_START` all described the `config.json` that no longer exists, and can simply be
dropped. `APP_ENV` no longer does anything for the OCPP server, since there are no per-environment config files left
to select; the OCPI server still reads it. `APP_NAME`, which chooses what the process runs, is unaffected.

### Settings that no longer exist

- **Per-module OCPP action lists** — `modules.<name>.requests`, `.responses`, `.excludedRequests` and
  `.excludedResponses`. Each handler now declares the actions and protocols it serves, and a module subscribes to the
  handlers it owns, so the routing that these lists described is derived from code rather than configured.
- **Per-module `host` and `port`** — these were carried in the config but never used to reach a module.
- **`modules.tenant.ocppRouterBaseUrl`**.
- **`ocpiServer`** — the OCPI server is its own application under [`apps/ocpi-server`](./apps/ocpi-server) with its
  own configuration, and is started with `pnpm citrine --ocpi`.

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

- [CitrineOS Server (`@citrineos/ocpp-server`)](./apps/ocpp-server/README.md) — running the server, configuration
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
