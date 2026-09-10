// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { seedMeterValues, deleteMeterValuesForTransaction } from '../../fixtures/seeded-data';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('transactions › detail charts', () => {
  test('E2E-093: Detail page renders for an existing transaction', async ({
    page,
    seededTransaction,
  }) => {
    await page.goto(`/transactions/${seededTransaction.id}`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(page.getByRole('heading').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('E2E-094: Recharts SVG mounts and plots a non-empty path when MeterValues are present', async ({
    page,
    seededTransaction,
    apiClient,
  }) => {
    // Charts render an empty-state when measurand-filtered data is empty.
    // The `tab=meterValues` query param selects the chart tab directly.
    await seedMeterValues(apiClient, seededTransaction, 6);
    try {
      await page.goto(`/transactions/${seededTransaction.id}?tab=meterValues`, {
        waitUntil: 'domcontentloaded',
      });
      const surface = page.locator('svg.recharts-surface').first();
      await expect(surface).toBeVisible({ timeout: 30_000 });

      // An empty chart mounts the surface but skips the line path; asserting
      // the path's `d` attribute proves data points actually plotted.
      const dataPath = surface.locator('path.recharts-curve, path.recharts-line-curve').first();
      await expect(dataPath).toHaveAttribute('d', /M.+/, { timeout: 15_000 });
    } finally {
      await deleteMeterValuesForTransaction(apiClient, seededTransaction.id).catch(() => undefined);
    }
  });

  test('E2E-095: Detail page exposes the Energy Over Time chart heading', async ({
    page,
    seededTransaction,
    apiClient,
  }) => {
    await seedMeterValues(apiClient, seededTransaction, 6);
    try {
      await page.goto(`/transactions/${seededTransaction.id}?tab=meterValues`, {
        waitUntil: 'domcontentloaded',
      });
      await expect(page.getByRole('heading', { name: /energy over time/i }).first()).toBeVisible({
        timeout: 30_000,
      });
    } finally {
      await deleteMeterValuesForTransaction(apiClient, seededTransaction.id).catch(() => undefined);
    }
  });
});
