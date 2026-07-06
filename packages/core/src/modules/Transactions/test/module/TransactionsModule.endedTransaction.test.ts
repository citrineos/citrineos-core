// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type {
  BootstrapConfig,
  ICache,
  IMessage,
  IMessageHandler,
  IMessageSender,
  OcppRequest,
  SystemConfig,
} from '@citrineos/base';
import {
  AuthorizationStatusEnum,
  DEFAULT_TENANT_ID,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import type { ITransactionEventRepository } from '@dal/interfaces/repositories.js';
import { TransactionsModule } from '../../src/module/module.js';
import { asValue } from 'awilix';
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

function makeMessage<T extends OcppRequest>(payload: T, action: string): IMessage<T> {
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
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

describe('TransactionsModule - ended transaction guard', () => {
  const { container } = createTestContainer();
  let module: TransactionsModule;
  let transactionEventRepository: Partial<ITransactionEventRepository>;
  let sendCallResultSpy: ReturnType<typeof vi.spyOn>;
  let createOrUpdateSpy: ReturnType<typeof vi.fn>;

  function setupModule(readTransactionResult: { isActive: boolean } | null) {
    createOrUpdateSpy = vi.fn().mockResolvedValue({
      id: 1,
      transactionId: 'txn-001',
      isActive: true,
      totalKwh: null,
    });

    transactionEventRepository = {
      createOrUpdateTransactionByTransactionEventAndStationId: createOrUpdateSpy,
      readTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue(readTransactionResult),
    };

    const config = makeConfig();
    const logger = new Logger<ILogObj>({ name: 'test', minLevel: 6 });

    const mockHandler = {
      subscribe: vi.fn().mockResolvedValue(true),
      shutdown: vi.fn(),
      set module(_: any) {},
    } as unknown as IMessageHandler;

    const mockSender = {
      sendResponse: vi.fn().mockResolvedValue({ success: true }),
      sendRequest: vi.fn().mockResolvedValue({ success: true }),
      shutdown: vi.fn(),
    } as unknown as IMessageSender;

    const mockCache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(true),
    } as unknown as ICache;

    container.register({
      config: asValue(config),
      logger: asValue(logger),
      cache: asValue(mockCache),
      sender: asValue(mockSender),
      handler: asValue(mockHandler),
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
        deactivateOtherActiveTransactionsAtEvse: vi.fn().mockResolvedValue(undefined),
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
    vi.spyOn(module, 'sendCallErrorWithMessage').mockResolvedValue({ success: true });
  }

  describe('when transaction has already ended (isActive=false)', () => {
    beforeEach(() => {
      setupModule({ isActive: false });
    });

    it('should send an empty TransactionEventResponse and not update transaction for eventType=Updated', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 5,
        transactionInfo: { transactionId: 'txn-001' },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent),
      );

      expect(sendCallResultSpy).toHaveBeenCalledOnce();
      expect(sendCallResultSpy).toHaveBeenCalledWith(expect.anything(), {});
      expect(createOrUpdateSpy).not.toHaveBeenCalled();
    });

    it('should send an empty TransactionEventResponse and not update transaction for eventType=Ended', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Ended,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.EVDisconnected,
        seqNo: 5,
        transactionInfo: { transactionId: 'txn-001' },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent),
      );

      expect(sendCallResultSpy).toHaveBeenCalledOnce();
      expect(sendCallResultSpy).toHaveBeenCalledWith(expect.anything(), {});
      expect(createOrUpdateSpy).not.toHaveBeenCalled();
    });

    it('should forward the authorization response when idToken is present', async () => {
      const authResponse = { idTokenInfo: { status: AuthorizationStatusEnum.Accepted } };
      vi.spyOn((module as any)._transactionService, 'authorizeOcpp201IdToken').mockResolvedValue(
        authResponse,
      );

      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 5,
        transactionInfo: { transactionId: 'txn-001' },
        idToken: { idToken: 'RFID-001', type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent),
      );

      expect(sendCallResultSpy).toHaveBeenCalledOnce();
      expect(sendCallResultSpy).toHaveBeenCalledWith(expect.anything(), authResponse);
      expect(createOrUpdateSpy).not.toHaveBeenCalled();
    });
  });

  describe('when transaction is still active (isActive=true)', () => {
    beforeEach(() => {
      setupModule({ isActive: true });
    });

    it('should proceed normally and call createOrUpdate for eventType=Updated', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 2,
        transactionInfo: { transactionId: 'txn-001' },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent),
      );

      expect(createOrUpdateSpy).toHaveBeenCalledOnce();
    });
  });

  describe('when transaction is not found', () => {
    beforeEach(() => {
      setupModule(null);
    });

    it('should proceed normally and call createOrUpdate for eventType=Updated', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 2,
        transactionInfo: { transactionId: 'txn-unknown' },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent),
      );

      expect(createOrUpdateSpy).toHaveBeenCalledOnce();
    });
  });

  describe('when eventType=Started', () => {
    beforeEach(() => {
      setupModule({ isActive: false });
    });

    it('should skip the ended-transaction check entirely and proceed normally', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
        seqNo: 0,
        transactionInfo: { transactionId: 'txn-new' },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent),
      );

      expect(
        transactionEventRepository.readTransactionByStationIdAndTransactionId,
      ).not.toHaveBeenCalled();
      expect(createOrUpdateSpy).toHaveBeenCalledOnce();
    });
  });
});
