// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
  OCPP2_response_types,
} from '@citrineos/base';
import {
  CancelReservationStatusEnum,
  type HandlerProperties,
  MessageOrigin,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
} from '@citrineos/types';
import type {
  IOCPPMessageRepository,
  IReservationRepository,
} from '@dal/interfaces/repositories.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.CancelReservation)
export class CancelReservationResponseOcpp2Handler extends AbstractHandler {
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _reservationRepository: IReservationRepository;

  constructor({
    logger,
    ocppMessageRepository,
    reservationRepository,
  }: AbstractHandlerDependencies & {
    ocppMessageRepository: IOCPPMessageRepository;
    reservationRepository: IReservationRepository;
  }) {
    super(logger);
    this._ocppMessageRepository = ocppMessageRepository;
    this._reservationRepository = reservationRepository;
  }

  async handle(
    message: IMessage<OCPP2_response_types.CancelReservationResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(
      this.createHandlerReceivedMessageLog('CancelReservationResponse'),
      message,
      props,
    );

    const request = await this._ocppMessageRepository.readOnlyOneByQuery(message.context.tenantId, {
      where: {
        tenantId: message.context.tenantId,
        ocppConnectionName: message.context.ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    if (request) {
      await this._reservationRepository.updateByKey(
        message.context.tenantId,
        {
          isActive: message.payload.status === CancelReservationStatusEnum.Rejected,
        },
        request.message[3].reservationId,
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }
}
