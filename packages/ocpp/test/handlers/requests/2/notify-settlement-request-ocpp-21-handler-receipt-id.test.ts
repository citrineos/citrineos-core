// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID, OCPPValidator } from '@citrineos/base';
import type { IVariableAttributeRepository, ITransactionEventRepository } from '@citrineos/dal';
import {
  type OcppRequest,
  type SystemConfig,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import { NotifySettlementRequestOcpp21Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

const STATION_ID = 'CS001';
const RECEIPT_BASE_URL = 'https://receipts.example.com';
const TRANSACTION_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION_ID,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Transactions,
    action: OCPP_CallAction.NotifySettlement,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP2_1,
  } as unknown as IMessage<T>;
}

function settled(overrides?: Partial<OCPP2_1.NotifySettlementRequest>) {
  return {
    transactionId: TRANSACTION_ID,
    pspRef: 'PSP-000123',
    status: OCPP2_1.PaymentStatusEnumType.Settled,
    settlementAmount: 12.34,
    settlementTime: '2026-09-14T10:00:00Z',
    ...overrides,
  } as OCPP2_1.NotifySettlementRequest;
}

describe('NotifySettlementRequestOcpp21Handler', () => {
  let ocppSender: ReturnType<typeof makeMockOcppSender>;
  let handler: NotifySettlementRequestOcpp21Handler;

  beforeEach(() => {
    const { logger } = createTestContainer();
    ocppSender = makeMockOcppSender();
    handler = new NotifySettlementRequestOcpp21Handler({
      logger,
      ocppSender,
      config: { transactions: { receiptBaseUrl: RECEIPT_BASE_URL } } as unknown as SystemConfig,
      variableAttributeRepository: {
        readAllByQuerystring: vi.fn().mockResolvedValue([{ value: 'true' }]),
      } as unknown as IVariableAttributeRepository,
      transactionEventRepository: {
        readTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue(undefined),
        updateTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue(undefined),
      } as unknown as ITransactionEventRepository,
    });
  });

  async function settle(
    request: OCPP2_1.NotifySettlementRequest,
  ): Promise<OCPP2_1.NotifySettlementResponse> {
    ocppSender.sendCallResultWithMessage.mockClear();
    await handler.handle(makeMessage(request));
    return ocppSender.sendCallResultWithMessage.mock
      .calls[0][1] as OCPP2_1.NotifySettlementResponse;
  }

  it('produces a response the schema accepts for a UUID transactionId', async () => {
    const response = await settle(settled());

    const { isValid, errors } = new OCPPValidator().validateOCPPResponse(
      OCPP_CallAction.NotifySettlement,
      response,
      OCPPVersion.OCPP2_1,
    );
    expect(errors ?? []).toEqual([]);
    expect(isValid).toBe(true);
  });

  it('keeps receiptId within 50 characters', async () => {
    const response = await settle(settled({ pspRef: 'P'.repeat(255) }));

    expect(response.receiptId).toMatch(/^.{1,50}$/);
  });

  it('points receiptUrl at the station, transaction and pspRef', async () => {
    const response = await settle(settled());

    expect(response.receiptUrl).toBe(
      `${RECEIPT_BASE_URL}/${encodeURIComponent(`${STATION_ID}-${TRANSACTION_ID}-PSP-000123`)}`,
    );
  });

  it('gives the same receiptId when the station repeats the settlement', async () => {
    const first = await settle(settled());
    const second = await settle(settled());

    expect(second.receiptId).toBe(first.receiptId);
  });

  it('gives another receiptId for another payment', async () => {
    const first = await settle(settled());
    const second = await settle(settled({ pspRef: 'PSP-000124' }));

    expect(second.receiptId).not.toBe(first.receiptId);
  });
});
