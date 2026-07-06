<!--
SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project

SPDX-License-Identifier: Apache-2.0
-->

# Dependency Injection (Awilix)

How DI is orchestrated in the server. Read this alongside `apps/ocpp-server/src/container.ts` and `apps/ocpp-server/src/citrineOSServer.ts`

## The model

One Awilix container, built once at a single composition root: `buildContainer()` in `container.ts`. The server `citrineOSServer.ts` builds it in its constructor and then resolves everything from it.

The container runs in PROXY mode: a class declares its dependencies as a destructured constructor object, and Awilix supplies them by matching parameter name → registered token name.

```ts
// because it's registered under the token `transactionEventRepository`,
// naming the constructor param the same thing is all the wiring needed:
constructor({ transactionEventRepository, logger }: { ... }) { ... }
```

So when wiring a new dependency: register it under a token and name the constructor param the same. Nothing is wired by hand.

A handful of registrations use `asFunction` instead of `asClass` — where construction composes other objects (the RabbitMQ `sender`/`handler`), needs a runtime choice (`apiAuthProvider`), needs a narrowed input (`bootNotificationService` gets `config.modules.configuration`, not the full `config`), or must defer a lookup (`costUpdatedNotifier`). Everything else uses a destructured constructor + `asClass`.

## Bootstrap flow

```
constructor   build the prebuilt primitives the container needs (logger, cache,
              ocppValidator, server, fileStorage), then buildContainer(config, {…})

initialize()  resolve & wire from the container, in order:
              registerHttpPlugins → sequelize → message broker
              → initSystem (modules) → db → health → shutdown handlers
```

Those few primitives are built before the container because the container depends on them; they're passed in and registered as values.

## Lifetimes

| Lifetime    | Meaning                      | Used for                                                                    |
| ----------- | ---------------------------- | --------------------------------------------------------------------------- |
| `value`     | a prebuilt instance/constant | config, the Sequelize instance, the Fastify server, cache                   |
| `singleton` | one app-wide instance        | repositories, shared services, the network stack, broker connection/channel |
| `scoped`    | one per module               | each module + its `sender`/`handler` + its internal services + its APIs     |

The rule: a dependency must live at least as long as its consumer (`singleton` ≥ `scoped`). Break it and Awilix throws at startup.

- Modules are scoped, so `sender`/`handler` are scoped too (a scoped module is allowed to depend on them).
- The router is a singleton, so it gets its _own_ singleton `routerSender`/`routerHandler` — a singleton can't depend on the scoped pair.

Per-module scopes: each module is resolved in its own child scope (`initModuleInScope`) together with its sender/handler, internal services, and APIs.

## Where things are registered

`buildContainer()` calls one registrar per layer. To find a registration, open `container.ts` and go to:

| Registrar                                | What it registers                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `registerPrimitives`                     | config + derived scalars, the Sequelize instance, prebuilt infra (all values)            |
| `registerMessaging`                      | RabbitMQ connection/channel managers, `sender`/`handler`, `routerSender`/`routerHandler` |
| `registerRepositories`                   | every repository (singletons)                                                            |
| `registerServices`                       | shared services + `apiAuthProvider`                                                      |
| `registerModuleServices`                 | calls each module package's own `register<Module>Services` (see next section)            |
| `registerNetwork`                        | filters, authenticator, router, network connection, `adminApi`                           |
| `registerModules` / `registerModuleApis` | the 8 modules and their APIs (scoped)                                                    |

## Module-internal services live in the module packages

Services that belong to a single module (e.g. `TransactionService`, `BootNotificationService`) are not registered in `container.ts`.
Each module package owns a `src/register.ts` exporting `register<Module>Services(container)`, and `registerModuleServices` just calls all six.

Why it's done this way: the service classes stay private to their package (only the registrar is exported).
To add or change a module's internal service, edit that package's `register.ts`.

## Patterns worth knowing

- Breaking a dependency cycle. `CostNotifier` has to call back into its module to send a message. Instead of holding the module (a cycle), it injects a `costUpdatedNotifier` function token whose factory reads the module lazily, only when invoked — so there's no cycle at construction time.
- One API instance serves multiple OCPP versions; the version is threaded through as a parameter (`AbstractModuleApi.supportedVersions`)

## Intentionally NOT in the container

Deliberate — don't "fix" these:

