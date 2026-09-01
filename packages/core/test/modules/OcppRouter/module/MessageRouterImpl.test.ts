// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type ICache,
  type IMessageHandler,
  type IMessageSender,
  CacheNamespace,
  Call,
  CallError,
  CallResult,
  createIdentifier,
  OcppError,
  RequestBuilder,
} from '@citrineos/base';
import type { IChargingStationRepository } from '@citrineos/core';
import {
  type OcppRequest,
  type OcppResponse,
  type RawCall,
  type RawCallError,
  type RawCallResult,
  type SystemConfig,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  MessageTypeId,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
  RetryMessageError,
} from '@citrineos/types';
import { MessageRouterImpl } from '@modules/OcppRouter/src/module/router.js';
import { WebhookDispatcher } from '@modules/OcppRouter/src/module/webhook.dispatcher.js';
import { createTestContainer, getTestInstance } from '@test/testContainer.js';
import { type Mocked, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Helpers ───────────────────────────────────────────────────────────────────

const TENANT_ID = 1;
const STATION_ID = 'CS001';
const IDENTIFIER = createIdentifier(TENANT_ID, STATION_ID);
const PROTOCOL = OCPPVersion.OCPP2_0_1;
const CORRELATION_ID = 'msg-123';

function buildConfig(overrides?: Partial<SystemConfig['timeouts']>): any {
  return {
    logLevel: 0,
    timeouts: {
      maxCallLengthSeconds: 30,
      maxCachingSeconds: 60,
      shutdownGracePeriodSeconds: 30,
      realTimeAuthDefaultTimeoutSeconds: 15,
      notReadyThresholdSeconds: 60,
      ...overrides,
    },
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
    dispatchCallbackUrl: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<WebhookDispatcher>;
}

function buildMockLocationRepository(): Mocked<IChargingStationRepository> {
  return {
    setChargingStationIsOnlineAndOCPPVersion: vi.fn().mockResolvedValue(undefined),
    readChargingStationByStationId: vi.fn().mockResolvedValue(undefined),
    updateChargingStationTimestamp: vi.fn().mockResolvedValue(undefined),
  } as unknown as Mocked<IChargingStationRepository>;
}

// ─── Test Suite ────────────────────────────────────────────────────────────────

describe('MessageRouterImpl', () => {
  const { container } = createTestContainer();
  let config: any;
  let cache: Mocked<ICache>;
  let sender: Mocked<IMessageSender>;
  let handler: Mocked<IMessageHandler>;
  let dispatcher: Mocked<WebhookDispatcher>;
  let networkHook: ReturnType<typeof vi.fn>;
  let locationRepository: Mocked<IChargingStationRepository>;
  let router: MessageRouterImpl;

  beforeEach(() => {
    config = buildConfig();
    cache = buildMockCache();
    sender = buildMockSender();
    handler = buildMockHandler();
    dispatcher = buildMockDispatcher();
    networkHook = vi.fn().mockResolvedValue(undefined);
    locationRepository = buildMockLocationRepository();

    router = getTestInstance(container, MessageRouterImpl, {
      config,
      cache,
      routerSender: sender,
      routerHandler: handler,
      webhookDispatcher: dispatcher,
      networkHook,
      ocppValidator: undefined,
      locationRepository,
    });
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
        ocppConnectionName: STATION_ID,
        state: MessageState.Request.toString(),
        origin: MessageOrigin.ChargingStationManagementSystem.toString(),
      });
      // Response subscription
      expect(handler.subscribe).toHaveBeenCalledWith(IDENTIFIER, undefined, {
        tenantId: TENANT_ID.toString(),
        ocppConnectionName: STATION_ID,
        state: MessageState.Response.toString(),
        origin: MessageOrigin.ChargingStationManagementSystem.toString(),
      });

      expect(locationRepository.setChargingStationIsOnlineAndOCPPVersion).toHaveBeenCalledWith(
        TENANT_ID,
        STATION_ID,
        true,
        PROTOCOL,
        undefined,
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
        null,
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

        const callMessage: RawCall = [
          MessageTypeId.Call,
          CORRELATION_ID,
          OCPP_CallAction.BootNotification,
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
        expect(sentMessage[2]).toBe(ErrorCode.FormatViolation);
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
        expect(dispatcher.dispatchMessageReceived).toHaveBeenCalled();
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

        expect(dispatcher.dispatchMessageReceived).toHaveBeenCalled();
      });
    });

    describe('CallResult messages', () => {
      it('should process a valid CallResult message', async () => {
        // Set up cached action for the correlation id (new format: action@isoTimestamp)
        cache.get.mockResolvedValue(`BootNotification@${new Date().toISOString()}`);
        vi.spyOn(router as any, '_validateCallResult').mockReturnValue({ isValid: true });

        const callResultMessage: RawCallResult = [MessageTypeId.CallResult, CORRELATION_ID, {}];
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

        const callErrorMessage: RawCallError = [
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
        undefined,
        // Unparseable message — no messageTypeId could be read off the frame.
        undefined,
      );
    });

    it('should always attempt to update timestamp', async () => {
      vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });
      cache.exists.mockResolvedValue(false);

      const callMessage = JSON.stringify([
        MessageTypeId.Call,
        CORRELATION_ID,
        OCPP_CallAction.Heartbeat,
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
        OCPP_CallAction.Heartbeat,
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
        OCPP_CallAction.Heartbeat,
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
        OCPP_CallAction.BootNotification,
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
        OCPP_CallAction.Heartbeat,
        {},
      ]);

      await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      // The error is handled asynchronously via sendCallError, so success is still true from onMessage
      // but the call itself will trigger sendCallError
      expect(sender.send).toHaveBeenCalled();
    });
  });

  // ─── action attribution ────────────────────────────────────────────────────

  // An action that cannot be determined is recorded as undefined
  // only a Call carries an action of its own, and a
  // CallResult/CallError inherits the action of the Call it is correlated to.
  describe('action attribution', () => {
    const timestamp = new Date('2025-01-01T00:00:00Z');

    describe('getActionFromIncompletelyParsedRpcMessage', () => {
      const getAction = (rpcMessage: any, messageTypeId?: MessageTypeId) =>
        (router as any).getActionFromIncompletelyParsedRpcMessage(rpcMessage, messageTypeId);

      it('should read the action off a Call frame that carries one', () => {
        expect(
          getAction(
            [MessageTypeId.Call, CORRELATION_ID, OCPP_CallAction.Heartbeat, {}],
            MessageTypeId.Call,
          ),
        ).toBe(OCPP_CallAction.Heartbeat);
      });

      it('should return undefined for a Call frame truncated before the action', () => {
        expect(getAction([MessageTypeId.Call, CORRELATION_ID], MessageTypeId.Call)).toBeUndefined();
      });

      it('should return undefined when the frame itself could not be parsed', () => {
        expect(getAction(undefined, MessageTypeId.Call)).toBeUndefined();
      });

      it('should return undefined for a CallResult frame', () => {
        expect(
          getAction([MessageTypeId.CallResult, CORRELATION_ID, {}], MessageTypeId.CallResult),
        ).toBeUndefined();
      });

      it('should return undefined for a CallError frame', () => {
        expect(
          getAction(
            [MessageTypeId.CallError, CORRELATION_ID, ErrorCode.InternalError, 'boom', {}],
            MessageTypeId.CallError,
          ),
        ).toBeUndefined();
      });

      it('should return undefined when the messageTypeId could not be read', () => {
        expect(getAction(undefined, undefined)).toBeUndefined();
      });

      it('should return undefined for an unknown messageTypeId even if slot 2 looks like an action', () => {
        expect(
          getAction([99, CORRELATION_ID, OCPP_CallAction.Heartbeat, {}], 99 as MessageTypeId),
        ).toBeUndefined();
      });
    });

    describe('unparsed messages (via onMessage)', () => {
      it('should attribute both the record and the CallError reply to a malformed Call action', async () => {
        // Payload missing ⇒ the Call model rejects the frame, but the action is still readable.
        const malformedCall = JSON.stringify([
          MessageTypeId.Call,
          CORRELATION_ID,
          OCPP_CallAction.Heartbeat,
        ]);

        const result = await router.onMessage(IDENTIFIER, malformedCall, timestamp, PROTOCOL);

        expect(result).toBe(false);
        expect(dispatcher.dispatchMessageReceivedUnparsed).toHaveBeenCalledWith(
          TENANT_ID,
          STATION_ID,
          malformedCall,
          timestamp.toISOString(),
          PROTOCOL,
          OCPP_CallAction.Heartbeat,
          MessageTypeId.Call,
        );
        expect(dispatcher.dispatchMessageSent).toHaveBeenCalledWith(
          IDENTIFIER,
          expect.any(String),
          PROTOCOL,
          expect.any(String),
          MessageTypeId.CallError,
          expect.anything(),
          OCPP_CallAction.Heartbeat,
        );
      });

      it('should leave the action undefined on the CallError reply to an unparseable frame', async () => {
        await router.onMessage(IDENTIFIER, 'not-json', timestamp, PROTOCOL);

        expect(dispatcher.dispatchMessageSent).toHaveBeenCalledWith(
          IDENTIFIER,
          expect.any(String),
          PROTOCOL,
          expect.any(String),
          MessageTypeId.CallError,
          expect.anything(),
          undefined,
        );
      });

      it('should leave the action undefined for an unknown messageTypeId', async () => {
        const badMessage = JSON.stringify([99, CORRELATION_ID, OCPP_CallAction.Heartbeat, {}]);

        await router.onMessage(IDENTIFIER, badMessage, timestamp, PROTOCOL);

        expect(dispatcher.dispatchMessageReceivedUnparsed).toHaveBeenCalledWith(
          TENANT_ID,
          STATION_ID,
          badMessage,
          timestamp.toISOString(),
          PROTOCOL,
          undefined,
          99,
        );
      });

      it('should leave the action undefined for a malformed CallResult and send no reply', async () => {
        // Payload is a string, not an object ⇒ the CallResult model rejects the frame.
        const malformedCallResult = JSON.stringify([
          MessageTypeId.CallResult,
          CORRELATION_ID,
          'not-an-object',
        ]);

        const result = await router.onMessage(IDENTIFIER, malformedCallResult, timestamp, PROTOCOL);

        expect(result).toBe(false);
        // A CallResult is never answered with a CallError.
        expect(networkHook).not.toHaveBeenCalled();
        expect(dispatcher.dispatchMessageReceivedUnparsed).toHaveBeenCalledWith(
          TENANT_ID,
          STATION_ID,
          malformedCallResult,
          timestamp.toISOString(),
          PROTOCOL,
          undefined,
          MessageTypeId.CallResult,
        );
      });
    });

    describe('parsed messages (via onMessage)', () => {
      it('should record a Call with its own action', async () => {
        vi.spyOn(router as any, '_validateCall').mockReturnValue({ isValid: true });
        cache.exists.mockResolvedValue(false);

        const callMessage = JSON.stringify([
          MessageTypeId.Call,
          CORRELATION_ID,
          OCPP_CallAction.Heartbeat,
          {},
        ]);

        await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

        expect(dispatcher.dispatchMessageReceived).toHaveBeenCalledWith(
          TENANT_ID,
          STATION_ID,
          timestamp.toISOString(),
          PROTOCOL,
          callMessage,
          MessageTypeId.Call,
          expect.anything(),
          OCPP_CallAction.Heartbeat,
        );
      });

      it('should record a CallResult without an action, leaving correlation to supply it', async () => {
        cache.get.mockResolvedValue(
          `${OCPP_CallAction.BootNotification}@${timestamp.toISOString()}`,
        );
        vi.spyOn(router as any, '_validateCallResult').mockReturnValue({ isValid: true });

        const callResultMessage = JSON.stringify([MessageTypeId.CallResult, CORRELATION_ID, {}]);

        await router.onMessage(IDENTIFIER, callResultMessage, timestamp, PROTOCOL);

        expect(dispatcher.dispatchMessageReceived).toHaveBeenCalledWith(
          TENANT_ID,
          STATION_ID,
          timestamp.toISOString(),
          PROTOCOL,
          callResultMessage,
          MessageTypeId.CallResult,
          expect.anything(),
          undefined,
        );
      });

      it('should record a CallError without an action, leaving correlation to supply it', async () => {
        cache.get.mockResolvedValue(
          `${OCPP_CallAction.BootNotification}@${timestamp.toISOString()}`,
        );

        const callErrorMessage = JSON.stringify([
          MessageTypeId.CallError,
          CORRELATION_ID,
          ErrorCode.InternalError,
          'boom',
          {},
        ]);

        await router.onMessage(IDENTIFIER, callErrorMessage, timestamp, PROTOCOL);

        expect(dispatcher.dispatchMessageReceived).toHaveBeenCalledWith(
          TENANT_ID,
          STATION_ID,
          timestamp.toISOString(),
          PROTOCOL,
          callErrorMessage,
          MessageTypeId.CallError,
          expect.anything(),
          undefined,
        );
      });

      it('should attribute the CallError reply to the action of the Call it rejects', async () => {
        cache.exists.mockResolvedValue(true); // blacklisted ⇒ _onCall throws back out to onMessage

        const callMessage = JSON.stringify([
          MessageTypeId.Call,
          CORRELATION_ID,
          OCPP_CallAction.Heartbeat,
          {},
        ]);

        await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

        expect(dispatcher.dispatchMessageSent).toHaveBeenCalledWith(
          IDENTIFIER,
          expect.any(String),
          PROTOCOL,
          expect.any(String),
          MessageTypeId.CallError,
          expect.anything(),
          OCPP_CallAction.Heartbeat,
        );
      });
    });

    describe('outbound messages', () => {
      it('should attribute a sent Call to its action', async () => {
        cache.get.mockResolvedValue(null);

        await router.sendCall(
          STATION_ID,
          TENANT_ID,
          PROTOCOL,
          OCPP_CallAction.GetBaseReport,
          { requestId: 1, reportBase: 'FullInventory' } as unknown as OcppRequest,
          CORRELATION_ID,
        );

        expect(dispatcher.dispatchMessageSent).toHaveBeenCalledWith(
          IDENTIFIER,
          expect.any(String),
          PROTOCOL,
          expect.any(String),
          MessageTypeId.Call,
          expect.anything(),
          OCPP_CallAction.GetBaseReport,
        );
      });

      it('should attribute a sent CallResult to the cached action of the Call it answers', async () => {
        const action = OCPP_CallAction.BootNotification;
        cache.get.mockResolvedValue(`${action}@${timestamp.toISOString()}`);

        await router.sendCallResult(CORRELATION_ID, STATION_ID, TENANT_ID, PROTOCOL, action, {
          status: 'Accepted',
        } as unknown as OcppResponse);

        expect(dispatcher.dispatchMessageSent).toHaveBeenCalledWith(
          IDENTIFIER,
          expect.any(String),
          PROTOCOL,
          expect.any(String),
          MessageTypeId.CallResult,
          expect.anything(),
          action,
        );
      });

      it('should attribute a sent CallError to the cached action of the Call it answers', async () => {
        const action = OCPP_CallAction.BootNotification;
        cache.get.mockResolvedValue(`${action}@${timestamp.toISOString()}`);

        await router.sendCallError(
          CORRELATION_ID,
          STATION_ID,
          TENANT_ID,
          PROTOCOL,
          action,
          new OcppError(CORRELATION_ID, ErrorCode.InternalError, 'boom', {}),
        );

        expect(dispatcher.dispatchMessageSent).toHaveBeenCalledWith(
          IDENTIFIER,
          expect.any(String),
          PROTOCOL,
          expect.any(String),
          MessageTypeId.CallError,
          expect.anything(),
          action,
        );
      });
    });
  });

  // ─── sendCall ──────────────────────────────────────────────────────────────

  describe('sendCall', () => {
    const action = OCPP_CallAction.GetBaseReport;
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
        OCPP_CallAction.TriggerMessage,
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
        config.timeouts.maxCallLengthSeconds,
      );
    });
  });

  // ─── handle (stale Call TTL) ─────────────────────────────────────────────────

  describe('handle stale Call TTL', () => {
    const action = OCPP_CallAction.GetBaseReport;
    const payload = { requestId: 1, reportBase: 'FullInventory' } as unknown as OcppRequest;

    function buildRequestMessage(ageMs: number) {
      return RequestBuilder.buildCall(
        STATION_ID,
        CORRELATION_ID,
        TENANT_ID,
        action,
        payload,
        EventGroup.General,
        MessageOrigin.ChargingStationManagementSystem,
        PROTOCOL,
        new Date(Date.now() - ageMs),
      );
    }

    function buildRouterWithStaleGuard(staleCallMaxAgeSeconds?: number) {
      return getTestInstance(container, MessageRouterImpl, {
        config: buildConfig({ staleCallMaxAgeSeconds }),
        cache,
        routerSender: sender,
        routerHandler: handler,
        webhookDispatcher: dispatcher,
        networkHook,
        ocppValidator: undefined,
        locationRepository,
      });
    }

    it('should drop a Call older than staleCallMaxAgeSeconds when the guard is enabled', async () => {
      const guardedRouter = buildRouterWithStaleGuard(30);
      const sendCallSpy = vi.spyOn(guardedRouter, 'sendCall');

      // guard is 30s; 60s old ⇒ stale
      await guardedRouter.handle(buildRequestMessage(60_000));

      expect(sendCallSpy).not.toHaveBeenCalled();
      expect(networkHook).not.toHaveBeenCalled();
    });

    it('should route a Call still within staleCallMaxAgeSeconds when the guard is enabled', async () => {
      cache.get.mockResolvedValue(null);
      const guardedRouter = buildRouterWithStaleGuard(30);
      const sendCallSpy = vi.spyOn(guardedRouter, 'sendCall');

      await guardedRouter.handle(buildRequestMessage(0));

      expect(sendCallSpy).toHaveBeenCalledTimes(1);
    });

    it('should route an aged Call when the guard is disabled (default)', async () => {
      cache.get.mockResolvedValue(null);
      // default router has no staleCallMaxAgeSeconds ⇒ opt-in guard off, delivery unchanged
      const sendCallSpy = vi.spyOn(router, 'sendCall');

      await router.handle(buildRequestMessage(60_000));

      expect(sendCallSpy).toHaveBeenCalledTimes(1);
    });
  });

  // ─── sendCallResult ────────────────────────────────────────────────────────

  describe('sendCallResult', () => {
    const action = OCPP_CallAction.BootNotification;
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
    const action = OCPP_CallAction.BootNotification;
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
        OCPP_CallAction.GetBaseReport,
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
        OCPP_CallAction.GetBaseReport,
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
        OCPP_CallAction.GetBaseReport,
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
        OCPP_CallAction.GetBaseReport,
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
        OCPP_CallAction.GetBaseReport,
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
        OCPP_CallAction.GetBaseReport,
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
        OCPP_CallAction.TriggerMessage,
        {
          requestedMessage: OCPP2_0_1.MessageTriggerEnumType.Heartbeat,
        } as unknown as OcppRequest,
        CORRELATION_ID,
      );

      expect(result.success).toBe(false);
    });
  });

  // ─── _routeCall ────────────────────────────────────────────────────────────

  describe('_routeCall', () => {
    it('should build and send a Call IMessage via sender', async () => {
      const message = new Call(CORRELATION_ID, OCPP_CallAction.BootNotification, {
        chargingStation: { model: 'M', vendorName: 'V' },
        reason: 'PowerUp',
      } as OcppRequest);
      const timestamp = new Date();

      const buildCallSpy = vi.spyOn(RequestBuilder, 'buildCall');

      await (router as any)._routeCall(IDENTIFIER, message, timestamp, PROTOCOL);

      expect(buildCallSpy).toHaveBeenCalledWith(
        STATION_ID,
        CORRELATION_ID,
        TENANT_ID,
        OCPP_CallAction.BootNotification,
        message.payload,
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
      const message = new CallResult(CORRELATION_ID, { status: 'Accepted' } as OcppResponse);
      const timestamp = new Date();
      const action = OCPP_CallAction.BootNotification;

      const buildCallResultSpy = vi.spyOn(RequestBuilder, 'buildCallResult');

      await (router as any)._routeCallResult(IDENTIFIER, message, action, timestamp, PROTOCOL);

      expect(buildCallResultSpy).toHaveBeenCalledWith(
        STATION_ID,
        CORRELATION_ID,
        TENANT_ID,
        action,
        message.payload,
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

      const message = new CallError(CORRELATION_ID, ErrorCode.InternalError, 'test error');
      const timestamp = new Date();
      const action = OCPP_CallAction.BootNotification;

      const result = await (router as any)._routeCallError(
        IDENTIFIER,
        message,
        action,
        timestamp,
        PROTOCOL,
      );

      expect(result.success).toBe(false);
    });

    it('should call dispatchCallbackUrl on the webhook dispatcher', async () => {
      const message = new CallError(CORRELATION_ID, ErrorCode.InternalError, 'test error', {
        detail: 'some detail',
      });
      const timestamp = new Date();
      const action = OCPP_CallAction.BootNotification;

      await (router as any)._routeCallError(IDENTIFIER, message, action, timestamp, PROTOCOL);

      expect(dispatcher.dispatchCallbackUrl).toHaveBeenCalledWith(
        CORRELATION_ID,
        STATION_ID,
        expect.any(OcppError),
      );
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
        OCPP_CallAction.Heartbeat,
        {},
      ]);

      const result = await router.onMessage(IDENTIFIER, callMessage, timestamp, PROTOCOL);

      expect(result).toBe(true);
      expect(sender.send).toHaveBeenCalled();
      // New: key is messageId, namespace is CacheNamespace.Transactions + identifier, value is action@timestamp
      expect(cache.setIfNotExist).toHaveBeenCalledWith(
        CORRELATION_ID,
        expect.stringMatching(new RegExp(`^${OCPP_CallAction.Heartbeat}@`)),
        CacheNamespace.Transactions + IDENTIFIER,
        config.timeouts.maxCallLengthSeconds,
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
