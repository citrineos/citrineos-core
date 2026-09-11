// SPDX-FileCopyrightText: 2026 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
import {
  AbstractMessageEndpoint,
  DEFAULT_TENANT_ID,
  type AbstractMessageEndpointDependencies,
  type IMessageConfirmation,
  type IMessageEndpointMetadata,
  type IOcppSender,
} from '@citrineos/base';
import type { IEvseRepository, IVariableCharacteristicsRepository } from '@citrineos/dal';
import {
  EventGroup,
  OCPP_CallAction,
  type OCPP2_request_types,
  type OCPPVersion,
} from '@citrineos/types';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';
import { readChargingRateUnitMemberList } from './charging-rate-units.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  evseRepository: IEvseRepository;
  variableCharacteristicsRepository: IVariableCharacteristicsRepository;
}

export class GetCompositeScheduleEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.GetCompositeSchedule,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.SmartCharging,
    bodySchema: ocpp2Schema('GetCompositeScheduleRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;
  private readonly _evseRepository: IEvseRepository;
  private readonly _variableCharacteristicsRepository: IVariableCharacteristicsRepository;

  constructor({
    logger,
    ocppSender,
    evseRepository,
    variableCharacteristicsRepository,
  }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
    this._evseRepository = evseRepository;
    this._variableCharacteristicsRepository = variableCharacteristicsRepository;
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
          const evse = await this._evseRepository.readEvseByStationIdAndOcpp201EvseId(
            tenantId,
            ocppConnectionName,
            request.evseId,
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
            this._variableCharacteristicsRepository,
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
