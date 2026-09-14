// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../fixtures';
import { ChargingStationDetailPage } from '../../pages/charging-stations/detail-page';

test.use({ storageState: 'playwright/.auth/admin.json' });

test.describe('charging-stations › realtime status @everest', () => {
  test('E2E-057: cp001 detail page surfaces a Hasura-bound status without manual reload @everest', async ({
    page,
    everestStation,
  }) => {
    // The everestStation fixture guarantees cp001 has fresh
    // StatusNotifications. The detail card subscribes via Refine + Hasura
    // websockets so a live status change propagates without page.reload().
    // Smoke depth: confirm the detail card mounts with a status indicator
    // on first load. A true "transition" assertion would require driving
    // EVerest to flip Available → Charging, which is not feasible without
    // staging an active OCPP transaction.
    const detail = new ChargingStationDetailPage(page);
    await detail.goto(everestStation.id);
    await expect(detail.commandBar.resetButton).toBeVisible({
      timeout: 30_000,
    });
    // Status indicator presence — text or colored dot. Re-uses the
    // pattern from list.spec.ts E2E-045.
    await expect(page.getByText(/(online|offline|unknown)/i).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});
