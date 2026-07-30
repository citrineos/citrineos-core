<!--
SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
SPDX-License-Identifier: Apache-2.0
-->

# @citrineos/mock-msp

A mock **eMSP** (e-Mobility Service Provider) that speaks **OCPI 2.2.1** and
impersonates the seeded partner **`US/TST` "TestMobilitySolutions"**. Its job is
to test CitrineOS's **CPO-side** OCPI implementation from the outside: it listens
on **port 8083**, exposes exactly the endpoint paths the partner seed advertises,
and **reuses `@citrineos/ocpi-base`'s Zod schemas verbatim** to validate every
inbound request and self-check every reply.

Because those schemas are the *same catalog `zod` instance* (`4.1.12`) Citrine
parses with, the two sides never disagree by accident. The only wire deviations
Citrine ever sees are ones a scenario **deliberately injects** — so **a
validation failure is a detected Citrine-side contract issue**, not schema drift.

The mock is three machines over one in-memory store:

- **Recorder** — every inbound request and outbound call becomes an immutable,
  queryable, *awaitable* `Exchange` (a wire trace you can assert against).
- **Actor** — drives the credentials handshake (both directions), sends
  Commands to Citrine, hosts the async `response_url` callbacks, and pulls
  Citrine's SENDER endpoints.
- **Adversary** — a `FaultEngine` that perturbs traffic **only when a scenario
  arms it** (delay, abort, wrong OCPI status, malformed body, dropped headers,
  oversize token, …), plus a conformance checker that records what Citrine sends.

A `/_mock/*` control API is the test-harness surface: inspect the trace, wait for
async traffic, drive the Actor, arm faults, and run assertion oracles.

> Private/dev tool. `package.json` is `private: true` — never published, never
> committed as a release artifact. The tokens below are **dev defaults from the
> seed, not secrets**.

---

## Prerequisites

- **Node `>=24.16.0`** and **pnpm `10.19.0`** (repo `packageManager`). On an older
  Node you will hit `ERR_PNPM_UNSUPPORTED_ENGINE`; install Node 24 or set
  `npm_config_engine_strict=false` for local runs.
- **Build `@citrineos/ocpi-base` first.** The mock deep-imports a handful of
  schemas from `@citrineos/ocpi-base/dist/...` (see `src/ocpi/barrel.ts`), and
  ocpi-base ships **only `dist/`** (no `src`, no `exports` map). ocpi-base's
  `tsc -b` references `@citrineos/base` and `@citrineos/core`, so build the
  closure in order:

  ```bash
  pnpm --filter @citrineos/base build
  pnpm --filter @citrineos/core build
  pnpm --filter @citrineos/ocpi-base build
  ```

  or in one shot (builds the whole dependency closure topologically):

  ```bash
  pnpm --filter "@citrineos/mock-msp..." build
  ```

> If the barrel fails to resolve at runtime with unrewritten path aliases
> (`@interfaces/*`, `@ocpp/*`, …), the upstream package's `dist` was built with a
> bare `tsc -b` that skipped its `tsc-alias` step. Re-run the package's full
> `build` script (`tsc -b && tsc-alias`) for `base`/`core`/`ocpi-base`.

---

## Quick start (native — recommended for developing the mock)

```bash
# from the repo root
pnpm --filter "@citrineos/mock-msp..." build   # ensures ocpi-base/dist exists
pnpm --filter @citrineos/mock-msp start        # node dist/index.js, listens on :8083
```

`start` runs the compiled ESM (`node dist/index.js`) — the recommended path.
`pnpm --filter @citrineos/mock-msp dev` (`tsx watch`) is available for iteration,
but on Node < 24 `tsx` can trip over a transitive `@peculiar/webcrypto` CJS
export; the compiled `start` path resolves the ESM condition cleanly.

Liveness check:

```bash
curl http://localhost:8083/_mock/health
# {"status":"up","party":"US/TST","role":"EMSP","registration":"registered",...}
```

### Point it at Citrine's CPO OCPI

The mock calls Citrine at `http://localhost:8085/ocpi` by default
(`CITRINE_OCPI_BASE_URL`). Bring the CPO stack up with the **`--local`** flag so
host port **8083 is freed** for the mock (the base compose file publishes 8083 on
the OCPP server; the `!override` in `docker-compose.local.yml` drops it):

```bash
pnpm citrine --ocpi --local            # Citrine OCPI on :8085 (+ containerized mock on :8083)
```

To run the mock **natively** while still freeing 8083, keep the mock container
scaled to zero:

```bash
docker compose -f docker-compose.yml -f docker-compose.local.yml \
  --profile ui --profile ocpi up -d --build --scale mock-msp=0
pnpm --filter @citrineos/mock-msp start   # native mock now owns :8083
```

---

## Quick start (containerized)

The image (`apps/mock-msp/deploy.Dockerfile`, mirrors
`apps/ocpi-server/deploy.Dockerfile`) runs under the `ocpi` profile and is only
defined in `docker-compose.local.yml`, so the containerized mock needs **both**
flags:

```bash
pnpm citrine --ocpi --local             # builds + runs mock-msp alongside citrineos-ocpi
```

