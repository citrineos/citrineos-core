// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsRequestHandler,
  type IMessage,
  type IOcppSender,
} from '@citrineos/base';
import {
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  ReservationUpdateStatusEnum,
  type ReservationUpdateStatusEnumType,
  OCPP2_request_types,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IReservationRepository } from '@dal/interfaces/repositories.js';

@AsRequestHandler(OCPP_2_VER_LIST, OCPP_CallAction.ReservationStatusUpdate)
export class ReservationStatusUpdateRequestOcpp2Handler extends AbstractHandler {
  protected _ocppSender: IOcppSender;
  protected _reservationRepository: IReservationRepository;

  constructor({
    logger,
    ocppSender,
    reservationRepository,
  }: AbstractHandlerDependencies & {
    ocppSender: IOcppSender;
    reservationRepository: IReservationRepository;
  }) {
    super(logger);
    this._ocppSender = ocppSender;
    this._reservationRepository = reservationRepository;
  }

  async handle(
    message: IMessage<OCPP2_request_types.ReservationStatusUpdateRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('ReservationStatusUpdateRequest'),
      message,
      props,
    );

    try {
      const status = message.payload.reservationUpdateStatus as ReservationUpdateStatusEnumType;
      const reservation = await this._reservationRepository.readOnlyOneByQuery(
        message.context.tenantId,
        {
          where: {
            tenantId: message.context.tenantId,
            ocppConnectionName: message.context.ocppConnectionName,
            id: message.payload.reservationId,
          },
        },
      );
      if (reservation) {
        if (
          status === ReservationUpdateStatusEnum.Expired ||
          status === ReservationUpdateStatusEnum.Removed
        ) {
          await this._reservationRepository.updateByKey(
            message.context.tenantId,
            {
              isActive: false,
            },
            reservation.databaseId.toString(),
          );
        }
      } else {
        throw new Error(`Reservation ${message.payload.reservationId} not found`);
      }
    } catch (error) {
      this._logger.error('Error reading reservation:', error);
    }

    // Create response
    const response: OCPP2_response_types.ReservationStatusUpdateResponse = {};

    const messageConfirmation = await this._ocppSender.sendCallResultWithMessage(message, response);
    this._logger.debug(
      this.createHandlerSentMessageLog('ReservationStatusUpdateResponse'),
      messageConfirmation,
    );
  }
}
