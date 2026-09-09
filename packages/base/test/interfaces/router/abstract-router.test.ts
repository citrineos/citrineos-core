// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ErrorObject } from 'ajv';
import type { ILogObj } from 'tslog';
import type { Logger } from 'tslog';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  type CallAction,
  type OcppRequest,
  type OcppResponse,
  type OCPPVersionType,
  type SystemConfigInput,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { Call, CallResult, OcppError } from '@ocpp/rpc/message.js';
import type { ICache } from '@interfaces/cache/cache.js';
import type { IMessage } from '@interfaces/messages/message.js';
import type { IMessageConfirmation } from '@interfaces/messages/message-confirmation.js';
import type { IMessageContext } from '@interfaces/messages/message-context.js';
import type { IMessageHandler } from '@interfaces/messages/message-handler.js';
import type { IMessageSender } from '@interfaces/messages/message-sender.js';
import { OCPPValidator } from '@interfaces/modules/ocpp-validator.js';
import { AbstractMessageRouter } from '@interfaces/router/abstract-router.js';
import { aSystemConfig } from '../../providers/system-config.js';

const A_CONFIRMATION: IMessageConfirmation = { success: true };

// Mirrors OCPPValidator's verdict shape so mockReturnValue can carry `errors`.
type ValidationResult = { isValid: boolean; errors?: ErrorObject[] | null };

// The send* mocks spell out their parameters so `mock.calls` keeps a typed tuple.
class TestRouter extends AbstractMessageRouter {
  onMessage = vi.fn(async () => true);
  registerConnection = vi.fn(async () => true);
  deregisterConnection = vi.fn(async () => true);
  sendCall = vi.fn(
    async (
      _ocppConnectionName: string,
      _tenantId: number,
      _protocol: OCPPVersionType,
      _action: CallAction,
      _payload: OcppRequest,
      _correlationId?: string,
      _origin?: MessageOrigin,
    ) => A_CONFIRMATION,
  );
  sendCallResult = vi.fn(
    async (
      _correlationId: string,
      _ocppConnectionName: string,
      _tenantId: number,
      _protocol: OCPPVersionType,
      _action: CallAction,
      _payload: OcppResponse,
      _origin?: MessageOrigin,
    ) => A_CONFIRMATION,
  );
  sendCallError = vi.fn(
    async (
      _correlationId: string,
      _ocppConnectionName: string,
      _tenantId: number,
      _protocol: OCPPVersionType,
      _action: CallAction,
      _error: OcppError,
      _origin?: MessageOrigin,
    ) => A_CONFIRMATION,
  );
  shutdown = vi.fn(async () => {});

  validateCall(identifier: string, message: Call, protocol: string) {
    return this._validateCall(identifier, message, protocol);
  }

  validateCallResult(
    identifier: string,
    action: CallAction,
    message: CallResult,
    protocol: string,
  ) {
    return this._validateCallResult(identifier, action, message, protocol);
  }

  currentNetworkHook() {
    return this._networkHook;
  }
}

function aMockValidator() {
  return {
    sanitizeOCPPPayload: vi.fn((payload: unknown) => payload),
    validateOCPPRequest: vi.fn((): ValidationResult => ({ isValid: true })),
    validateOCPPResponse: vi.fn((): ValidationResult => ({ isValid: true })),
  };
}

function aRouter(configOverride?: Partial<SystemConfigInput>) {
  const subLogger = { error: vi.fn(), info: vi.fn(), settings: { minLevel: 0 } };
  const logger = { getSubLogger: vi.fn(() => subLogger) } as unknown as Logger<ILogObj>;
  const validator = aMockValidator();
  const handler = { module: undefined } as unknown as IMessageHandler;
  const sender = {} as IMessageSender;
  const cache = {} as ICache;
  const networkHook = vi.fn(async () => {});
  const config = aSystemConfig(configOverride);
  const router = new TestRouter(
    config,
    cache,
    handler,
    sender,
    networkHook,
    logger,
    validator as unknown as OCPPValidator,
  );
  return { router, validator, subLogger, handler, sender, cache, config, networkHook };
}

const A_TIMESTAMP = '2026-09-01T12:00:00.000Z';

type MessageOverrides = Partial<
  Omit<IMessage<OcppRequest | OcppResponse | OcppError>, 'context'>
> & {
  context?: Partial<IMessageContext>;
};