The container publishes **`8083:8083`** on the host (the seed forces Citrine's
calls through `host.docker.internal:8083`, so service-name DNS won't do), adds
`extra_hosts: host.docker.internal:host-gateway`, and reaches Citrine at
`http://citrineos-ocpi:8085/ocpi`. All env is in `docker-compose.local.yml`.

---

## Register with a running Citrine (one command)

Citrine ships already knowing this partner (**preregistered** with the seed
tokens), so **for the default stack you do not need to register** — the bootstrap
tokens already work end to end.

The helper is for exercising the **full credentials handshake** against a
**fresh/unregistered** Citrine partner. It drives the mock's own Actor through the
control API — the mock does the version discovery, mints TOKEN_A via Citrine's
admin `generate-credentials-token-a`, and `POST`s its `CredentialsDTO` — and every
step is recorded in the trace:

```bash
# mock must be running first (native or container)
npx tsx apps/mock-msp/scripts/register.ts               # msp-initiated (default)
npx tsx apps/mock-msp/scripts/register.ts cpo-initiated # let Citrine drive it
npx tsx apps/mock-msp/scripts/register.ts reregister    # PUT re-register
npx tsx apps/mock-msp/scripts/register.ts unregister    # DELETE + wipe tokens
```

Zero-tooling equivalent (the script just POSTs this):

```bash
curl -X POST 'http://localhost:8083/_mock/register?mode=msp-initiated'
```

> Citrine's admin `generate-credentials-token-a` refuses a partner that already
> has an OCPI profile, so `msp-initiated` targets a **fresh** Citrine partner.
> Env: `MOCK_MSP_CONTROL_BASE` (default `http://localhost:8083`),
> `MOCK_MSP_CONTROL_SECRET` (sent as `x-mock-control-secret` if the mock was
> started with a control secret).

---

## Architecture

```
                         Citrine (CPO, :8085/ocpi)
                          ▲   pushes (Locations/Sessions/CDRs/Tariffs)
                          │   real-time authorize, command results
   ───────────────────────┼───────────────────────────────────────────
   Fastify 5 (ESM) :8083  │
   ┌──────────────────────┴─────────────────────────────────────────┐
   │  raw-preserving JSON parser  (exact wire bytes kept)            │
   │                                                                 │
   │  registry ── per OcpiRoute ──► dispatcher (uniform pipeline):   │
   │     auth ▸ routing-hdrs ▸ record ▸ validate(requestSchema)      │
   │        ▸ handle ▸ self-check(responseSchema) ▸ FAULT            │
   │        ▸ echo X-Request-ID/X-Correlation-ID ▸ send ▸ record     │
   └───────┬──────────────┬──────────────┬───────────────┬──────────┘
           │              │              │               │
        Recorder        Actor        Adversary       Conformance
        (Store)      (OcpiClient)   (FaultEngine)     (findings)
           │              │              │               │
           └──────────────┴──── one in-memory Store ─────┘
                          ▲
                          │  /_mock/* control API (not OCPI-enveloped)
                       test harness
```

Every module file stays a ~10-line declarative route table: a `ModuleDef` with an
array of `OcpiRoute`s, each declaring `auth` mode, whether routing headers are
required, a reused `requestSchema` (validate Citrine's inbound body → `Finding`
on drift) and `responseSchema` (self-check our own reply at send time), and a
pure `handle(ctx)` that reads `ctx.req` and returns an `OcpiReply`. **The
dispatcher does everything else** — handlers never touch Fastify, never set wire
status, never build the envelope, never check auth.

### File map

| Path (`apps/mock-msp/`) | Role |
|---|---|
| `src/index.ts` | Entrypoint: `loadConfig → buildContext → applyScenario? → buildServer → listen(:8083) → autoRegister?` |
| `src/config.ts` | `loadConfig(env)` → `MockConfig` (port, base URLs, bootstrap tokens) |
| `src/identity.ts` | `US/TST` EMSP identity + `buildEndpointCatalog()` (the 8 split `{identifier,role,url}` endpoints) |
| `src/context.ts` | `buildContext(cfg)` — assembles the singletons (WireLogger → Store → FaultEngine → OcpiClient) |
| `src/server.ts` | `buildServer(ctx)` — Fastify factory, raw-JSON parser, mounts modules + control API |
| `src/ocpi/barrel.ts` | **The ONLY** import site for `@citrineos/ocpi-base` (barrel exports + `dist` deep-imports) |
| `src/ocpi/dispatcher.ts` | `dispatch(route, ctx, freq, freply)` — the uniform per-request pipeline |
| `src/core/registry.ts` | `registerAllModules` — binds each `OcpiRoute` through the dispatcher |
| `src/core/types.ts` | All shared types/interfaces (`MockContext`, `Exchange`, `Store`, `FaultEngine`, `Scenario`, …) |
| `src/core/envelope.ts` | `ok()/empty()/error()` → `OcpiReply`; `buildBody()` wraps the ocpi-base envelope builders |
| `src/core/Store.ts` | Exchange ring buffer (cap 10k) + `DomainState` + `waitForReceived` + findings + `reset` |
| `src/core/auth.ts` | base64 `Token` encode/decode; inbound verify; outbound `Authorization` builder |
| `src/core/routingHeaders.ts` | Parse / strict-require / echo `OCPI-*` + `X-Request-ID`/`X-Correlation-ID` |
| `src/core/conformance.ts` | `check(ctx, schema) → Finding[]` — header + `safeParse` body checks, never throws |
| `src/core/faults.ts` | `FaultEngine` (matcher) + injectors (`mutateJson`, `dropHeaderCI`, `oversizeTokenBody`) |
| `src/core/client.ts` | `OcpiClient` (Actor): fetch wrapper + handshake + `sendCommand` + `pull` |
| `src/core/wireLog.ts` | `WireLogger` — NDJSON + pretty console, token redaction |
| `src/modules/*.ts` | One `ModuleDef` each: `versions`, `credentials`, `locations`, `tariffs`, `sessions`, `cdrs`, `chargingprofiles`, `tokens`, `commands` |
| `src/control/controlApi.ts` | `registerControlApi(app, ctx)` — all `/_mock/*` routes |
| `src/control/scenario.ts` | `Scenario` zod schema + `loadScenario` / `applyScenario` / `evaluateExpectations` + authorize-policy runtime |
| `scripts/register.ts` | One-command handshake helper (drives `/_mock/register`) |
| `scenarios/*.json` | Checked-in `Scenario` fixtures (see below) |
| `test/*.test.ts` | vitest self-tests (`test/harness.ts` = shared scaffolding + stub CPO) |

---

## Identity & tokens (mirrors the partner seed)

| Field | Value |
|---|---|
| role / country / party | `EMSP` / `US` / `TST` |
| business name | `TestMobilitySolutions` |
| OCPI version | `2.2.1` |
| advertised base (`publicBaseUrl`) | `http://host.docker.internal:8083/ocpi` |
| Citrine CPO identity | `CPO` / `US` / `S44` |

Two bootstrap tokens (both **base64-encoded on the wire**, format
`Authorization: Token <base64(raw)>`):

| Seed field | Raw value | Direction |
|---|---|---|
| `credentials.token` | `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567` | Citrine **presents** this calling us → the mock **accepts** it inbound. |
| `serverCredentials.token` | `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9eyJzdWIiOiJwYXJ0bmVyIn0` | The mock **presents** this calling Citrine. |

These are **bootstrap** values; a live handshake rotates them. Override any with
the `MOCK_MSP_*` env vars (table at the bottom).

---

## Endpoints served (prefix `/ocpi`)

- `GET /ocpi/versions`, `GET /ocpi/versions/2.2.1` — discovery (split
  `{identifier, role, url}` catalog including a `credentials` endpoint)
- `GET|POST|PUT|DELETE /ocpi/2.2.1/credentials` — registration handshake
- **RECEIVER** (Citrine pushes to us): `/ocpi/2.2.1/emsp/{locations,tariffs,sessions,cdrs,chargingprofiles}`
- **SENDER** (Citrine reads / calls us): `/ocpi/2.2.1/emsp/{tokens,commands}`
  - `tokens`: `POST /:token_uid/authorize?type=<TokenType>` real-time authorize
  - `commands`: `POST /:command/:uid` async `response_url` callback host

---

## `/_mock` control API cheatsheet

Mounted on the same server, **outside `/ocpi`**, never OCPI-enveloped or
OCPI-authenticated (optional `x-mock-control-secret` header if
`MOCK_MSP_CONTROL_SECRET` is set). Control exchanges are recorded as
`module: "control"` and **excluded from OCPI queries by default**.

**Inspection (recorder)**

| Method | Path | Notes |
|---|---|---|
| GET | `/_mock/health` | up + registration summary |
| GET | `/_mock/state` | full domain snapshot (registration + stored objects) |
| GET | `/_mock/state/:module` | one module's stored objects |
| GET | `/_mock/exchanges` | `?direction=&module=&operation=&method=&pathMatches=&minSeq=&limit=&offset=` or `?filter=<json>` |
| GET | `/_mock/exchanges/:id` | one exchange |
| POST | `/_mock/exchanges/wait` | `{ filter, timeoutMs }` long-poll; **`408` + near-misses on timeout** |
| DELETE | `/_mock/exchanges` | clear the recorder |
| GET / DELETE | `/_mock/findings` | list / clear findings |

**Control (actor + adversary + lifecycle)**

| Method | Path | Notes |
|---|---|---|
| POST | `/_mock/reset` | `{ keepRegistration? }` |
| GET / POST | `/_mock/scenario` | read / hot-load a `Scenario` |
| POST | `/_mock/register` | `?mode=msp-initiated\|cpo-initiated` |
| POST | `/_mock/reregister`, `/_mock/unregister` | re-register / unregister |
| POST | `/_mock/commands/:type`, `/_mock/emit/command` | body = `StartSession`/`StopSession`/… → `{ sync, responseUrl }`. Empty `{}` payload is back-filled with a **schema-valid per-type default** (see §Dashboard). |
| POST | `/_mock/emit/token` | push a default RFID token to Citrine (RECEIVER `PUT`) |
| POST | `/_mock/pull/:module` | GET Citrine's CPO SENDER endpoints (`locations`/`sessions`/`cdrs`/`tariffs`) |
| GET | `/_mock/discover/evse` | pull Citrine's locations and return the first real `{ location_id, evse_uid, connector_id }` (what a real eMSP does before commanding). See §Live charging. |
| POST | `/_mock/charge/start` | `{ location_id?, evse_uid?, connector_id?, token_uid?, timeoutMs? }` → `START_SESSION`, then **await** the async `CommandResult` + the pushed `Session`. Defaults target the seeded EVerest station. |
| POST | `/_mock/charge/stop` | `{ session_id?, timeoutMs? }` → `STOP_SESSION` (session_id defaults to the last pushed session), then await the `CommandResult` + the pushed `CDR`. |
| POST | `/_mock/everest/plug`, `/_mock/everest/unplug` | drive the EVerest car simulator over MQTT (`docker exec … mosquitto_pub`). Needs docker access → run the mock **natively**, or use `scripts/everest-plug.sh`. |
| POST | `/_mock/provoke/:what` | **make Citrine push back**: `location-add` (Hasura insert → Citrine `PUT`, reproduces the coordinates bug) / `location-nudge` (Hasura update → Citrine `PATCH`). See §Dashboard. |
| GET | `/_mock/coverage` | module × direction matrix (`{ modules:[{module, inbound:{count,lastOk}, outbound:{count,lastOk}}], generatedAt }`) aggregated from the recorder — no new state. |
| POST | `/_mock/authorize` | `{ default, byUid }` set live authorize behavior |
| GET / POST / DELETE | `/_mock/faults[/:id]`, POST `/_mock/fault` | CRUD `FaultRule` (`/fault` arms one rule — used by the dashboard builder) |
| POST | `/_mock/scenarios/:id/evaluate` | run a scenario's `expect[]` oracle → pass/fail |

---

## Live charging with EVerest

Without a charger on the CPO side, an OCPI command has nothing to act on:
CitrineOS's `handleStartSession` rejects it (`"Unknown charging station"` /
`"Charging station is offline"`) **before** any OCPP message. EVerest — the
Linux Foundation SIL simulator already vendored at `apps/ocpp-server/everest/` —
is that missing charger. With it connected, the mock's `START_SESSION` reaches a
live station and completes the full round-trip: sync **ACCEPTED** → async
**CommandResult** → a real **Session** push → (on stop) a real **CDR** push.

