// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  type OcppRequest,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPP2_0_1,
  type OCPP2_request_types,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Message } from '@citrineos/base';
import { NotifyDisplayMessagesRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/test-container.js';

const STATION_ID = 'station-001';
const REQUEST_ID = 42;

function aNotifyDisplayMessagesMessage<T extends OcppRequest>(payload: T): Message<T> {
  return new Message(
    MessageOrigin.ChargingStation,
    EventGroup.Configuration,
    OCPP_CallAction.NotifyDisplayMessages,
    MessageState.Request,
    {
      correlationId: 'corr-001',
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    'ocpp2.0.1',
  );
}

function aNotifyDisplayMessagesRequest(): OCPP2_request_types.NotifyDisplayMessagesRequest {
  return {
    requestId: REQUEST_ID,
    // messageInfo is a non-empty tuple in the schema, and the handler validates
    // each entry's content, so this carries one well-formed ASCII message.
    messageInfo: [
      {
        id: 1,
        priority: OCPP2_0_1.MessagePriorityEnumType.NormalCycle,
        message: { format: OCPP2_0_1.MessageFormatEnumType.ASCII, content: 'Charging' },
      },
    ],
  };
}

describe('NotifyDisplayMessagesRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let handler: NotifyDisplayMessagesRequestOcpp2Handler;
  let ocppMessageRepository: { readAllByQuery: ReturnType<typeof vi.fn> };
  let deviceModelRepository: { findOrCreateEvseAndComponent: ReturnType<typeof vi.fn> };
  let messageInfoRepository: {
    createOrUpdateByMessageInfoTypeAndStationId: ReturnType<typeof vi.fn>;
  };
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  beforeEach(() => {
    vi.clearAllMocks();

    ocppMessageRepository = { readAllByQuery: vi.fn() };
    deviceModelRepository = { findOrCreateEvseAndComponent: vi.fn() };
    messageInfoRepository = { createOrUpdateByMessageInfoTypeAndStationId: vi.fn() };
    ocppSender = makeMockOcppSender();

    handler = new NotifyDisplayMessagesRequestOcpp2Handler(
      mockDeps<typeof NotifyDisplayMessagesRequestOcpp2Handler>({
        logger,
        ocppSender,
        ocppMessageRepository,
        deviceModelRepository,
        messageInfoRepository,
      }),
    );
  });

  it('correlates the requestId against the stored payload and acknowledges', async () => {
    ocppMessageRepository.readAllByQuery.mockResolvedValue([{ id: 1 }]);

    await handler.handle(aNotifyDisplayMessagesMessage(aNotifyDisplayMessagesRequest()));

    expect(ocppMessageRepository.readAllByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      where: {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: STATION_ID,
        action: OCPP_CallAction.GetDisplayMessages,
        payload: { requestId: REQUEST_ID },
      },
      limit: 1,
    });
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalled();
    expect(ocppSender.sendCallErrorWithMessage).not.toHaveBeenCalled();
  });

  it('rejects with a CallError when no GetDisplayMessagesRequest matches the requestId', async () => {
    ocppMessageRepository.readAllByQuery.mockResolvedValue([]);

    await handler.handle(aNotifyDisplayMessagesMessage(aNotifyDisplayMessagesRequest()));

    expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
  });
});
