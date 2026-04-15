// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BootstrapConfig,
  Call,
  CallError,
  CallResult,
  ICache,
  IMessageHandler,
  IMessageSender,
  OcppRequest,
  OcppResponse,
  SystemConfig,
} from '@citrineos/base';
import {
  CacheNamespace,
  createIdentifier,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  MessageTypeId,
  NO_ACTION,
  OCPP2_0_1,
  OCPP2_0_1_CallAction,
  OcppError,
  OCPPVersion,
  RequestBuilder,
  RetryMessageError,
} from '@citrineos/base';
import type { ILocationRepository } from '@citrineos/data';
import { afterEach, beforeEach, describe, expect, it, type Mocked, vi } from 'vitest';
import { MessageRouterImpl } from '../../src/module/router.js';
import { WebhookDispatcher } from '../../src/module/webhook.dispatcher.js';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TENANT_ID = 1;
const STATION_ID = 'CS001';
const IDENTIFIER = createIdentifier(TENANT_ID, STATION_ID);
const PROTOCOL = OCPPVersion.OCPP2_0_1;
const CORRELATION_ID = 'msg-123';

function buildConfig(overrides?: Partial<SystemConfig & BootstrapConfig>): any {
  return {
    maxCallLengthSeconds: 30,
    maxCachingSeconds: 60,
    maxReconnectDelay: 30,
    logLevel: 0,
    ...overrides,
  };
}

function buildMockCache(): Mocked<ICache> {
  return {
    exists: vi.fn().mockResolvedValue(false),
    existsAnyInNamespace: vi.fn().mockResolvedValue(false),
    remove: vi.fn().mockResolvedValue(true),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue(true),
    setIfNotExist: vi.fn().mockResolvedValue(true),
    onChange: vi.fn().mockResolvedValue(null),
    getAndRemove: vi.fn().mockResolvedValue(null),
  } as unknown as Mocked<ICache>;
}