**Why it just works: the seed already aligns.** `apps/ocpi-server/seeders/20250822120003-basic-objects.ts`
seeds Location `1` / Station `cp001` / EVSE `cp001::1` / Connector `1` under the
`US/TST` partner, plus an Accepted `ISO14443` authorization `DEADBEEF`. That is
exactly the station EVerest registers as at `ws://host.docker.internal:8081/cp001`.
So the command defaults (`MOCK_MSP_DEFAULT_*`, see below) point straight at it —
no extra seeding, no mapping layer.

```bash
# 1. Main OCPI stack (server + OCPI on :8085 + mock eMSP on :8083)
pnpm citrine --ocpi --local
# 2. Mock, natively (needed for the car-sim; container mode can't reach docker)
bash apps/mock-msp/scripts/demo-up.sh
# 3. EVerest as the charger, patched to OCPP 2.0.1, wait until cp001 is online
bash apps/mock-msp/scripts/everest-up.sh
```

Then, on the dashboard's **Charging session (live · EVerest)** card:
**① Discover EVSE → ② Plug in car → ③ Start charging → ④ Stop charging → ⑤ Unplug**,
or via the control API:

```bash
curl -s localhost:8083/_mock/discover/evse            # {location_id:"1", evse_uid:"cp001::1", ...}
curl -sX POST localhost:8083/_mock/everest/plug       # car → connector 1 (native mock only)
curl -sX POST localhost:8083/_mock/charge/start       # sync ACCEPTED → async CommandResult → Session
curl -sX POST localhost:8083/_mock/charge/stop        # async CommandResult → CDR
curl -sX POST localhost:8083/_mock/everest/unplug
```

