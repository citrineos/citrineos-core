// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteStationNetworkProfileEndpoint } from '@/apis/commands/DeleteStationNetworkProfileEndpoint.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { mountEndpoint, type MountedEndpoint } from '@test/providers/endpointHarness.js';

const URL = '/commands/stationNetworkProfile';

describe('DeleteStationNetworkProfileEndpoint', () => {
  const { container } = createTestContainer();

  let deleteAllByStationIdAndConfigurationSlots: ReturnType<typeof vi.fn>;
  let mounted: MountedEndpoint;

  beforeEach(async () => {
    vi.clearAllMocks();
    deleteAllByStationIdAndConfigurationSlots = vi.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const endpoint = getTestInstance(container, DeleteStationNetworkProfileEndpoint, {
      chargingStationNetworkProfileRepository: { deleteAllByStationIdAndConfigurationSlots },
    });
    mounted = await mountEndpoint(endpoint, DeleteStationNetworkProfileEndpoint.route);
  });

  it('is registered as a DELETE', () => {
    expect(DeleteStationNetworkProfileEndpoint.route.method).toBe('DELETE');
    expect(DeleteStationNetworkProfileEndpoint.route.path).toBe('/stationNetworkProfile');
  });

  it('deletes the requested slots for the station', async () => {
    const response = await mounted.server.inject({
      method: 'DELETE',
      url: `${URL}?ocppConnectionName=cs001&tenantId=${DEFAULT_TENANT_ID}&configurationSlot=1&configurationSlot=2`,
    });

    expect(response.statusCode).toBe(200);
    expect(deleteAllByStationIdAndConfigurationSlots).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      'cs001',
      [1, 2],
    );
  });

  it('reports how many rows it destroyed', async () => {
    const response = await mounted.server.inject({
      method: 'DELETE',
      url: `${URL}?ocppConnectionName=cs001&tenantId=${DEFAULT_TENANT_ID}&configurationSlot=1`,
    });

    expect(response.json()).toEqual({ success: true, payload: '2 rows successfully destroyed' });
  });

  it('reports zero when nothing matched', async () => {
    deleteAllByStationIdAndConfigurationSlots.mockResolvedValue([]);

    const response = await mounted.server.inject({
      method: 'DELETE',
      url: `${URL}?ocppConnectionName=cs001&tenantId=${DEFAULT_TENANT_ID}&configurationSlot=9`,
    });

    expect(response.json().payload).toBe('0 rows successfully destroyed');
  });

  it('rejects a request without a station name', async () => {
    const response = await mounted.server.inject({
      method: 'DELETE',
      url: `${URL}?tenantId=${DEFAULT_TENANT_ID}&configurationSlot=1`,
    });

    expect(response.statusCode).toBe(400);
    expect(deleteAllByStationIdAndConfigurationSlots).not.toHaveBeenCalled();
  });

  it('surfaces a repository failure as a 500 and logs it', async () => {
    deleteAllByStationIdAndConfigurationSlots.mockRejectedValue(new Error('db down'));

    const response = await mounted.server.inject({
      method: 'DELETE',
      url: `${URL}?ocppConnectionName=cs001&tenantId=${DEFAULT_TENANT_ID}&configurationSlot=1`,
    });

    expect(response.statusCode).toBe(500);
    expect(mounted.loggedErrors).toHaveLength(1);
  });
});
