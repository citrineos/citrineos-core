// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '@faker-js/faker';
import { aRequest } from '../../providers/IncomingMessageProvider.js';
import { anAuthenticationOptions } from '../../providers/AuthenticationOptionsProvider.js';
import { CacheNamespace, createIdentifier, DEFAULT_TENANT_ID, ICache } from '@citrineos/base';
import { ConnectedStationFilter } from '../../../index.js';
import { afterEach, describe, expect, it, Mock, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '../../../../test/testContainer.js';

describe('ConnectedStationFilter', () => {
  const { container } = createTestContainer();
  const cache = {
    exists: vi.fn() as ICache['exists'],
    existsAnyInNamespace: vi.fn() as ICache['existsAnyInNamespace'],
    remove: vi.fn() as ICache['remove'],
    onChange: vi.fn() as ICache['onChange'],
    get: vi.fn() as Mock & ICache['get'],
    set: vi.fn() as ICache['set'],
    setIfNotExist: vi.fn() as ICache['setIfNotExist'],
    updateExpiration: vi.fn() as ICache['updateExpiration'],
    ping: vi.fn() as ICache['ping'],
  };
  const filter = getTestInstance(container, ConnectedStationFilter, { cache });

  afterEach(() => {
    cache.get.mockReset();
  });

  it('should not reject when station is not connected', async () => {
    const ocppConnectionName = faker.string.uuid().toString();
    const identifier = createIdentifier(DEFAULT_TENANT_ID, ocppConnectionName);
    givenStationIsNotConnected();

    await filter.authenticate(
      DEFAULT_TENANT_ID,
      ocppConnectionName,
      aRequest(),
      anAuthenticationOptions(),
    );

    expect(cache.get).toHaveBeenCalledWith(identifier, CacheNamespace.Connections);
  });

  it('should reject when station is already connected', async () => {
    const ocppConnectionName = faker.string.uuid().toString();
    const identifier = createIdentifier(DEFAULT_TENANT_ID, ocppConnectionName);
    givenStationIsConnected();

    await expect(
      filter.authenticate(
        DEFAULT_TENANT_ID,
        ocppConnectionName,
        aRequest(),
        anAuthenticationOptions(),
      ),
    ).rejects.toThrow(`New connection attempted for already connected identifier ${identifier}`);

    expect(cache.get).toHaveBeenCalledWith(identifier, CacheNamespace.Connections);
  });

  function givenStationIsConnected() {
    cache.get.mockResolvedValue(faker.number.int({ min: 0, max: 3 }).toString() as any);
  }

  function givenStationIsNotConnected() {
    cache.get.mockResolvedValue(null as any);
  }
});
