# E2E Tests — Authoring Guide

This directory holds cross-server e2e parity tests. Each test runs against
both the legacy CitrineOS server and the NestJS rewrite via the
`CITRINEOS_TARGET={old,nestjs}` env var, asserting identical observable
behavior.

## Helpers

- **`helpers/test-server.ts`** — `startTestServer()` factory. Boots
  Postgres + RabbitMQ + the configured target server and returns a
  `TestServerHandle` with `db`, `httpUrl`, `wsUrl`, `shutdown()`.
- **`helpers/ocpp-ws.ts`** — `connectOcpp(wsUrl, stationId)` /
  `connectOcpp16(...)` / `sendCall(ws, msgId, action, payload)`. The
  raw WebSocket plumbing every test would otherwise reimplement.
- **`helpers/server-target.ts`** — lower-level primitives
  (`runMigrations`, `spawnServer`, `writeConfigFile`). Most tests
  should not need these directly.

## Anatomy of a test

```ts
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { TARGET } from './helpers/server-target.js';
import {
  type TestServerHandle,
  seedChargingStation,
  startTestServer,
  uniqueStationId,
} from './helpers/test-server.js';
import { connectOcpp, sendCall } from './helpers/ocpp-ws.js';

const STATION_ID = uniqueStationId('YOUR-TEST-TAG');

let ctx: TestServerHandle;

beforeAll(async () => {
  ctx = await startTestServer();
  await seedChargingStation(ctx.db, STATION_ID);
}, 180_000);

afterAll(async () => {
  await ctx?.shutdown();
});

describe(`Your feature — target=${TARGET}`, () => {
  it('does the thing', async () => {
    const ws = await connectOcpp(ctx.wsUrl, STATION_ID);
    try {
      const resp = await sendCall(ws, crypto.randomUUID(), 'YourAction', {
        /* payload */
      });
      expect(resp[0]).toBe(3);
      // assert against ctx.db.query(...)
    } finally {
      ws.close();
    }
  });
});
```

## Conventions

- **`uniqueStationId(tag)`**: always use this helper to mint stationIds.
  Random hex suffix prevents cross-test collision when sharing a server.
- **`tag` should describe the test**: `HEARTBEAT`, `START-TX`,
  `RESERVE-CANCEL` — short, all-caps, hyphen-separated. The harness
  prepends `E2E-` so the resulting id is e.g. `E2E-HEARTBEAT-a3f9c012`.
- **Use `seedChargingStation(...)`**: the OCPP router rejects WS
  handshakes for unknown stations. This helper handles the row.
- **Test bodies should not own the harness**: take the `ctx` handle
  from `beforeAll` and use it. Don't call `startTestServer` inside
  `it(...)` — every call boots fresh containers (~30s).
- **Always `await ctx.shutdown()`** in `afterAll`. Otherwise containers
  leak across test files.

## What this replaces

Previously each e2e test had:

- `bootContainers()` — ~25 lines
- `runMigrations()` — direct call
- `seedTenant1()` — sometimes implicit, sometimes explicit
- `spawnServer()` + `waitForHealth()` — ~30 lines
- `connectOcpp()` / `sendCall()` — ~25 lines duplicated per test

Total per test: ~80 lines of boilerplate. With the harness, that's a
single `await startTestServer()` plus a 1-line stationId seed.

## Migration checklist (existing → harness)

When porting an existing `*.e2e.test.ts` to the harness:

1. Delete the imports for `GenericContainer`, `Wait`, `mkdtempSync`,
   `tmpdir`, `WebSocket`, individual `Client` ctor, `ChildProcess`.
   Replace with the helper imports above.
2. Delete the `pgContainer` / `rabbitContainer` / `pgPort` / `rabbitPort`
   / `tempDir` / `server` module-scope vars. Replace with a single `let
ctx: TestServerHandle`.
3. Delete the `waitForHealth` / `connectOcpp` / `sendCall` local
   helpers. Use the imports.
4. Delete the `INSERT INTO ChargingStations` block. Use
   `seedChargingStation(ctx.db, STATION_ID)`.
5. Delete the inline boot block in `beforeAll`. Replace with
   `ctx = await startTestServer()`.
6. Inside the test body, change `pgContainer` / `db` references to
   `ctx.db`, port references to `ctx.httpUrl` / `ctx.wsUrl`.

Net result: ~80 lines removed per test.

## Future improvement: shared global setup

For even faster runs, vitest's `globalSetup` could boot one harness
for the entire test run, with each test just reading `ctx` from a
shared fixture. That cuts total runtime from O(N × 30s) to O(30s).

The work to land that:

1. Add `helpers/global-setup.ts` exporting `setup()` / `teardown()`.
2. Wire it via `vitest.config.ts` `globalSetup`.
3. Publish ports through env vars (vitest serializes globalSetup state
   only via env vars).
4. Each test's `beforeAll` reads the env vars instead of calling
   `startTestServer()`.

Tests use random stationIds already (`uniqueStationId(...)`) so the
shared-DB isolation already works. The migration is mechanical.

Tracked as F4 Phase B in `addressing-feedback-4-tests.md`.
