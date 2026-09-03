// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import * as allHandlers from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/testContainer.js';

// Importing the handler barrel loads @citrineos/base, which installs the reflect-metadata polyfill.
const AS_HANDLER_CLASS_METADATA = 'AS_HANDLER_CLASS_METADATA';

interface HandlerClassDefinition {
  protocol: OCPPVersion;
  action: string;
  type: MessageState;
}

/**
 * Every handler declares the protocol/action pairs it serves on itself, and AbstractModule indexes
 * them by exactly that triple. A pair no exported handler declares cannot be routed at all.
 */
function handlersDeclaring(protocol: OCPPVersion, action: string, type: MessageState): string[] {
  return Object.entries(allHandlers)
    .filter(([, exported]) => typeof exported === 'function')
    .filter(([, handlerClass]) => {
      const definitions = (Reflect.getMetadata(AS_HANDLER_CLASS_METADATA, handlerClass) ??
        []) as HandlerClassDefinition[];
      return definitions.some(
        (d) => d.protocol === protocol && d.action === action && d.type === type,
      );
    })
    .map(([name]) => name);
}

function makeMessage(
  payload: OCPP1_6.FirmwareStatusNotificationRequest,
): IMessage<OCPP1_6.FirmwareStatusNotificationRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Configuration,
    action: OCPP_CallAction.FirmwareStatusNotification,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<OCPP1_6.FirmwareStatusNotificationRequest>;
}

describe('OCPP 1.6 FirmwareStatusNotification', () => {
  it('has a handler declared for the 1.6 protocol', () => {
    // UpdateFirmware is exposed as a 1.6 message endpoint and FirmwareStatusNotification is listed
    // in the Configuration module's 1.6 requests, but no 1.6 handler declared it. AbstractModule
    // answers an unrouted request with a CallError (NotSupported), so a charging station reporting
    // firmware progress got a protocol error instead of the acknowledgement 1.6 requires.
    const declaring = handlersDeclaring(
      OCPPVersion.OCPP1_6,
      OCPP_CallAction.FirmwareStatusNotification,
      MessageState.Request,
    );

    expect(declaring).toHaveLength(1);
  });

  it('does not route the 1.6 notification to the OCPP 2.x handler', () => {
    const declaring = handlersDeclaring(
      OCPPVersion.OCPP1_6,
      OCPP_CallAction.FirmwareStatusNotification,
      MessageState.Request,
    );

    expect(declaring).not.toContain('FirmwareStatusNotificationRequestOcpp2Handler');
  });

  it('acknowledges the notification with an empty payload', async () => {
    const { logger } = createTestContainer();
    const ocppSender = makeMockOcppSender();
    const handler = new allHandlers.FirmwareStatusNotificationRequestOcpp16Handler({
      logger,
      ocppSender,
    } as never);

    await handler.handle(
      makeMessage({ status: OCPP1_6.FirmwareStatusNotificationRequestStatus.Installed }),
    );

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({});
  });
});
