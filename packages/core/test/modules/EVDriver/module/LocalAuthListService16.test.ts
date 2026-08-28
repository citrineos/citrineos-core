// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type {
  IChangeConfigurationRepository,
  IDeviceModelRepository,
  ILocalAuthListRepository,
} from '@citrineos/core';
import { ChangeConfiguration, LocalListVersion, SendLocalList } from '@citrineos/core';
import { LocalAuthListService } from '@modules/EVDriver/src/module/LocalAuthListService.js';
import { DEFAULT_TENANT_ID } from '@citrineos/base';
import { OCPP1_6 } from '@citrineos/types';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';

/**
 * The 2.0.1 path reads its limits from the device model. OCPP 1.6 has no device model: the
 * equivalents are the LocalAuthListMaxLength and SendLocalListMaxLength configuration keys, which
 * GetConfigurationResponseOcpp16Handler stores as ChangeConfiguration rows.
 */
describe('LocalAuthListService OCPP 1.6 limits', () => {
  const { container } = createTestContainer();
  const tenantId = DEFAULT_TENANT_ID;
  const ocppConnectionName = 'station-1';
  const correlationId = 'test-correlation-id';

  let localAuthListRepository: Mocked<ILocalAuthListRepository>;
  let deviceModelRepository: Mocked<IDeviceModelRepository>;
  let changeConfigurationRepository: Mocked<IChangeConfigurationRepository>;
  let service: LocalAuthListService;
  let configuration: Record<string, string>;

  beforeEach(() => {
    configuration = {};

    localAuthListRepository = {
      readOnlyOneByQuery: vi.fn().mockResolvedValue(undefined),
      createSendLocalListFromRequestData16: vi.fn().mockResolvedValue({} as SendLocalList),
    } as unknown as Mocked<ILocalAuthListRepository>;

    deviceModelRepository = {
      readAllByQuerystring: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IDeviceModelRepository>;

    changeConfigurationRepository = {
      readOnlyOneByQuery: vi.fn(async (_tenantId: number, query: { where: { key: string } }) => {
        const value = configuration[query.where.key];
        return value === undefined ? undefined : ({ value } as ChangeConfiguration);
      }),
    } as unknown as Mocked<IChangeConfigurationRepository>;

    service = getTestInstance(container, LocalAuthListService, {
      localAuthListRepository,
      deviceModelRepository,
      changeConfigurationRepository,
    });
  });

  function aRequest(
    idTags: string[],
    updateType = OCPP1_6.SendLocalListRequestUpdateType.Full,
    listVersion = 3,
  ): OCPP1_6.SendLocalListRequest {
    return {
      listVersion,
      updateType,
      localAuthorizationList: idTags.map((idTag) => ({
        idTag,
        idTagInfo: { status: OCPP1_6.SendLocalListRequestStatus.Accepted },
      })),
    } as unknown as OCPP1_6.SendLocalListRequest;
  }

  function send(request: OCPP1_6.SendLocalListRequest) {
    return service.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest16(
      tenantId,
      ocppConnectionName,
      correlationId,
      request,
    );
  }

  describe('SendLocalListMaxLength', () => {
    it('refuses a list longer than the station accepts in one message', async () => {
      configuration.SendLocalListMaxLength = '2';

      await expect(send(aRequest(['A', 'B', 'C']))).rejects.toThrow(/SendLocalListMaxLength/);
      expect(localAuthListRepository.createSendLocalListFromRequestData16).not.toHaveBeenCalled();
    });

    it('accepts a list exactly at the limit', async () => {
      configuration.SendLocalListMaxLength = '3';

      await expect(send(aRequest(['A', 'B', 'C']))).resolves.toBeDefined();
    });

    it('forwards the request when the station has not reported the key', async () => {
      await expect(send(aRequest(['A', 'B', 'C']))).resolves.toBeDefined();
    });
  });

  describe('LocalAuthListMaxLength', () => {
    it('refuses a full list that would not fit on the station', async () => {
      configuration.LocalAuthListMaxLength = '2';

      await expect(send(aRequest(['A', 'B', 'C']))).rejects.toThrow(/LocalAuthListMaxLength/);
      expect(localAuthListRepository.createSendLocalListFromRequestData16).not.toHaveBeenCalled();
    });

    it('counts a differential update against what the station already holds', async () => {
      configuration.LocalAuthListMaxLength = '3';
      localAuthListRepository.readOnlyOneByQuery.mockResolvedValue({
        versionNumber: 2,
        localAuthorizationList: [{ idToken: 'A' }, { idToken: 'B' }],
      } as unknown as LocalListVersion);

      await expect(
        send(aRequest(['C', 'D'], OCPP1_6.SendLocalListRequestUpdateType.Differential)),
      ).rejects.toThrow(/LocalAuthListMaxLength/);
    });

    it('does not count a differential entry that replaces one already held', async () => {
      configuration.LocalAuthListMaxLength = '2';
      localAuthListRepository.readOnlyOneByQuery.mockResolvedValue({
        versionNumber: 2,
        localAuthorizationList: [{ idToken: 'A' }, { idToken: 'B' }],
      } as unknown as LocalListVersion);

      await expect(
        send(aRequest(['B'], OCPP1_6.SendLocalListRequestUpdateType.Differential)),
      ).resolves.toBeDefined();
    });

    it('counts a differential delete as freeing a slot', async () => {
      // A differential entry with no idTagInfo removes that idTag, per the 1.6 spec.
      configuration.LocalAuthListMaxLength = '2';
      localAuthListRepository.readOnlyOneByQuery.mockResolvedValue({
        versionNumber: 2,
        localAuthorizationList: [{ idToken: 'A' }, { idToken: 'B' }],
      } as unknown as LocalListVersion);

      const request = {
        listVersion: 3,
        updateType: OCPP1_6.SendLocalListRequestUpdateType.Differential,
        localAuthorizationList: [{ idTag: 'A' }, { idTag: 'C', idTagInfo: { status: 'Accepted' } }],
      } as unknown as OCPP1_6.SendLocalListRequest;

      await expect(send(request)).resolves.toBeDefined();
    });

    it('forwards the request when the station has not reported the key', async () => {
      await expect(send(aRequest(['A', 'B', 'C']))).resolves.toBeDefined();
    });
  });
});
