// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP2_request_types,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import * as allHandlers from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

// Importing the handler barrel loads @citrineos/base, which installs the reflect-metadata polyfill.
const AS_HANDLER_CLASS_METADATA = 'AS_HANDLER_CLASS_METADATA';

interface HandlerClassDefinition {
  protocol: OCPPVersion;
  action: string;
  type: MessageState;
}

/**
 * Every handler declares the protocol/action pairs it serves on itself, and AbstractModule indexes
 * them by exactly that triple. A pair no exported handler declares is answered NotSupported.
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
  payload: OCPP2_request_types.PublishFirmwareStatusNotificationRequest,
  protocol: OCPPVersion = OCPPVersion.OCPP2_0_1,
): IMessage<OCPP2_request_types.PublishFirmwareStatusNotificationRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'lc-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Configuration,
    action: OCPP_CallAction.PublishFirmwareStatusNotification,
    state: MessageState.Request,
    protocol,
  } as unknown as IMessage<OCPP2_request_types.PublishFirmwareStatusNotificationRequest>;
}

function makeHandler() {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();
  const handler = new allHandlers.PublishFirmwareStatusNotificationRequestOcpp2Handler({
    logger,
    ocppSender,
  } as never);
  return { handler, ocppSender };
}

describe('PublishFirmwareStatusNotification', () => {
  it.each([OCPPVersion.OCPP2_0_1, OCPPVersion.OCPP2_1])(
    'has a handler declared for %s',
    (protocol) => {
      // The CSMS exposes PublishFirmware as an operator endpoint and handles its response, so a
      // Local Controller that took the request will report on it (L03.FR.01). Without a handler
      // AbstractModule answered every report with a CallError NotSupported.
      const declaring = handlersDeclaring(
        protocol,
        OCPP_CallAction.PublishFirmwareStatusNotification,
        MessageState.Request,
      );

      expect(declaring).toEqual(['PublishFirmwareStatusNotificationRequestOcpp2Handler']);
    },
  );

  it.each([
    OCPP2_0_1.PublishFirmwareStatusEnumType.Downloading,
    OCPP2_0_1.PublishFirmwareStatusEnumType.DownloadFailed,
    OCPP2_0_1.PublishFirmwareStatusEnumType.InvalidChecksum,
    OCPP2_0_1.PublishFirmwareStatusEnumType.PublishFailed,
  ])('acknowledges a %s report with an empty payload', async (status) => {
    const { handler, ocppSender } = makeHandler();

    await handler.handle(makeMessage({ status, requestId: 7 }));

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({});
  });

  it('acknowledges a Published report that carries the download locations', async () => {
    const { handler, ocppSender } = makeHandler();

    await handler.handle(
      makeMessage(
        {
          status: OCPP2_0_1.PublishFirmwareStatusEnumType.Published,
          location: ['http://lc.local/fw.bin', 'ftp://lc.local/fw.bin'],
          requestId: 7,
        },
        OCPPVersion.OCPP2_1,
      ),
    );

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({});
  });

  it('acknowledges a report without a requestId', async () => {
    // requestId is optional in the schema: a report outside any PublishFirmwareRequest has none to
    // echo and is still owed the acknowledgement.
    const { handler, ocppSender } = makeHandler();

    await handler.handle(makeMessage({ status: OCPP2_0_1.PublishFirmwareStatusEnumType.Idle }));

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  });
});
