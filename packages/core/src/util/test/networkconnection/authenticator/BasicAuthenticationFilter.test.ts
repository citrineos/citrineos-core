// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { VariableAttribute } from '@citrineos/core';
import { DEFAULT_TENANT_ID, OCPP2_0_1 } from '@citrineos/base';
import { faker } from '@faker-js/faker';
import { aBasicAuthPasswordVariable } from '../../providers/VariableAttributeProvider.js';
import { BasicAuthenticationFilter } from '../../../index.js';
import { aRequestWithAuthorization, basicAuth } from '../../providers/IncomingMessageProvider.js';
import { anAuthenticationOptions } from '../../providers/AuthenticationOptionsProvider.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '../../../../test/testContainer.js';

describe('BasicAuthenticationFilter', () => {
  const { container } = createTestContainer();
  const password = 'SEPtwLckb5QD5on0EXcCAmuQVmJ*bu3ZXmA:Clt3';
  const anotherPassword = '_Oec8yF4r1hH6ildo4yvM25:SU2hpL*jobDskYos';

  const deviceModelRepository = { readAllByQuerystring: vi.fn() };
  const filter = getTestInstance(container, BasicAuthenticationFilter, { deviceModelRepository });

  afterEach(() => {
    deviceModelRepository.readAllByQuerystring.mockReset();
  });

  describe.each([1, 2])(`given %i security profile `, (securityProfile) => {
    const authenticationOptions = anAuthenticationOptions({
      securityProfile,
      allowUnknownChargingStations: faker.datatype.boolean(),
    });

    it.each([
      ['9a06661c-2332-4897-b0d4-2187671dbe7b', ' 9a06661c-2332-4897-b0d4-2187671dbe7b'],
      ['9a06661c-2332-4897-b0d4-2187671dbe7b', '9a06661c-2332-4897-b0d4-2187671dbe7b '],
      ['9a06661c-2332-4897-b0d4-2187671dbe7b', '9a06661c-2332-4897-b0d4-2187671dbe7bb'],
      ['9a06661c-2332-4897-b0d4-2187671dbe7b', '8a06661c-2332-4897-b0d4-2187671dbe7b'],
      ['9a06661c-2332-4897-b0d4-2187671dbe7b', 'bc2696f3-66d5-4027-9eae-be74c1e85fa7'],
    ])(
      'should reject when station identifier does not match username',
      async (ocppConnectionName, username) => {
        givenPassword(ocppConnectionName, password);

        await expect(
          filter.authenticate(
            DEFAULT_TENANT_ID,
            ocppConnectionName,
            aRequestWithAuthorization(basicAuth(username, password)),
            authenticationOptions,
          ),
        ).rejects.toThrow(`Unauthorized ${ocppConnectionName}`);
        expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
      },
    );

    it('should reject when missing Authorization header', async () => {
      const ocppConnectionName = faker.string.uuid().toString();

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          ocppConnectionName,
          aRequestWithAuthorization(undefined),
          authenticationOptions,
        ),
      ).rejects.toThrow('Auth header missing or incorrectly formatted');
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });

    it('should reject when Authorization header is empty', async () => {
      const ocppConnectionName = faker.string.uuid().toString();

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          ocppConnectionName,
          aRequestWithAuthorization(''),
          authenticationOptions,
        ),
      ).rejects.toThrow('Auth header missing or incorrectly formatted');
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });

    it('should reject when Authorization header is not Basic', async () => {
      const ocppConnectionName = faker.string.uuid().toString();

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          ocppConnectionName,
          aRequestWithAuthorization(
            `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6ImNwMDAxIiwiaWF0IjoxNTE2MjM5MDIyfQ.Y3LDdxSufp_2nOqUmBWTR5CyQ2eEBWPPzjRIJqc6bn8`,
          ),
          authenticationOptions,
        ),
      ).rejects.toThrow('Auth header missing or incorrectly formatted');
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });

    it('should reject when missing username', async () => {
      const ocppConnectionName = faker.string.uuid().toString();

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          ocppConnectionName,
          aRequestWithAuthorization(basicAuth('', password)),
          authenticationOptions,
        ),
      ).rejects.toThrow('Auth header missing or incorrectly formatted');
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });

    it('should reject when missing password', async () => {
      const ocppConnectionName = faker.string.uuid().toString();

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          ocppConnectionName,
          aRequestWithAuthorization(basicAuth(ocppConnectionName, '')),
          authenticationOptions,
        ),
      ).rejects.toThrow('Auth header missing or incorrectly formatted');
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });

    it('should reject when missing username and password', async () => {
      const ocppConnectionName = faker.string.uuid().toString();

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          ocppConnectionName,
          aRequestWithAuthorization(basicAuth('', '')),
          authenticationOptions,
        ),
      ).rejects.toThrow('Auth header missing or incorrectly formatted');
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });

    it('should reject when password is not found for station', async () => {
      const ocppConnectionName = faker.string.uuid().toString();
      givenNoPassword();

      await expect(
        filter.authenticate(
          DEFAULT_TENANT_ID,
          ocppConnectionName,
          aRequestWithAuthorization(basicAuth(ocppConnectionName, password)),
          authenticationOptions,
        ),
      ).rejects.toThrow(`Unauthorized ${ocppConnectionName}`);
      expect(deviceModelRepository.readAllByQuerystring).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: ocppConnectionName,
        component_name: 'SecurityCtrlr',
        variable_name: 'BasicAuthPassword',
        type: OCPP2_0_1.AttributeEnumType.Actual,
      });
    });

    it.each([
      {
        actualPassword: password,
        authenticationPassword: ` `,
      },
      {
        actualPassword: password,
        authenticationPassword: anotherPassword,
      },
      {
        actualPassword: anotherPassword,
        authenticationPassword: password,
      },
      {
        actualPassword: password,
        authenticationPassword: `${password} `,
      },
      {
        actualPassword: password,
        authenticationPassword: ` ${password}`,
      },
      {
        actualPassword: password,
        authenticationPassword: ` ${password} `,
      },
    ])(
      'should reject when password does not match',
      async ({ actualPassword, authenticationPassword }) => {
        const ocppConnectionName = faker.string.uuid().toString();
        givenPassword(ocppConnectionName, actualPassword);

        await expect(
          filter.authenticate(
            DEFAULT_TENANT_ID,
            ocppConnectionName,
            aRequestWithAuthorization(basicAuth(ocppConnectionName, authenticationPassword)),
            authenticationOptions,
          ),
        ).rejects.toThrow(`Unauthorized ${ocppConnectionName}`);
      },
    );

    it.each([
      {
        actualPassword: password,
        authenticationPassword: password,
      },
      {
        actualPassword: anotherPassword,
        authenticationPassword: anotherPassword,
      },
    ])(
      'should do nothing when password matches',
      async ({ actualPassword, authenticationPassword }) => {
        const ocppConnectionName = faker.string.uuid().toString();
        givenPassword(ocppConnectionName, actualPassword);

        await expect(async () => {
          await filter.authenticate(
            DEFAULT_TENANT_ID,
            ocppConnectionName,
            aRequestWithAuthorization(basicAuth(ocppConnectionName, authenticationPassword)),
            authenticationOptions,
          );
        }).not.toThrow();
      },
    );
  });

  describe.each([0, 3])(`given %i security profile`, (securityProfile) => {
    const authenticationOptions = anAuthenticationOptions({
      securityProfile,
      allowUnknownChargingStations: faker.datatype.boolean(),
    });

    it('should do nothing when missing Authorization header', async () => {
      const ocppConnectionName = faker.string.uuid().toString();

      await filter.authenticate(
        DEFAULT_TENANT_ID,
        ocppConnectionName,
        aRequestWithAuthorization(undefined),
        authenticationOptions,
      );
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });

    it('should do nothing when Authorization header is present', async () => {
      const ocppConnectionName = faker.string.uuid().toString();

      await filter.authenticate(
        DEFAULT_TENANT_ID,
        ocppConnectionName,
        aRequestWithAuthorization(basicAuth(ocppConnectionName, password)),
        authenticationOptions,
      );

      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
    });
  });

  function givenPassword(ocppConnectionName: string, storedPassword: string): void {
    const passwordVariable = aBasicAuthPasswordVariable({
      ocppConnectionName: ocppConnectionName,
      value: storedPassword,
    } as Partial<VariableAttribute>);

    deviceModelRepository.readAllByQuerystring.mockResolvedValue([passwordVariable]);
  }

  function givenNoPassword() {
    deviceModelRepository.readAllByQuerystring.mockResolvedValue([]);
  }
});
