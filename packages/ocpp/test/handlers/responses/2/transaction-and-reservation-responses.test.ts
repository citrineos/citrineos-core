// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0

import { type IMessage, DEFAULT_TENANT_ID } from '@citrineos/base';
import {
  type OcppResponse,
  type SystemConfig,
  CancelReservationStatusEnum,
  ChargingLimitSourceEnum,
  ChargingProfilePurposeEnum,
  ChargingStationSequenceTypeEnum,
  EventGroup,
  MessageOrigin,
  MessageState,
  OCPP_CallAction,
  OCPPVersion,
  RequestStartStopStatusEnum,
  ReserveNowStatusEnum,
} from '@citrineos/types';
import type {
  IChargingProfileRepository,
  IOCPPMessageRepository,
  IReservationRepository,
} from '@citrineos/dal';
import {
  CancelReservationResponseOcpp2Handler,
  GetTransactionStatusResponseOcpp2Handler,
  RequestStartTransactionResponseOcpp2Handler,
  RequestStopTransactionResponseOcpp2Handler,
  ReserveNowResponseOcpp2Handler,
} from '@handlers/index.js';
import type { TransactionService } from '@modules/transactions/transaction-service.js';
import type { IdGenerator } from '@util/index.js';
import {
  createTestContainer,
  getTestInstance,
  makeMockOcppSender,
  type MockOcppSender,
} from '@test/test-container.js';
import type { Mocked } from 'vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const STATION = 'station-001';
const CORRELATION_ID = 'corr-001';
const GENERATED_REQUEST_ID = 42;

/**
 * Reservation.databaseId is the primary key; Reservation.id is the OCPP-level reservation id.
 * The handlers address the row by the OCPP id carried in the originating request.
 */
const OCPP_RESERVATION_ID = 7;

const { container, logger } = createTestContainer();

