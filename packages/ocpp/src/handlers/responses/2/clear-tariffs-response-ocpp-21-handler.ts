// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractHandler,
  type AbstractHandlerDependencies,
  AsResponseHandler,
  type IMessage,
} from '@citrineos/base';
import { type HandlerProperties, OCPP2_1, OCPP_CallAction, OCPPVersion } from '@citrineos/types';

@AsResponseHandler([OCPPVersion.OCPP2_1], OCPP_CallAction.ClearTariffs)
export class ClearTariffsResponseOcpp21Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  async handle(
    message: IMessage<OCPP2_1.ClearTariffsResponse, OCPP2_1.ClearTariffsRequest>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog(`ClearTariffsResponse ${message.protocol}`),
      message,
      props,
    );

    const ocppConnectionName = message.context.ocppConnectionName;

    for (const result of message.payload.clearTariffsResult) {
      switch (result.status) {
        case OCPP2_1.TariffClearStatusEnumType.Accepted:
          this._logger.info(`Tariff ${result.tariffId} cleared on station ${ocppConnectionName}`);
          break;
        case OCPP2_1.TariffClearStatusEnumType.NoTariff:
          this._logger.info(`No matching tariffs to clear on station ${ocppConnectionName}`);
          break;
        default:
          this._logger.warn(
            `ClearTariffs ${result.status} for tariff ${result.tariffId} on station ${ocppConnectionName}`,
            result.statusInfo,
          );
      }
    }
  }
}
