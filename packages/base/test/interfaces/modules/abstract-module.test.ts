// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ErrorObject } from 'ajv';
import type { ILogObj, Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';
import {
  type CallAction,
  type OcppRequest,
  type OcppResponse,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { OcppError } from '@ocpp/rpc/message.js';
import type { ICache } from '@interfaces/cache/cache.js';
import { AbstractHandler } from '@interfaces/handlers/abstract-handler.js';
import { AsRequestHandler, AsResponseHandler } from '@interfaces/handlers/as-handler-class.js';
import type { IOcppSender } from '@interfaces/handlers/i-ocpp-sender.js';
import type { IMessage } from '@interfaces/messages/message.js';
import type { IMessageConfirmation } from '@interfaces/messages/message-confirmation.js';
import type { IMessageContext } from '@interfaces/messages/message-context.js';
import type { IMessageHandler } from '@interfaces/messages/message-handler.js';
import type { IMessageSender } from '@interfaces/messages/message-sender.js';
import { AbstractModule } from '@interfaces/modules/abstract-module.js';
import { OCPPValidator } from '@interfaces/modules/ocpp-validator.js';
import { aSystemConfig } from '../../providers/system-config.js';

const A_CONFIRMATION: IMessageConfirmation = { success: true };
const A_TIMESTAMP = '2026-09-01T12:00:00.000Z';
const A_HANDLER_LOGGER = {} as unknown as Logger<ILogObj>;
const AN_AJV_ERROR: ErrorObject = {
  keyword: 'required',
  instancePath: '',
  schemaPath: '#/required',
  params: { missingProperty: 'reason' },
  message: 'missing field',
};

// Mirrors OCPPValidator's verdict shape so mockReturnValue can carry `errors`.
type ValidationResult = { isValid: boolean; errors?: ErrorObject[] | null };

class TestModule extends AbstractModule {}

@AsRequestHandler([OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP1_6], OCPP_CallAction.BootNotification)
class BootRequestHandler extends AbstractHandler {
  handle = vi.fn(async () => {});
}

@AsRequestHandler([OCPPVersion.OCPP2_0_1], OCPP_CallAction.BootNotification)
class RivalBootRequestHandler extends AbstractHandler {
  handle = vi.fn(async () => {});
}

@AsRequestHandler([OCPPVersion.OCPP2_0_1], OCPP_CallAction.StatusNotification)
class StatusRequestHandler extends AbstractHandler {
  handle = vi.fn(async () => {});
}

@AsResponseHandler([OCPPVersion.OCPP2_0_1], OCPP_CallAction.Heartbeat)
class HeartbeatResponseHandler extends AbstractHandler {
  handle = vi.fn(async () => {});
}

function aMockValidator() {
  return {
    sanitizeOCPPPayload: vi.fn((payload: OcppRequest | OcppResponse) => payload),
    validateOCPPRequest: vi.fn((): ValidationResult => ({ isValid: true })),
    validateOCPPResponse: vi.fn((): ValidationResult => ({ isValid: true })),
  };
}

interface ModuleOptions {
  handlers?: AbstractHandler[];
  excludedActions?: { requests?: CallAction[]; responses?: CallAction[] };
}

function aModule(options: ModuleOptions = {}) {
  const subLogger = { error: vi.fn(), info: vi.fn(), warn: vi.fn(), settings: { minLevel: 0 } };
  const logger = { getSubLogger: vi.fn(() => subLogger) } as unknown as Logger<ILogObj>;
  const validator = aMockValidator();
  const handler = {
    module: undefined as unknown,
    subscribe: vi.fn(
      async (_identifier: string, _actions?: CallAction[], _filter?: { [k: string]: string }) =>
        true,
    ),
    shutdown: vi.fn(async () => {}),
  };
  const sender = {
    sendResponse: vi.fn(
      async (_message: IMessage<OcppRequest | OcppResponse>, _payload?: OcppResponse | OcppError) =>
        A_CONFIRMATION,
    ),
    shutdown: vi.fn(async () => {}),
  };
  const cache = {
    set: vi.fn(
      async (_key: string, _value: string, _namespace?: string, _expireSeconds?: number) => true,
    ),
  };
  const ocppSender = {
    sendCall: vi.fn(async () => A_CONFIRMATION),
    sendCallResult: vi.fn(async () => A_CONFIRMATION),
    sendCallResultWithMessage: vi.fn(async () => A_CONFIRMATION),
    sendCallError: vi.fn(async () => A_CONFIRMATION),
    sendCallErrorWithMessage: vi.fn(async () => A_CONFIRMATION),
  };
  const config = aSystemConfig();
  const module = new TestModule(
    config,
    cache as unknown as ICache,
    handler as unknown as IMessageHandler,
    sender as unknown as IMessageSender,
    EventGroup.Certificates,
    ocppSender as unknown as IOcppSender,
    logger,
    validator as unknown as OCPPValidator,
    options.handlers ?? [],
    options.excludedActions,
  );
  return { module, validator, handler, sender, cache, ocppSender, subLogger, config };
}

type MessageOverrides = Partial<Omit<IMessage<OcppRequest | OcppResponse>, 'context'>> & {
  context?: Partial<IMessageContext>;
};

function aMessage(overrides: MessageOverrides = {}): IMessage<OcppRequest | OcppResponse> {
  const { context: contextOverride, ...rest } = overrides;
  return {
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Certificates,
    action: OCPP_CallAction.BootNotification,
    state: MessageState.Request,
    context: {
      correlationId: 'corr-1',
      tenantId: 7,
      ocppConnectionName: 'cp001',
      timestamp: A_TIMESTAMP,
      ...contextOverride,
    },
    payload: { reason: 'PowerUp' } as OcppRequest,
    protocol: OCPPVersion.OCPP2_0_1,
    ...rest,
  } as IMessage<OcppRequest | OcppResponse>;
}

async function rejectionOf(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('promise resolved but a rejection was expected');
}

describe('AbstractModule', () => {
  describe('constructor', () => {
    it('registers itself as the handler module', () => {
      const { module, handler, subLogger } = aModule();
      expect(handler.module).toBe(module);
      expect(subLogger.info).toHaveBeenCalledWith('Initializing...');
    });

    it('exposes the given dependencies through getters', () => {
      const { module, validator, cache, sender, handler, config } = aModule();
      expect(module.ocppValidator).toBe(validator);
      expect(module.cache).toBe(cache);
      expect(module.sender).toBe(sender);
      expect(module.handler).toBe(handler);
      expect(module.config).toBe(config);
      expect(AbstractModule.CALLBACK_URL_CACHE_PREFIX).toBe('CALLBACK_URL_');
    });

    it('builds a default OCPPValidator when none is given', () => {
      const subLogger = { error: vi.fn(), info: vi.fn(), settings: { minLevel: 0 } };
      const logger = { getSubLogger: vi.fn(() => subLogger) } as unknown as Logger<ILogObj>;
      const module = new TestModule(
        aSystemConfig(),
        {} as ICache,
        { module: undefined } as unknown as IMessageHandler,
        {} as IMessageSender,
        EventGroup.Certificates,
        {} as IOcppSender,
        logger,
      );
      expect(module.ocppValidator).toBeInstanceOf(OCPPValidator);
    });

    it('throws when two handler instances claim the same protocol, action, and direction', () => {
      let thrown: Error | undefined;
      try {
        aModule({
          handlers: [
            new BootRequestHandler(A_HANDLER_LOGGER),
            new RivalBootRequestHandler(A_HANDLER_LOGGER),
          ],
        });
      } catch (error) {
        thrown = error as Error;
      }
      expect(thrown?.message).toBe(
        [
          "Module 'certificates' cannot start: two handlers are registered for the same message.",
          '',
          '  BootNotification (Request) — BootRequestHandler and RivalBootRequestHandler',
          '',
          'Dispatch can only route a message to one handler, so the other would never run. ' +
            "Remove one from this module's handler list.",
        ].join('\n'),
      );
    });

    it('accepts the same handler instance listed twice', () => {
      const boot = new BootRequestHandler(A_HANDLER_LOGGER);
      const { module, handler } = aModule({ handlers: [boot, boot] });
      expect(handler.module).toBe(module);
    });
  });

  describe('config setter', () => {
    it('applies the new log level to the logger', () => {
      const { module, subLogger } = aModule();
      module.config = aSystemConfig({ logLevel: 5 });
      expect(module.config.logLevel).toBe(5);
      expect(subLogger.settings.minLevel).toBe(5);
      expect(subLogger.info).toHaveBeenLastCalledWith(
        'Updating system configuration for certificates module...',
      );
    });
  });

  describe('handle - requests', () => {
    it('sanitizes, validates, and dispatches to the request handler', async () => {
      const boot = new BootRequestHandler(A_HANDLER_LOGGER);
      const { module, validator } = aModule({ handlers: [boot] });
      const sanitized = { reason: 'PowerUp' } as OcppRequest;
      validator.sanitizeOCPPPayload.mockReturnValue(sanitized);
      const message = aMessage();

      await module.handle(message, 'props-1');

      expect(validator.sanitizeOCPPPayload).toHaveBeenCalledTimes(1);
      expect(message.payload).toBe(sanitized);
      expect(validator.validateOCPPRequest).toHaveBeenCalledTimes(1);
      expect(validator.validateOCPPRequest).toHaveBeenCalledWith(
        OCPP_CallAction.BootNotification,
        sanitized,
        OCPPVersion.OCPP2_0_1,
      );
      expect(boot.handle).toHaveBeenCalledTimes(1);
      expect(boot.handle).toHaveBeenCalledWith(message, 'props-1');
    });

    it('routes each declared protocol to the same handler instance', async () => {
      const boot = new BootRequestHandler(A_HANDLER_LOGGER);
      const { module } = aModule({ handlers: [boot] });
      const ocpp16Message = aMessage({ protocol: OCPPVersion.OCPP1_6 });
      const ocpp201Message = aMessage({ protocol: OCPPVersion.OCPP2_0_1 });

      await module.handle(ocpp16Message);
      await module.handle(ocpp201Message);

      expect(boot.handle).toHaveBeenCalledTimes(2);
      expect(boot.handle).toHaveBeenNthCalledWith(1, ocpp16Message, undefined);
      expect(boot.handle).toHaveBeenNthCalledWith(2, ocpp201Message, undefined);
    });

    it('throws a FormatViolation OcppError when request validation fails', async () => {
      const boot = new BootRequestHandler(A_HANDLER_LOGGER);
      const { module, validator, sender } = aModule({ handlers: [boot] });
      validator.validateOCPPRequest.mockReturnValue({ isValid: false, errors: [AN_AJV_ERROR] });

      const error = (await rejectionOf(module.handle(aMessage()))) as OcppError;

      expect(error).toBeInstanceOf(OcppError);
      expect(error.errorCode).toBe(ErrorCode.FormatViolation);
      expect(error.message).toBe('Invalid message format');
      expect(error.messageId).toBe('corr-1');
      expect(error.errorDetails).toEqual({ errors: [AN_AJV_ERROR] });
      expect(boot.handle).not.toHaveBeenCalled();
      expect(sender.sendResponse).not.toHaveBeenCalled();
    });

    it('answers a NotSupported CallError when no handler matches the protocol', async () => {
      const boot = new BootRequestHandler(A_HANDLER_LOGGER);
      const { module, sender } = aModule({ handlers: [boot] });
      const message = aMessage({ protocol: OCPPVersion.OCPP2_1 });

      await module.handle(message);

      expect(boot.handle).not.toHaveBeenCalled();
      expect(sender.sendResponse).toHaveBeenCalledTimes(1);
      const [sentMessage, sentError] = sender.sendResponse.mock.calls[0];
      expect(sentMessage).toBe(message);
      expect(sentMessage.origin).toBe(MessageOrigin.ChargingStationManagementSystem);
      expect(sentError).toBeInstanceOf(OcppError);
      expect((sentError as OcppError).errorCode).toBe(ErrorCode.NotSupported);
      expect((sentError as OcppError).message).toBe(
        'No handler found for action: BootNotification at module certificates',
      );
    });

    it('does not route a request to a response handler of the same action', async () => {
      const heartbeat = new HeartbeatResponseHandler(A_HANDLER_LOGGER);
      const { module, sender } = aModule({ handlers: [heartbeat] });
      const message = aMessage({ action: OCPP_CallAction.Heartbeat, payload: {} as OcppRequest });

      await module.handle(message);

      expect(heartbeat.handle).not.toHaveBeenCalled();
      expect(sender.sendResponse).toHaveBeenCalledTimes(1);
      expect((sender.sendResponse.mock.calls[0][1] as OcppError).errorCode).toBe(
        ErrorCode.NotSupported,
      );
    });

    it('forwards a thrown OcppError as the CallError', async () => {
      const boot = new BootRequestHandler(A_HANDLER_LOGGER);
      const failure = new OcppError('corr-1', ErrorCode.SecurityError, 'not allowed');
      boot.handle.mockRejectedValue(failure);
      const { module, sender } = aModule({ handlers: [boot] });
      const message = aMessage();

      await module.handle(message);

      expect(sender.sendResponse).toHaveBeenCalledTimes(1);
      expect(sender.sendResponse).toHaveBeenCalledWith(message, failure);
      expect(message.origin).toBe(MessageOrigin.ChargingStationManagementSystem);
    });

    it('wraps a thrown plain Error into an InternalError CallError', async () => {
      const boot = new BootRequestHandler(A_HANDLER_LOGGER);
      boot.handle.mockRejectedValue(new Error('db down'));
      const { module, sender } = aModule({ handlers: [boot] });

      await module.handle(aMessage());

      expect(sender.sendResponse).toHaveBeenCalledTimes(1);
      const sentError = sender.sendResponse.mock.calls[0][1] as OcppError;
      expect(sentError).toBeInstanceOf(OcppError);
      expect(sentError.errorCode).toBe(ErrorCode.InternalError);
      expect(sentError.message).toBe('Failed handling message: db down');
      expect(sentError.messageId).toBe('corr-1');
    });

    it('sends no CallError for a non-Error throw', async () => {
      const boot = new BootRequestHandler(A_HANDLER_LOGGER);
      boot.handle.mockRejectedValue('exploded');
      const { module, sender, subLogger } = aModule({ handlers: [boot] });

      await module.handle(aMessage());

      expect(sender.sendResponse).not.toHaveBeenCalled();
      expect(subLogger.warn).toHaveBeenCalledTimes(1);
      expect(subLogger.warn).toHaveBeenCalledWith("Unknown error type, couldn't send CallError");
    });
  });

  describe('handle - responses', () => {
    it('validates and caches the response payload by correlationId before dispatch', async () => {
      const heartbeat = new HeartbeatResponseHandler(A_HANDLER_LOGGER);
      const { module, validator, cache } = aModule({ handlers: [heartbeat] });
      const payload = { currentTime: A_TIMESTAMP } as OcppResponse;
      const message = aMessage({
        action: OCPP_CallAction.Heartbeat,
        state: MessageState.Response,
        payload,
      });

      await module.handle(message);

      expect(validator.validateOCPPResponse).toHaveBeenCalledTimes(1);
      expect(validator.validateOCPPResponse).toHaveBeenCalledWith(
        OCPP_CallAction.Heartbeat,
        payload,
        OCPPVersion.OCPP2_0_1,
      );
      expect(cache.set).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(
        'corr-1',
        JSON.stringify({ currentTime: A_TIMESTAMP }),
        'cp001',
        30,
      );
      expect(heartbeat.handle).toHaveBeenCalledTimes(1);
      expect(heartbeat.handle).toHaveBeenCalledWith(message, undefined);
    });

    it('throws a FormatViolation OcppError when response validation fails', async () => {
      const heartbeat = new HeartbeatResponseHandler(A_HANDLER_LOGGER);
      const { module, validator, cache } = aModule({ handlers: [heartbeat] });
      validator.validateOCPPResponse.mockReturnValue({ isValid: false, errors: [AN_AJV_ERROR] });
      const message = aMessage({
        action: OCPP_CallAction.Heartbeat,
        state: MessageState.Response,
        payload: {} as OcppResponse,
      });

      const error = (await rejectionOf(module.handle(message))) as OcppError;

      expect(error).toBeInstanceOf(OcppError);
      expect(error.errorCode).toBe(ErrorCode.FormatViolation);
      expect(cache.set).not.toHaveBeenCalled();
      expect(heartbeat.handle).not.toHaveBeenCalled();
    });

    it('sends no CallError when a response handler throws', async () => {
      const heartbeat = new HeartbeatResponseHandler(A_HANDLER_LOGGER);
      heartbeat.handle.mockRejectedValue(new Error('db down'));
      const { module, sender, subLogger } = aModule({ handlers: [heartbeat] });
      const message = aMessage({
        action: OCPP_CallAction.Heartbeat,
        state: MessageState.Response,
        payload: { currentTime: A_TIMESTAMP } as OcppResponse,
      });

      await expect(module.handle(message)).resolves.toBeUndefined();

      expect(sender.sendResponse).not.toHaveBeenCalled();
      expect(subLogger.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('handle - unknown state', () => {
    it('rejects an unknown message state', async () => {
      const { module, sender } = aModule();
      const message = aMessage({ state: MessageState.Unknown });

      const error = (await rejectionOf(module.handle(message))) as Error;

      expect(error.message).toBe('Unknown message state: 99');
      expect(sender.sendResponse).not.toHaveBeenCalled();
    });
  });

  describe('initHandlers', () => {
    it('subscribes to the request and response queues with the declared actions', async () => {
      const { module, handler } = aModule({
        handlers: [
          new BootRequestHandler(A_HANDLER_LOGGER),
          new StatusRequestHandler(A_HANDLER_LOGGER),
          new HeartbeatResponseHandler(A_HANDLER_LOGGER),
        ],
      });

      await module.initHandlers();

      expect(handler.subscribe).toHaveBeenCalledTimes(2);
      expect(handler.subscribe).toHaveBeenNthCalledWith(
        1,
        'certificates_requests',
        [OCPP_CallAction.BootNotification, OCPP_CallAction.StatusNotification],
        { origin: 'cs', state: '1' },
      );
      expect(handler.subscribe).toHaveBeenNthCalledWith(
        2,
        'certificates_responses',
        [OCPP_CallAction.Heartbeat],
        { origin: 'cs', state: '2' },
      );
    });

    it('omits excluded requests and responses from the subscriptions', async () => {
      const { module, handler } = aModule({
        handlers: [
          new BootRequestHandler(A_HANDLER_LOGGER),
          new StatusRequestHandler(A_HANDLER_LOGGER),
          new HeartbeatResponseHandler(A_HANDLER_LOGGER),
        ],
        excludedActions: {
          requests: [OCPP_CallAction.StatusNotification],
          responses: [OCPP_CallAction.Heartbeat],
        },
      });

      await module.initHandlers();

      expect(handler.subscribe).toHaveBeenNthCalledWith(
        1,
        'certificates_requests',
        [OCPP_CallAction.BootNotification],
        { origin: 'cs', state: '1' },
      );
      expect(handler.subscribe).toHaveBeenNthCalledWith(2, 'certificates_responses', [], {
        origin: 'cs',
        state: '2',
      });
    });

    it('rejects and skips the responses subscription when the requests one fails', async () => {
      const { module, handler } = aModule({
        handlers: [new BootRequestHandler(A_HANDLER_LOGGER)],
      });
      handler.subscribe.mockResolvedValueOnce(false);

      const error = (await rejectionOf(module.initHandlers())) as Error;

      expect(error.message).toBe(
        'Could not initialize module due to failure in handler initialization.',
      );
      expect(handler.subscribe).toHaveBeenCalledTimes(1);
    });

    it('rejects when the responses subscription fails', async () => {
      const { module, handler } = aModule({
        handlers: [new HeartbeatResponseHandler(A_HANDLER_LOGGER)],
      });
      handler.subscribe.mockResolvedValueOnce(true).mockResolvedValueOnce(false);

      const error = (await rejectionOf(module.initHandlers())) as Error;

      expect(error.message).toBe(
        'Could not initialize module due to failure in handler initialization.',
      );
      expect(handler.subscribe).toHaveBeenCalledTimes(2);
    });
  });

  describe('send delegation', () => {
    it('delegates sendCall with its event group and the default origin', async () => {
      const { module, ocppSender } = aModule();
      const payload = { reason: 'PowerUp' } as OcppRequest;

      const result = await module.sendCall(
        'cp001',
        7,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.BootNotification,
        payload,
        'http://callback',
        'corr-9',
      );

      expect(result).toBe(A_CONFIRMATION);
      expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
      expect(ocppSender.sendCall).toHaveBeenCalledWith({
        ocppConnectionName: 'cp001',
        tenantId: 7,
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.BootNotification,
        eventGroup: EventGroup.Certificates,
        payload,
        callbackUrl: 'http://callback',
        correlationId: 'corr-9',
        origin: MessageOrigin.ChargingStationManagementSystem,
      });
    });

    it('delegates sendCallResult and keeps an explicit origin', async () => {
      const { module, ocppSender } = aModule();
      const payload = { currentTime: A_TIMESTAMP } as OcppResponse;

      const result = await module.sendCallResult(
        'corr-9',
        'cp001',
        7,
        OCPPVersion.OCPP1_6,
        OCPP_CallAction.Heartbeat,
        payload,
        MessageOrigin.ChargingStation,
      );

      expect(result).toBe(A_CONFIRMATION);
      expect(ocppSender.sendCallResult).toHaveBeenCalledTimes(1);
      expect(ocppSender.sendCallResult).toHaveBeenCalledWith({
        correlationId: 'corr-9',
        ocppConnectionName: 'cp001',
        tenantId: 7,
        protocol: OCPPVersion.OCPP1_6,
        action: OCPP_CallAction.Heartbeat,
        eventGroup: EventGroup.Certificates,
        payload,
        origin: MessageOrigin.ChargingStation,
      });
    });

    it('delegates sendCallResultWithMessage unchanged', async () => {
      const { module, ocppSender } = aModule();
      const message = aMessage() as IMessage<OcppRequest>;
      const payload = { currentTime: A_TIMESTAMP } as OcppResponse;

      const result = await module.sendCallResultWithMessage(message, payload);

      expect(result).toBe(A_CONFIRMATION);
      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledTimes(1);
      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledWith(message, payload);
    });

    it('delegates sendCallError with its event group and the default origin', async () => {
      const { module, ocppSender } = aModule();
      const payload = new OcppError('corr-9', ErrorCode.InternalError, 'boom');

      const result = await module.sendCallError(
        'corr-9',
        'cp001',
        7,
        OCPPVersion.OCPP2_0_1,
        OCPP_CallAction.BootNotification,
        payload,
      );

      expect(result).toBe(A_CONFIRMATION);
      expect(ocppSender.sendCallError).toHaveBeenCalledTimes(1);
      expect(ocppSender.sendCallError).toHaveBeenCalledWith({
        correlationId: 'corr-9',
        ocppConnectionName: 'cp001',
        tenantId: 7,
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.BootNotification,
        eventGroup: EventGroup.Certificates,
        payload,
        origin: MessageOrigin.ChargingStationManagementSystem,
      });
    });

    it('delegates sendCallErrorWithMessage unchanged', async () => {
      const { module, ocppSender } = aModule();
      const message = aMessage() as IMessage<OcppRequest>;
      const payload = new OcppError('corr-1', ErrorCode.InternalError, 'boom');

      const result = await module.sendCallErrorWithMessage(message, payload);

      expect(result).toBe(A_CONFIRMATION);
      expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalledTimes(1);
      expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalledWith(message, payload);
    });
  });

  describe('shutdown', () => {
    it('shuts down the handler and the sender', async () => {
      const { module, handler, sender } = aModule();

      await module.shutdown();

      expect(handler.shutdown).toHaveBeenCalledTimes(1);
      expect(sender.shutdown).toHaveBeenCalledTimes(1);
    });
  });
});
