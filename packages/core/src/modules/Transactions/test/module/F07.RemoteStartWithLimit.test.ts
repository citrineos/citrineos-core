// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { BootstrapConfig, ICache, IMessage, OcppRequest, SystemConfig } from '@citrineos/base';
import {
  AuthorizationStatusEnum,
  CacheNamespace,
  DEFAULT_TENANT_ID,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { asValue } from 'awilix';
import type { ITransactionEventRepository } from '@citrineos/core';
import { TransactionsModule } from '../../src/module/module.js';
import { createTestContainer, getTestInstance } from '../../../../test/testContainer.js';

vi.mock('@util/security/SignedMeterValuesUtil.js', () => ({
  SignedMeterValuesUtil: vi.fn().mockImplementation(() => ({
    validateMeterValues: vi.fn().mockResolvedValue(true),
  })),
}));

vi.mock('@util/authorizer/RealTimeAuthorizer.js', () => ({
  RealTimeAuthorizer: vi.fn().mockImplementation(() => ({
    authorize: vi.fn().mockResolvedValue('Accepted'),
  })),
}));

function makeConfig(): BootstrapConfig & SystemConfig {
  return {
    env: 'test',
    logLevel: 6,
    maxCallLengthSeconds: 30,
    maxCachingSeconds: 30,
    centralSystem: { host: '0.0.0.0', port: 8080 },
    modules: {
      transactions: {
        requests: [],
        responses: [],
        sendCostUpdatedOnMeterValue: false,
      },
    },
    util: {
      cache: { memory: true },
      messageBroker: { amqp: { url: 'amqp://localhost', exchange: 'x' } },
      authProvider: { localByPass: true },
      swagger: { path: '/docs', logoPath: '', exposeData: false, exposeMessage: false },
      networkConnection: { websocketServers: [] },
      certificateAuthority: {
        v2gCA: {
          name: 'hubject',
          hubject: { baseUrl: '', tokenUrl: '', clientId: '', clientSecret: '' },
        },
        chargingStationCA: {
          name: 'acme',
          acme: { env: 'staging', accountKeyFilePath: '', email: '' },
        },
      },
    },
  } as unknown as BootstrapConfig & SystemConfig;
}

function makeMessage<T extends OcppRequest>(
  payload: T,
  action: string,
  protocol: OCPPVersion,
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Transactions,
    action,
    state: MessageState.Request,
    protocol,
  } as unknown as IMessage<T>;
}

