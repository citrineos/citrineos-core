// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPP2_0_1,
  OCPPVersion,
} from '@citrineos/types';
import { GetTransactionStatusResponseOcpp2Handler } from '@handlers/index.js';
import type { TransactionService } from '@modules/transactions/transaction-service.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const CORRELATION_ID = 'corr-001';

function makeMessage(
  payload: OCPP2_0_1.GetTransactionStatusResponse,
): IMessage<OCPP2_0_1.GetTransactionStatusResponse> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: CORRELATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Transactions,
    action: OCPP_CallAction.GetTransactionStatus,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<OCPP2_0_1.GetTransactionStatusResponse>;
}

describe('GetTransactionStatusResponseOcpp2Handler', () => {
  const { container } = createTestContainer();
  let transactionService: Mocked<TransactionService>;
  let handler: GetTransactionStatusResponseOcpp2Handler;

  beforeEach(() => {
    transactionService = {
      updateTransactionStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<TransactionService>;
    handler = getTestInstance(container, GetTransactionStatusResponseOcpp2Handler, {
      transactionService,
    });
  });

  it('leaves the transaction active while the station still has its messages queued', async () => {
    await handler.handle(makeMessage({ ongoingIndicator: false, messagesInQueue: true }));

    expect(transactionService.updateTransactionStatus).not.toHaveBeenCalled();
  });

  it('marks the transaction inactive once it has ended and nothing is left to deliver', async () => {
    await handler.handle(makeMessage({ ongoingIndicator: false, messagesInQueue: false }));

    expect(transactionService.updateTransactionStatus).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      CORRELATION_ID,
      false,
    );
  });

  it('marks the transaction active when the station reports it ongoing', async () => {
    await handler.handle(makeMessage({ ongoingIndicator: true, messagesInQueue: true }));

    expect(transactionService.updateTransactionStatus).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      CORRELATION_ID,
      true,
    );
  });
});
