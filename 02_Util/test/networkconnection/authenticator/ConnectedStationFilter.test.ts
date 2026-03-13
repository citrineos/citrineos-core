// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '@faker-js/faker';
import { aRequest } from '../../providers/IncomingMessageProvider.js';
import { anAuthenticationOptions } from '../../providers/AuthenticationOptionsProvider.js';
import { CacheNamespace, DEFAULT_TENANT_ID, ICache } from '@citrineos/base';
import { ConnectedStationFilter } from '../../../src';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('ConnectedStationFilter', () => {
  let cache: Mocked<ICache>;
  let filter: ConnectedStationFilter;

  beforeEach(() => {
    cache = {
      get: vi.fn(),
    } as unknown as Mocked<ICache>;

    filter = new ConnectedStationFilter(cache);
  });

  afterEach(() => {
    cache.get.mockReset();
  });

  it('should not reject when station is not connected', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationIsNotConnected();

    await filter.authenticate(DEFAULT_TENANT_ID, stationId, aRequest(), anAuthenticationOptions());

    expect(cache.get).toHaveBeenCalledWith(stationId, CacheNamespace.Connections);
  });

  it('should reject when station is already connected', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationIsConnected();

    await expect(
      filter.authenticate(DEFAULT_TENANT_ID, stationId, aRequest(), anAuthenticationOptions()),
    ).rejects.toThrow(`New connection attempted for already connected identifier ${stationId}`);

    expect(cache.get).toHaveBeenCalledWith(stationId, CacheNamespace.Connections);
  });

  function givenStationIsConnected() {
    cache.get.mockResolvedValue(faker.number.int({ min: 0, max: 3 }).toString() as any);
  }

  function givenStationIsNotConnected() {
    cache.get.mockResolvedValue(null as any);
  }
});
