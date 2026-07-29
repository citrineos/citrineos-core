// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IMessage, OcppRequest } from '@citrineos/base';
import {
  DEFAULT_TENANT_ID,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import type { ILocationRepository } from '@dal/interfaces/repositories.js';
import { GetTariffsRequestOcpp21Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/testContainer.js';

// Mock sequelize models
vi.mock('@dal/layers/sequelize/model/Location/Connector.js', () => ({
  Connector: {
    findAll: vi.fn(),
  },
}));

vi.mock('@dal/layers/sequelize/model/Authorization/Authorization.js', () => ({
  Authorization: {
    findAll: vi.fn(),
  },
}));

vi.mock('@dal/layers/sequelize/model/TransactionEvent/Transaction.js', () => ({
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
  let mockLocationRepository: Partial<ILocationRepository>;
  let mockConnectorFindAll: any;
  let mockAuthorizationFindAll: any;
  let mockTransactionFindAll: any;

  beforeEach(async () => {
    // Import the mocked models - these are what the handler actually calls directly.
    const { Connector } = await import('@dal/layers/sequelize/model/Location/Connector.js');
    const { Authorization } = await import(
      '@dal/layers/sequelize/model/Authorization/Authorization.js'
    );
    const { Transaction } = await import(
      '@dal/layers/sequelize/model/TransactionEvent/Transaction.js'
    );

    // Mock the sequelize.Connector.findAll which is what the handler actually uses
    mockConnectorFindAll = vi.mocked(Connector.findAll);
    mockAuthorizationFindAll = vi.mocked(Authorization.findAll);
    mockTransactionFindAll = vi.mocked(Transaction.findAll);

    mockLocationRepository = {
      readChargingStationByStationId: vi.fn().mockResolvedValue({
        id: 1,
        ocppConnectionName: 'station-001',
      }),
    };

    const { logger } = createTestContainer();
    ocppSender = makeMockOcppSender();

    handler = new GetTariffsRequestOcpp21Handler({
      logger,
      ocppSender,
      locationRepository: mockLocationRepository as unknown as ILocationRepository,
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
      mockConnectorFindAll.mockResolvedValue([]);
      mockAuthorizationFindAll.mockResolvedValue([]);
      mockTransactionFindAll.mockResolvedValue([]);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.NoTariff);
      expect(response.tariffAssignments).toBeUndefined();
    });
  });

  describe('I09.FR.01 & I09.FR.04 - evseId=0 returns all default tariffs with evseIds', () => {
    it('should return default tariffs for all EVSEs when evseId=0', async () => {
      mockConnectorFindAll.mockResolvedValue([
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
      mockConnectorFindAll.mockResolvedValue([
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
      mockConnectorFindAll.mockResolvedValue([]);
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
      mockConnectorFindAll.mockResolvedValue([]);
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
      mockConnectorFindAll.mockResolvedValue([
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
      mockConnectorFindAll.mockResolvedValue([]);
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
      mockConnectorFindAll.mockResolvedValue([
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
      (mockLocationRepository.readChargingStationByStationId as any).mockResolvedValue(null);

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Rejected);
      expect(response.statusInfo?.reasonCode).toBe('StationNotFound');
    });

    it('should return Rejected status when database query fails', async () => {
      mockConnectorFindAll.mockRejectedValue(new Error('Database connection failed'));

      const response = await handleAndGetResponse({ evseId: 0 });

      expect(response.status).toBe(OCPP2_1.TariffGetStatusEnumType.Rejected);
      expect(response.statusInfo?.reasonCode).toBe('InternalError');
    });
  });
});