**Two gotchas** (both handled by `scripts/everest-up.sh`, ported from the
operator-ui e2e fixture):

- **EVerest defaults to OCPP 2.1**, whose profile CitrineOS (OCPP 2.0.1) won't
  register. `everest-up.sh` patches the device-model DB to `OCPP20` and restarts
  the manager.
- **The token must be authorizable.** An `ISO14443` idToken must be 8/14 hex
  chars, so the old `MOCK-RFID-001` fails Citrine's Authorize. The default is now
  `DEADBEEF` (the seeded, Accepted token; OCPI `RFID` → OCPP `ISO14443`).

Override any identity default via env: `MOCK_MSP_DEFAULT_LOCATION_ID`,
`MOCK_MSP_DEFAULT_EVSE_UID`, `MOCK_MSP_DEFAULT_CONNECTOR_ID`,
`MOCK_MSP_DEFAULT_TOKEN_UID`, `MOCK_MSP_DEFAULT_TOKEN_TYPE`.

---

## Dashboard (`GET /`)

The mock serves a single self-contained operator dashboard from
`apps/mock-msp/public/dashboard.html` at `http://localhost:8083/`. It is pure
HTML/CSS/JS with **no build step** — it polls the `/_mock/*` control API every
2 s (health, wire trace, findings, armed faults) and drives every action through
the same endpoints documented above. It is the human-facing twin of the harness:
everything a Cypress/vitest test does over HTTP, the dashboard does with a click.

