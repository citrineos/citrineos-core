// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPP2_1,
  OCPPVersion,
} from '@citrineos/types';
import { ClearTariffsResponseOcpp21Handler } from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';

function makeMessage(
  payload: OCPP2_1.ClearTariffsResponse,
): IMessage<OCPP2_1.ClearTariffsResponse, OCPP2_1.ClearTariffsRequest> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.Transactions,
    action: OCPP_CallAction.ClearTariffs,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_1,
    request: { tariffIds: ['Default01'] },
  };
}

describe('ClearTariffsResponseOcpp21Handler', () => {
  const { container, logger } = createTestContainer();
  let handler: ClearTariffsResponseOcpp21Handler;

  beforeEach(() => {
    vi.clearAllMocks();
    handler = getTestInstance(container, ClearTariffsResponseOcpp21Handler, {});
  });

  it('logs each accepted tariff without warning', async () => {
    await handler.handle(
      makeMessage({
        clearTariffsResult: [
          { tariffId: 'Default01', status: OCPP2_1.TariffClearStatusEnumType.Accepted },
          { tariffId: 'Default02', status: OCPP2_1.TariffClearStatusEnumType.Accepted },
        ],
      }),
    );

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Default01'));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('Default02'));
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs NoTariff without warning', async () => {
    await handler.handle(
      makeMessage({
        clearTariffsResult: [{ status: OCPP2_1.TariffClearStatusEnumType.NoTariff }],
      }),
    );

    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('No matching tariffs'));
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns with statusInfo when the station rejects a tariff', async () => {
    const statusInfo = { reasonCode: 'InternalError' };

    await handler.handle(
      makeMessage({
        clearTariffsResult: [
          {
            tariffId: 'Default01',
            status: OCPP2_1.TariffClearStatusEnumType.Rejected,
            statusInfo,
          },
        ],
      }),
    );

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('Rejected'), statusInfo);
  });
});
