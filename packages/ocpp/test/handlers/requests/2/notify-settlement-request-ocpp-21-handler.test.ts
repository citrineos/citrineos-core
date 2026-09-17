// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID, OcppError } from '@citrineos/base';
import {
  type OcppRequest,
  type SystemConfig,
  AttributeEnum,
  ErrorCode,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IDeviceModelRepository, ITransactionEventRepository } from '@citrineos/dal';
import { NotifySettlementRequestOcpp21Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

function makeConfig(receiptBaseUrl?: string): SystemConfig {
  return {
    transactions: { receiptBaseUrl },
  } as unknown as SystemConfig;
}

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
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

function makeHandler(
  overrides: {
    config?: SystemConfig;
    receiptByCSMSAttributes?: { value: string | null }[];
    existingTransaction?: { customData?: Record<string, unknown> } | null;
    readTransactionError?: Error;
    deviceModelError?: Error;
  } = {},
) {
  const { logger } = createTestContainer();
  const ocppSender = makeMockOcppSender();

  const transactionEventRepository = {
    readTransactionByStationIdAndTransactionId: overrides.readTransactionError
      ? vi.fn().mockRejectedValue(overrides.readTransactionError)
      : vi.fn().mockResolvedValue(overrides.existingTransaction ?? null),
    updateTransactionByStationIdAndTransactionId: vi.fn().mockResolvedValue({}),
  };

  const deviceModelRepository = {
    readAllByQuerystring: overrides.deviceModelError
      ? vi.fn().mockRejectedValue(overrides.deviceModelError)
      : vi.fn().mockResolvedValue(overrides.receiptByCSMSAttributes ?? []),
  };

  const handler = new NotifySettlementRequestOcpp21Handler({
    logger,
    ocppSender,
    config: overrides.config ?? makeConfig('https://receipts.example.com'),
    deviceModelRepository: deviceModelRepository as unknown as IDeviceModelRepository,
    transactionEventRepository:
      transactionEventRepository as unknown as ITransactionEventRepository,
  });

  return { handler, ocppSender, logger, transactionEventRepository, deviceModelRepository };
}

function sentResponse(
  ocppSender: ReturnType<typeof makeMockOcppSender>,
): OCPP2_1.NotifySettlementResponse {
  expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  return ocppSender.sendCallResultWithMessage.mock.calls[0][1] as OCPP2_1.NotifySettlementResponse;
}

function sentDisplayCall(ocppSender: ReturnType<typeof makeMockOcppSender>) {
  expect(ocppSender.sendCall).toHaveBeenCalledOnce();
  return ocppSender.sendCall.mock.calls[0][0] as {
    ocppConnectionName: string;
    tenantId: number;
    protocol: string;
    action: string;
    eventGroup: string;
    payload: OCPP2_1.SetDisplayMessageRequest;
  };
}

const settledRequest: OCPP2_1.NotifySettlementRequest = {
  transactionId: 'txn-001',
  pspRef: 'psp-123',
  status: OCPP2_1.PaymentStatusEnumType.Settled,
  settlementAmount: 42.5,
  settlementTime: '2026-01-15T10:00:00.000Z',
};

describe('NotifySettlementRequestOcpp21Handler', () => {
  describe('receipt generation (C21.FR.03)', () => {
    it('returns receiptUrl and receiptId when Settled and ReceiptByCSMS is true', async () => {
      const { handler, ocppSender, deviceModelRepository } = makeHandler({
        receiptByCSMSAttributes: [{ value: 'true' }],
      });
      const message = makeMessage(settledRequest);

      await handler.handle(message);

      const response = sentResponse(ocppSender);
      expect(response).toEqual({
        receiptId: 'station-001-txn-001-psp-123',
        receiptUrl: 'https://receipts.example.com/station-001-txn-001-psp-123',
      });
      expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);

      expect(deviceModelRepository.readAllByQuerystring).toHaveBeenCalledOnce();
      expect(deviceModelRepository.readAllByQuerystring).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: 'station-001',
        component_name: 'PaymentCtrlr',
        variable_name: 'ReceiptByCSMS',
        type: AttributeEnum.Actual,
      });

      // The generated URL is then pushed to the station display.
      const displayCall = sentDisplayCall(ocppSender);
      expect(displayCall.payload.message.message.content).toBe(
        'https://receipts.example.com/station-001-txn-001-psp-123',
      );
    });

    it('builds the receiptId without a transaction segment when the request has no transactionId', async () => {
      const { handler, ocppSender, transactionEventRepository } = makeHandler({
        receiptByCSMSAttributes: [{ value: 'true' }],
      });

      await handler.handle(makeMessage({ ...settledRequest, transactionId: undefined }));

      const response = sentResponse(ocppSender);
      expect(response.receiptId).toBe('station-001-psp-123');
      expect(response.receiptUrl).toBe('https://receipts.example.com/station-001-psp-123');
      expect(
        transactionEventRepository.readTransactionByStationIdAndTransactionId,
      ).not.toHaveBeenCalled();
      expect(
        transactionEventRepository.updateTransactionByStationIdAndTransactionId,
      ).not.toHaveBeenCalled();
    });

    it('percent-encodes the receiptId in the receiptUrl', async () => {
      const { handler, ocppSender } = makeHandler({
        receiptByCSMSAttributes: [{ value: 'true' }],
      });

      await handler.handle(makeMessage({ ...settledRequest, pspRef: 'psp/123' }));

      const response = sentResponse(ocppSender);
      expect(response.receiptId).toBe('station-001-txn-001-psp/123');
      expect(response.receiptUrl).toBe(
        'https://receipts.example.com/station-001-txn-001-psp%2F123',
      );
    });

    it('returns an empty response when ReceiptByCSMS is false', async () => {
      const { handler, ocppSender } = makeHandler({
        receiptByCSMSAttributes: [{ value: 'false' }],
      });

      await handler.handle(makeMessage(settledRequest));

      expect(sentResponse(ocppSender)).toEqual({});
      expect(ocppSender.sendCall).not.toHaveBeenCalled();
    });

    it('returns an empty response and warns when ReceiptByCSMS is true but no receiptBaseUrl is configured', async () => {
      const { handler, ocppSender, logger } = makeHandler({
        config: makeConfig(undefined),
        receiptByCSMSAttributes: [{ value: 'true' }],
      });

      await handler.handle(makeMessage(settledRequest));

      expect(sentResponse(ocppSender)).toEqual({});
      expect(ocppSender.sendCall).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.warn.mock.calls[0][0]).toContain('no receiptBaseUrl configured');
    });

    it('still sends an empty response when the device model read fails', async () => {
      const { handler, ocppSender, logger } = makeHandler({
        deviceModelError: new Error('device model down'),
      });

      await handler.handle(makeMessage({ ...settledRequest, transactionId: undefined }));

      expect(sentResponse(ocppSender)).toEqual({});
      expect(logger.error).toHaveBeenCalledOnce();
      expect(logger.error.mock.calls[0][0]).toBe(
        'Failed to read PaymentCtrlr.ReceiptByCSMS from device model',
      );
    });
  });

  describe('settlement storage', () => {
    it('merges the settlement into existing transaction customData', async () => {
      const { handler, transactionEventRepository } = makeHandler({
        existingTransaction: { customData: { transactionLimit: { maxCost: 20 } } },
      });

      await handler.handle(
        makeMessage({
          ...settledRequest,
          statusInfo: 'ok',
          receiptId: 'r-9',
          receiptUrl: 'https://cs.example/r/9',
          vatNumber: 'VAT123',
        }),
      );

      expect(
        transactionEventRepository.readTransactionByStationIdAndTransactionId,
      ).toHaveBeenCalledOnce();
      expect(
        transactionEventRepository.readTransactionByStationIdAndTransactionId,
      ).toHaveBeenCalledWith(DEFAULT_TENANT_ID, 'station-001', 'txn-001');

      expect(
        transactionEventRepository.updateTransactionByStationIdAndTransactionId,
      ).toHaveBeenCalledOnce();
      const [tenantArg, partial, transactionArg, stationArg] =
        transactionEventRepository.updateTransactionByStationIdAndTransactionId.mock.calls[0];
      expect(tenantArg).toBe(DEFAULT_TENANT_ID);
      expect(transactionArg).toBe('txn-001');
      expect(stationArg).toBe('station-001');
      expect(partial.customData).toEqual({
        transactionLimit: { maxCost: 20 },
        settlement: {
          pspRef: 'psp-123',
          status: 'Settled',
          settlementAmount: 42.5,
          settlementTime: '2026-01-15T10:00:00.000Z',
          statusInfo: 'ok',
          receiptId: 'r-9',
          receiptUrl: 'https://cs.example/r/9',
          vatNumber: 'VAT123',
        },
      });
    });

    it('stores a Rejected settlement without receipt fields and skips receipt generation (C22.FR.01)', async () => {
      const { handler, ocppSender, logger, transactionEventRepository, deviceModelRepository } =
        makeHandler({ receiptByCSMSAttributes: [{ value: 'true' }] });

      await handler.handle(
        makeMessage({
          ...settledRequest,
          status: OCPP2_1.PaymentStatusEnumType.Rejected,
          receiptId: 'r-9',
          receiptUrl: 'https://cs.example/r/9',
          vatNumber: 'VAT123',
        }),
      );

      const [, partial] =
        transactionEventRepository.updateTransactionByStationIdAndTransactionId.mock.calls[0];
      const settlement = partial.customData.settlement as Record<string, unknown>;
      expect(settlement.status).toBe('Rejected');
      expect(settlement).not.toHaveProperty('receiptId');
      expect(settlement).not.toHaveProperty('receiptUrl');
      expect(settlement).not.toHaveProperty('vatNumber');

      expect(sentResponse(ocppSender)).toEqual({});
      expect(deviceModelRepository.readAllByQuerystring).not.toHaveBeenCalled();
      expect(ocppSender.sendCall).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledOnce();
    });

    it('logs a capture warning for a Failed settlement (C22.FR.02)', async () => {
      const { handler, ocppSender, logger } = makeHandler();

      await handler.handle(
        makeMessage({
          ...settledRequest,
          transactionId: undefined,
          status: OCPP2_1.PaymentStatusEnumType.Failed,
        }),
      );

      expect(sentResponse(ocppSender)).toEqual({});
      expect(logger.warn).toHaveBeenCalledOnce();
      expect(logger.warn.mock.calls[0][0]).toContain('Settlement Failed for station station-001');
      expect(logger.warn.mock.calls[0][0]).toContain('pspRef=psp-123');
    });

    it('still sends the receipt response when reading the transaction fails', async () => {
      const { handler, ocppSender, logger, transactionEventRepository } = makeHandler({
        receiptByCSMSAttributes: [{ value: 'true' }],
        readTransactionError: new Error('db down'),
      });

      await handler.handle(makeMessage(settledRequest));

      expect(
        transactionEventRepository.updateTransactionByStationIdAndTransactionId,
      ).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledOnce();
      expect(logger.error.mock.calls[0][0]).toBe(
        'Failed to store settlement data for transaction txn-001',
      );
      expect(sentResponse(ocppSender).receiptId).toBe('station-001-txn-001-psp-123');
    });
  });

  describe('display message', () => {
    it('sends SetDisplayMessage with the station receiptUrl when the CSMS generates none (C21.FR.04)', async () => {
      const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1234);
      const { handler, ocppSender } = makeHandler({ receiptByCSMSAttributes: [] });

      await handler.handle(
        makeMessage({ ...settledRequest, receiptUrl: 'https://cs.example/r/1' }),
      );

      expect(sentResponse(ocppSender)).toEqual({});
      const displayCall = sentDisplayCall(ocppSender);
      expect(displayCall.ocppConnectionName).toBe('station-001');
      expect(displayCall.tenantId).toBe(DEFAULT_TENANT_ID);
      expect(displayCall.protocol).toBe(OCPPVersion.OCPP2_1);
      expect(displayCall.action).toBe(OCPP_CallAction.SetDisplayMessage);
      expect(displayCall.eventGroup).toBe(EventGroup.Transactions);
      expect(displayCall.payload.message).toEqual({
        id: 1234,
        priority: OCPP2_1.MessagePriorityEnumType.AlwaysFront,
        transactionId: 'txn-001',
        message: {
          format: OCPP2_1.MessageFormatEnumType.URI,
          content: 'https://cs.example/r/1',
        },
      });
      nowSpy.mockRestore();
    });

    it('resolves and logs when the SetDisplayMessage send fails', async () => {
      const { handler, ocppSender, logger } = makeHandler({
        receiptByCSMSAttributes: [{ value: 'true' }],
      });
      ocppSender.sendCall.mockRejectedValue(new Error('ws closed'));

      await handler.handle(makeMessage(settledRequest));

      expect(sentResponse(ocppSender).receiptId).toBe('station-001-txn-001-psp-123');
      expect(logger.error).toHaveBeenCalledOnce();
      expect(logger.error.mock.calls[0][0]).toBe(
        'Failed to send SetDisplayMessageRequest to station station-001',
      );
    });
  });

  describe('status validation', () => {
    it('answers a Canceled settlement with an empty response and no warning (C19)', async () => {
      const { handler, ocppSender, logger, transactionEventRepository } = makeHandler();

      await handler.handle(
        makeMessage({
          ...settledRequest,
          transactionId: undefined,
          status: OCPP2_1.PaymentStatusEnumType.Canceled,
        }),
      );

      expect(sentResponse(ocppSender)).toEqual({});
      expect(ocppSender.sendCall).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(
        transactionEventRepository.updateTransactionByStationIdAndTransactionId,
      ).not.toHaveBeenCalled();
    });

    it('throws PropertyConstraintViolation for an unknown status and sends no response', async () => {
      const { handler, ocppSender } = makeHandler();

      const error: OcppError = await handler
        .handle(
          makeMessage({
            ...settledRequest,
            status: 'Paid' as OCPP2_1.PaymentStatusEnumType,
          }),
        )
        .then(
          () => {
            throw new Error('expected handle to reject');
          },
          (e: OcppError) => e,
        );

      expect(error).toBeInstanceOf(OcppError);
      expect(error.errorCode).toBe(ErrorCode.PropertyConstraintViolation);
      expect(error.messageId).toBe('corr-001');
      expect(error.message).toContain('Invalid settlement status: Paid');
      expect(ocppSender.sendCallResultWithMessage).not.toHaveBeenCalled();
    });
  });
});
