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
  OCPP2_1,
  OCPP_CallAction,
  OCPPVersion,
  TariffSetStatusEnum,
} from '@citrineos/types';
import { type ITariffRepository } from '@citrineos/dal';

@AsResponseHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.SetDefaultTariff)
export class SetDefaultTariffResponseOcpp21Handler extends AbstractHandler {
  protected _tariffRepository: ITariffRepository;

  constructor({
    logger,
    tariffRepository,
  }: AbstractHandlerDependencies & {
    tariffRepository: ITariffRepository;
  }) {
    super(logger);

    this._tariffRepository = tariffRepository;
  }

  async handle(
    message: IMessage<OCPP2_1.SetDefaultTariffResponse, OCPP2_1.SetDefaultTariffRequest>,
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

    const request = message.request;

    if (!request) {
      this._logger.error(
        `No SetDefaultTariffRequest found for correlationId ${message.context.correlationId} on station ${ocppConnectionName}`,
      );
      return;
    }

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
