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
import type { IOCPPMessageRepository, IReservationRepository } from '@citrineos/dal';
import {
  CancelReservationResponseOcpp2Handler,
  ReserveNowResponseOcpp2Handler,
} from '@handlers/index.js';
import { createTestContainer, getTestInstance } from '@test/test-container.js';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';

/**
 * Reservation.databaseId is the primary key; Reservation.id is the OCPP-level reservation id,
 * unique per station within a tenant. These differ for every reservation that is not the first
 * row in the table, so the two must not be used interchangeably.
 */
const OCPP_RESERVATION_ID = 7;

function makeMessage<T extends OcppRequest>(payload: T): IMessage<T> {
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
  } as unknown as IMessage<T>;
}

describe('reservation response handlers address the reservation by its OCPP id', () => {
  const { container } = createTestContainer();
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;
  let reservationRepository: Mocked<IReservationRepository>;

  beforeEach(() => {
    reservationRepository = {
      updateAllByQuery: vi.fn().mockResolvedValue([]),
      updateByKey: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<IReservationRepository>;
  });

  function withRequest(payload: unknown) {
    ocppMessageRepository = {
      readOnlyOneByQuery: vi.fn().mockResolvedValue({ payload }),
    } as unknown as Mocked<IOCPPMessageRepository>;
  }

  it('ReserveNow updates the row matching the station and OCPP reservation id', async () => {
    withRequest({ id: OCPP_RESERVATION_ID });
    const handler = getTestInstance(container, ReserveNowResponseOcpp2Handler, {
      ocppMessageRepository,
      reservationRepository,
    });

    await handler.handle(
      makeMessage({
        status: OCPP2_0_1.ReserveNowStatusEnumType.Accepted,
      } as never),
    );

    expect(reservationRepository.updateByKey).not.toHaveBeenCalled();
    expect(reservationRepository.updateAllByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      { reserveStatus: ReserveNowStatusEnum.Accepted, isActive: true },
      { where: { ocppConnectionName: STATION, id: OCPP_RESERVATION_ID } },
    );
  });

  it('CancelReservation updates the row matching the station and OCPP reservation id', async () => {
    withRequest({ reservationId: OCPP_RESERVATION_ID });
    const handler = getTestInstance(container, CancelReservationResponseOcpp2Handler, {
      ocppMessageRepository,
      reservationRepository,
    });

    await handler.handle(
      makeMessage({
        status: CancelReservationStatusEnum.Accepted,
      } as never),
    );

    expect(reservationRepository.updateByKey).not.toHaveBeenCalled();
    expect(reservationRepository.updateAllByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      { isActive: false },
      { where: { ocppConnectionName: STATION, id: OCPP_RESERVATION_ID } },
    );
  });

  it('CancelReservation leaves the reservation active when the station refuses', async () => {
    withRequest({ reservationId: OCPP_RESERVATION_ID });
    const handler = getTestInstance(container, CancelReservationResponseOcpp2Handler, {
      ocppMessageRepository,
      reservationRepository,
    });

    await handler.handle(
      makeMessage({
        status: CancelReservationStatusEnum.Rejected,
      } as never),
    );

    expect(reservationRepository.updateAllByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      { isActive: true },
      { where: { ocppConnectionName: STATION, id: OCPP_RESERVATION_ID } },
    );
  });
});
