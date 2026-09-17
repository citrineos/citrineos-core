// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import {
  ChangeAvailabilityResponseOcpp2Handler,
  ClearCacheResponseOcpp2Handler,
  DataTransferResponseOcpp2Handler,
  NotifyWebPaymentStartedResponseOcpp21Handler,
  ResetResponseOcpp2Handler,
  TriggerMessageResponseOcpp2Handler,
  UnlockConnectorResponseOcpp2Handler,
} from '@handlers/index.js';
import { createTestContainer, getTestInstance, makeMockOcppSender } from '@test/test-container.js';
import { asValue } from 'awilix';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const CORRELATION = 'corr-001';

const { container, logger } = createTestContainer();

// A handler that resolved an OCPP sender from the container would receive this mock.
// The handlers under test are terminal acknowledgments and must never touch it.
const ocppSender = makeMockOcppSender();
container.register({ ocppSender: asValue(ocppSender) });

function makeMessage<T extends OcppResponse>(
  action: OCPP_CallAction,
  payload: T,
  overrides: { protocol?: OCPPVersion; station?: string; correlationId?: string } = {},
): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: overrides.station ?? STATION,
      correlationId: overrides.correlationId ?? CORRELATION,
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.All,
    action,
    state: MessageState.Response,
    protocol: overrides.protocol ?? OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

function expectNoOutboundTraffic() {
  expect(ocppSender.sendCall).not.toHaveBeenCalled();
  expect(ocppSender.sendCallResult).not.toHaveBeenCalled();
  expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
  expect(ocppSender.sendCallError).not.toHaveBeenCalled();
  expect(ocppSender.sendCallErrorWithMessage).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ResetResponseOcpp2Handler', () => {
  it('resolves an accepted reset without sending anything back', async () => {
    const handler = getTestInstance(container, ResetResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.Reset, {
      status: OCPP2_0_1.ResetStatusEnumType.Accepted,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for ResetResponse received message:',
      message,
      undefined,
    );
  });

  it('does not escalate a rejected reset: no error log, no outbound call', async () => {
    const handler = getTestInstance(container, ResetResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.Reset, {
      status: OCPP2_0_1.ResetStatusEnumType.Rejected,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('ClearCacheResponseOcpp2Handler', () => {
  it('resolves an accepted clear-cache without sending anything back', async () => {
    const handler = getTestInstance(container, ClearCacheResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.ClearCache, {
      status: OCPP2_0_1.ClearCacheStatusEnumType.Accepted,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.info).toHaveBeenCalledWith(
      'Handler for ClearCacheResponse received message:',
      message,
      undefined,
    );
  });

  it('does not escalate a rejected clear-cache: no error log, no outbound call', async () => {
    const handler = getTestInstance(container, ClearCacheResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.ClearCache, {
      status: OCPP2_0_1.ClearCacheStatusEnumType.Rejected,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('ChangeAvailabilityResponseOcpp2Handler', () => {
  it('resolves an accepted availability change and forwards props to the log', async () => {
    const handler = getTestInstance(container, ChangeAvailabilityResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.ChangeAvailability, {
      status: OCPP2_0_1.ChangeAvailabilityStatusEnumType.Accepted,
    });

    await expect(handler.handle(message, 'availability-props')).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for ChangeAvailabilityResponse received message:',
      message,
      'availability-props',
    );
  });

  it('takes no follow-up action on a Scheduled status', async () => {
    const handler = getTestInstance(container, ChangeAvailabilityResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.ChangeAvailability, {
      status: OCPP2_0_1.ChangeAvailabilityStatusEnumType.Scheduled,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('TriggerMessageResponseOcpp2Handler', () => {
  it('resolves an accepted trigger without sending anything back', async () => {
    const handler = getTestInstance(container, TriggerMessageResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.TriggerMessage, {
      status: OCPP2_0_1.TriggerMessageStatusEnumType.Accepted,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for TriggerMessageResponse received message:',
      message,
      undefined,
    );
  });

  it('does not escalate a NotImplemented trigger: no error log, no outbound call', async () => {
    const handler = getTestInstance(container, TriggerMessageResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.TriggerMessage, {
      status: OCPP2_0_1.TriggerMessageStatusEnumType.NotImplemented,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('UnlockConnectorResponseOcpp2Handler', () => {
  it('resolves an Unlocked status without sending anything back', async () => {
    const handler = getTestInstance(container, UnlockConnectorResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.UnlockConnector, {
      status: OCPP2_0_1.UnlockStatusEnumType.Unlocked,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.info).toHaveBeenCalledWith(
      'Handler for UnlockConnectorResponse received message:',
      message,
      undefined,
    );
  });

  it('does not retry or escalate an UnlockFailed status', async () => {
    const handler = getTestInstance(container, UnlockConnectorResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.UnlockConnector, {
      status: OCPP2_0_1.UnlockStatusEnumType.UnlockFailed,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('DataTransferResponseOcpp2Handler', () => {
  it('resolves an accepted transfer and does not act on the returned data', async () => {
    const handler = getTestInstance(container, DataTransferResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.DataTransfer, {
      status: OCPP2_0_1.DataTransferStatusEnumType.Accepted,
      data: { vendorReply: 'ok' },
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.debug).toHaveBeenCalledWith(
      'Handler for DataTransferResponse received message:',
      message,
      undefined,
    );
  });

  it('does not escalate an UnknownMessageId status: no error log, no outbound call', async () => {
    const handler = getTestInstance(container, DataTransferResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.DataTransfer, {
      status: OCPP2_0_1.DataTransferStatusEnumType.UnknownMessageId,
    });

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

describe('NotifyWebPaymentStartedResponseOcpp21Handler', () => {
  it('logs the received message and the station acknowledgment, nothing outbound', async () => {
    const handler = getTestInstance(container, NotifyWebPaymentStartedResponseOcpp21Handler, {});
    const message = makeMessage(
      OCPP_CallAction.NotifyWebPaymentStarted,
      {},
      {
        protocol: OCPPVersion.OCPP2_1,
      },
    );

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expectNoOutboundTraffic();
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenNthCalledWith(
      1,
      'Handler for NotifyWebPaymentStartedResponse received message:',
      message,
      undefined,
    );
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      'NotifyWebPaymentStarted acknowledged by station station-001 (correlationId=corr-001)',
    );
  });

  it('acknowledgment line tracks the sending station and correlation id', async () => {
    const handler = getTestInstance(container, NotifyWebPaymentStartedResponseOcpp21Handler, {});
    const message = makeMessage(
      OCPP_CallAction.NotifyWebPaymentStarted,
      {},
      {
        protocol: OCPPVersion.OCPP2_1,
        station: 'station-002',
        correlationId: 'corr-777',
      },
    );

    await handler.handle(message);

    expect(logger.info).toHaveBeenCalledWith(
      'NotifyWebPaymentStarted acknowledged by station station-002 (correlationId=corr-777)',
    );
    expectNoOutboundTraffic();
  });
});