function buildMockSender(): Mocked<IMessageSender> {
  return {
    send: vi.fn().mockResolvedValue({ success: true }),
    sendRequest: vi.fn().mockResolvedValue({ success: true }),
    sendResponse: vi.fn().mockResolvedValue({ success: true }),
    shutdown: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<IMessageSender>;
}

function buildMockHandler(): Mocked<IMessageHandler> {
  return {
    subscribe: vi.fn().mockResolvedValue(true),
    unsubscribe: vi.fn().mockResolvedValue(true),
    handle: vi.fn(),
    shutdown: vi.fn().mockResolvedValue(undefined),
    module: undefined,
  } as unknown as Mocked<IMessageHandler>;
}

function buildMockDispatcher(): Mocked<WebhookDispatcher> {
  return {
    register: vi.fn().mockResolvedValue(undefined),
    deregister: vi.fn().mockResolvedValue(undefined),
    dispatchMessageReceivedUnparsed: vi.fn().mockResolvedValue(undefined),
    dispatchMessageReceived: vi.fn().mockResolvedValue(undefined),
    dispatchMessageSent: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<WebhookDispatcher>;
}

function buildMockLocationRepository(): Mocked<ILocationRepository> {
  return {
    setChargingStationIsOnlineAndOCPPVersion: vi.fn().mockResolvedValue(undefined),
    readChargingStationByStationId: vi.fn().mockResolvedValue(undefined),
    updateChargingStationTimestamp: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<ILocationRepository>;
}

// ─── Test Suite ────────────────────────────────────────────────────────────────

describe('MessageRouterImpl', () => {
  let config: any;
  let cache: Mocked<ICache>;
  let sender: Mocked<IMessageSender>;
  let handler: Mocked<IMessageHandler>;
  let dispatcher: Mocked<WebhookDispatcher>;
  let networkHook: ReturnType<typeof vi.fn>;
  let locationRepository: Mocked<ILocationRepository>;
  let router: MessageRouterImpl;

  beforeEach(() => {
    config = buildConfig();
    cache = buildMockCache();
    sender = buildMockSender();
    handler = buildMockHandler();
    dispatcher = buildMockDispatcher();
    networkHook = vi.fn().mockResolvedValue(undefined);
    locationRepository = buildMockLocationRepository();

    router = new MessageRouterImpl(
      config,
      cache,
      sender,
      handler,
      dispatcher,
      networkHook,
      undefined, // logger
      undefined, // ajv
      locationRepository,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should use provided locationRepository', () => {
      // Verify it doesn't try to create a default one by checking our mock is used
      expect(router['_locationRepository']).toBe(locationRepository);
    });
  });

  // ─── registerConnection ────────────────────────────────────────────────────

  describe('registerConnection', () => {
    it('should register webhook dispatcher, subscribe request and response, and set charger online', async () => {
      const result = await router.registerConnection(TENANT_ID, STATION_ID, PROTOCOL);

      expect(dispatcher.register).toHaveBeenCalledWith(TENANT_ID, STATION_ID);

      expect(handler.subscribe).toHaveBeenCalledTimes(2);
      // Request subscription
      expect(handler.subscribe).toHaveBeenCalledWith(IDENTIFIER, undefined, {
        tenantId: TENANT_ID.toString(),
        stationId: STATION_ID,
        state: MessageState.Request.toString(),
        origin: MessageOrigin.ChargingStationManagementSystem.toString(),
      });
      // Response subscription
      expect(handler.subscribe).toHaveBeenCalledWith(IDENTIFIER, undefined, {
        tenantId: TENANT_ID.toString(),
        stationId: STATION_ID,
        state: MessageState.Response.toString(),
        origin: MessageOrigin.ChargingStationManagementSystem.toString(),
      });

      expect(locationRepository.setChargingStationIsOnlineAndOCPPVersion).toHaveBeenCalledWith(
        TENANT_ID,
        STATION_ID,
        true,
        PROTOCOL,
      );

      expect(result).toBe(true);
    });

    it('should return false when both subscriptions fail', async () => {
      handler.subscribe.mockResolvedValue(false);

      const result = await router.registerConnection(TENANT_ID, STATION_ID, PROTOCOL);

      expect(result).toBe(false);
    });

    it('should return false when request subscription fails', async () => {
      handler.subscribe
        .mockResolvedValueOnce(false) // request
        .mockResolvedValueOnce(true); // response

      const result = await router.registerConnection(TENANT_ID, STATION_ID, PROTOCOL);

      expect(result).toBe(false);
    });

    it('should return false on error and log the error', async () => {
      handler.subscribe.mockRejectedValue(new Error('subscribe failed'));

      const result = await router.registerConnection(TENANT_ID, STATION_ID, PROTOCOL);

      expect(result).toBe(false);
    });
  });

  // ─── deregisterConnection ─────────────────────────────────────────────────

  describe('deregisterConnection', () => {
    it('should deregister dispatcher, set charger offline, and unsubscribe handler', async () => {
      locationRepository.readChargingStationByStationId.mockResolvedValue({
        protocol: PROTOCOL,
      } as any);

      const result = await router.deregisterConnection(TENANT_ID, STATION_ID);

      expect(dispatcher.deregister).toHaveBeenCalledWith(TENANT_ID, STATION_ID);
      expect(locationRepository.readChargingStationByStationId).toHaveBeenCalledWith(
        TENANT_ID,
        STATION_ID,
      );
      expect(locationRepository.setChargingStationIsOnlineAndOCPPVersion).toHaveBeenCalledWith(
        TENANT_ID,
        STATION_ID,
        false,
        PROTOCOL,
      );
      expect(handler.unsubscribe).toHaveBeenCalledWith(IDENTIFIER);
      expect(result).toBe(true);
    });

    it('should set protocol to null when charging station is not found', async () => {
      locationRepository.readChargingStationByStationId.mockResolvedValue(undefined);

      await router.deregisterConnection(TENANT_ID, STATION_ID);

      expect(locationRepository.setChargingStationIsOnlineAndOCPPVersion).toHaveBeenCalledWith(
        TENANT_ID,
        STATION_ID,
        false,
        null,
      );
    });

    it('should set protocol to null when readChargingStation throws', async () => {
      locationRepository.readChargingStationByStationId.mockRejectedValue(new Error('db error'));

      await router.deregisterConnection(TENANT_ID, STATION_ID);

      expect(locationRepository.setChargingStationIsOnlineAndOCPPVersion).toHaveBeenCalledWith(
        TENANT_ID,
        STATION_ID,
        false,
        null,
      );
    });

    it('should not throw when dispatcher.deregister fails', async () => {
      dispatcher.deregister.mockRejectedValue(new Error('deregister failed'));

      // Should not throw
      const result = await router.deregisterConnection(TENANT_ID, STATION_ID);

      expect(handler.unsubscribe).toHaveBeenCalledWith(IDENTIFIER);
      expect(result).toBe(true);
    });
  });

  // ─── onMessage ─────────────────────────────────────────────────────────────

  describe('onMessage', () => {
    const timestamp = new Date('2025-01-01T00:00:00Z');

    describe('Call messages (MessageTypeId.Call)', () => {
      it('should process a valid Call message', async () => {
        // Stub the internal validation to pass
        vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });
        // Stub _onCallIsAllowed
        cache.exists.mockResolvedValue(false); // not blacklisted

        const callMessage: Call = [
          MessageTypeId.Call,
          CORRELATION_ID,
          OCPP2_0_1_CallAction.BootNotification,
          { chargingStation: { model: 'Model', vendorName: 'Vendor' }, reason: 'PowerUp' },
        ];
        const rawMessage = JSON.stringify(callMessage);

        const result = await router.onMessage(IDENTIFIER, rawMessage, timestamp, PROTOCOL);

        expect(result).toBe(true);
        expect(dispatcher.dispatchMessageReceived).toHaveBeenCalled();
        expect(locationRepository.updateChargingStationTimestamp).toHaveBeenCalledWith(
          TENANT_ID,
          STATION_ID,
          timestamp.toISOString(),
        );
      });

      it('should return false and send CallError for invalid JSON', async () => {
        const result = await router.onMessage(IDENTIFIER, 'not-json', timestamp, PROTOCOL);

        expect(result).toBe(false);
        // Should still dispatch webhook and update timestamp
        expect(dispatcher.dispatchMessageReceivedUnparsed).toHaveBeenCalled();
      });

      it('should return false and send CallError for unknown message type id', async () => {
        const badMessage = JSON.stringify([99, CORRELATION_ID, 'SomeAction', {}]);

        const result = await router.onMessage(IDENTIFIER, badMessage, timestamp, PROTOCOL);

        expect(result).toBe(false);
        // Should send a CallError back via network hook
        expect(networkHook).toHaveBeenCalled();
        // Should still dispatch webhook and update timestamp
        expect(dispatcher.dispatchMessageReceivedUnparsed).toHaveBeenCalled();
      });

      it('should send CallError with FormationViolation for ocpp1.6 unknown message type', async () => {
        const badMessage = JSON.stringify([99, CORRELATION_ID, 'SomeAction', {}]);

        await router.onMessage(IDENTIFIER, badMessage, timestamp, 'ocpp1.6');

        expect(networkHook).toHaveBeenCalled();
        const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
        expect(sentMessage[2]).toBe(ErrorCode.FormationViolation);
      });

      it('should send CallError with FormatViolation for ocpp2.0.1 unknown message type', async () => {
        const badMessage = JSON.stringify([99, CORRELATION_ID, 'SomeAction', {}]);

        await router.onMessage(IDENTIFIER, badMessage, timestamp, 'ocpp2.0.1');

        expect(networkHook).toHaveBeenCalled();
        const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
        expect(sentMessage[2]).toBe(ErrorCode.FormatViolation);
      });

      it('should not send CallError for failed CallResult processing', async () => {
        // CallResult that will fail processing (no cached action)
        const callResultMessage = JSON.stringify([MessageTypeId.CallResult, CORRELATION_ID, {}]);

        await router.onMessage(IDENTIFIER, callResultMessage, timestamp, PROTOCOL);

        // CallResult errors should not trigger a CallError response
        expect(networkHook).not.toHaveBeenCalled();
        // The networkHook should be called with a CallError
        expect(dispatcher.dispatchMessageReceivedUnparsed).toHaveBeenCalled();
      });

      it('should not send CallError for failed CallError processing', async () => {
        const callErrorMessage = JSON.stringify([
          MessageTypeId.CallError,
          CORRELATION_ID,
          ErrorCode.InternalError,
          'Something failed',
          {},
        ]);

        await router.onMessage(IDENTIFIER, callErrorMessage, timestamp, PROTOCOL);

        expect(dispatcher.dispatchMessageReceivedUnparsed).toHaveBeenCalled();
      });
    });

    describe('CallResult messages', () => {
      it('should process a valid CallResult message', async () => {
        // Set up cached action for the correlation id (new format: action@isoTimestamp)
        cache.get.mockResolvedValue(`BootNotification@${new Date().toISOString()}`);
        vi.spyOn(router as any, '_validateCallResult').mockReturnValue({ isValid: true });

        const callResultMessage: CallResult = [MessageTypeId.CallResult, CORRELATION_ID, {}];
        const rawMessage = JSON.stringify(callResultMessage);

        const result = await router.onMessage(IDENTIFIER, rawMessage, timestamp, PROTOCOL);

        expect(result).toBe(true);
        expect(cache.remove).toHaveBeenCalledWith(
          CORRELATION_ID,
          CacheNamespace.Transactions + IDENTIFIER,
        );
      });
    });

    describe('CallError messages', () => {
      it('should process a valid CallError message', async () => {
        cache.get.mockResolvedValue(`BootNotification@${new Date().toISOString()}`);

        const callErrorMessage: CallError = [
          MessageTypeId.CallError,
          CORRELATION_ID,
          ErrorCode.InternalError,
          'Something failed',
          {},
        ];
        const rawMessage = JSON.stringify(callErrorMessage);

        const result = await router.onMessage(IDENTIFIER, rawMessage, timestamp, PROTOCOL);

        expect(result).toBe(true);
        expect(cache.remove).toHaveBeenCalledWith(
          CORRELATION_ID,
          CacheNamespace.Transactions + IDENTIFIER,
        );
      });
    });

    it('should always dispatch webhook even on error', async () => {
      await router.onMessage(IDENTIFIER, 'invalid-json', timestamp, PROTOCOL);

      expect(dispatcher.dispatchMessageReceivedUnparsed).toHaveBeenCalledWith(
        TENANT_ID,
        STATION_ID,
        'invalid-json',
        timestamp.toISOString(),
        PROTOCOL,
        NO_ACTION,
        MessageState.Unknown,
      );
    });

    it('should always attempt to update timestamp', async () => {
      vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });
      cache.exists.mockResolvedValue(false);

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.Heartbeat,
        {},
      ]);

      await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      expect(locationRepository.updateChargingStationTimestamp).toHaveBeenCalledWith(
        TENANT_ID,
        STATION_ID,
        timestamp.toISOString(),
      );
    });

    it('should not throw when updateChargingStationTimestamp fails', async () => {
      locationRepository.updateChargingStationTimestamp.mockRejectedValue(new Error('db error'));
      vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });
      cache.exists.mockResolvedValue(false);

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.Heartbeat,
        {},
      ]);

      // Should not throw
      const result = await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);
      expect(result).toBe(true);
    });
  });

  // ─── _onCall (tested indirectly through onMessage) ─────────────────────────

  describe('_onCall (via onMessage)', () => {
    const timestamp = new Date('2025-01-01T00:00:00Z');

    it('should send CallError when action is blacklisted', async () => {
      cache.exists.mockResolvedValue(true); // action is blacklisted

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.Heartbeat,
        {},
      ]);

      const result = await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      expect(result).toBe(false);
      expect(networkHook).toHaveBeenCalled();
      const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
      expect(sentMessage[0]).toBe(MessageTypeId.CallError);
      expect(sentMessage[2]).toBe(ErrorCode.SecurityError);
    });

    it('should send CallError when validation fails', async () => {
      cache.exists.mockResolvedValue(false);
      vi.spyOn(router as any, '_validateCall').mockReturnValue({
        isValid: false,
        errors: [{ message: 'bad format' }],
      });

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.BootNotification,
        {},
      ]);

      const result = await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      expect(result).toBe(false);
      expect(networkHook).toHaveBeenCalled();
      const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
      expect(sentMessage[2]).toBe(ErrorCode.FormatViolation);
    });

    it('should send CallError when _routeCall fails', async () => {
      cache.exists.mockResolvedValue(false);
      vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });
      sender.send.mockResolvedValue({ success: false, payload: 'routing failed' });

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.Heartbeat,
        {},
      ]);

      await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      // The error is handled asynchronously via sendCallError, so success is still true from onMessage
      // but the call itself will trigger sendCallError
      expect(sender.send).toHaveBeenCalled();
    });
  });

  // ─── sendCall ──────────────────────────────────────────────────────────────

  describe('sendCall', () => {
    const action = OCPP2_0_1_CallAction.GetBaseReport;
    const payload = { requestId: 1, reportBase: 'FullInventory' } as unknown as OcppRequest;

    it('should send a Call message successfully', async () => {
      // Not rejected boot status, no ongoing call
      cache.get.mockResolvedValue(null);

      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        payload,
        CORRELATION_ID,
      );

      expect(result.success).toBe(true);
      expect(networkHook).toHaveBeenCalledWith(IDENTIFIER, expect.any(String));
      const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
      expect(sentMessage[0]).toBe(MessageTypeId.Call);
      expect(sentMessage[1]).toBe(CORRELATION_ID);
      expect(sentMessage[2]).toBe(action);
    });

    it('should throw RetryMessageError when call is already in progress', async () => {
      cache.get.mockResolvedValue(null); // not rejected
      cache.existsAnyInNamespace.mockResolvedValue(true); // call in progress

      await expect(
        router.sendCall(STATION_ID, TENANT_ID, PROTOCOL, action, payload, CORRELATION_ID),
      ).rejects.toThrow(RetryMessageError);
    });

    it('should return success false when boot status is Rejected', async () => {
      cache.get.mockResolvedValue(OCPP2_0_1.RegistrationStatusEnumType.Rejected);

      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        payload,
        CORRELATION_ID,
      );

      expect(result.success).toBe(false);
      expect(networkHook).not.toHaveBeenCalled();
    });

    it('should allow TriggerMessage<BootNotification> even when Rejected', async () => {
      cache.get.mockResolvedValue(OCPP2_0_1.RegistrationStatusEnumType.Rejected);

      const triggerPayload = {
        requestedMessage: OCPP2_0_1.MessageTriggerEnumType.BootNotification,
      } as unknown as OcppRequest;

      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        OCPP2_0_1_CallAction.TriggerMessage,
        triggerPayload,
        CORRELATION_ID,
      );

      expect(result.success).toBe(true);
      expect(networkHook).toHaveBeenCalled();
    });

    it('should return success false when networkHook fails', async () => {
      cache.get.mockResolvedValue(null);
      networkHook.mockRejectedValue(new Error('network error'));

      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        payload,
        CORRELATION_ID,
      );

      expect(result.success).toBe(false);
      expect(cache.remove).toHaveBeenCalledWith(
        CORRELATION_ID,
        CacheNamespace.Transactions + IDENTIFIER,
      );
    });

    it('should dispatch webhook on successful send', async () => {
      cache.get.mockResolvedValue(null);

      await router.sendCall(STATION_ID, TENANT_ID, PROTOCOL, action, payload, CORRELATION_ID);

      expect(dispatcher.dispatchMessageSent).toHaveBeenCalled();
    });

    it('should set cache entry with correlationId key and action@timestamp value', async () => {
      cache.get.mockResolvedValue(null);

      await router.sendCall(STATION_ID, TENANT_ID, PROTOCOL, action, payload, CORRELATION_ID);

      expect(cache.set).toHaveBeenCalledWith(
        CORRELATION_ID,
        expect.stringMatching(new RegExp(`^${action}@`)),
        CacheNamespace.Transactions + IDENTIFIER,
        config.maxCallLengthSeconds,
      );
    });
  });

  // ─── sendCallResult ────────────────────────────────────────────────────────

  describe('sendCallResult', () => {
    const action = OCPP2_0_1_CallAction.BootNotification;
    const payload = {
      currentTime: '2025-01-01T00:00:00Z',
      interval: 300,
      status: 'Accepted',
    } as unknown as OcppResponse;

    it('should send a CallResult message successfully when cache matches', async () => {
      // New format: action@isoTimestamp, key is correlationId
      cache.get.mockResolvedValue(`${action}@${new Date().toISOString()}`);

      const result = await router.sendCallResult(
        CORRELATION_ID,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        payload,
      );

      expect(result.success).toBe(true);
      expect(networkHook).toHaveBeenCalled();
      const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
      expect(sentMessage[0]).toBe(MessageTypeId.CallResult);
      expect(sentMessage[1]).toBe(CORRELATION_ID);
      expect(cache.remove).toHaveBeenCalledWith(
        CORRELATION_ID,
        CacheNamespace.Transactions + IDENTIFIER,
      );
    });

    it('should return success false when no cached entry exists', async () => {
      cache.get.mockResolvedValue(null);

      const result = await router.sendCallResult(
        CORRELATION_ID,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        payload,
      );

      expect(result.success).toBe(false);
      expect(networkHook).not.toHaveBeenCalled();
    });

    it('should return success false when cached action does not match', async () => {
      cache.get.mockResolvedValue(`DifferentAction@${new Date().toISOString()}`);

      const result = await router.sendCallResult(
        CORRELATION_ID,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        payload,
      );

      expect(result.success).toBe(false);
    });

    it('should handle timestamps containing colons (ISO format)', async () => {
      // ISO timestamps contain colons (e.g. 2026-01-01T12:34:56.000Z) — delimiter is @ so this is safe
      cache.get.mockResolvedValue(`${action}@${new Date().toISOString()}`);

      const result = await router.sendCallResult(
        CORRELATION_ID,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        payload,
      );

      expect(result.success).toBe(true);
    });

    it('should dispatch webhook on successful send', async () => {
      cache.get.mockResolvedValue(`${action}@${new Date().toISOString()}`);

      await router.sendCallResult(CORRELATION_ID, STATION_ID, TENANT_ID, PROTOCOL, action, payload);

      expect(dispatcher.dispatchMessageSent).toHaveBeenCalled();
    });
  });

  // ─── sendCallError ─────────────────────────────────────────────────────────

  describe('sendCallError', () => {
    const action = OCPP2_0_1_CallAction.BootNotification;
    const ocppError = new OcppError(
      CORRELATION_ID,
      ErrorCode.InternalError,
      'Something went wrong',
      {},
    );

    it('should send a CallError message successfully when cache matches', async () => {
      // New format: action@isoTimestamp, key is correlationId
      cache.get.mockResolvedValue(`${action}@${new Date().toISOString()}`);

      const result = await router.sendCallError(
        CORRELATION_ID,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        ocppError,
      );

      expect(result.success).toBe(true);
      expect(networkHook).toHaveBeenCalled();
      const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
      expect(sentMessage[0]).toBe(MessageTypeId.CallError);
      expect(sentMessage[1]).toBe(CORRELATION_ID);
      expect(sentMessage[2]).toBe(ErrorCode.InternalError);
      expect(cache.remove).toHaveBeenCalledWith(
        CORRELATION_ID,
        CacheNamespace.Transactions + IDENTIFIER,
      );
    });

    it('should return success false when no cached entry exists', async () => {
      cache.get.mockResolvedValue(null);

      const result = await router.sendCallError(
        CORRELATION_ID,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        ocppError,
      );

      expect(result.success).toBe(false);
      expect(networkHook).not.toHaveBeenCalled();
    });

    it('should return success false when cached action does not match', async () => {
      cache.get.mockResolvedValue(`DifferentAction@${new Date().toISOString()}`);

      const result = await router.sendCallError(
        CORRELATION_ID,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        ocppError,
      );

      expect(result.success).toBe(false);
    });

    it('should handle timestamps containing colons (ISO format)', async () => {
      // ISO timestamps contain colons — delimiter is @ so this is safe
      cache.get.mockResolvedValue(`${action}@${new Date().toISOString()}`);

      const result = await router.sendCallError(
        CORRELATION_ID,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        ocppError,
      );

      expect(result.success).toBe(true);
    });
  });

  // ─── shutdown ──────────────────────────────────────────────────────────────

  describe('shutdown', () => {
    it('should shut down both sender and handler', async () => {
      await router.shutdown();

      expect(sender.shutdown).toHaveBeenCalled();
      expect(handler.shutdown).toHaveBeenCalled();
    });
  });

  // ─── _sendMessage (tested indirectly) ──────────────────────────────────────

  describe('_sendMessage (via sendCall)', () => {
    it('should return false and not dispatch webhook when networkHook throws', async () => {
      cache.get.mockResolvedValue(null);
      networkHook.mockRejectedValue(new Error('connection lost'));

      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        OCPP2_0_1_CallAction.GetBaseReport,
        { requestId: 1, reportBase: 'FullInventory' } as unknown as OcppRequest,
        CORRELATION_ID,
      );

      expect(result.success).toBe(false);
      expect(dispatcher.dispatchMessageSent).not.toHaveBeenCalled();
    });

    it('should not throw when webhook dispatch fails after successful send', async () => {
      cache.get.mockResolvedValue(null);
      dispatcher.dispatchMessageSent.mockRejectedValue(new Error('webhook error'));

      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        OCPP2_0_1_CallAction.GetBaseReport,
        { requestId: 1, reportBase: 'FullInventory' } as unknown as OcppRequest,
        CORRELATION_ID,
      );

      expect(result.success).toBe(true);
    });
  });

  // ─── _sendCallIsAllowed (tested indirectly via sendCall) ───────────────────

  describe('_sendCallIsAllowed (via sendCall)', () => {
    it('should allow non-Rejected boot status', async () => {
      cache.get.mockResolvedValue(OCPP2_0_1.RegistrationStatusEnumType.Accepted);
      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        OCPP2_0_1_CallAction.GetBaseReport,
        {} as OcppRequest,
        CORRELATION_ID,
      );

      expect(result.success).toBe(true);
    });

    it('should allow Pending boot status', async () => {
      cache.get.mockResolvedValue(OCPP2_0_1.RegistrationStatusEnumType.Pending);
      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        OCPP2_0_1_CallAction.GetBaseReport,
        {} as OcppRequest,
        CORRELATION_ID,
      );

      expect(result.success).toBe(true);
    });

    it('should allow when no boot status is cached', async () => {
      cache.get.mockResolvedValue(null);
      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        OCPP2_0_1_CallAction.GetBaseReport,
        {} as OcppRequest,
        CORRELATION_ID,
      );

      expect(result.success).toBe(true);
    });

    it('should block non-TriggerMessage<BootNotification> when Rejected', async () => {
      cache.get.mockResolvedValue(OCPP2_0_1.RegistrationStatusEnumType.Rejected);

      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        OCPP2_0_1_CallAction.GetBaseReport,
        {} as OcppRequest,
        CORRELATION_ID,
      );

      expect(result.success).toBe(false);
    });

    it('should block TriggerMessage with non-BootNotification requestedMessage when Rejected', async () => {
      cache.get.mockResolvedValue(OCPP2_0_1.RegistrationStatusEnumType.Rejected);

      const result = await router.sendCall(
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        OCPP2_0_1_CallAction.TriggerMessage,
        {
          requestedMessage: OCPP2_0_1.MessageTriggerEnumType.Heartbeat,
        } as unknown as OcppRequest,
        CORRELATION_ID,
      );

      expect(result.success).toBe(false);
    });
  });

  // ─── _handleMessageApiCallback (tested indirectly via onMessage) ───────────

  describe('_handleMessageApiCallback', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should POST to callback URL when one exists in cache', async () => {
      const callbackUrl = 'http://localhost:3000/callback';
      // _handleMessageApiCallback calls cache.get with correlationId + CALLBACK_URL_ prefix namespace
      cache.get.mockResolvedValueOnce(callbackUrl);

      const message: any = {
        context: { correlationId: CORRELATION_ID, stationId: STATION_ID, tenantId: TENANT_ID },
        payload: new OcppError(CORRELATION_ID, ErrorCode.InternalError, 'test', {}),
      };

      await (router as any)._handleMessageApiCallback(message);

      expect(global.fetch).toHaveBeenCalledWith(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.any(String),
      });
    });

    it('should not call fetch when no callback URL is cached', async () => {
      cache.get.mockResolvedValue(null);

      const message: any = {
        context: { correlationId: CORRELATION_ID, stationId: STATION_ID, tenantId: TENANT_ID },
        payload: new OcppError(CORRELATION_ID, ErrorCode.InternalError, 'test', {}),
      };

      await (router as any)._handleMessageApiCallback(message);

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  // ─── _routeCall ────────────────────────────────────────────────────────────

  describe('_routeCall', () => {
    it('should build and send a Call IMessage via sender', async () => {
      const message: Call = [
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.BootNotification,
        { chargingStation: { model: 'M', vendorName: 'V' }, reason: 'PowerUp' },
      ];
      const timestamp = new Date();

      const buildCallSpy = vi.spyOn(RequestBuilder, 'buildCall');

      await (router as any)._routeCall(IDENTIFIER, message, timestamp, PROTOCOL);

      expect(buildCallSpy).toHaveBeenCalledWith(
        STATION_ID,
        CORRELATION_ID,
        TENANT_ID,
        OCPP2_0_1_CallAction.BootNotification,
        message[3],
        EventGroup.Router,
        MessageOrigin.ChargingStation,
        PROTOCOL,
        timestamp,
      );
      expect(sender.send).toHaveBeenCalled();
    });
  });

  // ─── _routeCallResult ─────────────────────────────────────────────────────

  describe('_routeCallResult', () => {
    it('should build and send a CallResult IMessage via sender', async () => {
      const message: CallResult = [
        MessageTypeId.CallResult,
        CORRELATION_ID,
        { status: 'Accepted' },
      ];
      const timestamp = new Date();
      const action = OCPP2_0_1_CallAction.BootNotification;

      const buildCallResultSpy = vi.spyOn(RequestBuilder, 'buildCallResult');

      await (router as any)._routeCallResult(IDENTIFIER, message, action, timestamp, PROTOCOL);

      expect(buildCallResultSpy).toHaveBeenCalledWith(
        STATION_ID,
        CORRELATION_ID,
        TENANT_ID,
        action,
        message[2],
        EventGroup.Router,
        MessageOrigin.ChargingStation,
        PROTOCOL,
        timestamp,
      );
      expect(sender.send).toHaveBeenCalled();
    });
  });

  // ─── _routeCallError ──────────────────────────────────────────────────────

  describe('_routeCallError', () => {
    it('should always return success false (error routing not implemented)', async () => {
      cache.get.mockResolvedValue(null); // no callback URL

      const message: CallError = [
        MessageTypeId.CallError,
        CORRELATION_ID,
        ErrorCode.InternalError,
        'test error',
        {},
      ];
      const timestamp = new Date();
      const action = OCPP2_0_1_CallAction.BootNotification;

      const result = await (router as any)._routeCallError(
        IDENTIFIER,
        message,
        action,
        timestamp,
        PROTOCOL,
      );

      expect(result.success).toBe(false);
    });

    it('should call _handleMessageApiCallback', async () => {
      const callbackSpy = vi
        .spyOn(router as any, '_handleMessageApiCallback')
        .mockResolvedValue(undefined);
      cache.get.mockResolvedValue(null);

      const message: CallError = [
        MessageTypeId.CallError,
        CORRELATION_ID,
        ErrorCode.InternalError,
        'test error',
        { detail: 'some detail' },
      ];
      const timestamp = new Date();
      const action = OCPP2_0_1_CallAction.BootNotification;

      await (router as any)._routeCallError(IDENTIFIER, message, action, timestamp, PROTOCOL);

      expect(callbackSpy).toHaveBeenCalled();
    });
  });

  // ─── Integration-style: full message flow ─────────────────────────────────

  describe('full message flow', () => {
    const timestamp = new Date('2025-01-01T00:00:00Z');

    it('should process a complete Call -> route -> send cycle', async () => {
      cache.exists.mockResolvedValue(false); // not blacklisted
      vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });
      sender.send.mockResolvedValue({ success: true });

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.Heartbeat,
        {},
      ]);

      const result = await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      expect(result).toBe(true);
      expect(sender.send).toHaveBeenCalled();
      // New: key is messageId, namespace is CacheNamespace.Transactions + identifier, value is action@timestamp
      expect(cache.setIfNotExist).toHaveBeenCalledWith(
        CORRELATION_ID,
        expect.stringMatching(new RegExp(`^${OCPP2_0_1_CallAction.Heartbeat}@`)),
        CacheNamespace.Transactions + IDENTIFIER,
        config.maxCallLengthSeconds,
      );
    });

    it('should handle a CallResult response for a pending Call', async () => {
      cache.get.mockResolvedValue(`BootNotification@${new Date().toISOString()}`);
      vi.spyOn(router as any, '_validateCallResult').mockReturnValue({ isValid: true });
      sender.send.mockResolvedValue({ success: true });

      const callResultMessage = JSON.stringify([
        MessageTypeId.CallResult,
        CORRELATION_ID,
        { status: 'Accepted' },
      ]);

      const result = await router.onMessage(IDENTIFIER, callResultMessage, timestamp, PROTOCOL);

      expect(result).toBe(true);
    });

    it('should handle a CallError response for a pending Call', async () => {
      cache.get.mockResolvedValue(`BootNotification@${new Date().toISOString()}`);

      const callErrorMessage = JSON.stringify([
        MessageTypeId.CallError,
        CORRELATION_ID,
        ErrorCode.InternalError,
        'test error',
        {},
      ]);

      const result = await router.onMessage(IDENTIFIER, callErrorMessage, timestamp, PROTOCOL);

      expect(result).toBe(true);
    });
  });
});
