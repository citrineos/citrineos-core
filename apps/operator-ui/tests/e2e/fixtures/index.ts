// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test as base } from '@playwright/test';
import { makeApiClient, type ApiClient } from './api-client';
import {
  deleteAuthorization,
  deleteLocation,
  deleteStation,
  deleteTransaction,
  seedAuthorization,
  seedLocation,
  seedStation,
  seedTransaction,
  type SeededAuthorization,
  type SeededLocation,
  type SeededStation,
  type SeededTransaction,
} from './seeded-data';
import { startEverest, ensureEverestOnline, type EverestHandle } from './everest';

interface E2EFixtures {
  apiClient: ApiClient;
  seededLocation: SeededLocation;
  seededStation: SeededStation;
  seededTransaction: SeededTransaction;
  seededAuthorization: SeededAuthorization;
  everestStation: EverestHandle;
}

interface E2EWorkerFixtures {
  everestManager: EverestHandle;
}

export const test = base.extend<E2EFixtures, E2EWorkerFixtures>({
  apiClient: async ({}, use) => {
    const client = await makeApiClient();
    await use(client);
    await client.dispose();
  },

  // Teardown deletes stay non-fatal (a failed cleanup must not fail the
  // test), but they log: a silently-broken delete leaks rows for the whole
  // run and only the name-prefix purge at teardown reclaims them.
  seededLocation: async ({ apiClient }, use) => {
    const location = await seedLocation(apiClient);
    await use(location);
    await deleteLocation(apiClient, location.id).catch((err) => {
      console.warn(`[e2e:fixtures] deleteLocation(${location.id}) failed:`, err);
    });
  },

  seededStation: async ({ apiClient, seededLocation }, use) => {
    const station = await seedStation(apiClient, seededLocation.id);
    await use(station);
    await deleteStation(apiClient, station.id).catch((err) => {
      console.warn(`[e2e:fixtures] deleteStation(${station.id}) failed:`, err);
    });
  },

  seededTransaction: async ({ apiClient, seededStation }, use) => {
    const transaction = await seedTransaction(apiClient, seededStation.ocppConnectionName);
    await use(transaction);
    await deleteTransaction(apiClient, transaction.transactionId).catch((err) => {
      console.warn(`[e2e:fixtures] deleteTransaction(${transaction.transactionId}) failed:`, err);
    });
  },

  seededAuthorization: async ({ apiClient }, use) => {
    const authorization = await seedAuthorization(apiClient);
    await use(authorization);
    await deleteAuthorization(apiClient, authorization.id).catch((err) => {
      console.warn(`[e2e:fixtures] deleteAuthorization(${authorization.id}) failed:`, err);
    });
  },

  // EVerest is expensive: docker-compose up of multiple containers, then a
  // 60–90s wait for the OCPP BootNotification to flow into Hasura.
  //
  // Worker-scoped: the manager boots once per worker and is shared by every
  // @everest spec in that worker (the everest-serial project runs them all in
  // a single workers=1 worker). This replaces the previous per-test
  // compose up/down cycle, which churned the manager into instability over a
  // run and — because EVerest shares the citrineos-core backend — leaked
  // failures into the chromium lane. The chromium worker never requests an
  // EVerest fixture, so it never starts EVerest at all.
  everestManager: [
    async ({}, use) => {
      const handle = await startEverest();
      await use(handle);
      await handle.stop();
    },
    { scope: 'worker' },
  ],

  // Test-scoped guard over the shared manager. A Reset Immediate in a prior
  // test reboots the manager, leaving cp001 offline for ~1 minute; this waits
  // for it to reconnect before the test runs (no-op when already online).
  // Specs request `everestStation` exactly as before.
  everestStation: async ({ everestManager }, use) => {
    await ensureEverestOnline();
    await use(everestManager);
  },
});

export { expect } from '@playwright/test';
