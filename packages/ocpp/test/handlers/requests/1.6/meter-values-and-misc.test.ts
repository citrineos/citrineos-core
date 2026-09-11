// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { ITransactionEventRepository } from '@citrineos/dal';
import {
  DataTransferRequestOcpp16Handler,
  HeartbeatRequestOcpp16Handler,
  MeterValuesRequestOcpp16Handler,
} from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

function makeMessage<T extends OcppRequest>(action: OCPP_CallAction, payload: T): IMessage<T> {
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
    action,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

describe('MeterValuesRequestOcpp16Handler', () => {
  const timestamp = '2026-09-01T10:00:00.000Z';

  const wattHourSample = {
    value: '1500',
    context: OCPP1_6.MeterValuesRequestContext.Sample_Periodic,
    measurand: OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
    unit: OCPP1_6.MeterValuesRequestUnit.Wh,
  };

  function makeHandler(options: { updateFails?: boolean } = {}) {
    const { logger } = createTestContainer();
    const ocppSender = makeMockOcppSender();

    const transactionEventRepository = {
      updateTransactionByMeterValues: options.updateFails
        ? vi.fn().mockRejectedValue(new Error('db down'))
        : vi.fn().mockResolvedValue(undefined),
    };

    const handler = new MeterValuesRequestOcpp16Handler({
      logger,
      ocppSender,
      transactionEventRepository:
        transactionEventRepository as unknown as ITransactionEventRepository,
    });

    return { handler, ocppSender, transactionEventRepository, logger };
  }

  function makeRequest(payload: unknown): IMessage<OCPP1_6.MeterValuesRequest> {
    return makeMessage(OCPP_CallAction.MeterValues, payload as OCPP1_6.MeterValuesRequest);
  }

  it('persists the mapped meter values against the transaction', async () => {
    const { handler, ocppSender, transactionEventRepository } = makeHandler();

    await handler.handle(
      makeRequest({
        connectorId: 1,
        transactionId: 42,
        meterValue: [{ timestamp, sampledValue: [wattHourSample] }],
      }),
    );

    expect(transactionEventRepository.updateTransactionByMeterValues).toHaveBeenCalledOnce();
    const [tenantId, entities, stationId, transactionId] =
      transactionEventRepository.updateTransactionByMeterValues.mock.calls[0];
    expect(tenantId).toBe(DEFAULT_TENANT_ID);
    expect(stationId).toBe('station-001');
    expect(transactionId).toBe(42);

    expect(entities).toHaveLength(1);
    expect(entities[0].tenantId).toBe(DEFAULT_TENANT_ID);
    expect(entities[0].timestamp).toBe(timestamp);
    // The OCPP connector number is no longer carried on the mapped entity; the repository
    // resolves the connector from the transaction the meter values belong to.
    expect(entities[0].connectorId).toBeUndefined();
    // 1.6 carries no multiplier, so the mapper pins it to 0.
    expect(entities[0].sampledValue).toEqual([
      {
        value: 1500,
        context: 'Sample.Periodic',
        measurand: 'Energy.Active.Import.Register',
        unitOfMeasure: { unit: 'Wh', multiplier: 0 },
      },
    ]);

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({});
  });

  it('keeps only the meter values that carry sampled values', async () => {
    const { handler, transactionEventRepository } = makeHandler();

    await handler.handle(
      makeRequest({
        connectorId: 2,
        transactionId: 7,
        meterValue: [
          { timestamp: '2026-09-01T09:00:00.000Z', sampledValue: [] },
          { timestamp, sampledValue: [wattHourSample] },
        ],
      }),
    );

    expect(transactionEventRepository.updateTransactionByMeterValues).toHaveBeenCalledOnce();
    const entities = transactionEventRepository.updateTransactionByMeterValues.mock.calls[0][1];
    expect(entities).toHaveLength(1);
    expect(entities[0].timestamp).toBe(timestamp);
  });

  it('does not persist when every meter value has an empty sampled value list', async () => {
    const { handler, ocppSender, transactionEventRepository } = makeHandler();

    await handler.handle(
      makeRequest({
        connectorId: 1,
        transactionId: 42,
        meterValue: [{ timestamp, sampledValue: [] }],
      }),
    );

    expect(transactionEventRepository.updateTransactionByMeterValues).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  });

  it('does not persist readings for connector 0', async () => {
    const { handler, ocppSender, transactionEventRepository } = makeHandler();

    await handler.handle(
      makeRequest({
        connectorId: 0,
        transactionId: 42,
        meterValue: [{ timestamp, sampledValue: [wattHourSample] }],
      }),
    );

    expect(transactionEventRepository.updateTransactionByMeterValues).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({});
  });

  it('does not persist readings that arrive outside a transaction', async () => {
    const { handler, ocppSender, transactionEventRepository } = makeHandler();

    await handler.handle(
      makeRequest({
        connectorId: 1,
        meterValue: [{ timestamp, sampledValue: [wattHourSample] }],
      }),
    );

    expect(transactionEventRepository.updateTransactionByMeterValues).not.toHaveBeenCalled();
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
  });

  it('still answers the station when persistence fails', async () => {
    const { handler, ocppSender, transactionEventRepository, logger } = makeHandler({
      updateFails: true,
    });

    await handler.handle(
      makeRequest({
        connectorId: 1,
        transactionId: 42,
        meterValue: [{ timestamp, sampledValue: [wattHourSample] }],
      }),
    );

    expect(transactionEventRepository.updateTransactionByMeterValues).toHaveBeenCalledOnce();
    expect(logger.error).toHaveBeenCalledOnce();
    expect(logger.error.mock.calls[0][0]).toBe('Failed to process MeterValues.');
    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({});
  });
});

describe('DataTransferRequestOcpp16Handler', () => {
  function makeHandler() {
    const { logger } = createTestContainer();
    const ocppSender = makeMockOcppSender();
    const handler = new DataTransferRequestOcpp16Handler({ logger, ocppSender });
    return { handler, ocppSender, logger };
  }

  it('rejects every data transfer', async () => {
    const { handler, ocppSender } = makeHandler();
    const message = makeMessage<OCPP1_6.DataTransferRequest>(OCPP_CallAction.DataTransfer, {
      vendorId: 'org.example',
      messageId: 'GetSettings',
      data: '{"key":"value"}',
    });

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    const [sentMessage, response] = ocppSender.sendCallResultWithMessage.mock.calls[0];
    expect(sentMessage).toBe(message);
    // Rejected with no data payload echoed back.
    expect(response).toEqual({ status: OCPP1_6.DataTransferResponseStatus.Rejected });
  });

  it('logs the confirmation returned by the sender', async () => {
    const { handler, ocppSender, logger } = makeHandler();
    ocppSender.sendCallResultWithMessage.mockResolvedValue({ success: true });

    await handler.handle(
      makeMessage<OCPP1_6.DataTransferRequest>(OCPP_CallAction.DataTransfer, {
        vendorId: 'org.example',
      }),
    );

    // One received-message log, one sent-response log with the confirmation.
    expect(logger.debug).toHaveBeenCalledTimes(2);
    expect(logger.debug.mock.calls[1][1]).toEqual({ success: true });
  });
});

describe('HeartbeatRequestOcpp16Handler', () => {
  function makeHandler() {
    const { logger } = createTestContainer();
    const ocppSender = makeMockOcppSender();
    const handler = new HeartbeatRequestOcpp16Handler({ logger, ocppSender });
    return { handler, ocppSender };
  }

  it('answers with the current time', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-01T10:20:30.000Z'));
    try {
      const { handler, ocppSender } = makeHandler();

      await handler.handle(makeMessage<OCPP1_6.HeartbeatRequest>(OCPP_CallAction.Heartbeat, {}));

      expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
      expect(ocppSender.sendCallResultWithMessage.mock.calls[0][1]).toEqual({
        currentTime: '2026-09-01T10:20:30.000Z',
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it('sends the result against the incoming message', async () => {
    const { handler, ocppSender } = makeHandler();
    const message = makeMessage<OCPP1_6.HeartbeatRequest>(OCPP_CallAction.Heartbeat, {});

    await handler.handle(message);

    expect(ocppSender.sendCallResultWithMessage).toHaveBeenCalledOnce();
    expect(ocppSender.sendCallResultWithMessage.mock.calls[0][0]).toBe(message);
  });
});
