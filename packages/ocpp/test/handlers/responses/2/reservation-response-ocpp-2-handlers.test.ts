// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppRequest,
  CancelReservationStatusEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP2_0_1,
  OCPP_CallAction,
  OCPPVersion,
  ReserveNowStatusEnum,
} from '@citrineos/types';
import type { IReservationRepository } from '@citrineos/dal';
import {
  CancelReservationResponseOcpp2Handler,
  ReserveNowResponseOcpp2Handler,
} from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION_DB_ID = vi.hoisted(() => 4242);
vi.mock('@citrineos/dal', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@citrineos/dal')>()),
  resolveStationId: vi.fn().mockResolvedValue(STATION_DB_ID),
}));

const STATION = 'station-001';

/**
 * Reservation.databaseId is the primary key; Reservation.id is the OCPP-level reservation id,
 * unique per station within a tenant. These differ for every reservation that is not the first
 * row in the table, so the two must not be used interchangeably.
 */
const OCPP_RESERVATION_ID = 7;

function makeMessage<T extends OcppRequest, R extends OcppRequest = OcppRequest>(
  payload: T,
  request?: R,
): IMessage<T, R> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: 'corr-001',
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.EVDriver,
    action: OCPP_CallAction.ReserveNow,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
    request,
  } as unknown as IMessage<T, R>;
}

describe('reservation response handlers address the reservation by its OCPP id', () => {
  const { container } = createTestContainer();
  let reservationRepository: Mocked<IReservationRepository>;

  beforeEach(() => {
    reservationRepository = {
      updateByStationAndReservationId: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IReservationRepository>;
  });

  it('ReserveNow updates the row matching the station and OCPP reservation id', async () => {
    const handler = getTestInstance(container, ReserveNowResponseOcpp2Handler, {
      reservationRepository,
    });

    await handler.handle(
      makeMessage(
        { status: OCPP2_0_1.ReserveNowStatusEnumType.Accepted } as never,
        { id: OCPP_RESERVATION_ID } as never,
      ),
    );

    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP_RESERVATION_ID,
      { reserveStatus: ReserveNowStatusEnum.Accepted, isActive: true },
    );
  });

  it('CancelReservation updates the row matching the station and OCPP reservation id', async () => {
    const handler = getTestInstance(container, CancelReservationResponseOcpp2Handler, {
      reservationRepository,
    });

    await handler.handle(
      makeMessage(
        { status: CancelReservationStatusEnum.Accepted } as never,
        { reservationId: OCPP_RESERVATION_ID } as never,
      ),
    );

    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP_RESERVATION_ID,
      { isActive: false },
    );
  });

  it('CancelReservation leaves the reservation active when the station refuses', async () => {
    const handler = getTestInstance(container, CancelReservationResponseOcpp2Handler, {
      reservationRepository,
    });

    await handler.handle(
      makeMessage(
        { status: CancelReservationStatusEnum.Rejected } as never,
        { reservationId: OCPP_RESERVATION_ID } as never,
      ),
    );

    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP_RESERVATION_ID,
      { isActive: true },
    );
  });
});
