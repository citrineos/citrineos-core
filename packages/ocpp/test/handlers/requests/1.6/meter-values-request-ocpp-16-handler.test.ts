// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { ITransactionEventRepository } from '@citrineos/dal';
import { MeterValuesRequestOcpp16Handler } from '@handlers/index.js';
import { createTestContainer, makeMockOcppSender } from '@test/test-container.js';

const RAW_REGISTER = {
  value: '1500',
  measurand: OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
  unit: OCPP1_6.MeterValuesRequestUnit.Wh,
};
const SIGNED_REGISTER = {
  value: 'OCMF|{}|{}',
  format: OCPP1_6.MeterValuesRequestFormat.SignedData,
  measurand: OCPP1_6.MeterValuesRequestMeasurand.Energy_Active_Import_Register,
};

function makeMessage(
  meterValue: OCPP1_6.MeterValuesRequest['meterValue'],
): IMessage<OCPP1_6.MeterValuesRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload: { connectorId: 1, transactionId: 100, meterValue },
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Transactions,
    action: OCPP_CallAction.MeterValues,
    state: MessageState.Request,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<OCPP1_6.MeterValuesRequest>;
}

function makeHandler() {
  const { logger } = createTestContainer();
  const updateTransactionByMeterValues = vi.fn().mockResolvedValue(undefined);
  const handler = new MeterValuesRequestOcpp16Handler({
    logger,
    ocppSender: makeMockOcppSender(),
    transactionEventRepository: {
      updateTransactionByMeterValues,
    } as unknown as ITransactionEventRepository,
  } as never);
  return { handler, updateTransactionByMeterValues };
}

describe('MeterValuesRequestOcpp16Handler', () => {
  it('stores no SignedData sampled value', async () => {
    const { handler, updateTransactionByMeterValues } = makeHandler();

    await handler.handle(
      makeMessage([
        { timestamp: '2026-09-14T10:00:00.000Z', sampledValue: [RAW_REGISTER, SIGNED_REGISTER] },
      ]),
    );

    const stored = updateTransactionByMeterValues.mock.calls[0][1];
    expect(stored[0].sampledValue).toEqual([expect.objectContaining({ value: 1500 })]);
  });

  it('skips a meterValue that carries only SignedData', async () => {
    const { handler, updateTransactionByMeterValues } = makeHandler();

    await handler.handle(
      makeMessage([
        { timestamp: '2026-09-14T10:00:00.000Z', sampledValue: [SIGNED_REGISTER] },
        { timestamp: '2026-09-14T10:00:01.000Z', sampledValue: [RAW_REGISTER] },
      ]),
    );

    const stored = updateTransactionByMeterValues.mock.calls[0][1];
    expect(stored).toEqual([expect.objectContaining({ timestamp: '2026-09-14T10:00:01.000Z' })]);
  });

  it('stores nothing for a batch that carries only SignedData', async () => {
    const { handler, updateTransactionByMeterValues } = makeHandler();

    await handler.handle(
      makeMessage([{ timestamp: '2026-09-14T10:00:00.000Z', sampledValue: [SIGNED_REGISTER] }]),
    );

    expect(updateTransactionByMeterValues).not.toHaveBeenCalled();
  });
});