describe('F07 - Remote start with fixed cost, energy, SoC or time', () => {
  const { container } = createTestContainer();
  let module: TransactionsModule;
  let transactionEventRepository: Partial<ITransactionEventRepository>;
  let mockCache: Partial<ICache>;
  let sendCallResultSpy: any;

  beforeEach(() => {
    transactionEventRepository = {
      createOrUpdateTransactionByTransactionEventAndStationId: vi.fn(),
      updateTransactionByStationIdAndTransactionId: vi.fn(),
      readTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue(null),
    };

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    };

    const config = makeConfig();
    const logger = new Logger<ILogObj>({ name: 'test', minLevel: 6 });

    // Register the module's dependencies as untyped values (asValue needs no casts).
    // Repos carry only the methods the handler touches; the module's injected
    // services are mocked at the boundary.
    container.register({
      config: asValue(config),
      logger: asValue(logger),
      cache: asValue(mockCache),
      sender: asValue({ sendResponse: vi.fn().mockResolvedValue({ success: true }) }),
      handler: asValue({ subscribe: vi.fn().mockResolvedValue(true), set module(_: unknown) {} }),
      ocppValidator: asValue(undefined),
      transactionEventRepository: asValue(transactionEventRepository),
      authorizationRepository: asValue({ readAllByQuerystring: vi.fn().mockResolvedValue([]) }),
      deviceModelRepository: asValue({ readAllByQuerystring: vi.fn().mockResolvedValue([]) }),
      locationRepository: asValue({}),
      tariffRepository: asValue({ readAllByQuerystring: vi.fn().mockResolvedValue([]) }),
      ocppMessageRepository: asValue({ readOnlyOneByQuery: vi.fn().mockResolvedValue(null) }),
      chargingProfileRepository: asValue({ readAllByQuery: vi.fn().mockResolvedValue([]) }),
      transactionService: asValue({
        authorizeOcpp21IdToken: vi
          .fn()
          .mockResolvedValue({ idTokenInfo: { status: AuthorizationStatusEnum.Accepted } }),
        authorizeOcpp201IdToken: vi
          .fn()
          .mockResolvedValue({ idTokenInfo: { status: AuthorizationStatusEnum.Accepted } }),
        deactivateReservation: vi.fn().mockResolvedValue(undefined),
      }),
      statusNotificationService: asValue({}),
      costCalculator: asValue({}),
      costNotifier: asValue({}),
      signedMeterValuesUtil: asValue({ validateMeterValues: vi.fn().mockResolvedValue(true) }),
    });

    module = getTestInstance(container, TransactionsModule, {});

    sendCallResultSpy = vi
      .spyOn(module, 'sendCallResultWithMessage')
      .mockResolvedValue({ success: true });
    vi.spyOn(module as any, 'deactivateOtherActiveTransactionsAtEvse201').mockResolvedValue(
      undefined,
    );
  });

  describe('F07.FR.02 - CSMS sets transactionLimit in first TransactionEventResponse', () => {
    it('should include transactionLimit.maxCost from cache when TransactionEvent(Started) has remoteStartId', async () => {
      const remoteStartId = 12345;
      const maxCost = 25.5;
      const cacheKey = `remotestart:${DEFAULT_TENANT_ID}:station-001:${remoteStartId}`;

      // Mock cache to return stored limit
      (mockCache.get as any).mockResolvedValue(JSON.stringify({ maxCost }));

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        remoteStartId,
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.RemoteStart,
        seqNo: 1,
        transactionInfo: {
          transactionId: 'txn-001',
          remoteStartId,
        },
        idToken: {
          idToken: 'token-001',
          type: OCPP2_1.IdTokenEnumType.ISO14443,
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // Verify cache was queried
      expect(mockCache.get).toHaveBeenCalledWith(cacheKey, CacheNamespace.Other);

      // Verify transactionLimit was included in response
      expect(sendCallResultSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          idTokenInfo: expect.anything(),
          transactionLimit: expect.objectContaining({
            maxCost,
          }),
        }),
      );

      // Verify cache entry was removed after use
      expect(mockCache.remove).toHaveBeenCalledWith(cacheKey, CacheNamespace.Other);
    });

    it('should include all transactionLimit fields (maxCost, maxEnergy, maxTime, maxSoC) from cache', async () => {
      const remoteStartId = 67890;
      const transactionLimit = {
        maxCost: 50.0,
        maxEnergy: 30000, // 30 kWh in Wh
        maxTime: 7200, // 2 hours in seconds
        maxSoC: 80, // 80%
      };
      (mockCache.get as any).mockResolvedValue(JSON.stringify(transactionLimit));

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-002',
        isActive: true,
        remoteStartId,
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.RemoteStart,
        seqNo: 1,
        transactionInfo: {
          transactionId: 'txn-002',
          remoteStartId,
        },
        idToken: {
          idToken: 'token-002',
          type: OCPP2_1.IdTokenEnumType.ISO14443,
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      expect(sendCallResultSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          transactionLimit: expect.objectContaining({
            maxCost: 50.0,
            maxEnergy: 30000,
            maxTime: 7200,
            maxSoC: 80,
          }),
        }),
      );
    });

    it('should NOT include transactionLimit when no cache entry exists for remoteStartId', async () => {
      const remoteStartId = 99999;

      // Mock cache to return null (no entry)
      (mockCache.get as any).mockResolvedValue(null);

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-003',
        isActive: true,
        remoteStartId,
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.RemoteStart,
        seqNo: 1,
        transactionInfo: {
          transactionId: 'txn-003',
          remoteStartId,
        },
        idToken: {
          idToken: 'token-003',
          type: OCPP2_1.IdTokenEnumType.ISO14443,
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // Response should not have transactionLimit
      expect(sendCallResultSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.not.objectContaining({
          transactionLimit: expect.anything(),
        }),
      );
    });

    it('should NOT include transactionLimit when eventType is not Started', async () => {
      const remoteStartId = 11111;
      const cacheKey = `remotestart:${DEFAULT_TENANT_ID}:station-001:${remoteStartId}`;

      (mockCache.get as any).mockResolvedValue(JSON.stringify({ maxCost: 20 }));

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-004',
        isActive: true,
        remoteStartId,
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Updated, // Not Started
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 2,
        transactionInfo: {
          transactionId: 'txn-004',
          remoteStartId,
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // Cache should not be queried for non-Started events
      expect(mockCache.get).not.toHaveBeenCalledWith(cacheKey, CacheNamespace.Other);
    });

    it('should NOT include transactionLimit when protocol is not OCPP 2.1', async () => {
      const remoteStartId = 22222;

      (mockCache.get as any).mockResolvedValue(JSON.stringify({ maxCost: 30 }));

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-005',
        isActive: true,
        remoteStartId,
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.RemoteStart,
        seqNo: 1,
        transactionInfo: {
          transactionId: 'txn-005',
          remoteStartId,
        },
        idToken: {
          idToken: 'token-005',
          type: OCPP2_1.IdTokenEnumType.ISO14443,
        },
      };

      // Use OCPP 2.0.1 instead of 2.1
      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_0_1),
      );

      // Cache should not be queried for OCPP 2.0.1
      expect(mockCache.get).not.toHaveBeenCalled();
    });
  });

  describe('F07.FR.04 - Persistence to DB (aligns with E16)', () => {
    it('should persist transactionLimit to DB when set in response', async () => {
      const remoteStartId = 33333;
      const maxEnergy = 25000;

      (mockCache.get as any).mockResolvedValue(JSON.stringify({ maxEnergy }));

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-006',
        isActive: true,
        remoteStartId,
      });

      const updateSpy = vi.fn().mockResolvedValue({});
      (transactionEventRepository as any).updateTransactionByStationIdAndTransactionId = updateSpy;

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.RemoteStart,
        seqNo: 1,
        transactionInfo: {
          transactionId: 'txn-006',
          remoteStartId,
        },
        idToken: {
          idToken: 'token-006',
          type: OCPP2_1.IdTokenEnumType.ISO14443,
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // Verify transactionLimit was persisted to DB
      expect(updateSpy).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          transactionLimit: expect.objectContaining({ maxEnergy }),
        }),
        'txn-006',
        'station-001',
      );
    });
  });
});
