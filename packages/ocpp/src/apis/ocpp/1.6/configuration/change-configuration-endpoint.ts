// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointMetadata,
  type IOcppSender,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { EventGroup, OCPP1_6, OCPP_CallAction, OCPPVersion } from '@citrineos/types';
import type { IChargingStationRepository } from '@citrineos/dal';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  locationRepository: IChargingStationRepository;
}

export class ChangeConfigurationEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.ChangeConfiguration,
    protocols: [OCPPVersion.OCPP1_6],
    eventGroup: EventGroup.Configuration,
    bodySchema: () => OCPP1_6.ChangeConfigurationRequestSchema,
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _locationRepository: IChargingStationRepository;

  constructor({ logger, ocppSender, locationRepository }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._locationRepository = locationRepository;
  }

  async handle(
    identifiers: string[],
    request: OCPP1_6.ChangeConfigurationRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
  ): Promise<IMessageConfirmation[]> {
    this._logger.debug('ChangeConfiguration request received:', request);

    return Promise.all(
      identifiers.map(async (ocppConnectionName) => {
        const chargingStation = await this._locationRepository.readChargingStationByStationId(
          tenantId,
          ocppConnectionName,
        );
        if (!chargingStation) {
          return {
            success: false,
            payload: `Charging station ${ocppConnectionName} not found`,
          };
        }

        return this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: OCPPVersion.OCPP1_6,
          action: OCPP_CallAction.ChangeConfiguration,
          eventGroup: EventGroup.Configuration,
          payload: request,
          callbackUrl,
        });
      }),
    );
  }
}
