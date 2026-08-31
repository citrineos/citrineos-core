// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP2_0_1 } from '@citrineos/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PutBootConfigEndpoint } from '@modules/Api/src/module/endpoints/BootConfigEndpoints.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';

const URL = '/commands/bootConfig';
const STATION = 'cs001';

describe('PutBootConfigEndpoint', () => {
  const { container } = createTestContainer();

  let createOrUpdateByKey: ReturnType<typeof vi.fn>;
  let doesChargingStationExistByStationId: ReturnType<typeof vi.fn>;
  let mounted: MountedEndpoint;

  async function mount(stationExists: boolean) {
    createOrUpdateByKey = vi.fn().mockResolvedValue({ id: 1, stationId: 7, status: 'Accepted' });
    doesChargingStationExistByStationId = vi.fn().mockResolvedValue(stationExists);

    const endpoint = getTestInstance(container, PutBootConfigEndpoint, {
      bootRepository: { createOrUpdateByKey },
      locationRepository: { doesChargingStationExistByStationId },
    });
    mounted = await mountEndpoint(endpoint, PutBootConfigEndpoint.route);
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const put = () =>
    mounted.server.inject({
      method: 'PUT',
      url: `${URL}?tenantId=${DEFAULT_TENANT_ID}&ocppConnectionName=${STATION}`,
      payload: { status: OCPP2_0_1.RegistrationStatusEnumType.Accepted },
    });

  it('stores the boot config when the charging station exists', async () => {
    await mount(true);

    const response = await put();

    expect(response.statusCode).toBe(200);
    expect(doesChargingStationExistByStationId).toHaveBeenCalledWith(DEFAULT_TENANT_ID, STATION);
    expect(createOrUpdateByKey).toHaveBeenCalledTimes(1);
    expect(createOrUpdateByKey.mock.calls[0][0]).toBe(DEFAULT_TENANT_ID);
    expect(createOrUpdateByKey.mock.calls[0][2]).toBe(STATION);
  });

  it('fails with 404 and does not write when the charging station does not exist', async () => {
    await mount(false);

    const response = await put();

    expect(response.statusCode).toBe(404);
    expect(response.json().message).toContain(STATION);
    expect(createOrUpdateByKey).not.toHaveBeenCalled();
  });
});
