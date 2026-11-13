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
import { createTestContainer, makeMockOcppSender, mockDeps } from '@test/test-container.js';

const STATION_DB_ID = vi.hoisted(() => 4242);
vi.mock('@citrineos/dal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@citrineos/dal')>()),
  resolveStationId: vi.fn().mockResolvedValue(STATION_DB_ID),
  stationIdFilter: vi.fn().mockResolvedValue(STATION_DB_ID),
}));

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
  let ocppMessageRepository: { hasMessageWithPayloadRequestId: ReturnType<typeof vi.fn> };
  let ocppSender: ReturnType<typeof makeMockOcppSender>;

  beforeEach(() => {
    vi.clearAllMocks();

    ocppMessageRepository = { hasMessageWithPayloadRequestId: vi.fn() };
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
    ocppMessageRepository.hasMessageWithPayloadRequestId.mockResolvedValue(true);

    await handler.handle(aNotifyCustomerInformationMessage(aNotifyCustomerInformationRequest()));

    expect(ocppMessageRepository.hasMessageWithPayloadRequestId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION_ID,
      OCPP_CallAction.CustomerInformation,
      REQUEST_ID,
    );
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalled();
    expect(ocppSender.sendCallErrorWithMessage).not.toHaveBeenCalled();
  });

  it('rejects with a CallError when no CustomerInformationRequest matches the requestId', async () => {
    ocppMessageRepository.hasMessageWithPayloadRequestId.mockResolvedValue(false);

    await handler.handle(aNotifyCustomerInformationMessage(aNotifyCustomerInformationRequest()));

    expect(ocppSender.sendCallErrorWithMessage).toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
  });
});
