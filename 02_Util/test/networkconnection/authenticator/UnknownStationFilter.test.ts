// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { ILocationRepository } from '@citrineos/data';
import { faker } from '@faker-js/faker';
import { UnknownStationFilter } from '../../../src';
import { aRequest } from '../../providers/IncomingMessageProvider.js';
import { anAuthenticationOptions } from '../../providers/AuthenticationOptionsProvider.js';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { afterEach, beforeEach, describe, expect, it, Mocked, vi } from 'vitest';

describe('UnknownStationFilter', () => {
  let locationRepository: Mocked<ILocationRepository>;
  let filter: UnknownStationFilter;

  beforeEach(() => {
    locationRepository = {
      doesChargingStationExistByStationId: vi.fn(),
    } as unknown as Mocked<ILocationRepository>;

    filter = new UnknownStationFilter(locationRepository);
  });

  afterEach(() => {
    locationRepository.doesChargingStationExistByStationId.mockReset();
  });

  it.each([true, false])(
    'should never reject known station',
    async (allowUnknownChargingStations) => {
      const stationId = faker.string.uuid().toString();
      givenStationExists();

      await filter.authenticate(
        DEFAULT_TENANT_ID,
        stationId,
        aRequest(),
        anAuthenticationOptions({ allowUnknownChargingStations }),
      );
    },
  );

  it('should reject unknown station when unknown stations are not allowed', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationDoesNotExist();

    await expect(
      filter.authenticate(
        DEFAULT_TENANT_ID,
        stationId,
        aRequest(),
        anAuthenticationOptions({ allowUnknownChargingStations: false }),
      ),
    ).rejects.toThrow(`Unknown identifier ${stationId}`);

    expect(locationRepository.doesChargingStationExistByStationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      stationId,
    );
  });

  it('should not reject unknown station when unknown stations are allowed', async () => {
    const stationId = faker.string.uuid().toString();
    givenStationDoesNotExist();

    await filter.authenticate(
      DEFAULT_TENANT_ID,
      stationId,
      aRequest(),
      anAuthenticationOptions({ allowUnknownChargingStations: true }),
    );

    expect(locationRepository.doesChargingStationExistByStationId).not.toHaveBeenCalledWith(
      stationId,
    );
  });

  function givenStationExists() {
    locationRepository.doesChargingStationExistByStationId.mockResolvedValue(true);
  }

  function givenStationDoesNotExist() {
    locationRepository.doesChargingStationExistByStationId.mockResolvedValue(false);
  }
});
