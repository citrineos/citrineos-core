// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { request as playwrightRequest } from '@playwright/test';
import dotenv from 'dotenv';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { makeApiClient } from '../fixtures/api-client';
import { purgeAllE2eRows } from '../fixtures/seeded-data';
import { LoginPage } from '../pages/login-page';
import { readEnv, assertRequiredEnv } from '../utils/env';
import { ensureManagedServer } from '../utils/managed-server';
import {
  captureHasuraIntrospection,
  formatDriftMessage,
  validateSchemaDrift,
  type SchemaSnapshot,
} from '../utils/schema-drift';
import { waitForBackendHealthy } from '../utils/wait';

dotenv.config({ path: resolve(__dirname, '..', '..', '..', '.env.test') });

const SCHEMA_SNAPSHOT_PATH = resolve(__dirname, '..', 'data', 'schema-snapshot.json');

export default async function globalSetup(): Promise<void> {
  assertRequiredEnv();

  const hasuraUrl = readEnv('HASURA_URL');
  const citrineUrl = readEnv('CITRINE_CORE_URL');
  const baseUrl = readEnv('E2E_BASE_URL');

  console.info('[e2e:globalSetup] resolved targets:', {
    baseUrl,
    hasuraUrl,
    citrineUrl,
  });

  // If nothing is listening on baseUrl yet, build a production bundle and
  // spawn `next start`. Reusing an already-up server is preferred (covers
  // local-dev iteration); production server is the fallback for CI and
  // for full suite runs where `next dev` would OOM under sustained route
  // compilation.
  await ensureManagedServer(baseUrl);

  const request = await playwrightRequest.newContext();
  try {
    await waitForBackendHealthy(request, [
      { name: 'Hasura', url: new URL('/healthz', hasuraUrl).toString() },
      {
        name: 'CitrineOS Core',
        url: new URL('/health', citrineUrl).toString(),
      },
      { name: 'UI', url: new URL(LoginPage.path, baseUrl).toString() },
    ]);
  } finally {
    await request.dispose();
  }

  console.info('[e2e:globalSetup] backend healthy.');

  // Purge any leaked test rows from prior runs so dashboard queries stay fast.
  // Then verify the running Hasura schema still matches the checked-in
  // snapshot — fail fast if a tracked operation or column has disappeared.
  const apiClient = await makeApiClient();
  try {
    await purgeAllE2eRows(apiClient);
    console.info('[e2e:globalSetup] e2e rows purged.');

    const baseline = JSON.parse(readFileSync(SCHEMA_SNAPSHOT_PATH, 'utf-8')) as SchemaSnapshot;
    const current = await captureHasuraIntrospection(apiClient);
    const report = validateSchemaDrift(current, baseline);
    if (!report.valid) {
      const message = formatDriftMessage(report);
      console.error('[e2e:globalSetup] schema drift detected:\n' + message);
      throw new Error(
        'Schema drift — operations or columns the UI depends on are missing.\n' + message,
      );
    }
    console.info('[e2e:globalSetup] schema snapshot in sync.');
  } finally {
    await apiClient.dispose();
  }
}
