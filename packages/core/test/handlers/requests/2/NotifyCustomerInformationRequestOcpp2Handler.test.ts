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
  type OCPP2_request_types,
} from '@citrineos/types';
import { DEFAULT_TENANT_ID, Message } from '@citrineos/base';
import { NotifyCustomerInformationRequestOcpp2Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/testContainer.js';

const STATION_ID = 'station-001';
const REQUEST_ID = 9940;

function aNotifyCustomerInformationMessage<T extends OcppRequest>(payload: T): Message<T> {
  return new Message(
    MessageOrigin.ChargingStation,
    EventGroup.Reporting,
    OCPP_CallAction.NotifyCustomerInformation,
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

function aNotifyCustomerInformationRequest(): OCPP2_request_types.NotifyCustomerInformationRequest {
  return {
    data: 'customer data',
    seqNo: 0,
    generatedAt: new Date().toISOString(),
    requestId: REQUEST_ID,
  };
}

describe('NotifyCustomerInformationRequestOcpp2Handler', () => {
  const { logger } = createTestContainer();
  let handler: NotifyCustomerInformationRequestOcpp2Handler;
  let ocppMessageRepository: { readAllByQuery: ReturnType<typeof vi.fn> };
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  beforeEach(() => {
    vi.clearAllMocks();

    ocppMessageRepository = { readAllByQuery: vi.fn() };
    ocppSender = makeMockOcppSender();

    handler = new NotifyCustomerInformationRequestOcpp2Handler(
      mockDeps<typeof NotifyCustomerInformationRequestOcpp2Handler>({
        logger,
        ocppSender,
        ocppMessageRepository,
      }),
    );
  });

  it('correlates the requestId against the stored payload and acknowledges', async () => {
    ocppMessageRepository.readAllByQuery.mockResolvedValue([{ id: 1 }]);

    await handler.handle(aNotifyCustomerInformationMessage(aNotifyCustomerInformationRequest()));

    expect(ocppMessageRepository.readAllByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      where: {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: STATION_ID,
        action: OCPP_CallAction.CustomerInformation,
        payload: { requestId: REQUEST_ID },
      },
      limit: 1,
    });
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalled();
    expect(ocppSender.sendCallErrorWithMessage).not.toHaveBeenCalled();
  });

  it('rejects with a CallError when no CustomerInformationRequest matches the requestId', async () => {
    ocppMessageRepository.readAllByQuery.mockResolvedValue([]);

    await handler.handle(aNotifyCustomerInformationMessage(aNotifyCustomerInformationRequest()));

    expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
  });
});
