// Copyright Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0

import {
  IDeviceModelRepository,
  ILocalAuthListRepository,
  LocalListVersion,
  SendLocalList,
  VariableAttribute,
  VariableCharacteristics,
} from '@citrineos/data';
import { LocalAuthListService } from '../../src/module/LocalAuthListService';
import { DEFAULT_TENANT_ID, OCPP2_0_1 } from '@citrineos/base';

describe('LocalAuthListService', () => {
  let mockLocalAuthListRepository: jest.Mocked<ILocalAuthListRepository>;
  let mockDeviceModelRepository: jest.Mocked<IDeviceModelRepository>;
  let localAuthListService: LocalAuthListService;

  const tenantId = DEFAULT_TENANT_ID;
  const stationId = 'station-1';
  const correlationId = 'test-correlation-id';
  const initialVersionNumber = 2;
  const baseMockLocalListVersion = jest.mocked<LocalListVersion>({
    stationId: stationId,
    versionNumber: initialVersionNumber,
  } as unknown as LocalListVersion);
  const baseMockVariableCharacteristics = jest.mocked<VariableCharacteristics>({
    dataType: OCPP2_0_1.DataEnumType.integer,
  } as unknown as VariableCharacteristics);

  beforeEach(() => {
    mockLocalAuthListRepository = {
      readOnlyOneByQuery: jest.fn(),
      createSendLocalListFromRequestData: jest.fn(),
    } as unknown as jest.Mocked<ILocalAuthListRepository>;

    mockDeviceModelRepository = {
      findVariableCharacteristicsByVariableNameAndVariableInstance: jest.fn(),
      readAllByQuerystring: jest.fn(),
    } as unknown as jest.Mocked<IDeviceModelRepository>;

    localAuthListService = new LocalAuthListService(
      mockLocalAuthListRepository,
      mockDeviceModelRepository,
    );
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

    const mockSendLocalList = jest.mocked<SendLocalList>({
      correlationId: expectedCorrelationId,
      stationId: stationId,
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
        stationId,
        correlationId,
        sendLocalListRequest,
      );

    expect(result).toEqual(mockSendLocalList);
    expect(mockLocalAuthListRepository.createSendLocalListFromRequestData).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      stationId,
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
        stationId,
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
        stationId,
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
        stationId,
        correlationId,
        sendLocalListRequest,
      ),
    ).rejects.toThrow(
      `Current LocalListVersion for ${stationId} is 2, cannot send LocalListVersion 1 (version number must be higher)`,
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

    const mockSendLocalList = jest.mocked<SendLocalList>({
      correlationId: correlationId,
      stationId: stationId,
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
        stationId,
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

    const mockSendLocalList = jest.mocked<SendLocalList>({
      correlationId: correlationId,
      stationId: stationId,
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
      maxLimit: 1,
    });

    mockLocalAuthListRepository.readOnlyOneByQuery.mockResolvedValue(undefined); // No previous list version
    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );
    mockDeviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance.mockResolvedValue(
      testMockVariableCharacteristics,
    );

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        stationId,
        correlationId,
        sendLocalListRequest,
      ),
    ).rejects.toThrow(
      'Updated local auth list length (2) will exceed max local auth list entries (1)',
    );
  });

  it('should throw an error when getMaxLocalAuthListEntries returns null', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;

    const sendLocalListRequest = {
      versionNumber: 2,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
    };

    const mockSendLocalList = jest.mocked<SendLocalList>({
      correlationId: correlationId,
      stationId: stationId,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
    } as unknown as SendLocalList);

    mockDeviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance.mockResolvedValue(
      undefined,
    ); // No variable characteristics
    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        stationId,
        correlationId,
        sendLocalListRequest,
      ),
    ).rejects.toThrow('Could not get max local auth list entries, required by D01.FR.12');
  });

  it('should throw an error when getMaxLocalAuthListEntries returns variable characteristics without maxLimit', async () => {
    const newVersionNumber = 3;
    const expectedUpdateType = OCPP2_0_1.UpdateEnumType.Full;

    const sendLocalListRequest = {
      versionNumber: 2,
      updateType: OCPP2_0_1.UpdateEnumType.Full,
    };

    const mockSendLocalList = jest.mocked<SendLocalList>({
      correlationId: correlationId,
      stationId: stationId,
      updateType: expectedUpdateType,
      versionNumber: newVersionNumber,
    } as unknown as SendLocalList);

    mockDeviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance.mockResolvedValue(
      baseMockVariableCharacteristics,
    );
    mockLocalAuthListRepository.createSendLocalListFromRequestData.mockResolvedValue(
      mockSendLocalList,
    );

    await expect(
      localAuthListService.persistSendLocalListForStationIdAndCorrelationIdAndSendLocalListRequest(
        tenantId,
        stationId,
        correlationId,
        sendLocalListRequest,
      ),
    ).rejects.toThrow('Could not get max local auth list entries, required by D01.FR.12');
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

    const mockSendLocalList = jest.mocked<SendLocalList>({
      correlationId: correlationId,
      stationId: stationId,
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
    const mockVariableAttribute = jest.mocked<VariableAttribute>({
      stationId: stationId,
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
        stationId,
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

    const mockSendLocalList = jest.mocked<SendLocalList>({
      correlationId: correlationId,
      stationId: stationId,
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
    const mockVariableAttribute = jest.mocked<VariableAttribute>({
      stationId: stationId,
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
        stationId,
        correlationId,
        sendLocalListRequest,
      );
    expect(result).toEqual(mockSendLocalList);
  });
});