function aMessage(
  overrides: MessageOverrides = {},
): IMessage<OcppRequest | OcppResponse | OcppError> {
  const { context: contextOverride, ...rest } = overrides;
  return {
    origin: MessageOrigin.ChargingStationManagementSystem,
    eventGroup: EventGroup.EVDriver,
    action: OCPP_CallAction.Reset,
    state: MessageState.Request,
    context: {
      correlationId: 'corr-1',
      tenantId: 7,
      ocppConnectionName: 'cp001',
      timestamp: A_TIMESTAMP,
      ...contextOverride,
    },
    payload: { type: 'Immediate' } as OcppRequest,
    protocol: OCPPVersion.OCPP2_0_1,
    ...rest,
  } as IMessage<OcppRequest | OcppResponse | OcppError>;
}

const AN_AJV_ERROR: ErrorObject = {
  keyword: 'required',
  instancePath: '',
  schemaPath: '#/required',
  params: { missingProperty: 'type' },
  message: 'missing field',
};

describe('AbstractMessageRouter', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('registers itself as the handler module', () => {
      const { router, handler } = aRouter();
      expect(handler.module).toBe(router);
    });

    it('exposes the given dependencies through getters', () => {
      const { router, validator, cache, sender, handler, config } = aRouter();
      expect(router.ocppValidator).toBe(validator);
      expect(router.cache).toBe(cache);
      expect(router.sender).toBe(sender);
      expect(router.handler).toBe(handler);
      expect(router.config).toBe(config);
    });

    it('builds a default OCPPValidator when none is given', () => {
      const handler = { module: undefined } as unknown as IMessageHandler;
      const router = new TestRouter(
        aSystemConfig(),
        {} as ICache,
        handler,
        {} as IMessageSender,
        vi.fn(async () => {}),
      );
      expect(router.ocppValidator).toBeInstanceOf(OCPPValidator);
    });
  });

  describe('config setter', () => {
    it('applies the new log level to the logger', () => {
      const { router, subLogger } = aRouter();
      router.config = aSystemConfig({ logLevel: 5 });
      expect(router.config.logLevel).toBe(5);
      expect(subLogger.settings.minLevel).toBe(5);
      expect(subLogger.info).toHaveBeenCalledTimes(1);
      expect(subLogger.info).toHaveBeenCalledWith(
        'Updating system configuration for ocpp router...',
      );
    });
  });

  describe('networkHook setter', () => {
    it('replaces the hook', () => {
      const { router } = aRouter();
      const replacement = vi.fn(async () => {});
      router.networkHook = replacement;
      expect(router.currentNetworkHook()).toBe(replacement);
    });
  });

  describe('handle: Call dispatch', () => {
    it('sanitizes the payload and dispatches via sendCall', async () => {
      const { router, validator } = aRouter();
      const sanitized = { type: 'Immediate', sanitized: true };
      validator.sanitizeOCPPPayload.mockReturnValue(sanitized);
      const message = aMessage();

      await router.handle(message);

      expect(validator.sanitizeOCPPPayload).toHaveBeenCalledTimes(1);
      expect(validator.sanitizeOCPPPayload).toHaveBeenCalledWith({ type: 'Immediate' });
      expect(validator.validateOCPPRequest).toHaveBeenCalledTimes(1);
      expect(validator.validateOCPPRequest).toHaveBeenCalledWith(
        OCPP_CallAction.Reset,
        sanitized,
        OCPPVersion.OCPP2_0_1,
      );
      expect(router.sendCall).toHaveBeenCalledTimes(1);
      expect(router.sendCall).toHaveBeenCalledWith(
        'cp001',
        7,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.Reset,
        sanitized,
        'corr-1',
        MessageOrigin.ChargingStationManagementSystem,
      );
    });

    it('throws a FormatViolation OcppError when request validation fails', async () => {
      const { router, validator } = aRouter();
      validator.validateOCPPRequest.mockReturnValue({ isValid: false, errors: [AN_AJV_ERROR] });

      const error: OcppError = await router.handle(aMessage()).then(
        () => {
          throw new Error('expected handle to reject');
        },
        (e) => e,
      );

      expect(error).toBeInstanceOf(OcppError);
      expect(error.messageId).toBe('corr-1');
      expect(error.errorCode).toBe(ErrorCode.FormatViolation);
      expect(error.message).toBe('Invalid message format');
      expect(error.errorDetails).toEqual({ errors: [AN_AJV_ERROR] });
      expect(router.sendCall).not.toHaveBeenCalled();
    });

    it('treats reported errors as failure even when isValid is true', async () => {
      const { router, validator } = aRouter();
      validator.validateOCPPRequest.mockReturnValue({ isValid: true, errors: [AN_AJV_ERROR] });

      await expect(router.handle(aMessage())).rejects.toBeInstanceOf(OcppError);
      expect(router.sendCall).not.toHaveBeenCalled();
    });
  });

  describe('handle: stale Call guard', () => {
    it('drops a request older than staleCallMaxAgeSeconds and logs it', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-01T12:01:01.000Z')); // 61 s after A_TIMESTAMP
      const { router, subLogger } = aRouter({ timeouts: { staleCallMaxAgeSeconds: 60 } });

      await expect(router.handle(aMessage())).resolves.toBeUndefined();

      expect(router.sendCall).not.toHaveBeenCalled();
      expect(subLogger.error).toHaveBeenCalledTimes(1);
      expect(subLogger.error).toHaveBeenCalledWith(
        'Dropping stale Reset Call for cp001: queued 61000 ms ago, ' +
          'exceeds staleCallMaxAgeSeconds (60000 ms). correlationId=corr-1',
      );
    });

    it('delivers a request exactly at the age limit', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-01T12:01:00.000Z')); // exactly 60 s
      const { router, subLogger } = aRouter({ timeouts: { staleCallMaxAgeSeconds: 60 } });

      await router.handle(aMessage());

      expect(router.sendCall).toHaveBeenCalledTimes(1);
      expect(subLogger.error).not.toHaveBeenCalled();
    });

    it('delivers an old request when staleCallMaxAgeSeconds is not configured', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-09-01T13:00:00.000Z')); // 1 h after A_TIMESTAMP
      const { router } = aRouter();

      await router.handle(aMessage());

      expect(router.sendCall).toHaveBeenCalledTimes(1);
    });
  });

  describe('handle: CallResult dispatch', () => {
    it('dispatches a valid response via sendCallResult', async () => {
      const { router, validator } = aRouter();
      const payload = { currentTime: A_TIMESTAMP } as OcppResponse;
      const message = aMessage({
        state: MessageState.Response,
        action: OCPP_CallAction.Heartbeat,
        payload,
        origin: MessageOrigin.ChargingStation,
      });

      await router.handle(message);

      expect(validator.validateOCPPResponse).toHaveBeenCalledTimes(1);
      expect(validator.validateOCPPResponse).toHaveBeenCalledWith(
        OCPP_CallAction.Heartbeat,
        payload,
        OCPPVersion.OCPP2_0_1,
      );
      expect(router.sendCallResult).toHaveBeenCalledTimes(1);
      expect(router.sendCallResult).toHaveBeenCalledWith(
        'corr-1',
        'cp001',
        7,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.Heartbeat,
        payload,
        MessageOrigin.ChargingStation,
      );
      expect(router.sendCallError).not.toHaveBeenCalled();
    });

    it('throws a FormatViolation OcppError when response validation fails', async () => {
      const { router, validator } = aRouter();
      validator.validateOCPPResponse.mockReturnValue({ isValid: false, errors: [AN_AJV_ERROR] });

      const error: OcppError = await router.handle(aMessage({ state: MessageState.Response })).then(
        () => {
          throw new Error('expected handle to reject');
        },
        (e) => e,
      );

      expect(error).toBeInstanceOf(OcppError);
      expect(error.messageId).toBe('corr-1');
      expect(error.errorCode).toBe(ErrorCode.FormatViolation);
      expect(router.sendCallResult).not.toHaveBeenCalled();
    });
  });

  describe('handle: CallError reconstruction', () => {
    it('rebuilds an OcppError from an _errorCode payload and dispatches via sendCallError', async () => {
      const { router } = aRouter();
      const errorPayload = {
        _messageId: 'msg-9',
        _errorCode: ErrorCode.InternalError,
        message: 'station exploded',
        _errorDetails: { detail: 'x' },
      };
      const message = aMessage({
        state: MessageState.Response,
        payload: errorPayload as unknown as OcppResponse,
      });

      await router.handle(message);

      expect(router.sendCallError).toHaveBeenCalledTimes(1);
      const [correlationId, connectionName, tenantId, protocol, action, sentError, origin] =
        router.sendCallError.mock.calls[0];
      expect(correlationId).toBe('corr-1');
      expect(connectionName).toBe('cp001');
      expect(tenantId).toBe(7);
      expect(protocol).toBe(OCPPVersion.OCPP2_0_1);
      expect(action).toBe(OCPP_CallAction.Reset);
      expect(origin).toBe(MessageOrigin.ChargingStationManagementSystem);
      expect(sentError).toBeInstanceOf(OcppError);
      expect(sentError.messageId).toBe('msg-9');
      expect(sentError.errorCode).toBe(ErrorCode.InternalError);
      expect(sentError.message).toBe('station exploded');
      expect(sentError.errorDetails).toEqual({ detail: 'x' });
      expect(router.sendCallResult).not.toHaveBeenCalled();
    });

    it('defaults description and details when the error payload omits them', async () => {
      const { router } = aRouter();
      const message = aMessage({
        state: MessageState.Response,
        payload: {
          _messageId: 'msg-9',
          _errorCode: ErrorCode.GenericError,
        } as unknown as OcppResponse,
      });

      await router.handle(message);

      const sentError = router.sendCallError.mock.calls[0][5];
      expect(sentError.message).toBe('');
      expect(sentError.errorDetails).toEqual({});
    });
  });

  describe('handle: unknown message state', () => {
    it('logs and throws on an unknown state', async () => {
      const { router, subLogger } = aRouter();
      const message = aMessage({ state: MessageState.Unknown });

      await expect(router.handle(message)).rejects.toThrow('Unknown message state: 99');

      expect(subLogger.error).toHaveBeenCalledTimes(1);
      expect(subLogger.error).toHaveBeenCalledWith('Unknown message state', message);
      expect(router.sendCall).not.toHaveBeenCalled();
      expect(router.sendCallResult).not.toHaveBeenCalled();
      expect(router.sendCallError).not.toHaveBeenCalled();
    });
  });

  describe('_validateCall', () => {
    it.each([[OCPPVersion.OCPP1_6], [OCPPVersion.OCPP2_0_1], [OCPPVersion.OCPP2_1]])(
      'validates a %s Call against the matching protocol enum',
      (protocol) => {
        const { router, validator } = aRouter();
        const call = new Call('m-1', OCPP_CallAction.Heartbeat, {});

        const result = router.validateCall('cp001', call, protocol);

        expect(validator.validateOCPPRequest).toHaveBeenCalledTimes(1);
        expect(validator.validateOCPPRequest).toHaveBeenCalledWith(
          OCPP_CallAction.Heartbeat,
          {},
          protocol,
        );
        expect(result).toEqual({ isValid: true });
      },
    );

    it('returns the validator verdict unchanged on failure', () => {
      const { router, validator } = aRouter();
      validator.validateOCPPRequest.mockReturnValue({ isValid: false, errors: [AN_AJV_ERROR] });
      const call = new Call('m-1', OCPP_CallAction.Heartbeat, {});

      const result = router.validateCall('cp001', call, OCPPVersion.OCPP1_6);

      expect(result).toEqual({ isValid: false, errors: [AN_AJV_ERROR] });
    });

    it('rejects an unknown subprotocol without validating', () => {
      const { router, validator, subLogger } = aRouter();
      const call = new Call('m-1', OCPP_CallAction.Heartbeat, {});

      const result = router.validateCall('cp001', call, 'ocpp9.9');

      expect(result).toEqual({ isValid: false });
      expect(validator.validateOCPPRequest).not.toHaveBeenCalled();
      expect(subLogger.error).toHaveBeenCalledTimes(1);
      expect(subLogger.error).toHaveBeenCalledWith('Unknown subprotocol', 'ocpp9.9');
    });
  });

  describe('_validateCallResult', () => {
    it.each([[OCPPVersion.OCPP1_6], [OCPPVersion.OCPP2_0_1], [OCPPVersion.OCPP2_1]])(
      'validates a %s CallResult against the matching protocol enum',
      (protocol) => {
        const { router, validator } = aRouter();
        const payload = { currentTime: A_TIMESTAMP };
        const callResult = new CallResult('m-2', payload);

        const result = router.validateCallResult(
          'cp001',
          OCPP_CallAction.Heartbeat,
          callResult,
          protocol,
        );

        expect(validator.validateOCPPResponse).toHaveBeenCalledTimes(1);
        expect(validator.validateOCPPResponse).toHaveBeenCalledWith(
          OCPP_CallAction.Heartbeat,
          payload,
          protocol,
        );
        expect(result).toEqual({ isValid: true });
      },
    );

    it('rejects an unknown subprotocol without validating', () => {
      const { router, validator, subLogger } = aRouter();
      const callResult = new CallResult('m-2', { currentTime: A_TIMESTAMP });

      const result = router.validateCallResult(
        'cp001',
        OCPP_CallAction.Heartbeat,
        callResult,
        'ocpp9.9',
      );

      expect(result).toEqual({ isValid: false });
      expect(validator.validateOCPPResponse).not.toHaveBeenCalled();
      expect(subLogger.error).toHaveBeenCalledTimes(1);
      expect(subLogger.error).toHaveBeenCalledWith('Unknown subprotocol', 'ocpp9.9');
    });
  });
});
