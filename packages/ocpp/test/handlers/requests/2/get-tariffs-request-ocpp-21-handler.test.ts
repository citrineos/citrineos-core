// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type {
  IAuthorizationRepository,
  IChargingStationRepository,
  IConnectorRepository,
} from '@citrineos/dal';
import { GetTariffsRequestOcpp21Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock sequelize models
vi.mock('@dal/models/location/connector.js', () => ({
  Connector: {
    findAll: vi.fn(),
  },
}));

vi.mock('@dal/models/transaction-event/transaction.js', () => ({
  Transaction: {
    findAll: vi.fn(),
  },
}));

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStationManagementSystem,
    eventGroup: EventGroup.Transactions,
    action: OCPP_CallAction.GetTariffs,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_1,
  } as unknown as IMessage<T>;
}

describe('GetTariffsRequestOcpp21Handler', () => {
  let handler: GetTariffsRequestOcpp21Handler;
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let mockChargingStationRepository: Partial<IChargingStationRepository>;
  let mockLocationRepository: Partial<IConnectorRepository>;
  let mockAuthorizationRepository: Partial<IAuthorizationRepository>;
  let mockReadConnectorsWithTariffs: any;
  let mockAuthorizationFindAll: any;
  let mockTransactionFindAll: any;

  beforeEach(async () => {
    // Import the mocked models - these are what the handler actually calls directly.
    const { Transaction } = await import('@dal/models/transaction-event/transaction.js');

    mockTransactionFindAll = vi.mocked(Transaction.findAll);

    // Driver tariffs come from the authorization repository, not the model directly.
    mockAuthorizationFindAll = vi.fn();
    mockAuthorizationRepository = {
      findAllAuthorizationsWithTariffs: mockAuthorizationFindAll,
    };

    // Default tariffs come from the location repository.
    mockReadConnectorsWithTariffs = vi.fn();
    mockChargingStationRepository = {
      readChargingStationByOcppConnectionName: vi.fn().mockResolvedValue({
        id: 1,
        ocppConnectionName: 'station-001',
      }),
    };
    mockLocationRepository = {
      readConnectorsWithTariffsByStationId: mockReadConnectorsWithTariffs,
    };

    const { logger } = createTestContainer();
    ocppSender = makeMockOcppSender();

    handler = new GetTariffsRequestOcpp21Handler({
      logger,
      ocppSender,
      authorizationRepository: mockAuthorizationRepository as unknown as IAuthorizationRepository,
      chargingStationRepository:
        mockChargingStationRepository as unknown as IChargingStationRepository,
      locationRepository: mockLocationRepository as unknown as IConnectorRepository,
    });
  });

  async function handleAndGetResponse(
    payload: OCPP2_1.GetTariffsRequest,
  ): Promise<OCPP2_1.GetTariffsResponse> {
    await handler.handle(makeMessage(payload));
    return ocppSender.sendCallResultWithMessage.mock.calls[0][1] as OCPP2_1.GetTariffsResponse;
  }

  describe('I09.FR.03 - No tariffs returns NoTariff status', () => {
    it('should return NoTariff status when no tariffs exist', async () => {
      mockReadConnectorsWithTariffs.mockResolvedValue([]);
      mockAuthorizationFindAll.mockResolvedValue([]);
      mockTransactionFindAll.mockResolvedValue([]);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.NoTariff);
      expect(response.tariffAssignments).toBeUndefined();
    });
  });

  describe('Default tariffs are read through the location repository', () => {
    beforeEach(() => {
      mockReadConnectorsWithTariffs.mockResolvedValue([]);
      mockAuthorizationFindAll.mockResolvedValue([]);
      mockTransactionFindAll.mockResolvedValue([]);
    });

    it('should ask for every EVSE when evseId=0 (I09.FR.01)', async () => {
      // evseId 0 addresses the station as a whole, so it must not be forwarded as a
      // filter — doing so would look for an EVSE numbered 0 and find nothing.
      await handleAndGetResponse({ evseId: 0 });

      expect(mockReadConnectorsWithTariffs).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        'station-001',
        undefined,
      );
    });

    it('should ask only for the requested EVSE when evseId>0 (I09.FR.02)', async () => {
      await handleAndGetResponse({ evseId: 3 });

      expect(mockReadConnectorsWithTariffs).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        'station-001',
        3,
      );
    });

    it('should not read connectors at all when the station is unknown', async () => {
      mockChargingStationRepository.readChargingStationByOcppConnectionName = vi
        .fn()
        .mockResolvedValue(undefined);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Rejected);
      expect(mockReadConnectorsWithTariffs).not.toHaveBeenCalled();
    });
  });

  describe('I09.FR.01 & I09.FR.04 - evseId=0 returns all default tariffs with evseIds', () => {
    it('should return default tariffs for all EVSEs when evseId=0', async () => {
      mockReadConnectorsWithTariffs.mockResolvedValue([
        {
          id: 1,
          tariffId: 1,
          evse: { evseTypeId: 1 },
          tariff: {
            id: 1,
            tariffId: 'Default01',
            validFrom: '2024-01-01T00:00:00Z',
          },
        },
        {
          id: 2,
          tariffId: 1,
          evse: { evseTypeId: 2 },
          tariff: {
            id: 1,
            tariffId: 'Default01',
            validFrom: '2024-01-01T00:00:00Z',
          },
        },
      ]);
      mockAuthorizationFindAll.mockResolvedValue([]);
      mockTransactionFindAll.mockResolvedValue([]);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Accepted);
      expect(response.tariffAssignments).toHaveLength(1);
      expect(response.tariffAssignments![0]).toEqual({
        tariffId: 'Default01',
        tariffKind: OCPP2_1.TariffKindEnumType.DefaultTariff,
        validFrom: '2024-01-01T00:00:00Z',
        evseIds: [1, 2],
      });
    });
  });

  describe('I09.FR.02 - evseId>0 returns tariffs only for that EVSE', () => {
    it('should return tariffs only for requested EVSE when evseId>0', async () => {
      mockReadConnectorsWithTariffs.mockResolvedValue([
        {
          id: 1,
          tariffId: 1,
          evse: { evseTypeId: 1 },
          tariff: {
            id: 1,
            tariffId: 'Default01',
            validFrom: '2024-01-01T00:00:00Z',
          },
        },
      ]);
      mockAuthorizationFindAll.mockResolvedValue([]);
      mockTransactionFindAll.mockResolvedValue([]);

      const response = await handleAndGetResponse({ evseId: 1 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Accepted);
      expect(response.tariffAssignments).toHaveLength(1);
      expect(response.tariffAssignments![0].evseIds).toEqual([1]);
    });
  });

  describe('I09.FR.05 - DriverTariff includes idTokens list', () => {
    it('should return driver-specific tariffs with idTokens', async () => {
      mockReadConnectorsWithTariffs.mockResolvedValue([]);
      mockAuthorizationFindAll.mockResolvedValue([
        {
          id: 1,
          idToken: 'ABCD1234',
          tariffId: 2,
          tariff: {
            id: 2,
            tariffId: 'MSP01',
            validFrom: null,
          },
        },
        {
          id: 2,
          idToken: 'FBFB0000',
          tariffId: 3,
          tariff: {
            id: 3,
            tariffId: 'MSP02',
            validFrom: null,
          },
        },
      ]);
      mockTransactionFindAll.mockResolvedValue([]);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Accepted);
      expect(response.tariffAssignments).toHaveLength(2);

      const msp01 = response.tariffAssignments!.find((t) => t.tariffId === 'MSP01');
      expect(msp01).toEqual({
        tariffId: 'MSP01',
        tariffKind: OCPP2_1.TariffKindEnumType.DriverTariff,
        idTokens: ['ABCD1234'],
      });

      const msp02 = response.tariffAssignments!.find((t) => t.tariffId === 'MSP02');
      expect(msp02).toEqual({
        tariffId: 'MSP02',
        tariffKind: OCPP2_1.TariffKindEnumType.DriverTariff,
        idTokens: ['FBFB0000'],
      });
    });
  });

  describe('I09.FR.06 - DriverTariff with active transaction includes evseIds', () => {
    it('should include evseIds for driver tariffs with active transactions', async () => {
      mockReadConnectorsWithTariffs.mockResolvedValue([]);
      mockAuthorizationFindAll.mockResolvedValue([
        {
          id: 1,
          idToken: 'ABCD1234',
          tariffId: 2,
          tariff: {
            id: 2,
            tariffId: 'MSP01',
            validFrom: null,
          },
        },
      ]);
      mockTransactionFindAll.mockResolvedValue([
        {
          id: 1,
          transactionId: 'txn-001',
          isActive: true,
          authorizationId: 1,
          authorization: {
            id: 1,
            idToken: 'ABCD1234',
            tariffId: 2,
            tariff: {
              id: 2,
              tariffId: 'MSP01',
              validFrom: null,
            },
          },
          evse: { evseTypeId: 1 },
        },
      ]);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Accepted);
      expect(response.tariffAssignments).toHaveLength(1);
      expect(response.tariffAssignments![0]).toEqual({
        tariffId: 'MSP01',
        tariffKind: OCPP2_1.TariffKindEnumType.DriverTariff,
        evseIds: [1],
        idTokens: ['ABCD1234'],
      });
    });
  });

  describe('I09.FR.07 - Include validFrom when present', () => {
    it('should include validFrom field when tariff has validFrom date', async () => {
      mockReadConnectorsWithTariffs.mockResolvedValue([
        {
          id: 1,
          tariffId: 1,
          evse: { evseTypeId: 1 },
          tariff: {
            id: 1,
            tariffId: 'Default01',
            validFrom: '2024-01-01T00:00:00Z',
          },
        },
      ]);
      mockAuthorizationFindAll.mockResolvedValue([]);
      mockTransactionFindAll.mockResolvedValue([]);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Accepted);
      expect(response.tariffAssignments![0].validFrom).toBe('2024-01-01T00:00:00Z');
    });

    it('should NOT include validFrom field when tariff has no validFrom date', async () => {
      mockReadConnectorsWithTariffs.mockResolvedValue([]);
      mockAuthorizationFindAll.mockResolvedValue([
        {
          id: 1,
          idToken: 'ABCD1234',
          tariffId: 2,
          tariff: {
            id: 2,
            tariffId: 'MSP01',
            validFrom: null,
          },
        },
      ]);
      mockTransactionFindAll.mockResolvedValue([]);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Accepted);
      expect(response.tariffAssignments![0].validFrom).toBeUndefined();
    });
  });

  describe('Complete scenario from I09 use case', () => {
    it('should return all tariffs as described in I09 scenario', async () => {
      // Setup: Default tariff on all EVSEs
      mockReadConnectorsWithTariffs.mockResolvedValue([
        {
          id: 1,
          tariffId: 1,
          evse: { evseTypeId: 1 },
          tariff: {
            id: 1,
            tariffId: 'Default01',
            validFrom: '2024-01-01T00:00:00Z',
          },
        },
        {
          id: 2,
          tariffId: 1,
          evse: { evseTypeId: 2 },
          tariff: {
            id: 1,
            tariffId: 'Default01',
            validFrom: '2024-01-01T00:00:00Z',
          },
        },
      ]);

      // Driver 1 authorized with MSP01, transaction active on EVSE 1
      // Driver 2 authorized with MSP02, no transaction yet
      mockAuthorizationFindAll.mockResolvedValue([
        {
          id: 1,
          idToken: 'ABCD1234',
          tariffId: 2,
          tariff: {
            id: 2,
            tariffId: 'MSP01',
            validFrom: null,
          },
        },
        {
          id: 2,
          idToken: 'FBFB0000',
          tariffId: 3,
          tariff: {
            id: 3,
            tariffId: 'MSP02',
            validFrom: null,
          },
        },
      ]);

      // Active transaction for Driver 1 on EVSE 1
      mockTransactionFindAll.mockResolvedValue([
        {
          id: 1,
          transactionId: 'txn-001',
          isActive: true,
          authorizationId: 1,
          authorization: {
            id: 1,
            idToken: 'ABCD1234',
            tariffId: 2,
            tariff: {
              id: 2,
              tariffId: 'MSP01',
              validFrom: null,
            },
          },
          evse: { evseTypeId: 1 },
        },
      ]);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Accepted);
      expect(response.tariffAssignments).toHaveLength(3);

      // Verify Default01
      const default01 = response.tariffAssignments!.find((t) => t.tariffId === 'Default01');
      expect(default01).toEqual({
        tariffId: 'Default01',
        tariffKind: OCPP2_1.TariffKindEnumType.DefaultTariff,
        validFrom: '2024-01-01T00:00:00Z',
        evseIds: [1, 2],
      });

      // Verify MSP01 (with active transaction on EVSE 1)
      const msp01 = response.tariffAssignments!.find((t) => t.tariffId === 'MSP01');
      expect(msp01).toEqual({
        tariffId: 'MSP01',
        tariffKind: OCPP2_1.TariffKindEnumType.DriverTariff,
        evseIds: [1],
        idTokens: ['ABCD1234'],
      });

      // Verify MSP02 (no active transaction)
      const msp02 = response.tariffAssignments!.find((t) => t.tariffId === 'MSP02');
      expect(msp02).toEqual({
        tariffId: 'MSP02',
        tariffKind: OCPP2_1.TariffKindEnumType.DriverTariff,
        idTokens: ['FBFB0000'],
      });
    });
  });

  describe('Error handling', () => {
    it('should return Rejected status when charging station not found', async () => {
      (
        mockChargingStationRepository.readChargingStationByOcppConnectionName as any
      ).mockResolvedValue(null);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Rejected);
      expect(response.statusInfo?.reasonCode).toBe('StationNotFound');
    });

    it('should return Rejected status when database query fails', async () => {
      mockReadConnectorsWithTariffs.mockRejectedValue(new Error('Database connection failed'));

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Rejected);
      expect(response.statusInfo?.reasonCode).toBe('InternalError');
    });
  });
});
