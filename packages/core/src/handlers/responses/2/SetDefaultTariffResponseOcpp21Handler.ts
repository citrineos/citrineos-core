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
  type TariffDto,
  MessageOrigin,
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
  TariffSetStatusEnum,
} from '@citrineos/types';
import { type IOCPPMessageRepository, type ITariffRepository } from '@dal/index.js';

@AsResponseHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.SetDefaultTariff)
export class SetDefaultTariffResponseOcpp21Handler extends AbstractHandler {
  protected _ocppMessageRepository: IOCPPMessageRepository;
  protected _tariffRepository: ITariffRepository;

  constructor({
    logger,
    ocppMessageRepository,
    tariffRepository,
  }: AbstractHandlerDependencies & {
    ocppMessageRepository: IOCPPMessageRepository;
    tariffRepository: ITariffRepository;
  }) {
    super(logger);

    this._ocppMessageRepository = ocppMessageRepository;
    this._tariffRepository = tariffRepository;
  }

  async handle(
    message: IMessage<OCPP2_1.SetDefaultTariffResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog(`SetDefaultTariffResponse ${message.protocol}`),
      message,
      props,
    );

    if (message.payload.status !== TariffSetStatusEnum.Accepted) {
      this._logger.warn(
        `SetDefaultTariff rejected for station ${message.context.ocppConnectionName}: ${message.payload.status}`,
      );
      return;
    }

    const tenantId = message.context.tenantId;
    const ocppConnectionName = message.context.ocppConnectionName;

    const storedRequest = await this._ocppMessageRepository.readOnlyOneByQuery(tenantId, {
      where: {
        tenantId,
        ocppConnectionName,
        correlationId: message.context.correlationId,
        origin: MessageOrigin.ChargingStationManagementSystem,
      },
    });

    if (!storedRequest) {
      this._logger.error(
        `No SetDefaultTariffRequest found for correlationId ${message.context.correlationId} on station ${ocppConnectionName}`,
      );
      return;
    }

    const request = storedRequest.payload as OCPP2_1.SetDefaultTariffRequest;
    const tariffData = request.tariff;

    const newTariff: TariffDto = {
      tenantId,
      currency: tariffData.currency,
      pricePerKwh: 0,
      tariffId: tariffData.tariffId,
      validFrom: tariffData.validFrom ?? undefined,
      description: tariffData.description ?? undefined,
      energy: tariffData.energy ?? undefined,
      chargingTime: tariffData.chargingTime ?? undefined,
      idleTime: tariffData.idleTime ?? undefined,
      fixedFee: tariffData.fixedFee ?? undefined,
      reservationTime: tariffData.reservationTime ?? undefined,
      reservationFixed: tariffData.reservationFixed ?? undefined,
      minCost: tariffData.minCost ?? undefined,
      maxCost: tariffData.maxCost ?? undefined,
    };

    const storedTariff = await this._tariffRepository.upsertTariffByTariffId(tenantId, newTariff);
    this._logger.info(`Tariff ${storedTariff.id} stored for station ${ocppConnectionName}`);
  }
}
