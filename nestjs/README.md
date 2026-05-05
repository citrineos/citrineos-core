# CitrineOS NestJS

NestJS + Drizzle implementation of CitrineOS — a drop-in replacement for the
legacy `Server/`, `base/`, and `core/` workspaces. Implements OCPP 2.0.1, 2.1,
and 1.6 charging-station management.

## Quick start

```bash
npm install
npm run migrate          # apply schema migrations to local Postgres
npm run start:dev        # run the server with hot reload
```

See the **Guide** section in the rendered documentation for full prerequisites,
configuration, and walkthroughs (mirrored from the project's mkdocs site). The
**API Reference** in the same site is generated directly from the source code.

## Common scripts

| Script                    | Purpose                                       |
| ------------------------- | --------------------------------------------- |
| `npm run build`           | Production build (`nest build` + tsc-alias)   |
| `npm run start:dev`       | Watched dev server                            |
| `npm run test:e2e`        | End-to-end test suite                         |
| `npm run migrate`         | Apply Drizzle migrations                      |
| `npm run diff:schema`     | Verify entity ↔ legacy SQL parity            |
| `npm run audit:endpoints` | Verify `@AsMessageEndpoint` ↔ `@Post` parity |
| `npm run docs`            | Generate static documentation site            |
| `npm run docs:serve`      | Serve docs locally with watch                 |

## Project layout

```
nestjs/
  src/
    modules/        # feature + cross-cutting NestJS modules
    repositories/   # all Drizzle-backed repositories (centralised)
    dto/            # request/response DTOs
    enums/
    database/       # Drizzle schema + entities
    ocpp/           # protocol primitives (handlers, versions, call actions)
    config/, logger/, telemetry/
  docs/             # Static guide content (rendered alongside the API ref)
  migrations/       # SQL migrations applied via drizzle-kit
  scripts/          # Parity gates + maintenance tools
```

## Parity with legacy CitrineOS

Honest gut estimate: **~80%** parity with the legacy `Server/` + `base/` +
`core/` workspaces. The structural surface is essentially complete; the
gap is everything that hasn't been exercised end-to-end yet.

| Dimension                                                                                                      | Confidence            | Notes                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint surface (96/96 actions × versions)                                                                    | ~100%                 | `npm run audit:endpoints` is mechanical                                                                                                                                                                                                                                                                                   |
| Schema (tables, columns, defaults, constraints)                                                                | ~98%                  | `npm run diff:schema` clean. Only known semantic difference: `Connector.evseId` / `Transaction.evseId` (FKs to surrogate tables) are set null where legacy may eventually populate them                                                                                                                                   |
| Handler class count + module wiring                                                                            | ~100%                 | 33 request + 22 response handlers + 7 OCPP module groups present                                                                                                                                                                                                                                                          |
| **2.0.1 happy-path behaviour** (Boot, StatusNotification, Authorize, TransactionEvent.Started→Updated×N→Ended) | ~95%                  | Both servers return the same `idTokenInfo` statuses and persist matching audit / transaction / connector rows. Legacy actually crashes on `TransactionEventStarted`; nestjs doesn't.                                                                                                                                      |
| **Other ~85 endpoints** behaviour                                                                              | ~50% (mostly unknown) | Dispatch path proven on the 6 actions k6 hits. ReserveNow, SendLocalList, Reset, ChangeAvailability, GetVariables / SetVariables, NotifyReport multi-chunk, NotifyCustomerInformation, FirmwareStatusNotification, Smart Charging, Cert flows, Boot Pending state machine — none observed side-by-side against legacy yet |
| OCPP 1.6 flow                                                                                                  | ~60%                  | Handlers exist (Authorize16, StartTransaction, StopTransaction, MeterValues16, BootNotification16, StatusNotification16, FirmwareStatusNotification16, DataTransfer16) but the 1.6 k6 flow has never been run                                                                                                             |
| Cert flows (Hubject V2G / ACME / SignedMeterValue)                                                             | ~40%                  | Code implemented but never run against real Hubject API or Let's Encrypt staging                                                                                                                                                                                                                                          |
| Edge cases / error paths / multi-tenant / webhook fan-out                                                      | ~30%                  | Largely unverified                                                                                                                                                                                                                                                                                                        |

### Why ~80% and not ~95%

The structural numbers are flattering. 96/96 endpoints just means a
`@Post` exists at the right route — it doesn't mean the response body
matches legacy byte-for-byte. The k6 run is a single happy-path slice of
one OCPP version. The real risk surface is the long tail of
CSMS-initiated paths and protocol edge cases nobody's ever exercised.

### What would move parity from ~80% → ~95%

1. Run the cross-server e2e suite under `CITRINEOS_TARGET=nestjs` (the
   existing 14 tests under `core/src/dal/test/e2e/` — biggest single
   parity signal we have).
2. Run k6 with `CONFIG.version = '1.6'`.
3. Spot-check 5–10 CSMS-initiated REST endpoints against both servers
   and diff the results.
4. Drive a `BootNotification` returning `Pending` and observe the
   `GetBaseReport` → `NotifyReport` → `SetVariables` follow-up state
   machine end-to-end.
5. Drive a `ReserveNow` and confirm the resulting `Reservation` row
   matches legacy column-for-column.

### What would block ~95% → ~100%

The cert flows (Hubject + ACME) against real staging environments. That
requires real credentials; until those are tested I wouldn't honestly
claim parity even if everything else passes.
