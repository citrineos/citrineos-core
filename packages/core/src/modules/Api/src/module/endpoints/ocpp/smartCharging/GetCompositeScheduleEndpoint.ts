// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointDeclaration,
  type IOcppSender,
  type OCPP2_request_types,
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
} from '@citrineos/base';
import { EventGroup, OCPP_CallAction, type OCPPVersion } from '@citrineos/types';
import type { IDeviceModelRepository } from '@dal/interfaces/repositories.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';
import { readChargingRateUnitMemberList } from './chargingRateUnits.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelRepository: IDeviceModelRepository;
}

export class GetCompositeScheduleEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointDeclaration = {
    action: OCPP_CallAction.GetCompositeSchedule,
    protocols: OCPP2_PROTOCOLS,
    endpointPrefixConfigKey: 'smartcharging',
    bodySchema: ocpp2Schema('GetCompositeScheduleRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _deviceModelRepository: IDeviceModelRepository;

  constructor({ logger, ocppSender, deviceModelRepository }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._deviceModelRepository = deviceModelRepository;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.GetCompositeScheduleRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    return Promise.all(
      identifiers.map(async (ocppConnectionName) => {
        if (request.evseId !== 0) {
          const evse = await this._deviceModelRepository.findEvseByIdAndConnectorId(
            tenantId,
            request.evseId,
            null,
          );
          if (!evse) {
            return {
              success: false,
              payload: `EVSE ${request.evseId} not found for station ${ocppConnectionName}.`,
            };
          }
          this._logger.info(
            `Found evse for station ${ocppConnectionName}: ${JSON.stringify(evse)}`,
          );
        }

        if (request.chargingRateUnit) {
          const rateUnitMemberList = await readChargingRateUnitMemberList(
            this._deviceModelRepository,
            tenantId,
            this._logger,
          );
          if (rateUnitMemberList && !rateUnitMemberList.has(request.chargingRateUnit)) {
            return {
              success: false,
              payload: `chargingRateUnit SHALL be one of [${Array.from(rateUnitMemberList)}].`,
            };
          }
        }

        return this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: version,
          action: OCPP_CallAction.GetCompositeSchedule,
          eventGroup: EventGroup.SmartCharging,
          payload: request,
          callbackUrl,
        });
      }),
    );
  }
}
