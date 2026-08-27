// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP1_6,
  OCPP_CallAction,
  OCPPVersion,
} from '@citrineos/types';
import type { IChargingProfileRepository } from '@dal/interfaces/repositories.js';
import { GetCompositeScheduleResponseOcpp16Handler } from '@handlers/index.js';
import { createTestContainer } from '@test/testContainer.js';

/**
 * OCPP 1.6 Edition 2, GetCompositeSchedule.conf: `scheduleStart` is a field of the response, not of
 * the schedule inside it - "Time. Periods contained in the charging profile are relative to this
 * point in time. If status is 'Rejected', this field may be absent."
 */
const SCHEDULE_START = '2026-08-27T09:00:00.000Z';
const SCHEDULE_OWN_START = '2026-08-27T08:00:00.000Z';

function makeMessage<T extends OcppResponse>(payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: 'station-001',
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.SmartCharging,
    action: OCPP_CallAction.GetCompositeSchedule,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP1_6,
  } as unknown as IMessage<T>;
}

function aResponse(
  overrides: Partial<OCPP1_6.GetCompositeScheduleResponse> = {},
): OCPP1_6.GetCompositeScheduleResponse {
  return {
    status: OCPP1_6.GetCompositeScheduleResponseStatus.Accepted,
    connectorId: 1,
    scheduleStart: SCHEDULE_START,
    chargingSchedule: {
      duration: 3600,
      chargingRateUnit: OCPP1_6.GetCompositeScheduleResponseChargingRateUnit.A,
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
    },
    ...overrides,
  } as OCPP1_6.GetCompositeScheduleResponse;
}

describe('GetCompositeScheduleResponseOcpp16Handler', () => {
  let handler: GetCompositeScheduleResponseOcpp16Handler;
  let createCompositeSchedule: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    const { logger } = createTestContainer();
    createCompositeSchedule = vi.fn().mockResolvedValue({ id: 1 });
    handler = new GetCompositeScheduleResponseOcpp16Handler({
      logger,
      chargingProfileRepository: {
        createCompositeSchedule,
      } as unknown as IChargingProfileRepository,
    });
  });

  async function storedSchedule(response: OCPP1_6.GetCompositeScheduleResponse) {
    await handler.handle(makeMessage(response));
    return createCompositeSchedule.mock.calls[0]?.[1];
  }

  it('anchors the periods at the scheduleStart the station reported', async () => {
    const stored = await storedSchedule(aResponse());

    expect(stored.scheduleStart).toBe(SCHEDULE_START);
  });

  it('prefers the response scheduleStart over the schedule own startSchedule', async () => {
    const stored = await storedSchedule(
      aResponse({
        chargingSchedule: {
          duration: 3600,
          startSchedule: SCHEDULE_OWN_START,
          chargingRateUnit: OCPP1_6.GetCompositeScheduleResponseChargingRateUnit.A,
          chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
        },
      } as Partial<OCPP1_6.GetCompositeScheduleResponse>),
    );

    expect(stored.scheduleStart).toBe(SCHEDULE_START);
  });

  it('falls back to the schedule own startSchedule when the response carries none', async () => {
    const stored = await storedSchedule(
      aResponse({
        scheduleStart: undefined,
        chargingSchedule: {
          duration: 3600,
          startSchedule: SCHEDULE_OWN_START,
          chargingRateUnit: OCPP1_6.GetCompositeScheduleResponseChargingRateUnit.A,
          chargingSchedulePeriod: [{ startPeriod: 0, limit: 16 }],
        },
      } as Partial<OCPP1_6.GetCompositeScheduleResponse>),
    );

    expect(stored.scheduleStart).toBe(SCHEDULE_OWN_START);
  });

  it('stores nothing when the station rejected the request', async () => {
    await handler.handle(
      makeMessage(
        aResponse({
          status: OCPP1_6.GetCompositeScheduleResponseStatus.Rejected,
          scheduleStart: undefined,
          chargingSchedule: undefined,
        } as Partial<OCPP1_6.GetCompositeScheduleResponse>),
      ),
    );

    expect(createCompositeSchedule).not.toHaveBeenCalled();
  });
});
