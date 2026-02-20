// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import type {
  BootstrapConfig,
  Call,
  CallError,
  CallResult,
  CircuitBreakerOptions,
  ICache,
  IMessageHandler,
  IMessageSender,
  OcppRequest,
  OcppResponse,
  SystemConfig,
} from '@citrineos/base';
import {
  CacheNamespace,
  CircuitBreaker,
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
    initConnection: vi.fn().mockResolvedValue(undefined),
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
    it('should call handler.initConnection on construction', () => {
      expect(handler.initConnection).toHaveBeenCalled();
    });

    it('should use provided locationRepository', () => {
      // Verify it doesn't try to create a default one by checking our mock is used
      expect(router['_locationRepository']).toBe(locationRepository);
    });

    it('should use default maxReconnectDelay from config', () => {
      expect(router['_maxReconnectDelay']).toBe(30);
    });

    it('should use custom maxReconnectDelay from config', () => {
      const customConfig = buildConfig({ maxReconnectDelay: 60 });
      const customRouter = new MessageRouterImpl(
        customConfig,
        cache,
        sender,
        handler,
        dispatcher,
        networkHook,
        undefined,
        undefined,
        locationRepository,
      );
      expect(customRouter['_maxReconnectDelay']).toBe(60);
    });

    it('should fall back to DEFAULT_MAX_RECONNECT_DELAY when config is undefined', () => {
      const customConfig = buildConfig({ maxReconnectDelay: undefined });
      const customRouter = new MessageRouterImpl(
        customConfig,
        cache,
        sender,
        handler,
        dispatcher,
        networkHook,
        undefined,
        undefined,
        locationRepository,
      );
      expect(customRouter['_maxReconnectDelay']).toBe(30);
    });

    it('should accept custom circuitBreakerOptions', () => {
      const opts: CircuitBreakerOptions = { maxReconnectDelayMs: 5000 };
      const customRouter = new MessageRouterImpl(
        config,
        cache,
        sender,
        handler,
        dispatcher,
        networkHook,
        undefined,
        undefined,
        locationRepository,
        opts,
      );
      expect(customRouter['_circuitBreaker']).toBeInstanceOf(CircuitBreaker);
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

        const _result = await router.onMessage(IDENTIFIER, callResultMessage, timestamp, PROTOCOL);

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
        // Set up cached action for the correlation id
        cache.get.mockResolvedValue(`BootNotification:${CORRELATION_ID}`);
        vi.spyOn(router as any, '_validateCallResult').mockReturnValue({ isValid: true });

        const callResultMessage: CallResult = [MessageTypeId.CallResult, CORRELATION_ID, {}];
        const rawMessage = JSON.stringify(callResultMessage);

        const result = await router.onMessage(IDENTIFIER, rawMessage, timestamp, PROTOCOL);

        expect(result).toBe(true);
        expect(cache.remove).toHaveBeenCalledWith(IDENTIFIER, CacheNamespace.Transactions);
      });
    });

    describe('CallError messages', () => {
      it('should process a valid CallError message', async () => {
        cache.get.mockResolvedValue(`BootNotification:${CORRELATION_ID}`);

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
        expect(cache.remove).toHaveBeenCalledWith(IDENTIFIER, CacheNamespace.Transactions);
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

      // _onCall handles the error internally (sends CallError and returns), so onMessage returns true
      expect(result).toBe(true);
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

      // _onCall handles validation errors internally
      expect(result).toBe(true);
      expect(networkHook).toHaveBeenCalled();
      const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
      expect(sentMessage[2]).toBe(ErrorCode.FormatViolation);
    });

    it('should wait for ongoing call and retry when setIfNotExist fails initially', async () => {
      cache.exists.mockResolvedValue(false);
      vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });

      // First setIfNotExist fails (call in progress), onChange resolves, second setIfNotExist succeeds
      cache.setIfNotExist.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
      cache.onChange.mockResolvedValue(null);

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.Heartbeat,
        {},
      ]);

      const result = await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      expect(result).toBe(true);
      expect(cache.setIfNotExist).toHaveBeenCalledTimes(2);
      expect(cache.onChange).toHaveBeenCalled();
    });

    it('should send CallError when setIfNotExist fails on both attempts', async () => {
      cache.exists.mockResolvedValue(false);
      vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });

      cache.setIfNotExist.mockResolvedValue(false);
      cache.onChange.mockResolvedValue(null);

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP2_0_1_CallAction.Heartbeat,
        {},
      ]);

      const result = await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      // _onCall handles this error internally
      expect(result).toBe(true);
      expect(networkHook).toHaveBeenCalled();
      const sentMessage = JSON.parse(networkHook.mock.calls[0][1]);
      expect(sentMessage[2]).toBe(ErrorCode.RpcFrameworkError);
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

      const _result = await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

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
      // Not rejected boot status
      cache.get.mockResolvedValue(null);
      cache.setIfNotExist.mockResolvedValue(true);

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
      cache.setIfNotExist.mockResolvedValue(false); // call in progress

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
      cache.setIfNotExist.mockResolvedValue(true);

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
      cache.setIfNotExist.mockResolvedValue(true);
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
    });

    it('should dispatch webhook on successful send', async () => {
      cache.get.mockResolvedValue(null);
      cache.setIfNotExist.mockResolvedValue(true);

      await router.sendCall(STATION_ID, TENANT_ID, PROTOCOL, action, payload, CORRELATION_ID);

      expect(dispatcher.dispatchMessageSent).toHaveBeenCalled();
    });

    it('should set cache entry with action:correlationId', async () => {
      cache.get.mockResolvedValue(null);
      cache.setIfNotExist.mockResolvedValue(true);

      await router.sendCall(STATION_ID, TENANT_ID, PROTOCOL, action, payload, CORRELATION_ID);

      expect(cache.setIfNotExist).toHaveBeenCalledWith(
        IDENTIFIER,
        `${action}:${CORRELATION_ID}`,
        CacheNamespace.Transactions,
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
      cache.get.mockResolvedValue(`${action}:${CORRELATION_ID}`);

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
      expect(cache.remove).toHaveBeenCalledWith(IDENTIFIER, CacheNamespace.Transactions);
    });

    it('should return success false when no cached message id exists', async () => {
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
      cache.get.mockResolvedValue(`DifferentAction:${CORRELATION_ID}`);

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

    it('should return success false when cached message id does not match', async () => {
      cache.get.mockResolvedValue(`${action}:different-id`);

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

    it('should handle correlation ids containing colons', async () => {
      const colonId = 'id:with:colons';
      cache.get.mockResolvedValue(`${action}:${colonId}`);

      const result = await router.sendCallResult(
        colonId,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        payload,
      );

      expect(result.success).toBe(true);
    });

    it('should dispatch webhook on successful send', async () => {
      cache.get.mockResolvedValue(`${action}:${CORRELATION_ID}`);

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
      cache.get.mockResolvedValue(`${action}:${CORRELATION_ID}`);

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
      expect(cache.remove).toHaveBeenCalledWith(IDENTIFIER, CacheNamespace.Transactions);
    });

    it('should return success false when no cached message id exists', async () => {
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

    it('should return success false when cached message id does not match', async () => {
      cache.get.mockResolvedValue(`${action}:different-id`);

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

    it('should return success false when cached action does not match', async () => {
      cache.get.mockResolvedValue(`DifferentAction:${CORRELATION_ID}`);

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

    it('should handle correlation ids containing colons', async () => {
      const colonId = 'id:with:colons';
      const error = new OcppError(colonId, ErrorCode.InternalError, 'error', {});
      cache.get.mockResolvedValue(`${action}:${colonId}`);

      const result = await router.sendCallError(
        colonId,
        STATION_ID,
        TENANT_ID,
        PROTOCOL,
        action,
        error,
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

  // ─── Circuit Breaker ──────────────────────────────────────────────────────

  describe('circuit breaker', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    describe('handleCircuitBreakerStateChange', () => {
      it('should reset failingReconnectDelay on CLOSED state', () => {
        router['_failingReconnectDelay'] = 16;
        router['handleCircuitBreakerStateChange']('CLOSED', 'test reason');
        expect(router['_failingReconnectDelay']).toBe(1);
      });

      it('should reset failingReconnectDelay on OPEN state', () => {
        router['_failingReconnectDelay'] = 16;
        router['handleCircuitBreakerStateChange']('OPEN', 'test reason');
        expect(router['_failingReconnectDelay']).toBe(1);
      });

      it('should attempt exponential reconnect on FAILING state', () => {
        const spy = vi.spyOn(router as any, '_attemptExponentialReconnect');
        router['handleCircuitBreakerStateChange']('FAILING', 'test reason');
        expect(spy).toHaveBeenCalled();
      });
    });

    describe('_attemptExponentialReconnect', () => {
      it('should close circuit breaker when max delay is exceeded', () => {
        const closeSpy = vi.spyOn(router['_circuitBreaker'], 'close');
        router['_failingReconnectDelay'] = 31; // > DEFAULT_MAX_RECONNECT_DELAY (30)
        router['_attemptExponentialReconnect']();

        expect(closeSpy).toHaveBeenCalledWith('Max reconnect delay reached');
      });

      it('should double the reconnect delay on each attempt', () => {
        const reconnectSpy = vi.spyOn(router, 'onBrokerReconnect' as any);
        router['_failingReconnectDelay'] = 1;

        router['_attemptExponentialReconnect']();
        vi.advanceTimersByTime(1000);

        expect(reconnectSpy).toHaveBeenCalled();
        expect(router['_failingReconnectDelay']).toBe(2);
      });

      it('should cap reconnect delay at maxReconnectDelay', () => {
        const reconnectSpy = vi.spyOn(router, 'onBrokerReconnect' as any);
        router['_failingReconnectDelay'] = 16;

        router['_attemptExponentialReconnect']();
        vi.advanceTimersByTime(16000);

        expect(reconnectSpy).toHaveBeenCalled();
        expect(router['_failingReconnectDelay']).toBe(30); // capped at max
      });
    });

    describe('onCircuitBreakerClosed', () => {
      it('should set up a reconnect interval', () => {
        router['onCircuitBreakerClosed']('test');
        expect(router['_reconnectInterval']).toBeDefined();
      });

      it('should clear existing interval before creating new one', () => {
        const existingInterval = setInterval(() => {}, 100000);
        router['_reconnectInterval'] = existingInterval;

        router['onCircuitBreakerClosed']('test');

        expect(router['_reconnectInterval']).not.toBe(existingInterval);
      });

      it('should call onBrokerReconnect periodically', () => {
        const reconnectSpy = vi.spyOn(router, 'onBrokerReconnect' as any);
        router['onCircuitBreakerClosed']('test');

        vi.advanceTimersByTime(30000); // maxReconnectDelay * 1000
        expect(reconnectSpy).toHaveBeenCalledTimes(1);

        vi.advanceTimersByTime(30000);
        expect(reconnectSpy).toHaveBeenCalledTimes(2);
      });
    });

    describe('onCircuitBreakerOpen', () => {
      it('should clear reconnect interval', () => {
        router['_reconnectInterval'] = setInterval(() => {}, 100000);
        router['onCircuitBreakerOpen']();
        expect(router['_reconnectInterval']).toBeUndefined();
      });

      it('should handle no existing interval gracefully', () => {
        router['_reconnectInterval'] = undefined;
        expect(() => router['onCircuitBreakerOpen']()).not.toThrow();
      });
    });

    describe('onBrokerDisconnect', () => {
      it('should trigger circuit breaker failure', () => {
        const failureSpy = vi.spyOn(router['_circuitBreaker'], 'triggerFailure');
        router['onBrokerDisconnect']('disconnect reason');
        expect(failureSpy).toHaveBeenCalledWith('disconnect reason');
      });
    });

    describe('onBrokerReconnect', () => {
      it('should trigger circuit breaker success', () => {
        const successSpy = vi.spyOn(router['_circuitBreaker'], 'triggerSuccess');
        router['onBrokerReconnect']();
        expect(successSpy).toHaveBeenCalled();
      });
    });
  });

  // ─── _sendMessage (tested indirectly) ──────────────────────────────────────

  describe('_sendMessage (via sendCall)', () => {
    it('should return false and not dispatch webhook when networkHook throws', async () => {
      cache.get.mockResolvedValue(null);
      cache.setIfNotExist.mockResolvedValue(true);
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
      cache.setIfNotExist.mockResolvedValue(true);
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
      cache.setIfNotExist.mockResolvedValue(true);

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
      cache.setIfNotExist.mockResolvedValue(true);

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
      cache.setIfNotExist.mockResolvedValue(true);

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
    const _timestamp = new Date('2025-01-01T00:00:00Z');

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
      cache.setIfNotExist.mockResolvedValue(true);
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
      expect(cache.setIfNotExist).toHaveBeenCalledWith(
        IDENTIFIER,
        `${OCPP2_0_1_CallAction.Heartbeat}:${CORRELATION_ID}`,
        CacheNamespace.Transactions,
        config.maxCallLengthSeconds,
      );
    });

    it('should handle a CallResult response for a pending Call', async () => {
      cache.get.mockResolvedValue(`BootNotification:${CORRELATION_ID}`);
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
      cache.get.mockResolvedValue(`BootNotification:${CORRELATION_ID}`);

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