> **Dashboard run gotchas** (respect exactly):
> - **Run compiled, not `tsx`.** Start the server with `node dist/index.js`
>   (`pnpm --filter @citrineos/mock-msp start`), not `tsx` — see Quick start.
> - **Restart, don't rebuild, after editing the HTML.** `dashboard.html` is read
>   **once at boot**. A `tsc` rebuild does nothing for it; you must **restart the
>   process** (`bash apps/mock-msp/scripts/demo-down.sh && bash
>   apps/mock-msp/scripts/demo-up.sh`) and **hard-refresh** the browser
>   (Ctrl+Shift+R).
> - On older Node, prefix pnpm/npx steps with `npm_config_engine_strict=false`.

It exposes four interactive surfaces beyond the read-only wire trace:

### 1. Dynamic fault builder (Adversary)

Instead of a fixed set of preset buttons, the **Adversary** panel composes a
`FaultRule` from three dropdowns — **Module** (any / locations / sessions / cdrs /
tariffs / tokens / commands / versions / credentials / chargingprofiles),
**Direction** (any / inbound / outbound), and **Fault kind** (the full
`FaultAction` union) — plus the params the selected kind needs (`delay`→ms,
`httpStatus`→status, `ocpiStatus`→code+message, `malformBody`→mutation dropdown,
`dropHeaders`→headers). **Arm** posts the composed rule to `POST /_mock/fault`
(validated by `FaultRuleInputSchema` — same grammar as a scenario's `faults[]`).
A few **quick-fill chips** pre-fill the builder for the common cases; they do
**not** arm on click, so nothing is armed by accident. The live armed-rules list
(with ✕ disarm and **Clear all** → `DELETE /_mock/faults`) is unchanged.

### 2. Provoke panel — "can we do both directions?" (yes)

The mock is not only *reactive*. The **Provoke** panel makes Citrine originate
traffic on demand, so **the Citrine→mock direction is exercised with one click**,
no live charging session and no terminal required:

- **Make Citrine push a new location** → `POST /_mock/provoke/location-add`
- **Make Citrine update a location** → `POST /_mock/provoke/location-nudge`

**Mechanism.** `/_mock/provoke/:what` performs a **raw `fetch` to Citrine's
Hasura GraphQL** (`citrineHasuraUrl`, default `http://localhost:8090/v1/graphql`,
dev-mode/unauthenticated) — *not* an OCPI call, so the provoke itself is **not**
recorded as an OCPI exchange. The DB write to the `Locations` table fires
Citrine's `pgNotify` → OCPI broadcaster, which then makes a **real inbound
`PUT`/`PATCH`** to the mock's `/ocpi/2.2.1/emsp/locations` — and *that* inbound
call is validated and recorded like any other. `location-add` inserts a row with
4-decimal coordinates and reproduces the coordinates finding on the `PUT`;
`location-nudge` bumps an existing row's `name`/`updatedAt` and yields a clean
`PATCH`. This replaces the old `scripts/demo-trigger.sh` terminal step (kept as a
CLI fallback). Only Locations has a proven broadcast trigger — sessions/tariffs/
CDRs are Citrine SENDER modules pushed on transaction lifecycle, so they are
pull-only here (see the coverage caveat below).

### 3. Coverage matrix + "Pull all"

A compact **module × direction** grid, fed by `GET /_mock/coverage`, shows every
OCPI module with an inbound and an outbound cell: green (exercised + last valid),
red (exercised + last invalid), or grey (not exercised). `coverage` is a pure
aggregation over `store.query({})` — `lastOk` is the `validation.ok` of the most
recent exchange for that module+direction (`null` when never exercised). A
**Pull all** button fans out `POST /_mock/pull/:module` across
`locations`/`sessions`/`cdrs`/`tariffs` so the whole Citrine-SENDER side lights up
at once.

> **The last two flows — now live via EVerest.** The real-time token
> **authorize** (Citrine asks us to approve a card) and the async **command
> result** (Citrine posts the outcome back to our `response_url`) both need a real
> charging transaction. Start the simulator (`scripts/everest-up.sh`) and run the
> **Charging session** panel and both fire for real — verified: an inbound
> `tokens.authorize` and an inbound `commands.result` land in the trace. Without
> EVerest running they simply stay grey (never exercised) rather than faked.

### 4. Send-command default payload (polish)

The **Send command** control seeds a **schema-valid default** for the selected
type (e.g. a full `TokenDTO` + `location_id` for `START_SESSION`), merged
*under* any JSON you type so your overrides win. An empty `{}` now produces a
well-formed command Citrine actually parses (a proper sync `ACCEPTED`/`REJECTED`
`CommandResponse`) instead of a `400`. With EVerest connected the **async**
command *result* now completes too — see §Live charging with EVerest.

---

## Writing a test that asserts on Citrine's behavior

The pattern is always the same three beats:

1. **Arm** the mock (load a scenario, set authorize policy, or arm a fault).
2. **Trigger** Citrine to call the mock (a push, a real-time authorize) or have
   the mock call Citrine (a command).
3. **Await + assert** on the recorded `Exchange` via `waitForReceived`.

`waitForReceived` is race-free: it scans already-arrived traffic from
`filter.minSeq` first, then registers a waiter — so you can trigger *then* wait
without missing the event. On timeout it returns **near-misses** ("got a PUT but
from the wrong `party_id`") so async failures are debuggable.

### A) External / end-to-end (drive a running mock over HTTP)

This is how a Cypress/vitest/any harness asserts on a **live Citrine**. Nothing
here imports the mock — it only speaks to `:8083` and lets Citrine speak to the
mock.

```ts
const MOCK = 'http://localhost:8083';

// Assert Citrine delivers an async command result to our response_url.
// 1) Actor: send a START_SESSION command to Citrine; get the sync CommandResponse.
const send = await fetch(`${MOCK}/_mock/commands/START_SESSION`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    response_url: 'PLACEHOLDER',           // the mock fills the real response_url
    token: { /* TokenDTO */ },
    location_id: 'LOC1',
  }),
}).then((r) => r.json());
// send => { sync: <CommandResponse ACCEPTED|...>, responseUrl: "http://.../commands/START_SESSION/<uuid>" }

// 2) Await the async CommandResult Citrine POSTs back to responseUrl.
const waited = await fetch(`${MOCK}/_mock/exchanges/wait`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    filter: { direction: 'inbound', module: 'commands', method: 'POST' },
    timeoutMs: 8000,
  }),
});
// 408 => Citrine never called back (near-misses in the body explain why).
const exchange = await waited.json();

// 3) Assert on what Citrine sent us.
expect(exchange.request.body.result).toBe('ACCEPTED');   // Citrine's CommandResult
expect(exchange.validation.ok).toBe(true);               // it matched CommandResultSchema
```

**Fault injection** — prove Citrine mishandles a deviation. Arm a fault, let
Citrine call the faulted endpoint, then read the trace/findings:

```ts
// Drop the (Citrine-required) authorization_reference from our authorize reply.
await fetch(`${MOCK}/_mock/faults`, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({
    id: 'drop-auth-ref',
    enabled: true,
    match: { direction: 'inbound', module: 'tokens', method: 'POST', pathMatches: 'authorize' },
    action: { kind: 'malformBody', mutation: 'dropRequired', targetPath: 'data.authorization_reference' },
  }),
});
// ... now cause Citrine to run a real-time authorize (e.g. present an RFID at a
// simulated charger, or via Citrine's admin API) ...
const ex = await fetch(`${MOCK}/_mock/exchanges/wait`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ filter: { operation: 'tokens.authorize' }, timeoutMs: 8000 }),
}).then((r) => r.json());
expect(ex.fault.ruleId).toBe('drop-auth-ref');                 // the fault fired
expect(ex.response.body.data.authorization_reference).toBeUndefined();
// Citrine's schema.parse then throws CPO-side — assert that via Citrine's own logs/API.
```

### B) In-process (Citrine-free unit test)

The repo's own tests (`test/*.test.ts`) assemble the real `MockContext` + Fastify
app via `makeServer()` and drive it with `app.inject()` — no socket, no live
Citrine. `startStubCpo()` stands in for the CPO when exercising outbound calls.

```ts
import { makeServer, functionalHeaders, validSession } from './harness.js';

const { app, ctx } = makeServer();
await app.ready();

const res = await app.inject({
  method: 'PUT',
  url: '/ocpi/2.2.1/emsp/sessions/US/TST/SESSION-1',
  headers: functionalHeaders(ctx.config),
  payload: JSON.stringify(validSession()),
});

expect(res.json().status_code).toBe(1000);
const ex = ctx.store.query({ operation: 'sessions.put' }).at(-1)!;
expect(ex.validation.ok).toBe(true);                 // matched SessionSchema
expect(ctx.store.domain.sessions.get('SESSION-1')).toBeDefined();
```

Run the suite:

```bash
pnpm --filter @citrineos/mock-msp test    # vitest run
```

---

## Scenarios & faults

A **scenario** (`apps/mock-msp/scenarios/*.json`) is simultaneously the adversary
config, the registration state, and a snapshot/assertion fixture. Load one at boot
with `MOCK_MSP_SCENARIO=scenarios/<name>.json`, or hot-load at runtime with
`POST /_mock/scenario`.

### Shipped fixtures

| File | Purpose |
|---|---|
| `scenarios/preregistered.json` | Already-registered baseline using the seed tokens (no handshake). |
| `scenarios/unregistered.json` | Fresh state to drive the full credentials handshake (pair with `MOCK_MSP_AUTO_REGISTER=1`). |
| `scenarios/authorize-blocked.json` | `tokens/{uid}/authorize` returns `BLOCKED` for uid `04E7F5A2B37C80`, `ALLOWED` otherwise. |
| `scenarios/known-bugs/authorization-reference-required.json` | Arms one fault dropping the (Citrine-required) `authorization_reference` from the authorize reply, to prove Citrine's `schema.parse` throws. |

### Scenario shape

```jsonc
{
  "name": "authorize-blocked",
  "registration": "preregistered",          // | "unregistered"
  "identity": { /* optional Partial<OcpiIdentity> override */ },
  "authorize": {                            // tokens/{uid}/authorize policy
    "default": "ALLOWED",                   // ALLOWED|BLOCKED|EXPIRED|NO_CREDIT|NOT_ALLOWED
    "byUid": { "04E7F5A2B37C80": "BLOCKED" }
  },
  "strictInbound": false,                   // true => schema-invalid inbound body => 2001 (else record-and-accept)
  "faults": [ /* FaultRule[] — see below */ ],
  "expect": [                               // the assertion oracle
    { "on": "tokens.authorize", "assert": "response.body.data.allowed == BLOCKED" }
  ]
}
```

`expect[]` runs via `POST /_mock/scenarios/:id/evaluate`. `on` selects exchanges
(a bare `operation`/`module` substring, or a JSON `ExchangeFilter`). `assert` is
one of the bare predicates `received | notReceived | hasFinding | hasError | valid
| invalid`, or a comparison `<metric> <op> <value>` where `<metric>` is
`count | findings | globalFindings | httpStatus | ocpiStatusCode | validationOk`
**or a dotted path** resolved against the last matched exchange
(`validation.ok`, `response.body.data.allowed`, `response.httpStatus`) — or, when
prefixed `registration.`, against the live domain state
(`registration.status == registered`).

### FaultRule shape

```jsonc
{
  "id": "drop-authorization-reference",
  "enabled": true,
  "match": { "direction": "inbound", "module": "tokens", "method": "POST", "pathMatches": "authorize" },
  "scope": { "times": 1, "afterSeq": 0, "probability": 1 },   // all optional
  "action": { "kind": "malformBody", "mutation": "dropRequired", "targetPath": "data.authorization_reference" }
}
```

**Fault actions** (`action.kind`): `passthrough` · `delay {ms}` · `abort`
(destroy socket) · `unauthorized` (401 + 2002) · `httpStatus {status, body?}` ·
`ocpiStatus {status_code, status_message?}` (well-formed envelope, wrong OCPI
code) · `malformBody {mutation, targetPath?}` where `mutation ∈
dropRequired | wrongType | injectData | emptyObject | notJson` · `dropHeaders
{headers}` · `oversizeToken` (credentials only: token > 64 chars).

> `malformBody.targetPath` is a dotted path into the **full wire body (the OCPI
> envelope)** — `data.authorization_reference` targets the field inside `data`,
> matching how `injectData` adds `data` at the envelope root. The known-bugs
> fixture matches by `direction`/`module`/`method`/`pathMatches` (robust to
> operation-id naming) rather than by `operation`.

The baseline is a **fault-free** conformance actor; ad-hoc rules arrive via
`POST /_mock/faults`, scenario rules via `POST /_mock/scenario` /
`applyScenario`.

---

## Real Citrine OCPI rough-edges this mock can surface

Each is reproducible by arming a fault (or reading the recorded trace) and then
observing Citrine's CPO-side behavior:

1. **`AuthorizationInfo.authorization_reference` treated as REQUIRED** though OCPI
   2.2.1 marks it optional. `scenarios/known-bugs/authorization-reference-required.json`
   drops it from an otherwise-valid authorize reply; Citrine's `schema.parse`
   throws `UnsuccessfulRequestException` and real-time authorization fails.
2. **`OcpiEmptyResponseSchema` rejects any `data`** (it is `z.undefined()`). A
   `malformBody { mutation: "injectData" }` fault on any empty-envelope route
   (Locations/Sessions/CDRs/Tariffs/Commands/ChargingProfiles) adds `data:{}` and
   proves Citrine's parse throws — while the mock's baseline correctly omits
   `data`.
3. **Command-result callback sends `from`/`to` REVERSED** (`from` = eMSP, `to` =
   CPO). The `commands` route uses `auth: "callback"` with
   `requireRoutingHeaders: false`, so the mock **accepts and records** the
   reversed-header callback; the deviation is queryable in `exchange.request.ocpi`
   rather than being rejected as a valid Citrine call.
4. **CDR `POST` `Location` header ignored + no follow-up GET.** The mock emits a
   spec-correct `Location` on `POST /cdrs`; a harness can assert Citrine never
   issues the GET, surfacing the ignored-header behavior.
5. **Wrong OCPI `status_code` on success / HTTP non-2xx / timeout handling.**
   `ocpiStatus`, `httpStatus`, `delay`, and `unauthorized` faults probe Citrine's
   `UnsuccessfulRequestException` and timeout paths from any inbound route.
6. **`CredentialsDTO.token` > 64 rejected.** The `oversizeToken` fault emits an
   80-char token on the credentials response to trip Citrine's
   `CredentialsDTOSchema.token.max(64)`.
7. **Missing message-id headers.** A `dropHeaders` fault strips
   `X-Request-ID`/`X-Correlation-ID` to test Citrine's required-header
   enforcement.
8. **Deny-path handling** (`BLOCKED`/`EXPIRED`/`NO_CREDIT`/`NOT_ALLOWED`).
   `scenarios/authorize-blocked.json` (or `POST /_mock/authorize`) returns a
   non-`ALLOWED` decision inside a well-formed `1000` envelope with a full token +
   `authorization_reference`, so Citrine's parse still succeeds and its deny
   handling is exercised.
9. **Coordinates emitted with 4 decimals** where `GeoLocationSchema` requires
   5–7 (`/-?[0-9]{1,2}\.[0-9]{5,7}/`). Reproduces on **both** paths the dashboard
   exposes: **Pull locations** (Citrine's SENDER response) and **Provoke →
   location-add** (a real inbound `PUT`). It hits every location and every nested
   EVSE. High severity, one-line fix (the *value* is correct — it is a formatting
   bug on a mandatory field) — but it blocks certification and any spec-strict
   partner. **Passive finding, no fault armed.**
10. **`GET /cdrs` omits `status_code` + `timestamp`** from the OCPI envelope while
    `/sessions` and `/tariffs` on the *same server* include them — Citrine is
    inconsistent with itself. Surfaced by **Pull CDRs** / **Pull all**. An interop
    break, not a formatting nit (a client doing `if (res.status_code === 1000)`
    reads a successful empty list as a failure). **Passive finding**; observed on
    the empty-list path (populated path untested).

---

## Environment variables

All optional; defaults (from `src/config.ts`) match the seed and the native
workflow.

| Var | Default | Meaning |
|---|---|---|
| `MOCK_MSP_PORT` / `MOCK_MSP_HOST` | `8083` / `0.0.0.0` | listen address |
| `MOCK_MSP_PUBLIC_BASE_URL` | `http://host.docker.internal:8083/ocpi` | advertised base URL |
| `CITRINE_OCPI_BASE_URL` | `http://localhost:8085/ocpi` | Citrine CPO OCPI base |
| `CITRINE_HASURA_URL` | `http://localhost:8090/v1/graphql` | Citrine's Hasura GraphQL (used by `/_mock/provoke/*` to trigger a real Citrine push) |
| `MOCK_MSP_COUNTRY_CODE` / `MOCK_MSP_PARTY_ID` | `US` / `TST` | our eMSP identity |
| `MOCK_MSP_CPO_COUNTRY_CODE` / `MOCK_MSP_CPO_PARTY_ID` | `US` / `S44` | Citrine CPO identity |
| `MOCK_MSP_CLIENT_TOKEN` | seed `credentials.token` | token we accept inbound |
| `MOCK_MSP_SERVER_TOKEN` | seed `serverCredentials.token` | token we present outbound |
| `MOCK_MSP_SCENARIO` | _(unset)_ | scenario file to load at boot |
| `MOCK_MSP_AUTO_REGISTER` | `0` | `1` = auto-handshake at boot (unregistered scenarios) |
| `MOCK_MSP_LOG_LEVEL` | `info` | pino level |
| `MOCK_MSP_CONTROL_SECRET` | _(unset)_ | shared secret for `/_mock/*` |

---

## Verified vs not-yet-verified

**Verified (in this repo, no live Citrine required):**

- **Compiles clean** — `tsc -b apps/mock-msp/tsconfig.json` → exit 0.
- **Unit/self-tests pass** — `pnpm --filter @citrineos/mock-msp test` → **6 test
  files, 32 tests passing**. Coverage: the CPO-initiated credentials handshake
  (mint TOKEN_C ≤ 64 chars, flip to `registered`, valid `CredentialsResponse`);
  fault injection (`ocpiStatus`/`httpStatus`/`malformBody`, scope `times`,
  disarm); functional modules (sessions RECEIVER + tokens SENDER — good body
  `validation.ok:true` and stored, bad body `validation.ok:false` + `Finding`;
  bad token → 401/2002; wrong routing headers → 401; `strictInbound` → 2001);
  the control API (`waitForReceived` direct and over `/_mock/exchanges/wait`,
  timeout → 408 + near-misses, `reset`, fault CRUD, control traffic excluded from
  the OCPI trace); the full Actor command roundtrip (sync `CommandResponse` →
  async `CommandResult` callback → `awaitResult()` resolves the flow-stitched
  exchange); and the `expect[]` oracle evaluating each shipped fixture.
- **Boot smoke** — the compiled server listens on the configured port and every
  wired route responds correctly (versions discovery, authorize with all three
  Citrine-required fields, empty-envelope receivers, CDR `Location` header,
  credentials read).

**Not yet verified (the human's next step):**

- **Live end-to-end against a running CitrineOS.** No test in this package drives
  a real Citrine — the self-tests use `app.inject()` + a stub CPO. The intended
  next step is: `pnpm citrine --ocpi --local`, bring up the mock on `:8083`, and
  drive the flows from §"Writing a test" against the live CPO, confirming each
  Citrine rough-edge above manifests as expected. Because the seed preregisters
  this partner, the functional flows should work with **zero handshake**; the
  handshake helper is for a fresh partner.
