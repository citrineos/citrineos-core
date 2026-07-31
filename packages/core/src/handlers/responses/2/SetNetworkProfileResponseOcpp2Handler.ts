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
  type HandlerProperties,
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  SetNetworkProfileStatusEnum,
} from '@citrineos/types';
import {
  ChargingStation,
  ChargingStationNetworkProfile,
  ServerNetworkProfile,
  SetNetworkProfile,
} from '@dal/layers/sequelize/index.js';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetNetworkProfile)
export class SetNetworkProfileResponseOcpp2Handler extends AbstractHandler {
  constructor({ logger }: AbstractHandlerDependencies) {
    super(logger);
  }

  async handle(
    message: IMessage<OCPP2_response_types.SetNetworkProfileResponse>,
    props?: HandlerProperties,
  ): Promise<void> {
    this._logger.debug(
      this.createHandlerReceivedMessageLog('SetNetworkProfileResponse'),
      message,
      props,
    );

    if (message.payload.status !== SetNetworkProfileStatusEnum.Accepted) {
      return;
    }

    const setNetworkProfile = await SetNetworkProfile.findOne({
      where: { tenantId: message.context.tenantId, correlationId: message.context.correlationId },
    });
    if (!setNetworkProfile) {
      return;
    }

    const serverNetworkProfile = await ServerNetworkProfile.findByPk(
      setNetworkProfile.websocketServerConfigId!,
    );
    if (!serverNetworkProfile) {
      return;
    }

    const chargingStation = await ChargingStation.findOne({
      where: {
        ocppConnectionName: message.context.ocppConnectionName,
        tenantId: message.context.tenantId,
      },
    });
    if (!chargingStation) {
      return;
    }

    const [chargingStationNetworkProfile] = await ChargingStationNetworkProfile.findOrBuild({
      where: {
        tenantId: message.context.tenantId,
        ocppConnectionName: chargingStation.ocppConnectionName,
        configurationSlot: setNetworkProfile.configurationSlot!,
      },
    });
    chargingStationNetworkProfile.websocketServerConfigId =
      setNetworkProfile.websocketServerConfigId!;
    chargingStationNetworkProfile.setNetworkProfileId = setNetworkProfile.id;
    await chargingStationNetworkProfile.save();
  }
}
