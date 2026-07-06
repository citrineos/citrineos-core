// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { BootstrapConfig, IMessage, OcppRequest, SystemConfig } from '@citrineos/base';
import {
  DEFAULT_TENANT_ID,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { asValue } from 'awilix';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('TransactionsModule - E16 Transaction Limits', () => {
  const { container } = createTestContainer();
  let module: TransactionsModule;
  let transactionEventRepository: Partial<ITransactionEventRepository>;
  let sendCallResultSpy: any;

  beforeEach(() => {
    transactionEventRepository = {
      createOrUpdateTransactionByTransactionEventAndStationId: vi.fn(),
      readTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue(null),
    };

    const config = makeConfig();
    const logger = new Logger<ILogObj>({ name: 'test', minLevel: 6 });

    // Register the module's dependencies as untyped values (asValue needs no casts).
    // Repos carry only the methods the handler touches; the module's injected
    // services are mocked at the boundary.
    container.register({
      config: asValue(config),
      logger: asValue(logger),
      cache: asValue({ get: vi.fn().mockResolvedValue(null) }),
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
        authorizeOcpp21IdToken: vi.fn().mockResolvedValue({}),
        authorizeOcpp201IdToken: vi.fn().mockResolvedValue({}),
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

  it('should include transactionLimit in response when DB limit differs from station limit (OCPP 2.1)', async () => {
    const dbLimit = { maxEnergy: 1000 };
    (
      transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
    ).mockResolvedValue({
      id: 1,
      transactionId: 'txn-001',
      isActive: true,
      transactionLimit: dbLimit,
    });

    const payload: OCPP2_1.TransactionEventRequest = {
      eventType: OCPP2_1.TransactionEventEnumType.Updated,
      timestamp: new Date().toISOString(),
      triggerReason: OCPP2_1.TriggerReasonEnumType.MeterValuePeriodic,
      seqNo: 2,
      transactionInfo: {
        transactionId: 'txn-001',
        // No transactionLimit in request
      },
    };

    await (module as any)._handleTransactionEvent(
      makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
    );

    expect(sendCallResultSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transactionLimit: dbLimit,
      }),
    );
  });

  it('should NOT include transactionLimit in response when DB limit matches station limit (OCPP 2.1)', async () => {
    const dbLimit = { maxEnergy: 1000 };
    (
      transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
    ).mockResolvedValue({
      id: 1,
      transactionId: 'txn-001',
      isActive: true,
      transactionLimit: dbLimit,
    });

    const payload: OCPP2_1.TransactionEventRequest = {
      eventType: OCPP2_1.TransactionEventEnumType.Updated,
      timestamp: new Date().toISOString(),
      triggerReason: OCPP2_1.TriggerReasonEnumType.MeterValuePeriodic,
      seqNo: 2,
      transactionInfo: {
        transactionId: 'txn-001',
        transactionLimit: dbLimit, // Limit matches DB
      },
    };

    await (module as any)._handleTransactionEvent(
      makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
    );

    expect(sendCallResultSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.not.objectContaining({
        transactionLimit: dbLimit,
      }),
    );
  });

  it('should include transactionLimit in response when idToken is present and DB limit differs (OCPP 2.1)', async () => {
    const dbLimit = { maxEnergy: 1000 };
    (
      transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
    ).mockResolvedValue({
      id: 1,
      transactionId: 'txn-001',
      isActive: true,
      transactionLimit: dbLimit,
    });

    const payload: OCPP2_1.TransactionEventRequest = {
      eventType: OCPP2_1.TransactionEventEnumType.Started,
      timestamp: new Date().toISOString(),
      triggerReason: OCPP2_1.TriggerReasonEnumType.Authorized,
      seqNo: 1,
      transactionInfo: {
        transactionId: 'txn-001',
      },
      idToken: {
        idToken: 'token-001',
        type: OCPP2_1.IdTokenEnumType.ISO14443,
      },
    };

    await (module as any)._handleTransactionEvent(
      makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
    );

    expect(sendCallResultSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        transactionLimit: dbLimit,
      }),
    );
  });

  // ─── Fix 1: C23 LimitSet persists to transactionLimit column ────────────────

  describe('C23 - LimitSet trigger reason persists to transactionLimit column', () => {
    it('should persist updated maxCost to transactionLimit column (not customData) when LimitSet received', async () => {
      const updateSpy = vi
        .fn()
        .mockResolvedValue({ transactionId: 'txn-001', transactionLimit: { maxCost: 50 } });
      (transactionEventRepository as any).updateTransactionByStationIdAndTransactionId = updateSpy;

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        transactionLimit: { maxCost: 20 }, // old limit in DB
        customData: {},
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.LimitSet,
        seqNo: 2,
        transactionInfo: {
          transactionId: 'txn-001',
          transactionLimit: { maxCost: 50 }, // CS confirms new limit
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // Must update transactionLimit column, not customData
      expect(updateSpy).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          transactionLimit: expect.objectContaining({ maxCost: 50 }),
        }),
        'txn-001',
        'station-001',
      );

      // Must NOT write to customData
      const callArgs = updateSpy.mock.calls[0][1];
      expect(callArgs).not.toHaveProperty('customData');
    });

    it('should merge existing transactionLimit fields when updating maxCost via LimitSet', async () => {
      const updateSpy = vi.fn().mockResolvedValue({});
      (transactionEventRepository as any).updateTransactionByStationIdAndTransactionId = updateSpy;

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        // Existing limit has maxEnergy set — must be preserved when maxCost is updated
        transactionLimit: { maxCost: 20, maxEnergy: 5000 },
        customData: {},
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.LimitSet,
        seqNo: 2,
        transactionInfo: {
          transactionId: 'txn-001',
          transactionLimit: { maxCost: 75 },
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      expect(updateSpy).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          transactionLimit: expect.objectContaining({ maxCost: 75, maxEnergy: 5000 }),
        }),
        'txn-001',
        'station-001',
      );
    });

    it('should NOT call updateTransactionByStationIdAndTransactionId when triggerReason is not LimitSet', async () => {
      const updateSpy = vi.fn().mockResolvedValue({});
      (transactionEventRepository as any).updateTransactionByStationIdAndTransactionId = updateSpy;

      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        transactionLimit: null,
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 2,
        transactionInfo: {
          transactionId: 'txn-001',
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // No limit update should happen for non-LimitSet events
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  // ─── Fix 2: CSMS-set transactionLimit is persisted to DB ─────────────────────

  describe('E16.FR.02 - CSMS-set transactionLimit is persisted to DB', () => {
    it('should persist transactionLimit to DB when CSMS sets it in response (idToken path)', async () => {
      const updateSpy = vi.fn().mockResolvedValue({});
      (transactionEventRepository as any).updateTransactionByStationIdAndTransactionId = updateSpy;

      const dbLimit = { maxEnergy: 2000 };
      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        transactionLimit: dbLimit,
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.Authorized,
        seqNo: 1,
        transactionInfo: {
          transactionId: 'txn-001',
          // No transactionLimit in request — DB limit differs, so E16 will set it in response
        },
        idToken: { idToken: 'token-001', type: OCPP2_1.IdTokenEnumType.ISO14443 },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // The response had transactionLimit set by E16 — it must be persisted
      expect(updateSpy).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          transactionLimit: dbLimit,
        }),
        'txn-001',
        'station-001',
      );
    });

    it('should NOT call updateTransactionByStationIdAndTransactionId when no transactionLimit is set in response', async () => {
      const updateSpy = vi.fn().mockResolvedValue({});
      (transactionEventRepository as any).updateTransactionByStationIdAndTransactionId = updateSpy;

      // DB has no limit — E16 won't set one in the response
      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        transactionLimit: null,
      });

      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.Authorized,
        seqNo: 1,
        transactionInfo: { transactionId: 'txn-001' },
        idToken: { idToken: 'token-001', type: OCPP2_1.IdTokenEnumType.ISO14443 },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // No limit in response → no persistence call
      expect(updateSpy).not.toHaveBeenCalled();
    });

    it('should persist transactionLimit to DB on no-idToken path when DB limit differs from station limit', async () => {
      const updateSpy = vi.fn().mockResolvedValue({});
      (transactionEventRepository as any).updateTransactionByStationIdAndTransactionId = updateSpy;

      const dbLimit = { maxTime: 3600 };
      (
        transactionEventRepository.createOrUpdateTransactionByTransactionEventAndStationId as any
      ).mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        transactionLimit: dbLimit,
      });

      // No idToken — goes through the else branch
      const payload: OCPP2_1.TransactionEventRequest = {
        eventType: OCPP2_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 2,
        transactionInfo: {
          transactionId: 'txn-001',
          // No transactionLimit — DB limit differs, E16 will set it in response
        },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_1),
      );

      // E16 set transactionLimit in response — it must be persisted
      expect(updateSpy).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({
          transactionLimit: dbLimit,
        }),
        'txn-001',
        'station-001',
      );
    });
  });
});
