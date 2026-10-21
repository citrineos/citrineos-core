// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import {
  CancelReservationStatusEnum,
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IReservationRepository } from '@citrineos/dal';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.CancelReservation)
export class CancelReservationResponseOcpp2Handler extends AbstractHandler {
  protected _reservationRepository: IReservationRepository;

  constructor({
    logger,
    reservationRepository,
  }: AbstractHandlerDependencies & {
    reservationRepository: IReservationRepository;
  }) {
    super(logger);
    this._reservationRepository = reservationRepository;
  }

  async handle(
    message: IMessage<
      OCPP2_response_types.CancelReservationResponse,
      OCPP2_request_types.CancelReservationRequest
    >,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('CancelReservationResponse'),
      message,
      props,
    );

    const request = message.request;
    if (request) {
      await this._reservationRepository.updateByStationAndReservationId(
        message.context.tenantId,
        message.context.ocppConnectionName,
        request.reservationId,
        {
          isActive: message.payload.status === CancelReservationStatusEnum.Rejected,
        },
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }
}
