// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { faker } from '@faker-js/faker';
import { UnknownStationFilter } from '@/transport/index.js';
import { aRequest } from '../../../providers/incoming-message-provider.js';
import { anAuthenticationOptions } from '../../../providers/authentication-options-provider.js';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '@test/test-container.js';

describe('UnknownStationFilter', () => {
  const { container } = createTestContainer();
  const chargingStationRepository = { doesChargingStationExistByOcppConnectionName: vi.fn() };
  const filter = getTestInstance(container, UnknownStationFilter, { chargingStationRepository });

  afterEach(() => {
    chargingStationRepository.doesChargingStationExistByOcppConnectionName.mockReset();
  });

  it.each([true, false])(
    'should never reject known station',
    async (allowUnknownChargingStations) => {
      const ocppConnectionName = faker.string.uuid().toString();
      givenStationExists();

      await filter.authenticate(
        DEFAULT_TENANT_ID,
        ocppConnectionName,
        aRequest(),
        anAuthenticationOptions({ allowUnknownChargingStations }),
      );
    },
  );

  it('should reject unknown station when unknown stations are not allowed', async () => {
    const ocppConnectionName = faker.string.uuid().toString();
    givenStationDoesNotExist();

    await expect(
      filter.authenticate(
        DEFAULT_TENANT_ID,
        ocppConnectionName,
        aRequest(),
        anAuthenticationOptions({ allowUnknownChargingStations: false }),
      ),
    ).rejects.toThrow(`Unknown identifier ${ocppConnectionName}`);

    expect(
      chargingStationRepository.doesChargingStationExistByOcppConnectionName,
    ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, ocppConnectionName);
  });

  it('should not reject unknown station when unknown stations are allowed', async () => {
    const ocppConnectionName = faker.string.uuid().toString();
    givenStationDoesNotExist();

    await filter.authenticate(
      DEFAULT_TENANT_ID,
      ocppConnectionName,
      aRequest(),
      anAuthenticationOptions({ allowUnknownChargingStations: true }),
    );

    expect(
      chargingStationRepository.doesChargingStationExistByOcppConnectionName,
    ).not.toHaveBeenCalledWith(ocppConnectionName);
  });

  function givenStationExists() {
    chargingStationRepository.doesChargingStationExistByOcppConnectionName.mockResolvedValue(true);
  }

  function givenStationDoesNotExist() {
    chargingStationRepository.doesChargingStationExistByOcppConnectionName.mockResolvedValue(false);
  }
});