function makeMessage<T extends OcppResponse>(action: OCPP_CallAction, payload: T): IMessage<T> {
  return {
    context: {
      tenantId: DEFAULT_TENANT_ID,
      ocppConnectionName: STATION,
      correlationId: CORRELATION_ID,
      timestamp: new Date().toISOString(),
    },
    payload,
    origin: MessageOrigin.ChargingStation,
    eventGroup: EventGroup.EVDriver,
    action,
    state: MessageState.Response,
    protocol: OCPPVersion.OCPP2_0_1,
  } as unknown as IMessage<T>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('RequestStartTransactionResponseOcpp2Handler', () => {
  let chargingProfileRepository: Mocked<IChargingProfileRepository>;
  let idGenerator: Mocked<IdGenerator>;
  let ocppSender: MockOcppSender;

  beforeEach(() => {
    chargingProfileRepository = {
      updateAllByQuery: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IChargingProfileRepository>;
    idGenerator = {
      generateRequestId: vi.fn().mockResolvedValue(GENERATED_REQUEST_ID),
    } as unknown as Mocked<IdGenerator>;
    ocppSender = makeMockOcppSender();
  });

  function makeHandler(enableGetChargingProfilesOnStartTransaction?: boolean) {
    // evdriver is a top-level config section, not nested under `modules`.
    const config = {
      evdriver: { enableGetChargingProfilesOnStartTransaction },
    } as unknown as SystemConfig;
    return getTestInstance(container, RequestStartTransactionResponseOcpp2Handler, {
      config,
      ocppSender,
      chargingProfileRepository,
      idGenerator,
    });
  }

  it('Accepted deactivates the active CSO TxProfile profiles of the station', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.RequestStartTransaction, {
        status: RequestStartStopStatusEnum.Accepted,
      } as never),
    );

    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledTimes(1);
    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      { isActive: false },
      {
        where: {
          ocppConnectionName: STATION,
          isActive: true,
          chargingLimitSource: ChargingLimitSourceEnum.CSO,
          chargingProfilePurpose: ChargingProfilePurposeEnum.TxProfile,
        },
        returning: false,
      },
    );
  });

  it('Accepted requests fresh TxProfile profiles under a generated request id', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.RequestStartTransaction, {
        status: RequestStartStopStatusEnum.Accepted,
      } as never),
    );

    expect(idGenerator.generateRequestId).toHaveBeenCalledTimes(1);
    expect(idGenerator.generateRequestId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      ChargingStationSequenceTypeEnum.getChargingProfiles,
    );
    expect(ocppSender.sendCall).toHaveBeenCalledTimes(1);
    expect(ocppSender.sendCall).toHaveBeenCalledWith({
      ocppConnectionName: STATION,
      tenantId: DEFAULT_TENANT_ID,
      protocol: OCPPVersion.OCPP2_0_1,
      action: OCPP_CallAction.GetChargingProfiles,
      eventGroup: EventGroup.EVDriver,
      payload: {
        requestId: GENERATED_REQUEST_ID,
        chargingProfile: {
          chargingProfilePurpose: ChargingProfilePurposeEnum.TxProfile,
          chargingLimitSource: [ChargingLimitSourceEnum.CSO],
        },
      },
    });
  });

  it('Accepted with the GetChargingProfiles follow-up disabled still clears profiles but sends nothing', async () => {
    const handler = makeHandler(false);

    await handler.handle(
      makeMessage(OCPP_CallAction.RequestStartTransaction, {
        status: RequestStartStopStatusEnum.Accepted,
      } as never),
    );

    expect(chargingProfileRepository.updateAllByQuery).toHaveBeenCalledTimes(1);
    expect(idGenerator.generateRequestId).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
  });

  it('Rejected logs the failure and performs no writes or calls', async () => {
    const handler = makeHandler();

    await handler.handle(
      makeMessage(OCPP_CallAction.RequestStartTransaction, {
        status: RequestStartStopStatusEnum.Rejected,
      } as never),
    );

    expect(chargingProfileRepository.updateAllByQuery).not.toHaveBeenCalled();
    expect(ocppSender.sendCall).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      'RequestStartTransaction failed: {"status":"Rejected"}',
    );
  });
});

describe('RequestStopTransactionResponseOcpp2Handler', () => {
  // Log-only stub: no repositories, no sender.
  it('resolves and only logs the received message', async () => {
    const handler = getTestInstance(container, RequestStopTransactionResponseOcpp2Handler, {});
    const message = makeMessage(OCPP_CallAction.RequestStopTransaction, {
      status: RequestStartStopStatusEnum.Accepted,
    } as never);

    await expect(handler.handle(message)).resolves.toBeUndefined();

    expect(logger.info).toHaveBeenCalledWith(
      'Handler for RequestStopTransactionResponse received message:',
      message,
      undefined,
    );
  });
});

// Accepted/Rejected reservation updates are covered in reservation-response-ocpp-2-handlers.test.ts;
// here only the request lookup and the missing-request branch are exercised.
describe('ReserveNowResponseOcpp2Handler', () => {
  let ocppMessageRepository: Mocked<IOCPPMessageRepository>;
  let reservationRepository: Mocked<IReservationRepository>;

  beforeEach(() => {
    reservationRepository = {
      updateByStationAndReservationId: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IReservationRepository>;
  });

  function makeHandler(request: unknown) {
    ocppMessageRepository = {
      readOnlyOneByQuery: vi.fn().mockResolvedValue(request),
    } as unknown as Mocked<IOCPPMessageRepository>;
    return getTestInstance(container, ReserveNowResponseOcpp2Handler, {
      ocppMessageRepository,
      reservationRepository,
    });
  }

  it('finds the originating request by correlation id and CSMS origin, then stores a non-Accepted status as inactive', async () => {
    const handler = makeHandler({ payload: { id: OCPP_RESERVATION_ID } });

    await handler.handle(
      makeMessage(OCPP_CallAction.ReserveNow, {
        status: ReserveNowStatusEnum.Occupied,
      } as never),
    );

    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledTimes(1);
    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      where: {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: STATION,
        correlationId: CORRELATION_ID,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledTimes(1);
    expect(reservationRepository.updateByStationAndReservationId).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      OCPP_RESERVATION_ID,
      { reserveStatus: ReserveNowStatusEnum.Occupied, isActive: false },
    );
  });

  it('missing originating request logs an error and touches no reservation', async () => {
    const handler = makeHandler(null);

    await handler.handle(
      makeMessage(OCPP_CallAction.ReserveNow, {
        status: ReserveNowStatusEnum.Accepted,
      } as never),
    );

    expect(reservationRepository.updateByStationAndReservationId).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `Update reservation failed. ReservationId not found by CorrelationId ${CORRELATION_ID}.`,
    );
  });
});

