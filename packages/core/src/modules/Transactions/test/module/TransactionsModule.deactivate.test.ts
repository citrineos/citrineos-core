// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ILogObj } from 'tslog';
import { Logger } from 'tslog';
import type { BootstrapConfig, IMessage, OcppRequest, SystemConfig } from '@citrineos/base';
import {
  DEFAULT_TENANT_ID,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/base';
import { asValue } from 'awilix';
import type {
  IAuthorizationRepository,
  ILocationRepository,
  ITransactionEventRepository,
} from '@dal/interfaces/repositories.js';
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

describe('TransactionsModule - _handleTransactionEvent and _handleOcpp16StartTransaction deactivate triggers', () => {
  const { container } = createTestContainer();
  let module: TransactionsModule;
  let transactionEventRepository: Partial<ITransactionEventRepository>;
  let locationRepository: Partial<ILocationRepository>;
  let authorizationRepository: Partial<IAuthorizationRepository>;
  let deactivateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    transactionEventRepository = {
      createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        totalKwh: null,
      }),
      createTransactionByStartTransaction: vi.fn().mockResolvedValue({ transactionId: '100' }),
      readTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue(null),
    };

    locationRepository = {
      readConnectorByStationIdAndOcpp16ConnectorId: vi.fn().mockResolvedValue({
        id: 1,
        evse: { evseTypeId: 42 },
      }),
    };

    authorizationRepository = {
      readAllByQuerystring: vi.fn().mockResolvedValue([]),
    };

    const config = makeConfig();
    const logger = new Logger<ILogObj>({ name: 'test', minLevel: 6 });

    // Register the module's dependencies as untyped values (asValue needs no casts).
    // Repos carry only the methods the handlers touch; the module's injected
    // services are mocked at the boundary. authorizeOcpp16IdToken must return
    // Accepted so the 1.6 StartTransaction path reaches the deactivate call.
    container.register({
      config: asValue(config),
      logger: asValue(logger),
      cache: asValue({
        get: vi.fn().mockResolvedValue(null),
        set: vi.fn().mockResolvedValue(true),
      }),
      sender: asValue({
        sendResponse: vi.fn().mockResolvedValue({ success: true }),
        sendRequest: vi.fn().mockResolvedValue({ success: true }),
        shutdown: vi.fn(),
      }),
      handler: asValue({
        subscribe: vi.fn().mockResolvedValue(true),
        shutdown: vi.fn(),
        set module(_: unknown) {},
      }),
      ocppValidator: asValue(undefined),
      transactionEventRepository: asValue(transactionEventRepository),
      authorizationRepository: asValue(authorizationRepository),
      deviceModelRepository: asValue({ readAllByQuerystring: vi.fn().mockResolvedValue([]) }),
      locationRepository: asValue(locationRepository),
      tariffRepository: asValue({ readAllByQuerystring: vi.fn().mockResolvedValue([]) }),
      ocppMessageRepository: asValue({ readOnlyOneByQuery: vi.fn().mockResolvedValue(null) }),
      chargingProfileRepository: asValue({ readAllByQuery: vi.fn().mockResolvedValue([]) }),
      transactionService: asValue({
        authorizeOcpp16IdToken: vi.fn().mockResolvedValue({
          idTagInfo: { status: OCPP1_6.StartTransactionResponseStatus.Accepted },
        }),
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

    vi.spyOn(module, 'sendCallResultWithMessage').mockResolvedValue({ success: true });

    deactivateSpy = vi
      .spyOn((module as any)._transactionService, 'deactivateOtherActiveTransactionsAtEvse')
      .mockResolvedValue(undefined);
  });

  describe('_handleTransactionEvent (OCPP 2.0.1)', () => {
    it('calls deactivateOtherActiveTransactionsAtEvse when eventType=Started and evse is defined', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
        seqNo: 1,
        transactionInfo: { transactionId: 'txn-start-evse' },
        evse: { id: 1 },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_0_1),
      );

      expect(deactivateSpy).toHaveBeenCalledOnce();
      expect(deactivateSpy).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        'txn-start-evse',
        'station-001',
        { id: 1 },
      );
    });

    it('does NOT call deactivateOtherActiveTransactionsAtEvse when eventType=Started but evse is undefined', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
        seqNo: 1,
        transactionInfo: { transactionId: 'txn-start-noevse' },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_0_1),
      );

      expect(deactivateSpy).not.toHaveBeenCalled();
    });

    it('does NOT call deactivateOtherActiveTransactionsAtEvse when eventType=Updated', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 2,
        transactionInfo: { transactionId: 'txn-updated' },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_0_1),
      );

      expect(deactivateSpy).not.toHaveBeenCalled();
    });

    it('does NOT call deactivateOtherActiveTransactionsAtEvse when eventType=Ended even with evse defined', async () => {
      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Ended,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.Authorized,
        seqNo: 3,
        transactionInfo: { transactionId: 'txn-ended' },
        evse: { id: 1 },
      };

      await (module as any)._handleTransactionEvent(
        makeMessage(payload, OCPP_CallAction.TransactionEvent, OCPPVersion.OCPP2_0_1),
      );

      expect(deactivateSpy).not.toHaveBeenCalled();
    });
  });

  describe('_handleOcpp16StartTransaction (OCPP 1.6)', () => {
    it('calls deactivateOtherActiveTransactionsAtEvse when connector is found', async () => {
      const payload: OCPP1_6.StartTransactionRequest = {
        connectorId: 1,
        idTag: 'TAG001',
        meterStart: 0,
        timestamp: new Date().toISOString(),
      };

      await (module as any)._handleOcpp16StartTransaction(
        makeMessage(payload, OCPP_CallAction.StartTransaction, OCPPVersion.OCPP1_6),
      );

      expect(deactivateSpy).toHaveBeenCalledOnce();
      expect(deactivateSpy).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.any(String),
        'station-001',
        1,
      );
    });

    it('throws and does NOT call deactivateOtherActiveTransactionsAtEvse when connector is not found', async () => {
      (
        locationRepository.readConnectorByStationIdAndOcpp16ConnectorId as ReturnType<typeof vi.fn>
      ).mockResolvedValue(null);

      const payload: OCPP1_6.StartTransactionRequest = {
        connectorId: 99,
        idTag: 'TAG001',
        meterStart: 0,
        timestamp: new Date().toISOString(),
      };

      await expect(
        (module as any)._handleOcpp16StartTransaction(
          makeMessage(payload, OCPP_CallAction.StartTransaction, OCPPVersion.OCPP1_6),
        ),
      ).rejects.toThrow('Unable to find connector 99');

      expect(deactivateSpy).not.toHaveBeenCalled();
    });
  });
});
