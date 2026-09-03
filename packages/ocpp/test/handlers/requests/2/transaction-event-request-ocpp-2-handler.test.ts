// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type ICache, type IMessage, CacheNamespace, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  type SystemConfig,
  AuthorizationStatusEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { ITransactionEventRepository } from '@citrineos/dal';
import { TransactionEventRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';
import { describe, expect, it, vi } from 'vitest';

function makeConfig(): SystemConfig {
  return {
    transactions: {
      sendCostUpdatedOnMeterValue: false,
    },
  } as unknown as SystemConfig;
}

function makeMessage<T extends OcppRequest>(
  payload: T,
  protocol: OCPPVersion = OCPPVersion.OCPP2_0_1,
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
    action: OCPP_CallAction.TransactionEvent,
    state: MessageState.Request,
    protocol,
  } as unknown as IMessage<T>;
}

function makeHandler(
  overrides: {
    transactionEventRepository?: Partial<ITransactionEventRepository>;
    cache?: Partial<ICache>;
    transactionService?: Record<string, unknown>;
    config?: SystemConfig;
    deviceModelVariables?: Record<string, { value: string | null }[]>;
    totalCost?: number;
  } = {},
) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const transactionEventRepository = {
    createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
      id: 1,
      transactionId: 'txn-001',
      isActive: true,
      totalKwh: null,
    }),
    readTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue(null),
    updateTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue({}),
    updateTransactionTotalCostById: vi.fn().mockResolvedValue(undefined),
    ...overrides.transactionEventRepository,
  };

  const cache = {
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    ...overrides.cache,
  };

  const transactionService = {
    authorizeOcpp21IdToken: vi.fn().mockResolvedValue({}),
    authorizeOcpp201IdToken: vi.fn().mockResolvedValue({}),
    deactivateReservation: vi.fn().mockResolvedValue(undefined),
    deactivateOtherActiveTransactionsAtEvse: vi.fn().mockResolvedValue(undefined),
    ...overrides.transactionService,
  };

  const chargingProfileRepository = { readAllByQuery: vi.fn().mockResolvedValue([]) };
  const deviceModelVariables = overrides.deviceModelVariables ?? {};
  const deviceModelRepository = {
    readAllByQuerystring: vi.fn().mockImplementation(async (_tenantId, query) => {
      const key = [query.component_name, query.variable_name, query.variable_instance]
        .filter(Boolean)
        .join('.');
      return deviceModelVariables[key] ?? [];
    }),
  };
  const signedMeterValuesUtil = { validateMeterValues: vi.fn().mockResolvedValue(true) };
  const costCalculator = {
    calculateTotalCost: vi.fn().mockResolvedValue(overrides.totalCost ?? 0),
  };
  const costNotifier = { notifyWhileActive: vi.fn() };

  const handler = new TransactionEventRequestOcpp2Handler({
    logger,
    ocppSender,
    cache: cache as unknown as ICache,
    chargingProfileRepository: chargingProfileRepository as any,
    config: overrides.config ?? makeConfig(),
    costCalculator: costCalculator as any,
    costNotifier: costNotifier as any,
    deviceModelRepository: deviceModelRepository as any,
    signedMeterValuesUtil: signedMeterValuesUtil as any,
    transactionEventRepository:
      transactionEventRepository as unknown as ITransactionEventRepository,
    transactionService: transactionService as any,
  });

  return {
    handler,
    ocppSender,
    transactionEventRepository,
    cache,
    transactionService,
    costCalculator,
    signedMeterValuesUtil,
  };
}