// Accepted/Rejected cancellation updates are covered in reservation-response-ocpp-2-handlers.test.ts;
// here only the missing-request branch is exercised.
describe('CancelReservationResponseOcpp2Handler', () => {
  it('missing originating request logs an error and touches no reservation', async () => {
    const ocppMessageRepository = {
      readOnlyOneByQuery: vi.fn().mockResolvedValue(null),
    } as unknown as Mocked<IOCPPMessageRepository>;
    const reservationRepository = {
      updateByStationAndReservationId: vi.fn().mockResolvedValue([]),
    } as unknown as Mocked<IReservationRepository>;
    const handler = getTestInstance(container, CancelReservationResponseOcpp2Handler, {
      ocppMessageRepository,
      reservationRepository,
    });

    await handler.handle(
      makeMessage(OCPP_CallAction.CancelReservation, {
        status: CancelReservationStatusEnum.Accepted,
      } as never),
    );

    expect(ocppMessageRepository.readOnlyOneByQuery).toHaveBeenCalledWith(DEFAULT_TENANT_ID, {
      where: {
        tenantId: DEFAULT_TENANT_ID,
        ocppConnectionName: STATION,
        correlationId: CORRELATION_ID,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    expect(reservationRepository.updateByStationAndReservationId).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      `Update reservation failed. ReservationId not found by CorrelationId ${CORRELATION_ID}.`,
    );
  });
});

describe('GetTransactionStatusResponseOcpp2Handler', () => {
  let transactionService: Mocked<TransactionService>;

  beforeEach(() => {
    transactionService = {
      updateTransactionStatus: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<TransactionService>;
  });

  function makeHandler() {
    return getTestInstance(container, GetTransactionStatusResponseOcpp2Handler, {
      transactionService,
    });
  }

  it('ongoingIndicator true is forwarded to the transaction service', async () => {
    await makeHandler().handle(
      makeMessage(OCPP_CallAction.GetTransactionStatus, { ongoingIndicator: true } as never),
    );

    expect(transactionService.updateTransactionStatus).toHaveBeenCalledTimes(1);
    expect(transactionService.updateTransactionStatus).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      CORRELATION_ID,
      true,
    );
  });

  it('ongoingIndicator false is forwarded, not treated as absent', async () => {
    await makeHandler().handle(
      makeMessage(OCPP_CallAction.GetTransactionStatus, { ongoingIndicator: false } as never),
    );

    expect(transactionService.updateTransactionStatus).toHaveBeenCalledTimes(1);
    expect(transactionService.updateTransactionStatus).toHaveBeenCalledWith(
      DEFAULT_TENANT_ID,
      STATION,
      CORRELATION_ID,
      false,
    );
  });

  it('absent ongoingIndicator skips the transaction service', async () => {
    await makeHandler().handle(makeMessage(OCPP_CallAction.GetTransactionStatus, {} as never));

    expect(transactionService.updateTransactionStatus).not.toHaveBeenCalled();
  });
});
