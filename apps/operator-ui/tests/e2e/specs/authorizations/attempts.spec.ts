// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import type { ApiClient } from '../../fixtures/api-client';
import { shortId } from '../../utils/random';

// Attempts are seeded straight into Hasura: producing them from a live station is covered on the
// Core side, and these specs only prove the UI lists the right ones in the right place.

test.use({ storageState: 'playwright/.auth/admin.json' });

interface SeededAttempt {
  idToken: string;
  idTokenType?: string | null;
  authorizationId?: number;
  reason: string;
  responseStatus: string;
  transactionId?: string;
}

async function seedAttempt(api: ApiClient, attempt: SeededAttempt, correlationId: string) {
  const now = new Date().toISOString();
  await api.gql(
    `mutation SeedAuthorizationAttempt($obj: AuthorizationAttempts_insert_input!) {
       insert_AuthorizationAttempts_one(object: $obj) { id }
     }`,
    {
      obj: {
        ocppVersion: 'ocpp2.0.1',
        action: 'Authorize',
        correlationId,
        timestamp: now,
        idTokenType: 'Central',
        tenantId: 1,
        createdAt: now,
        updatedAt: now,
        ...attempt,
      },
    },
  );
}

async function deleteAttempts(api: ApiClient, correlationId: string) {
  await api.gql(
    `mutation DeleteAuthorizationAttempts($correlationId: String!) {
       delete_AuthorizationAttempts(where: { correlationId: { _eq: $correlationId } }) {
         affected_rows
       }
     }`,
    { correlationId },
  );
}

test.describe('authorizations › attempts', () => {
  const correlationId = `e2e-${shortId()}`;
  const unknownToken = `E2E-${shortId().toUpperCase()}-UNKNOWN`;
  const unknownIdTag = `E2E-${shortId().toUpperCase()}-IDTAG`;
  // A NoAuthorization idToken is empty, so its row is found by the transaction it started.
  const noAuthorizationTransactionId = `e2e-${shortId()}`;

  test.afterEach(async ({ apiClient }) => {
    await deleteAttempts(apiClient, correlationId).catch(() => undefined);
  });

  test('E2E-159: the detail page lists only the attempts made with that authorization', async ({
    page,
    apiClient,
    seededAuthorization,
  }) => {
    await seedAttempt(
      apiClient,
      {
        idToken: seededAuthorization.idToken,
        authorizationId: seededAuthorization.id,
        reason: 'AuthorizerRejected',
        responseStatus: 'Blocked',
      },
      correlationId,
    );
    await seedAttempt(
      apiClient,
      { idToken: unknownToken, reason: 'NotFound', responseStatus: 'Unknown' },
      correlationId,
    );

    await page.goto(`/authorizations/${seededAuthorization.id}`, { waitUntil: 'domcontentloaded' });
    await page.getByRole('tab', { name: /authorization attempts/i }).click();

    await expect(page.getByRole('row').filter({ hasText: 'AuthorizerRejected' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('row').filter({ hasText: 'NotFound' })).toHaveCount(0);
  });

  test('E2E-160: the list tab narrows to idTokens that matched no authorization', async ({
    page,
    apiClient,
    seededAuthorization,
  }) => {
    await seedAttempt(
      apiClient,
      {
        idToken: seededAuthorization.idToken,
        authorizationId: seededAuthorization.id,
        reason: 'Accepted',
        responseStatus: 'Accepted',
      },
      correlationId,
    );
    await seedAttempt(
      apiClient,
      { idToken: unknownToken, reason: 'NotFound', responseStatus: 'Unknown' },
      correlationId,
    );
    await seedAttempt(
      apiClient,
      {
        idToken: unknownIdTag,
        idTokenType: null,
        reason: 'NotFound',
        responseStatus: 'Invalid',
      },
      correlationId,
    );
    await seedAttempt(
      apiClient,
      {
        idToken: '',
        idTokenType: 'NoAuthorization',
        reason: 'NoAuthorization',
        responseStatus: 'Accepted',
        transactionId: noAuthorizationTransactionId,
      },
      correlationId,
    );

    await page.goto('/authorizations?tab=attempts', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /^authorization attempts$/i })).toBeVisible({
      timeout: 30_000,
    });

    const known = page.getByRole('row').filter({ hasText: seededAuthorization.idToken });
    const unknown = page.getByRole('row').filter({ hasText: unknownToken });
    const untypedUnknown = page.getByRole('row').filter({ hasText: unknownIdTag });
    const noAuthorization = page.getByRole('row').filter({ hasText: noAuthorizationTransactionId });
    await expect(known).toBeVisible({ timeout: 30_000 });
    await expect(unknown).toBeVisible();
    await expect(noAuthorization).toBeVisible();

    await page.getByRole('switch', { name: /unmatched tokens only/i }).click();

    await expect(unknown).toBeVisible({ timeout: 30_000 });
    await expect(untypedUnknown).toBeVisible();
    await expect(known).toHaveCount(0);
    await expect(noAuthorization).toHaveCount(0);
  });
});
