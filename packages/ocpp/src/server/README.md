<!--
SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project

SPDX-License-Identifier: Apache-2.0
-->

# Extending `CitrineOSServer`

`CitrineOSServer` is the whole application server — DI container, HTTP surface, modules, APIs,
startup and shutdown. It ships from `@citrineos/core` so that a downstream distribution can
**subclass** it instead of forking `citrineOSServer.ts` into its own repo and re-merging every
upstream change by hand.

The runnable entrypoint is then just:

```ts
import { ConfigLoader } from '@citrineos/base';
import { CitrineOSServer } from '@citrineos/core';

const config = await ConfigLoader.loadConfig();
await new CitrineOSServer(process.env.APP_NAME!.toLowerCase(), config).run();
```

See [`apps/ocpp-server/src/index.ts`](../../../../apps/ocpp-server/src/index.ts) for the reference
entrypoint, and [`DEPENDENCY_INJECTION.md`](./DEPENDENCY_INJECTION.md) for the container model.

## The rules

- The constructor does no work beyond validating and storing its arguments. Everything is built in
  `initialize()`, which `run()` calls. That means an override in a subclass is always safe — the
  subclass's own fields are initialized before any `create*()` or `init*()` method runs.
- Every step of `initialize()` is a `protected` method, so anything the named hooks below don't
  cover can still be overridden individually. Call `super.<method>()` to keep the base behavior.

## Extension points

| Hook                                    | Type    | Use it to                                                                                                              |
| --------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `createLogger()`                        | method  | Swap the tslog `Logger` for a wrapped/instrumented one. `loggerSettings()` is split out so you can reuse the settings. |
| `createFastifyInstance()`               | method  | Build the Fastify instance yourself (extra plugins, HTTP/2, custom type provider).                                     |
| `createAjv()` / `createOCPPValidator()` | method  | Register custom schemas, e.g. for `DataTransfer` payloads.                                                             |
| `createCache()` / `createFileStorage()` | method  | Use a cache or file-storage implementation the core config doesn't cover.                                              |
| `corsOptions`                           | getter  | Lock CORS down to real origins.                                                                                        |
| `authExcludedRoutes`                    | getter  | Add unauthenticated routes (metrics, custom probes).                                                                   |
| `registerAdditionalServices(container)` | method  | Register extra repositories/services/modules/APIs, or **replace** a core registration by re-registering its token.     |
| `moduleSpecs` / `apiSpecs`              | getters | Add distribution-specific modules and API groups to the startup map — spread the base value.                           |
| `networkApiTokens`                      | getter  | Add APIs that come up with the WebSocket server.                                                                       |
| `onInitialized()`                       | hook    | Run after everything is wired, before the server listens.                                                              |
| `onShutdown()`                          | hook    | Flush/close your own resources; runs after core resources are closed.                                                  |

Prebuilt collaborators can also be injected without subclassing, via the constructor's third
argument (`CitrineOSServerOverrides`): `server`, `ajv`, `cache`, `fileStorage`, `logger`.