describe('TransactionEventRequestOcpp2Handler', () => {
  // C20.FR.03: when a transaction ends before any cost is incurred and central cost calculation is
  // used, the CSMS answers with totalCost = 0. Central calculation is what applies when the station
  // is not doing it itself, i.e. TariffCostCtrlr.Enabled[Tariff] is false or absent - and a device
  // model boolean arrives as the string "false", which is truthy.
  describe('C20 - cancelled before any cost was incurred', () => {
    function anEndedTransactionEvent(): OCPP2_1.TransactionEventRequest {
      return {
        eventType: OCPP2_1.TransactionEventEnumType.Ended,
        triggerReason: OCPP2_1.TriggerReasonEnumType.StopAuthorized,
        timestamp: new Date().toISOString(),
        seqNo: 2,
        transactionInfo: { transactionId: 'txn-001' },
      } as OCPP2_1.TransactionEventRequest;
    }

    async function handleWithTariffEnabled(value: string | null | undefined) {
      const { handler, ocppSender } = makeHandler({
        deviceModelVariables:
          value === undefined ? {} : { 'TariffCostCtrlr.Enabled.Tariff': [{ value }] },
      });

      await handler.handle(makeMessage(anEndedTransactionEvent(), OCPPVersion.OCPP2_1));

      return ocppSender.sendCallResultWithMessage.mock
        .calls[0][1] as OCPP2_1.TransactionEventResponse;
    }

    it('answers totalCost 0 when the station reports local cost calculation off', async () => {
      const response = await handleWithTariffEnabled('false');

      expect(response.totalCost).toBe(0);
    });

    it('answers totalCost 0 when the station has never reported the variable', async () => {
      const response = await handleWithTariffEnabled(undefined);

      expect(response.totalCost).toBe(0);
    });

    it('leaves totalCost alone when the station calculates cost itself', async () => {
      const response = await handleWithTariffEnabled('true');

      expect(response.totalCost).toBeUndefined();
    });
  });

  describe('deactivateOtherActiveTransactionsAtEvse201', () => {
    it('calls deactivateOtherActiveTransactionsAtEvse when eventType=Started and evse is defined', async () => {
      const { handler, transactionService } = makeHandler();

      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
        seqNo: 1,
        transactionInfo: { transactionId: 'txn-start-evse' },
        evse: { id: 1 },
      };

      await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_0_1));

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).toHaveBeenCalledOnce();
      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        'txn-start-evse',
        'station-001',
        { id: 1 },
      );
    });

    it('does NOT call deactivateOtherActiveTransactionsAtEvse when eventType=Started but evse is undefined', async () => {
      const { handler, transactionService } = makeHandler();

      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Started,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
        seqNo: 1,
        transactionInfo: { transactionId: 'txn-start-noevse' },
      };

      await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_0_1));

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).not.toHaveBeenCalled();
    });

    it('does NOT call deactivateOtherActiveTransactionsAtEvse when eventType=Updated', async () => {
      const { handler, transactionService } = makeHandler();

      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
        seqNo: 2,
        transactionInfo: { transactionId: 'txn-updated' },
      };

      await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_0_1));

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).not.toHaveBeenCalled();
    });

    it('does NOT call deactivateOtherActiveTransactionsAtEvse when eventType=Ended even with evse defined', async () => {
      const { handler, transactionService } = makeHandler();

      const payload: OCPP2_0_1.TransactionEventRequest = {
        eventType: OCPP2_0_1.TransactionEventEnumType.Ended,
        timestamp: new Date().toISOString(),
        triggerReason: OCPP2_0_1.TriggerReasonEnumType.Authorized,
        seqNo: 3,
        transactionInfo: { transactionId: 'txn-ended' },
        evse: { id: 1 },
      };

      await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_0_1));

      expect(transactionService.deactivateOtherActiveTransactionsAtEvse).not.toHaveBeenCalled();
    });
  });

  describe('E16 Transaction Limits', () => {
    it('should include transactionLimit in response when DB limit differs from station limit (OCPP 2.1)', async () => {
      const dbLimit = { maxEnergy: 1000 };
      const { handler, ocppSender } = makeHandler({
        transactionEventRepository: {
          createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
            id: 1,
            transactionId: 'txn-001',
            isActive: true,
            transactionLimit: dbLimit,
          }),
        },
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

      await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          transactionLimit: dbLimit,
        }),
      );
    });

    it('should NOT include transactionLimit in response when DB limit matches station limit (OCPP 2.1)', async () => {
      const dbLimit = { maxEnergy: 1000 };
      const { handler, ocppSender } = makeHandler({
        transactionEventRepository: {
          createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
            id: 1,
            transactionId: 'txn-001',
            isActive: true,
            transactionLimit: dbLimit,
          }),
        },
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

      await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.not.objectContaining({
          transactionLimit: dbLimit,
        }),
      );
    });

    it('should include transactionLimit in response when idToken is present and DB limit differs (OCPP 2.1)', async () => {
      const dbLimit = { maxEnergy: 1000 };
      const { handler, ocppSender } = makeHandler({
        transactionEventRepository: {
          createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
            id: 1,
            transactionId: 'txn-001',
            isActive: true,
            transactionLimit: dbLimit,
          }),
        },
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

      await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
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
        const { handler } = makeHandler({
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-001',
              isActive: true,
              transactionLimit: { maxCost: 20 }, // old limit in DB
              customData: {},
            }),
            updateTransactionByStationIdAndTransactionId: updateSpy,
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

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
        const { handler } = makeHandler({
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-001',
              isActive: true,
              // Existing limit has maxEnergy set — must be preserved when maxCost is updated
              transactionLimit: { maxCost: 20, maxEnergy: 5000 },
              customData: {},
            }),
            updateTransactionByStationIdAndTransactionId: updateSpy,
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

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
        const { handler } = makeHandler({
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-001',
              isActive: true,
              transactionLimit: null,
            }),
            updateTransactionByStationIdAndTransactionId: updateSpy,
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

        // No limit update should happen for non-LimitSet events
        expect(updateSpy).not.toHaveBeenCalled();
      });
    });

    // ─── Fix 2: CSMS-set transactionLimit is persisted to DB ─────────────────────

    describe('E16.FR.02 - CSMS-set transactionLimit is persisted to DB', () => {
      it('should persist transactionLimit to DB when CSMS sets it in response (idToken path)', async () => {
        const updateSpy = vi.fn().mockResolvedValue({});
        const dbLimit = { maxEnergy: 2000 };
        const { handler } = makeHandler({
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-001',
              isActive: true,
              transactionLimit: dbLimit,
            }),
            updateTransactionByStationIdAndTransactionId: updateSpy,
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

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
        const { handler } = makeHandler({
          transactionEventRepository: {
            // DB has no limit — E16 won't set one in the response
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-001',
              isActive: true,
              transactionLimit: null,
            }),
            updateTransactionByStationIdAndTransactionId: updateSpy,
          },
        });

        const payload: OCPP2_1.TransactionEventRequest = {
          eventType: OCPP2_1.TransactionEventEnumType.Started,
          timestamp: new Date().toISOString(),
          triggerReason: OCPP2_1.TriggerReasonEnumType.Authorized,
          seqNo: 1,
          transactionInfo: { transactionId: 'txn-001' },
          idToken: { idToken: 'token-001', type: OCPP2_1.IdTokenEnumType.ISO14443 },
        };

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

        // No limit in response → no persistence call
        expect(updateSpy).not.toHaveBeenCalled();
      });

      it('should persist transactionLimit to DB on no-idToken path when DB limit differs from station limit', async () => {
        const updateSpy = vi.fn().mockResolvedValue({});
        const dbLimit = { maxTime: 3600 };
        const { handler } = makeHandler({
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-001',
              isActive: true,
              transactionLimit: dbLimit,
            }),
            updateTransactionByStationIdAndTransactionId: updateSpy,
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

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

  describe('F07 - Remote start with fixed cost, energy, SoC or time', () => {
    describe('F07.FR.02 - CSMS sets transactionLimit in first TransactionEventResponse', () => {
      it('should include transactionLimit.maxCost from cache when TransactionEvent(Started) has remoteStartId', async () => {
        const remoteStartId = 12345;
        const maxCost = 25.5;
        const cacheKey = `remotestart:${DEFAULT_TENANT_ID}:station-001:${remoteStartId}`;

        const { handler, ocppSender, cache } = makeHandler({
          cache: { get: vi.fn().mockResolvedValue(JSON.stringify({ maxCost })) },
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-001',
              isActive: true,
              remoteStartId,
            }),
          },
          transactionService: {
            authorizeOcpp21IdToken: vi
              .fn()
              .mockResolvedValue({ idTokenInfo: { status: AuthorizationStatusEnum.Accepted } }),
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

        // Verify cache was queried
        expect(cache.get).toHaveBeenCalledWith(cacheKey, CacheNamespace.Other);

        // Verify transactionLimit was included in response
        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            idTokenInfo: expect.anything(),
            transactionLimit: expect.objectContaining({
              maxCost,
            }),
          }),
        );

        // Verify cache entry was removed after use
        expect(cache.remove).toHaveBeenCalledWith(cacheKey, CacheNamespace.Other);
      });

      it('should include all transactionLimit fields (maxCost, maxEnergy, maxTime, maxSoC) from cache', async () => {
        const remoteStartId = 67890;
        const transactionLimit = {
          maxCost: 50.0,
          maxEnergy: 30000, // 30 kWh in Wh
          maxTime: 7200, // 2 hours in seconds
          maxSoC: 80, // 80%
        };

        const { handler, ocppSender } = makeHandler({
          cache: { get: vi.fn().mockResolvedValue(JSON.stringify(transactionLimit)) },
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-002',
              isActive: true,
              remoteStartId,
            }),
          },
          transactionService: {
            authorizeOcpp21IdToken: vi
              .fn()
              .mockResolvedValue({ idTokenInfo: { status: AuthorizationStatusEnum.Accepted } }),
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
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

        const { handler, ocppSender } = makeHandler({
          cache: { get: vi.fn().mockResolvedValue(null) },
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-003',
              isActive: true,
              remoteStartId,
            }),
          },
          transactionService: {
            authorizeOcpp21IdToken: vi
              .fn()
              .mockResolvedValue({ idTokenInfo: { status: AuthorizationStatusEnum.Accepted } }),
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

        // Response should not have transactionLimit
        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
          expect.anything(),
          expect.not.objectContaining({
            transactionLimit: expect.anything(),
          }),
        );
      });

      it('should NOT include transactionLimit when eventType is not Started', async () => {
        const remoteStartId = 11111;
        const cacheKey = `remotestart:${DEFAULT_TENANT_ID}:station-001:${remoteStartId}`;

        const { handler, cache } = makeHandler({
          cache: { get: vi.fn().mockResolvedValue(JSON.stringify({ maxCost: 20 })) },
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-004',
              isActive: true,
              remoteStartId,
            }),
          },
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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

        // Cache should not be queried for non-Started events
        expect(cache.get).not.toHaveBeenCalledWith(cacheKey, CacheNamespace.Other);
      });

      it('should NOT include transactionLimit when protocol is not OCPP 2.1', async () => {
        const remoteStartId = 22222;

        const { handler, cache } = makeHandler({
          cache: { get: vi.fn().mockResolvedValue(JSON.stringify({ maxCost: 30 })) },
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-005',
              isActive: true,
              remoteStartId,
            }),
          },
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
        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_0_1));

        // Cache should not be queried for OCPP 2.0.1
        expect(cache.get).not.toHaveBeenCalled();
      });
    });

    describe('F07.FR.04 - Persistence to DB (aligns with E16)', () => {
      it('should persist transactionLimit to DB when set in response', async () => {
        const remoteStartId = 33333;
        const maxEnergy = 25000;
        const updateSpy = vi.fn().mockResolvedValue({});

        const { handler } = makeHandler({
          cache: { get: vi.fn().mockResolvedValue(JSON.stringify({ maxEnergy })) },
          transactionEventRepository: {
            createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
              id: 1,
              transactionId: 'txn-006',
              isActive: true,
              remoteStartId,
            }),
            updateTransactionByStationIdAndTransactionId: updateSpy,
          },
          transactionService: {
            authorizeOcpp21IdToken: vi
              .fn()
              .mockResolvedValue({ idTokenInfo: { status: AuthorizationStatusEnum.Accepted } }),
          },
        });

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

        await handler.handle(makeMessage(payload, OCPPVersion.OCPP2_1));

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

  describe('ended transaction guard', () => {
    function makeGuardHandler(readTransactionResult: { isActive: boolean } | null) {
      const createOrUpdateSpy = vi.fn().mockResolvedValue({
        id: 1,
        transactionId: 'txn-001',
        isActive: true,
        totalKwh: null,
      });

      const { handler, ocppSender, transactionService, transactionEventRepository } = makeHandler({
        transactionEventRepository: {
          createOrUpdateTransactionByTransactionEventAndStationId: createOrUpdateSpy,
          readTransactionByStationIdAndTransactionId: vi
            .fn()
            .mockResolvedValue(readTransactionResult),
        },
      });

      return {
        handler,
        ocppSender,
        transactionService,
        transactionEventRepository,
        createOrUpdateSpy,
      };
    }

    describe('when transaction has already ended (isActive=false)', () => {
      it('should send an empty TransactionEventResponse and not update transaction for eventType=Updated', async () => {
        const { handler, ocppSender, createOrUpdateSpy } = makeGuardHandler({ isActive: false });

        const payload: OCPP2_0_1.TransactionEventRequest = {
          eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
          timestamp: new Date().toISOString(),
          triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
          seqNo: 5,
          transactionInfo: { transactionId: 'txn-001' },
        };

        await handler.handle(makeMessage(payload));

        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(expect.anything(), {});
        expect(createOrUpdateSpy).not.toHaveBeenCalled();
      });

      it('should send an empty TransactionEventResponse and not update transaction for eventType=Ended', async () => {
        const { handler, ocppSender, createOrUpdateSpy } = makeGuardHandler({ isActive: false });

        const payload: OCPP2_0_1.TransactionEventRequest = {
          eventType: OCPP2_0_1.TransactionEventEnumType.Ended,
          timestamp: new Date().toISOString(),
          triggerReason: OCPP2_0_1.TriggerReasonEnumType.EVDisconnected,
          seqNo: 5,
          transactionInfo: { transactionId: 'txn-001' },
        };

        await handler.handle(makeMessage(payload));

        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(expect.anything(), {});
        expect(createOrUpdateSpy).not.toHaveBeenCalled();
      });

      it('should forward the authorization response when idToken is present', async () => {
        const authResponse = { idTokenInfo: { status: AuthorizationStatusEnum.Accepted } };
        const { handler, ocppSender, transactionService, createOrUpdateSpy } = makeGuardHandler({
          isActive: false,
        });
        (transactionService.authorizeOcpp201IdToken as ReturnType<typeof vi.fn>).mockResolvedValue(
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

        await handler.handle(makeMessage(payload));

        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
        expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
          expect.anything(),
          authResponse,
        );
        expect(createOrUpdateSpy).not.toHaveBeenCalled();
      });
    });

    describe('when transaction is still active (isActive=true)', () => {
      it('should proceed normally and call createOrUpdate for eventType=Updated', async () => {
        const { handler, createOrUpdateSpy } = makeGuardHandler({ isActive: true });

        const payload: OCPP2_0_1.TransactionEventRequest = {
          eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
          timestamp: new Date().toISOString(),
          triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
          seqNo: 2,
          transactionInfo: { transactionId: 'txn-001' },
        };

        await handler.handle(makeMessage(payload));

        expect(createOrUpdateSpy).toHaveBeenCalledOnce();
      });
    });

    describe('when transaction is not found', () => {
      it('should proceed normally and call createOrUpdate for eventType=Updated', async () => {
        const { handler, createOrUpdateSpy } = makeGuardHandler(null);

        const payload: OCPP2_0_1.TransactionEventRequest = {
          eventType: OCPP2_0_1.TransactionEventEnumType.Updated,
          timestamp: new Date().toISOString(),
          triggerReason: OCPP2_0_1.TriggerReasonEnumType.MeterValuePeriodic,
          seqNo: 2,
          transactionInfo: { transactionId: 'txn-unknown' },
        };

        await handler.handle(makeMessage(payload));

        expect(createOrUpdateSpy).toHaveBeenCalledOnce();
      });
    });

    describe('when eventType=Started', () => {
      it('should skip the ended-transaction check entirely and proceed normally', async () => {
        const { handler, transactionEventRepository, createOrUpdateSpy } = makeGuardHandler({
          isActive: false,
        });

        const payload: OCPP2_0_1.TransactionEventRequest = {
          eventType: OCPP2_0_1.TransactionEventEnumType.Started,
          timestamp: new Date().toISOString(),
          triggerReason: OCPP2_0_1.TriggerReasonEnumType.CablePluggedIn,
          seqNo: 0,
          transactionInfo: { transactionId: 'txn-new' },
        };

        await handler.handle(makeMessage(payload));

        expect(
          transactionEventRepository.readTransactionByStationIdAndTransactionId,
        ).not.toHaveBeenCalled();
        expect(createOrUpdateSpy).toHaveBeenCalledOnce();
      });
    });
  });

  describe('transaction bookkeeping is independent of the idToken', () => {
    // A driver stopping a session by tapping their card produces TransactionEvent(Ended)
    // *with* an idToken. The cost, settlement and signed-meter-value work must not depend
    // on whether the charger happened to include one.
    const ENDED_WITH_IDTOKEN: OCPP2_0_1.TransactionEventRequest = {
      eventType: OCPP2_0_1.TransactionEventEnumType.Ended,
      timestamp: new Date().toISOString(),
      triggerReason: OCPP2_0_1.TriggerReasonEnumType.StopAuthorized,
      seqNo: 9,
      transactionInfo: { transactionId: 'txn-ended' },
      idToken: { idToken: 'TAG-1', type: OCPP2_0_1.IdTokenEnumType.ISO14443 },
    };

    const ENDED_WITHOUT_IDTOKEN: OCPP2_0_1.TransactionEventRequest = {
      eventType: OCPP2_0_1.TransactionEventEnumType.Ended,
      timestamp: new Date().toISOString(),
      triggerReason: OCPP2_0_1.TriggerReasonEnumType.EVCommunicationLost,
      seqNo: 9,
      transactionInfo: { transactionId: 'txn-ended' },
    };

    function makeEndedHandler() {
      return makeHandler({
        totalCost: 4.25,
        transactionEventRepository: {
          createOrUpdateTransactionByTransactionEventAndStationId: vi.fn().mockResolvedValue({
            id: 55,
            transactionId: 'txn-ended',
            isActive: false,
            connectorId: 3,
            totalKwh: 17,
          }),
        },
        transactionService: {
          authorizeOcpp201IdToken: vi.fn().mockResolvedValue({
            idTokenInfo: { status: AuthorizationStatusEnum.Accepted },
          }),
        },
      });
    }

    it('calculates totalCost for an Ended event that carries an idToken', async () => {
      const { handler, costCalculator } = makeEndedHandler();

      await handler.handle(makeMessage(ENDED_WITH_IDTOKEN));

      expect(costCalculator.calculateTotalCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ id: 55, totalKwh: 17 }),
      );
    });

    it('stores totalCost for an Ended event that carries an idToken', async () => {
      const { handler, transactionEventRepository } = makeEndedHandler();

      await handler.handle(makeMessage(ENDED_WITH_IDTOKEN));

      expect(transactionEventRepository.updateTransactionTotalCostById).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        4.25,
        55,
      );
    });

    it('returns totalCost to the charger for an Ended event that carries an idToken', async () => {
      const { handler, ocppSender } = makeEndedHandler();

      await handler.handle(makeMessage(ENDED_WITH_IDTOKEN));

      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ totalCost: 4.25 }),
      );
    });

    it('validates signed meter values on an event that carries an idToken', async () => {
      const { handler, signedMeterValuesUtil } = makeEndedHandler();

      await handler.handle(
        makeMessage({
          ...ENDED_WITH_IDTOKEN,
          meterValue: [
            {
              timestamp: new Date().toISOString(),
              sampledValue: [{ value: 17 }],
            },
          ],
        } as OCPP2_0_1.TransactionEventRequest),
      );

      expect(signedMeterValuesUtil.validateMeterValues).toHaveBeenCalledOnce();
    });

    it('still calculates and stores totalCost when the Ended event carries no idToken', async () => {
      const { handler, costCalculator, transactionEventRepository } = makeEndedHandler();

      await handler.handle(makeMessage(ENDED_WITHOUT_IDTOKEN));

      expect(costCalculator.calculateTotalCost).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        expect.objectContaining({ id: 55, totalKwh: 17 }),
      );
      expect(transactionEventRepository.updateTransactionTotalCostById).toHaveBeenCalledWith(
        DEFAULT_TENANT_ID,
        4.25,
        55,
      );
    });

    it('still returns the authorization result alongside the cost', async () => {
      const { handler, ocppSender } = makeEndedHandler();

      await handler.handle(makeMessage(ENDED_WITH_IDTOKEN));

      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          idTokenInfo: { status: AuthorizationStatusEnum.Accepted },
          totalCost: 4.25,
        }),
      );
    });
  });
});
