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
  type HandlerProperties,
  MessageOrigin,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  ReserveNowStatusEnum,
  type ReserveNowStatusEnumType,
  OCPP2_response_types,
} from '@citrineos/types';
import type { IOCPPMessageRepository, IReservationRepository } from '@citrineos/dal';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.ReserveNow)
export class ReserveNowResponseOcpp2Handler extends AbstractHandler {
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
    message: IMessage<OCPP2_response_types.ReserveNowResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.info(this.createHandlerReceivedMessageLog('ReserveNowResponse'), message, props);

    const request = await this._ocppMessageRepository.readOnlyOneByQuery(message.context.tenantId, {
      where: {
        tenantId: message.context.tenantId,
        ocppConnectionName: message.context.ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });
    if (request) {
      const status = message.payload.status as ReserveNowStatusEnumType;
      await this._reservationRepository.updateByStationAndReservationId(
        message.context.tenantId,
        message.context.ocppConnectionName,
        request.payload.id,
        {
          reserveStatus: status,
          isActive: status === ReserveNowStatusEnum.Accepted,
        },
      );
    } else {
      this._logger.error(
        `Update reservation failed. ReservationId not found by CorrelationId ${message.context.correlationId}.`,
      );
    }
  }
}
