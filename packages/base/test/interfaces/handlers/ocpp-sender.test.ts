// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import type { ILogObj, Logger } from 'tslog';
import { describe, expect, it, vi } from 'vitest';
import {
  type OcppRequest,
  type OcppResponse,
  type SystemConfigInput,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { OcppError } from '@ocpp/rpc/message.js';
import type { ICache } from '@interfaces/cache/cache.js';
import { CacheNamespace } from '@interfaces/cache/types.js';
import type {
  IMessage,
  IMessageConfirmation,
  IMessageContext,
  IMessageSender,
} from '@interfaces/messages/index.js';
import { OCPPValidator } from '@interfaces/modules/ocpp-validator.js';
import { OcppSender } from '@interfaces/handlers/ocpp-sender.js';
import type { SendCallArgs, SendCallResultArgs } from '@interfaces/handlers/i-ocpp-sender.js';
import { aSystemConfig } from '../../providers/system-config.js';

const A_CONFIRMATION: IMessageConfirmation = { success: true };
const A_TIMESTAMP = '2026-09-01T12:00:00.000Z';
const AN_AJV_ERROR = { keyword: 'required', instancePath: '', message: 'missing field' };
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

type ValidationResult = { isValid: boolean; errors?: unknown[] | null };

function aMockValidator() {
  return {
    sanitizeOCPPPayload: vi.fn((payload: unknown) => payload),
    validateOCPPRequest: vi.fn((): ValidationResult => ({ isValid: true })),
    validateOCPPResponse: vi.fn((): ValidationResult => ({ isValid: true })),
  };
}

function anOcppSender(configOverride?: Partial<SystemConfigInput>) {
  const subLogger = { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
  const logger = { getSubLogger: vi.fn(() => subLogger) } as unknown as Logger<ILogObj>;
  const validator = aMockValidator();
  const cache = { get: vi.fn(), set: vi.fn() };
  cache.get.mockResolvedValue(aConnection());
  cache.set.mockResolvedValue('OK');
  const sender = { sendRequest: vi.fn(), sendResponse: vi.fn() };
  sender.sendRequest.mockResolvedValue(A_CONFIRMATION);
  sender.sendResponse.mockResolvedValue(A_CONFIRMATION);
  const config = aSystemConfig(configOverride);
  const ocppSender = new OcppSender({
    config,
    cache: cache as unknown as ICache,
    sender: sender as unknown as IMessageSender,
    logger,
    ocppValidator: validator as unknown as OCPPValidator,
  });
  return { ocppSender, validator, cache, sender, subLogger, logger, config };
}

function aConnection(protocol: string = OCPPVersion.OCPP2_0_1): string {
  return JSON.stringify({
    id: '0',
    timeConnected: A_TIMESTAMP,
    protocol,
    allowUnknownChargingStations: false,
  });
}

function aSendCallArgs(overrides: Partial<SendCallArgs> = {}): SendCallArgs {
  return {
    ocppConnectionName: 'cp001',
    tenantId: 7,
    protocol: OCPPVersion.OCPP2_0_1,
    action: OCPP_CallAction.Reset,
    eventGroup: EventGroup.EVDriver,
    payload: { type: 'Immediate' } as OcppRequest,
    correlationId: 'corr-1',
    ...overrides,
  };
}

function aSendCallResultArgs(overrides: Partial<SendCallResultArgs> = {}): SendCallResultArgs {
  return {
    ocppConnectionName: 'cp001',
    tenantId: 7,
    protocol: OCPPVersion.OCPP2_0_1,
    action: OCPP_CallAction.Reset,
    eventGroup: EventGroup.EVDriver,
    payload: { status: 'Accepted' } as OcppResponse,
    correlationId: 'corr-1',
    ...overrides,
  };
}

function aMessage(overrides: Partial<IMessage<OcppRequest>> = {}): IMessage<OcppRequest> {
  const context: IMessageContext = {
    correlationId: 'corr-1',
    tenantId: 7,
    ocppConnectionName: 'cp001',
    timestamp: A_TIMESTAMP,
  };
  return {
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.EVDriver,
    action: OCPP_CallAction.Reset,
    state: MessageState.Request,
    context,
    payload: { type: 'Immediate' } as OcppRequest,
    protocol: OCPPVersion.OCPP2_0_1,
    ...overrides,
  };
}

describe('OcppSender', () => {
  describe('constructor', () => {
    it('names the sub logger after the class', () => {
      const { logger } = anOcppSender();
      expect(logger.getSubLogger).toHaveBeenCalledTimes(1);
      expect(logger.getSubLogger).toHaveBeenCalledWith({ name: 'OcppSender' });
    });

    it('builds a default OCPPValidator when none is given', () => {
      const subLogger = { info: vi.fn() };
      const logger = { getSubLogger: vi.fn(() => subLogger) } as unknown as Logger<ILogObj>;
      const ocppSender = new OcppSender({
        config: aSystemConfig(),
        cache: {} as ICache,
        sender: {} as IMessageSender,
        logger,
      });
      expect(ocppSender['_ocppValidator']).toBeInstanceOf(OCPPValidator);
    });
  });

  describe('sendCall', () => {
    it('sanitizes the payload before validating it', async () => {
      const { ocppSender, validator } = anOcppSender();
      const original = { type: 'Immediate', evseId: null } as unknown as OcppRequest;
      const sanitized = { type: 'Immediate' } as OcppRequest;
      validator.sanitizeOCPPPayload.mockReturnValue(sanitized);

      await ocppSender.sendCall(aSendCallArgs({ payload: original }));

      expect(validator.sanitizeOCPPPayload).toHaveBeenCalledTimes(1);
      expect(validator.sanitizeOCPPPayload).toHaveBeenCalledWith(original);
      expect(validator.validateOCPPRequest).toHaveBeenCalledTimes(1);
      expect(validator.validateOCPPRequest).toHaveBeenCalledWith(
        OCPP_CallAction.Reset,
        sanitized,
        OCPPVersion.OCPP2_0_1,
      );
    });

    it('throws a FormatViolation OcppError when validation fails', async () => {
      const { ocppSender, validator, cache, sender } = anOcppSender();
      validator.validateOCPPRequest.mockReturnValue({ isValid: false, errors: [AN_AJV_ERROR] });

      const error = await ocppSender.sendCall(aSendCallArgs()).then(
        () => {
          throw new Error('expected sendCall to throw');
        },
        (thrown: unknown) => thrown as OcppError,
      );

      expect(error).toBeInstanceOf(OcppError);
      expect(error.messageId).toBe('corr-1');
      expect(error.errorCode).toBe(ErrorCode.FormatViolation);
      expect(error.message).toBe('Invalid message format');
      expect(error.errorDetails).toEqual({ errors: [AN_AJV_ERROR] });
      expect(cache.get).not.toHaveBeenCalled();
      expect(sender.sendRequest).not.toHaveBeenCalled();
    });

    it('throws when the validator reports errors despite isValid being true', async () => {
      const { ocppSender, validator } = anOcppSender();
      validator.validateOCPPRequest.mockReturnValue({ isValid: true, errors: [AN_AJV_ERROR] });

      const error = await ocppSender.sendCall(aSendCallArgs({ correlationId: undefined })).then(
        () => {
          throw new Error('expected sendCall to throw');
        },
        (thrown: unknown) => thrown as OcppError,
      );

      expect(error).toBeInstanceOf(OcppError);
      // no correlationId given, so the error carries a generated uuid
      expect(error.messageId).toMatch(UUID_V4);
    });

    it('caches the callback URL under the CALLBACK_URL_ prefix', async () => {
      const { ocppSender, cache, subLogger } = anOcppSender({
        timeouts: { maxCachingSeconds: 99 },
      });

      await ocppSender.sendCall(aSendCallArgs({ callbackUrl: 'https://cb.example/hook' }));

      expect(cache.set).toHaveBeenCalledTimes(1);
      expect(cache.set).toHaveBeenCalledWith(
        'corr-1',
        'https://cb.example/hook',
        'CALLBACK_URL_cp001',
        99,
      );
      await vi.waitFor(() => {
        expect(subLogger.debug).toHaveBeenCalledWith(
          'Successfully set cache for correlationId: corr-1',
        );
      });
    });

    it('skips the callback cache when no callbackUrl is given', async () => {
      const { ocppSender, cache } = anOcppSender();
      await ocppSender.sendCall(aSendCallArgs());
      expect(cache.set).not.toHaveBeenCalled();
    });

    it('warns when the callback cache write returns false', async () => {
      const { ocppSender, cache, subLogger } = anOcppSender();
      cache.set.mockResolvedValue(false);

      await ocppSender.sendCall(aSendCallArgs({ callbackUrl: 'https://cb.example/hook' }));

      await vi.waitFor(() => {
        expect(subLogger.warn).toHaveBeenCalledTimes(1);
        expect(subLogger.warn).toHaveBeenCalledWith(
          'Failed to set cache for correlationId: corr-1',
        );
      });
    });

    it('logs and keeps sending when the callback cache write rejects', async () => {
      const { ocppSender, cache, subLogger } = anOcppSender();
      const boom = new Error('redis down');
      cache.set.mockRejectedValue(boom);

      const result = await ocppSender.sendCall(
        aSendCallArgs({ callbackUrl: 'https://cb.example/hook' }),
      );

      expect(result).toBe(A_CONFIRMATION);
      await vi.waitFor(() => {
        expect(subLogger.error).toHaveBeenCalledTimes(1);
      });
      // logged through serializeError, so the message survives JSON serialization
      expect(subLogger.error).toHaveBeenCalledWith(
        'Error setting cache: ',
        expect.objectContaining({ name: 'Error', message: 'redis down' }),
      );
    });

    it('looks up the connection under the Connections namespace', async () => {
      const { ocppSender, cache } = anOcppSender();

      await ocppSender.sendCall(aSendCallArgs());

      expect(cache.get).toHaveBeenCalledTimes(1);
      expect(cache.get).toHaveBeenCalledWith('7:cp001', CacheNamespace.Connections);
    });

    it('rejects when no connection exists for the identifier', async () => {
      const { ocppSender, cache, sender } = anOcppSender();
      cache.get.mockResolvedValue(null);

      const result = await ocppSender.sendCall(aSendCallArgs());

      expect(result).toEqual({
        success: false,
        payload: 'No connection found for identifier: 7:cp001',
      });
      expect(sender.sendRequest).not.toHaveBeenCalled();
    });

    it('rejects when the requested protocol differs from the negotiated subprotocol', async () => {
      const { ocppSender, cache, sender } = anOcppSender();
      cache.get.mockResolvedValue(aConnection(OCPPVersion.OCPP1_6));

      const result = await ocppSender.sendCall(aSendCallArgs({ protocol: OCPPVersion.OCPP2_0_1 }));

      expect(result).toEqual({
        success: false,
        payload:
          "Requested protocol: 'ocpp2.0.1', connection protocol: 'ocpp1.6' for identifier: '7:cp001'",
      });
      expect(sender.sendRequest).not.toHaveBeenCalled();
    });

    it('hands the built call to sender.sendRequest and returns its confirmation', async () => {
      const { ocppSender, validator, sender } = anOcppSender();
      const sanitized = { type: 'Immediate' } as OcppRequest;
      validator.sanitizeOCPPPayload.mockReturnValue(sanitized);

      const result = await ocppSender.sendCall(aSendCallArgs());

      expect(sender.sendRequest).toHaveBeenCalledTimes(1);
      const message = sender.sendRequest.mock.calls[0][0] as IMessage<OcppRequest>;
      expect(message).toMatchObject({
        action: OCPP_CallAction.Reset,
        state: MessageState.Request,
        protocol: OCPPVersion.OCPP2_0_1,
        eventGroup: EventGroup.EVDriver,
        origin: MessageOrigin.ChargingStationManagementSystem,
        context: { ocppConnectionName: 'cp001', correlationId: 'corr-1', tenantId: 7 },
      });
      expect(message.payload).toBe(sanitized);
      expect(new Date(message.context.timestamp).toISOString()).toBe(message.context.timestamp);
      expect(result).toBe(A_CONFIRMATION);
    });

    it('passes a caller-supplied origin through to the call', async () => {
      const { ocppSender, sender } = anOcppSender();

      await ocppSender.sendCall(aSendCallArgs({ origin: MessageOrigin.ChargingStation }));

      const message = sender.sendRequest.mock.calls[0][0] as IMessage<OcppRequest>;
      expect(message.origin).toBe(MessageOrigin.ChargingStation);
    });

    it('generates a v4 correlationId when none is given and reuses it for the callback cache', async () => {
      const { ocppSender, cache, sender } = anOcppSender();

      await ocppSender.sendCall(
        aSendCallArgs({ correlationId: undefined, callbackUrl: 'https://cb.example/hook' }),
      );

      const message = sender.sendRequest.mock.calls[0][0] as IMessage<OcppRequest>;
      expect(message.context.correlationId).toMatch(UUID_V4);
      expect(cache.set.mock.calls[0][0]).toBe(message.context.correlationId);
    });
  });

  describe('sendCallResult', () => {
    it('validates the sanitized response and sends the call result', async () => {
      const { ocppSender, validator, sender } = anOcppSender();
      const sanitized = { status: 'Accepted' } as OcppResponse;
      validator.sanitizeOCPPPayload.mockReturnValue(sanitized);

      const result = await ocppSender.sendCallResult(aSendCallResultArgs());

      expect(validator.validateOCPPResponse).toHaveBeenCalledTimes(1);
      expect(validator.validateOCPPResponse).toHaveBeenCalledWith(
        OCPP_CallAction.Reset,
        sanitized,
        OCPPVersion.OCPP2_0_1,
      );
      expect(sender.sendResponse).toHaveBeenCalledTimes(1);
      const message = sender.sendResponse.mock.calls[0][0] as IMessage<OcppResponse>;
      expect(message).toMatchObject({
        action: OCPP_CallAction.Reset,
        state: MessageState.Response,
        origin: MessageOrigin.ChargingStationManagementSystem,
        context: { ocppConnectionName: 'cp001', correlationId: 'corr-1', tenantId: 7 },
      });
      expect(message.payload).toBe(sanitized);
      expect(result).toBe(A_CONFIRMATION);
    });

    it('throws a FormatViolation OcppError for an invalid response', async () => {
      const { ocppSender, validator, sender } = anOcppSender();
      validator.validateOCPPResponse.mockReturnValue({ isValid: false, errors: [AN_AJV_ERROR] });

      // throws synchronously, before a promise is returned
      let error: OcppError | undefined;
      try {
        await ocppSender.sendCallResult(aSendCallResultArgs());
      } catch (thrown) {
        error = thrown as OcppError;
      }

      expect(error).toBeInstanceOf(OcppError);
      expect(error!.messageId).toBe('corr-1');
      expect(error!.errorCode).toBe(ErrorCode.FormatViolation);
      expect(sender.sendResponse).not.toHaveBeenCalled();
    });
  });

  describe('sendCallResultWithMessage', () => {
    it('overwrites the origin and responds on the incoming message', async () => {
      const { ocppSender, validator, sender } = anOcppSender();
      const message = aMessage();
      const sanitized = { status: 'Accepted' } as OcppResponse;
      validator.sanitizeOCPPPayload.mockReturnValue(sanitized);

      const result = await ocppSender.sendCallResultWithMessage(message, {
        status: 'Accepted',
      } as OcppResponse);

      expect(validator.validateOCPPResponse).toHaveBeenCalledWith(
        OCPP_CallAction.Reset,
        sanitized,
        OCPPVersion.OCPP2_0_1,
      );
      expect(message.origin).toBe(MessageOrigin.ChargingStationManagementSystem);
      expect(sender.sendResponse).toHaveBeenCalledTimes(1);
      expect(sender.sendResponse).toHaveBeenCalledWith(message, sanitized);
      expect(result).toBe(A_CONFIRMATION);
    });

    it('throws with the message correlationId when validation fails', async () => {
      const { ocppSender, validator, sender } = anOcppSender();
      validator.validateOCPPResponse.mockReturnValue({ isValid: false, errors: [AN_AJV_ERROR] });

      let error: OcppError | undefined;
      try {
        await ocppSender.sendCallResultWithMessage(aMessage(), {} as OcppResponse);
      } catch (thrown) {
        error = thrown as OcppError;
      }

      expect(error).toBeInstanceOf(OcppError);
      expect(error!.messageId).toBe('corr-1');
      expect(sender.sendResponse).not.toHaveBeenCalled();
    });
  });

  describe('sendCallError', () => {
    it('sends the call error without validating or sanitizing', async () => {
      const { ocppSender, validator, sender } = anOcppSender();
      const payload = new OcppError('corr-1', ErrorCode.InternalError, 'boom');

      const result = await ocppSender.sendCallError({
        correlationId: 'corr-1',
        ocppConnectionName: 'cp001',
        tenantId: 7,
        protocol: OCPPVersion.OCPP2_0_1,
        action: OCPP_CallAction.Reset,
        eventGroup: EventGroup.EVDriver,
        payload,
      });

      expect(validator.sanitizeOCPPPayload).not.toHaveBeenCalled();
      expect(validator.validateOCPPRequest).not.toHaveBeenCalled();
      expect(validator.validateOCPPResponse).not.toHaveBeenCalled();
      expect(sender.sendResponse).toHaveBeenCalledTimes(1);
      const message = sender.sendResponse.mock.calls[0][0] as IMessage<OcppError>;
      expect(message).toMatchObject({
        action: OCPP_CallAction.Reset,
        state: MessageState.Response,
        origin: MessageOrigin.ChargingStationManagementSystem,
        context: { ocppConnectionName: 'cp001', correlationId: 'corr-1', tenantId: 7 },
      });
      expect(message.payload).toBe(payload);
      expect(result).toBe(A_CONFIRMATION);
    });
  });

  describe('sendCallErrorWithMessage', () => {
    it('overwrites the origin and forwards the payload untouched', async () => {
      const { ocppSender, validator, sender } = anOcppSender();
      const message = aMessage();
      const payload = new OcppError('corr-1', ErrorCode.InternalError, 'boom');

      const result = await ocppSender.sendCallErrorWithMessage(message, payload);

      expect(message.origin).toBe(MessageOrigin.ChargingStationManagementSystem);
      expect(validator.sanitizeOCPPPayload).not.toHaveBeenCalled();
      expect(sender.sendResponse).toHaveBeenCalledTimes(1);
      expect(sender.sendResponse).toHaveBeenCalledWith(message, payload);
      expect(result).toBe(A_CONFIRMATION);
    });
  });
});
