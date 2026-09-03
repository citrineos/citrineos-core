// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type IChangeConfigurationRepository,
  type IDeviceModelRepository,
  type ILocalAuthListRepository,
  LocalListVersion,
  SendLocalList,
  VariableAttribute,
  VariableCharacteristics,
} from '@citrineos/core';
import { OCPP2_0_1 } from '@citrineos/types';
import { LocalAuthListService } from '@modules/EVDriver/src/module/LocalAuthListService.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';

describe('LocalAuthListService', () => {
  const { container } = createTestContainer();
  let mockLocalAuthListRepository: Mocked<ILocalAuthListRepository>;
  let mockDeviceModelRepository: Mocked<IDeviceModelRepository>;
  let mockChangeConfigurationRepository: Mocked<IChangeConfigurationRepository>;
  let localAuthListService: LocalAuthListService;

  const tenantId = DEFAULT_TENANT_ID;
  const ocppConnectionName = 'station-1';
  const correlationId = 'test-correlation-id';
  const initialVersionNumber = 2;
  const baseMockLocalListVersion = vi.mocked<LocalListVersion>({
    ocppConnectionName: ocppConnectionName,
    versionNumber: initialVersionNumber,
  } as unknown as LocalListVersion);
  const baseMockVariableCharacteristics = vi.mocked<VariableCharacteristics>({
    dataType: OCPP2_0_1.DataEnumType.integer,
  } as unknown as VariableCharacteristics);

  beforeEach(() => {
    mockLocalAuthListRepository = {
      readOnlyOneByQuery: vi.fn(),
      createSendLocalListFromRequestData: vi.fn(),
    } as unknown as Mocked<ILocalAuthListRepository>;

    mockDeviceModelRepository = {
      findVariableCharacteristicsByVariableNameAndVariableInstance: vi.fn(),
      readAllByQuerystring: vi.fn(),
    } as unknown as Mocked<IDeviceModelRepository>;

    // Only the OCPP 1.6 path reads configuration keys; these specs all exercise 2.0.1.
    mockChangeConfigurationRepository = {
      readOnlyOneByQuery: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IChangeConfigurationRepository>;

    localAuthListService = getTestInstance(container, LocalAuthListService, {
      localAuthListRepository: mockLocalAuthListRepository,
      deviceModelRepository: mockDeviceModelRepository,
      changeConfigurationRepository: mockChangeConfigurationRepository,
    });
  });

  it('should persist SendLocalListRequest and return the SendLocalList, validating input arguments', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;
    const expectedCorrelationId = correlationId;

    const sendLocalListRequest = {
      versionNumber: newVersionNumber,
      localAuthorizationList: [
        {
          idToken: { idToken: 'ID_TOKEN', type: 'Central' },
          idTokenInfo: { status: 'Accepted' },
        },
      ] as [OCPP2_0_1.AuthorizationData],
      updateType: expectedUpdateType,
    };

    const mockSendLocalList = vi.mocked<SendLocalList>({
      correlationId: expectedCorrelationId,
      ocppConnectionName: ocppConnectionName,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
      localAuthorizationList: [],
    } as unknown as SendLocalList);

    const testMockVariableCharacteristics = Object.assign({}, baseMockVariableCharacteristics, {
      maxLimit: 10,
    });

    mockLocalAuthListRepository.readOnlyOneByQuery.mockResolvedValue(baseMockLocalListVersion);
    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );
    mockDeviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance.mockResolvedValue(
      testMockVariableCharacteristics,
    );
    mockDeviceModelRepository.readAllByQuerystring.mockResolvedValue([]);

    const result =
      await localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest,
      );

    expect(result).toEqual(mockSendLocalList);
    expect(mockLocalAuthListRepository.createSendLocalListFromRequestData).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      ocppConnectionName,
      expectedCorrelationId,
      expectedUpdateType,
      newVersionNumber,
      sendLocalListRequest.localAuthorizationList,
    );
  });

  it('should throw an error when SendLocalListRequest.versionNumber is less than or equal to 0', async () => {
    const sendLocalListRequest_0 = {
      versionNumber: 0,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
    };

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest_0,
      ),
    ).rejects.toThrow('Version number 0 must be greater than 0, see D01.FR.18');

    const sendLocalListRequest_negative = {
      versionNumber: -1,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
    };

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest_negative,
      ),
    ).rejects.toThrow('Version number -1 must be greater than 0, see D01.FR.18');
  });

  it('should throw an error when versionNumber is less than the current LocalListVersion', async () => {
    const sendLocalListRequest = {
      versionNumber: 1,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
    };

    mockLocalAuthListRepository.readOnlyOneByQuery.mockResolvedValue(baseMockLocalListVersion);

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest,
      ),
    ).rejects.toThrow(
      `Current LocalListVersion for ${ocppConnectionName} is 2, cannot send LocalListVersion 1 (version number must be higher)`,
    );
  });

  it('should throw an error when there are duplicate idTokens in the localAuthorizationList', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;

    const sendLocalListRequest = {
      versionNumber: newVersionNumber,
      updateType: expectedUpdateType,
      localAuthorizationList: [
        {
          idToken: { idToken: 'ID_TOKEN', type: 'Central' },
          idTokenInfo: { status: 'Accepted' },
        },
        {
          idToken: { idToken: 'ID_TOKEN', type: 'Central' },
          idTokenInfo: { status: 'Blocked' },
        },
      ] as [OCPP2_0_1.AuthorizationData, OCPP2_0_1.AuthorizationData],
    };

    const mockSendLocalList = vi.mocked<SendLocalList>({
      correlationId: correlationId,
      ocppConnectionName: ocppConnectionName,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
      localAuthorizationList: [],
    } as unknown as SendLocalList);

    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest,
      ),
    ).rejects.toThrow('Duplicated idToken in SendLocalList ["ID_TOKENCentral","ID_TOKENCentral"]');
  });

  it('should throw an error when updated list length exceeds maxLocalAuthListEntries', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;

    const sendLocalListRequest = {
      versionNumber: 3,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
      localAuthorizationList: [
        {
          idToken: { idToken: 'ID_TOKEN1', type: 'Central' },
          idTokenInfo: { status: 'Accepted' },
        },
        {
          idToken: { idToken: 'ID_TOKEN2', type: 'Central' },
          idTokenInfo: { status: 'Blocked' },
        },
      ] as [OCPP2_0_1.AuthorizationData, OCPP2_0_1.AuthorizationData],
    };

    const mockSendLocalList = vi.mocked<SendLocalList>({
      correlationId: correlationId,
      ocppConnectionName: ocppConnectionName,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
      localAuthorizationList: [
        {
          idToken: { idToken: 'ID_TOKEN1', type: 'Central' },
          idTokenInfo: { status: 'Accepted' },
        },
        {
          idToken: { idToken: 'ID_TOKEN2', type: 'Central' },
          idTokenInfo: { status: 'Blocked' },
        },
      ],
    } as unknown as SendLocalList);

    const mockEntriesAttribute = vi.mocked<VariableAttribute>({
      variable: { variableCharacteristics: { maxLimit: 1 } },
    } as unknown as VariableAttribute);

    mockLocalAuthListRepository.readOnlyOneByQuery.mockResolvedValue(undefined); // No previous list version
    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );
    mockDeviceModelRepository.readAllByQuerystring.mockResolvedValue([mockEntriesAttribute]);

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest,
      ),
    ).rejects.toThrow(
      'Updated local auth list length (2) will exceed max local auth list entries (1)',
    );
  });

  it('should forward the request when the station has not reported a max (no Entries variable)', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;

    const sendLocalListRequest = {
      versionNumber: 2,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
    };

    const mockSendLocalList = vi.mocked<SendLocalList>({
      correlationId: correlationId,
      ocppConnectionName: ocppConnectionName,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
    } as unknown as SendLocalList);

    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );
    mockDeviceModelRepository.readAllByQuerystring.mockResolvedValue([]); // No Entries variable reported

    const result =
      await localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest,
      );

    expect(result).toEqual(mockSendLocalList);
  });

  it('should forward the request when the Entries variable has no maxLimit', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;

    const sendLocalListRequest = {
      versionNumber: 2,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
    };

    const mockSendLocalList = vi.mocked<SendLocalList>({
      correlationId: correlationId,
      ocppConnectionName: ocppConnectionName,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
    } as unknown as SendLocalList);

    const mockEntriesAttribute = vi.mocked<VariableAttribute>({
      variable: { variableCharacteristics: {} },
    } as unknown as VariableAttribute);

    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );
    mockDeviceModelRepository.readAllByQuerystring.mockResolvedValue([mockEntriesAttribute]);

    const result =
      await localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest,
      );

    expect(result).toEqual(mockSendLocalList);
  });

  it('should throw an error when localAuthorizationList exceeds itemsPerMessageSendLocalList', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;

    const sendLocalListRequest = {
      versionNumber: 3,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
      localAuthorizationList: [
        {
          idToken: { idToken: 'ID_TOKEN1', type: 'Central' },
          idTokenInfo: { status: 'Accepted' },
        },
        {
          idToken: { idToken: 'ID_TOKEN2', type: 'Central' },
          idTokenInfo: { status: 'Blocked' },
        },
      ] as [OCPP2_0_1.AuthorizationData, OCPP2_0_1.AuthorizationData],
    };

    const mockSendLocalList = vi.mocked<SendLocalList>({
      correlationId: correlationId,
      ocppConnectionName: ocppConnectionName,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
      localAuthorizationList: [
        {
          idToken: { idToken: 'ID_TOKEN1', type: 'Central' },
          idTokenInfo: { status: 'Accepted' },
        },
        {
          idToken: { idToken: 'ID_TOKEN2', type: 'Central' },
          idTokenInfo: { status: 'Blocked' },
        },
      ],
    } as unknown as SendLocalList);

    const testMockVariableCharacteristics = Object.assign({}, baseMockVariableCharacteristics, {
      maxLimit: 10,
    });
    const mockVariableAttribute = vi.mocked<VariableAttribute>({
      ocppConnectionName: ocppConnectionName,
      dataType: OCPP2_0_1.DataEnumType.integer,
      value: '1', // Max 1 item per message
    } as unknown as VariableAttribute);

    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );
    mockDeviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance.mockResolvedValue(
      testMockVariableCharacteristics,
    );
    mockDeviceModelRepository.readAllByQuerystring.mockResolvedValue([mockVariableAttribute]);

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest,
      ),
    ).rejects.toThrow(
      'Number of authorizations (2) in SendLocalListRequest ({"versionNumber":3,"updateType":"Full","localAuthorizationList":[{"idToken":{"idToken":"ID_TOKEN1","type":"Central"},"idTokenInfo":{"status":"Accepted"}},{"idToken":{"idToken":"ID_TOKEN2","type":"Central"},"idTokenInfo":{"status":"Blocked"}}]}) exceeds itemsPerMessageSendLocalList (1) (see D01.FR.11; break list up into multiple SendLocalListRequests of at most 1 authorizations by sending one with updateType Full and additional with updateType Differential until all authorizations have been sent)',
    );
  });

  it('should not throw an error when localAuthorizationList is less than itemsPerMessageSendLocalList', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;

    const sendLocalListRequest = {
      versionNumber: newVersionNumber,
      updateType: expectedUpdateType,
      localAuthorizationList: [
        {
          idToken: { idToken: 'ID_TOKEN1', type: 'Central' },
          idTokenInfo: { status: 'Accepted' },
        },
        {
          idToken: { idToken: 'ID_TOKEN2', type: 'Central' },
          idTokenInfo: { status: 'Blocked' },
        },
      ] as [OCPP2_0_1.AuthorizationData, OCPP2_0_1.AuthorizationData],
    };

    const mockSendLocalList = vi.mocked<SendLocalList>({
      correlationId: correlationId,
      ocppConnectionName: ocppConnectionName,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
      localAuthorizationList: [
        {
          idToken: { idToken: 'ID_TOKEN1', type: 'Central' },
          idTokenInfo: { status: 'Accepted' },
        },
        {
          idToken: { idToken: 'ID_TOKEN2', type: 'Central' },
          idTokenInfo: { status: 'Blocked' },
        },
      ],
    } as unknown as SendLocalList);

    const testMockVariableCharacteristics = Object.assign({}, baseMockVariableCharacteristics, {
      maxLimit: 10,
    });
    const mockVariableAttribute = vi.mocked<VariableAttribute>({
      ocppConnectionName: ocppConnectionName,
      dataType: OCPP2_0_1.DataEnumType.integer,
      value: '3', // Max 1 item per message
    } as unknown as VariableAttribute);

    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );
    mockDeviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance.mockResolvedValue(
      testMockVariableCharacteristics,
    );
    mockDeviceModelRepository.readAllByQuerystring.mockResolvedValue([mockVariableAttribute]);

    const result =
      await localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        ocppConnectionName,
        correlationId,
        sendLocalListRequest,
      );
    expect(result).toEqual(mockSendLocalList);
  });

  describe('prepareSendLocalList', () => {
    it('mints a correlation id and persists the request against that same id', async () => {
      const persist = vi
        .spyOn(
          localAuthListService,
          'persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest',
        )
        .mockResolvedValue({} as SendLocalList);
      const sendLocalListRequest = {
        versionNumber: 3,
        updateType: OCPP2_0_1.UpdateEnumType.Full,
      } as OCPP2_0_1.SendLocalListRequest;

      const returned = await localAuthListService.prepareSendLocalList(
        tenantId,
        ocppConnectionName,
        sendLocalListRequest,
      );

      expect(returned).toEqual(expect.any(String));
      expect(persist).toHaveBeenCalledWith(
        tenantId,
        ocppConnectionName,
        returned,
        sendLocalListRequest,
      );
    });

    it('mints a distinct correlation id per call', async () => {
      vi.spyOn(
        localAuthListService,
        'persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest',
      ).mockResolvedValue({} as SendLocalList);
      const sendLocalListRequest = {
        versionNumber: 3,
        updateType: OCPP2_0_1.UpdateEnumType.Full,
      } as OCPP2_0_1.SendLocalListRequest;

      const first = await localAuthListService.prepareSendLocalList(
        tenantId,
        ocppConnectionName,
        sendLocalListRequest,
      );
      const second = await localAuthListService.prepareSendLocalList(
        tenantId,
        ocppConnectionName,
        sendLocalListRequest,
      );

      expect(first).not.toEqual(second);
    });

    it('propagates a validation failure from the persist step without swallowing it', async () => {
      vi.spyOn(
        localAuthListService,
        'persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest',
      ).mockRejectedValue(new Error('versionNumber must be greater than 0'));

      await expect(
        localAuthListService.prepareSendLocalList(tenantId, ocppConnectionName, {
          versionNumber: 0,
          updateType: OCPP2_0_1.UpdateEnumType.Full,
        } as OCPP2_0_1.SendLocalListRequest),
      ).rejects.toThrow('versionNumber must be greater than 0');
    });
  });
});