| Thing                  | Why                                                                                                                                                       |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TlsCredentialManager` | per-config private internal helper inside `WebsocketNetworkConnection`                                                                                    |
| `RbacRulesLoader`      | private internal helper inside `OIDCAuthProvider`                                                                                                         |
| `HealthCheckService`   | depends on `networkConnection`; resolving it through the container would start the websocket servers in modules-only mode, so it's built in the bootstrap |

## Tests

`packages/core/src/test/testContainer.ts` gives tests the same container settings as production

- `createTestContainer()` → a container with a mock logger pre-registered.
- `getTestInstance(container, Class, mocks)` → registers your mocks + the class, then resolves it. `mocks` is typed against the constructor, so a wrong or missing dependency name is a compile error.

## Adding things

All of these follow the same model from the top of this doc: register under a token, then name the constructor param to match.
See start of document regarding singleton vs scoped vs value. We do not use transient in this application as there isn't an applicable case worth doing.

### …a dependency on an existing class

Add the parameter to the class's destructured constructor. A token of that name is registered and visible where the class resolves.

- `singleton` and `value` tokens are visible everywhere;
- a `scoped` token (e.g. another module-internal service) is only visible inside that module's scope — so it must be registered in that module's `register.ts`.

**Example** — adding `tariffRepository` to a class's constructor:

```ts
constructor({ transactionEventRepository, tariffRepository, logger }: { /* … */ }) {
  this._tariffRepository = tariffRepository;
}
```

### …a repository

Add one line to `registerRepositories`: `xRepository: asClass(SequelizeXRepository).singleton()`.
Any class can now inject it by naming an `xRepository` constructor param.

**Example** — `SequelizeAsyncJobStatusRepository` takes the standard `{ config, logger, sequelizeInstance }` and forwards them to the base:

```ts
export class SequelizeAsyncJobStatusRepository extends SequelizeRepository<AsyncJobStatus> {
  constructor({
    config,
    logger,
    sequelizeInstance,
  }: {
    config: BootstrapConfig;
    logger?: Logger<ILogObj>;
    sequelizeInstance?: Sequelize;
  }) {
    super({ config, namespace: AsyncJobStatus.MODEL_NAME, logger, sequelizeInstance });
  }
}
```

One line in `registerRepositories` then exposes it as the `asyncJobStatusRepository` token:

```ts
asyncJobStatusRepository: asClass(SequelizeAsyncJobStatusRepository).singleton(),
```

### …a shared (app-wide) service

A service used across modules or by the network stack.

1. Give it a destructured constructor whose param names are existing tokens; export it from `@citrineos/core`.
2. Register it in `registerServices` as `asClass(X).singleton()` — or `asFunction(({ … }) => new X(…))` if construction needs a runtime choice or a narrowed input.

**Example** — `realTimeAuthorizer` is a plain singleton, while `apiAuthProvider` uses `asFunction` because it picks an implementation at runtime. Both live in `registerServices`:

```ts
realTimeAuthorizer: asClass(RealTimeAuthorizer).singleton(),

apiAuthProvider: asFunction(({ config, logger }): IApiAuthProvider => {
  if (config.util.authProvider.oidc) return new OIDCAuthProvider(config.util.authProvider.oidc, logger);
  if (config.util.authProvider.localByPass) return new LocalBypassAuthProvider(logger);
  throw new Error('No valid API authentication provider configured');
}).singleton(),
```

### …a module-internal service

A service used by exactly one module.

1. Add it to that module package's `src/register.ts` — `asClass(X).scoped()` (or `asFunction(...)` only if construction needs a narrowed input). Export only the registrar.
2. Add a param to the module's constructor named after the new token.

It resolves in the module's scope, alongside the module's other scoped services.

**Example** — Monitoring registers its two services in its own `register.ts`:

```ts
export function registerMonitoringServices(container: AwilixContainer): void {
  container.register({
    monitoringService: asClass(MonitoringService).scoped(),
    monitoringDeviceModelService: asClass(DeviceModelService).scoped(),
  });
}
```

`MonitoringModule` then names them in its constructor to receive that module's instances:

```ts
constructor({ monitoringService, monitoringDeviceModelService }: { /* … */ }) {
  this._monitoringService = monitoringService;
}
```

### …a new module

1. If it has internal services: add `register<Module>Services` in the package and export it.
2. Register the module + its APIs in `container.ts` (`registerModules`, `registerModuleApis`).
3. Add one row to `MODULE_INITS` in `citrineOSServer.ts`: `{ moduleToken, routeApis, configKey }`.

**Example** — the Tenant module (no internal services, so no `register.ts`). Its module and API are registered in `container.ts`:

```ts
tenantModule: asClass(TenantModule).scoped(),
tenantDataApi: asClass(TenantDataApi).scoped(),
```

and one row in `citrineOSServer.ts` drives its startup:

```ts
[EventGroup.Tenant]: {
  moduleToken: 'tenantModule',
  routeApis: ['tenantDataApi'],
  configKey: 'tenant',
},
```
