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
  OCPP_2_VER_LIST,
  OCPP_CallAction,
  SetNetworkProfileStatusEnum,
  OCPP2_response_types,
} from '@citrineos/types';
import type {
  IChargingStationRepository,
  IServerNetworkProfileRepository,
  ISetNetworkProfileRepository,
} from '@citrineos/dal';
import { ChargingStationNetworkProfile } from '@citrineos/dal';

@AsResponseHandler(OCPP_2_VER_LIST, OCPP_CallAction.SetNetworkProfile)
export class SetNetworkProfileResponseOcpp2Handler extends AbstractHandler {
  protected _serverNetworkProfileRepository: IServerNetworkProfileRepository;
  protected _setNetworkProfileRepository: ISetNetworkProfileRepository;
  protected _chargingStationRepository: IChargingStationRepository;

  constructor({
    logger,
    serverNetworkProfileRepository,
    setNetworkProfileRepository,
    chargingStationRepository,
  }: AbstractHandlerDependencies & {
    serverNetworkProfileRepository: IServerNetworkProfileRepository;
    setNetworkProfileRepository: ISetNetworkProfileRepository;
    chargingStationRepository: IChargingStationRepository;
  }) {
    super(logger);
    this._serverNetworkProfileRepository = serverNetworkProfileRepository;
    this._setNetworkProfileRepository = setNetworkProfileRepository;
    this._chargingStationRepository = chargingStationRepository;
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

    const setNetworkProfile = await this._setNetworkProfileRepository.readByCorrelationId(
      message.context.tenantId,
      message.context.ocppConnectionName,
      message.context.correlationId,
    );
    if (!setNetworkProfile) {
      return;
    }

    const serverNetworkProfile = await this._serverNetworkProfileRepository.findByProfileId(
      message.context.tenantId,
      setNetworkProfile.websocketServerConfigId!,
    );
    if (!serverNetworkProfile) {
      return;
    }

    const chargingStation =
      await this._chargingStationRepository.readChargingStationByOcppConnectionName(
        message.context.tenantId,
        message.context.ocppConnectionName,
      );
    if (!chargingStation) {
      return;
    }

    const [chargingStationNetworkProfile] = await ChargingStationNetworkProfile.findOrBuild({
      where: {
        tenantId: message.context.tenantId,
        stationId: chargingStation.id,
        configurationSlot: setNetworkProfile.configurationSlot!,
      },
    });
    chargingStationNetworkProfile.websocketServerConfigId =
      setNetworkProfile.websocketServerConfigId!;
    chargingStationNetworkProfile.setNetworkProfileId = setNetworkProfile.id!;
    await chargingStationNetworkProfile.save();
  }
}
