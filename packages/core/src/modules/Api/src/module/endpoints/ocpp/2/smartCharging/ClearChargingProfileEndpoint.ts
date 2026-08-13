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
import {
  ChargingProfilePurposeEnum,
  EventGroup,
  OCPP_CallAction,
  type OCPPVersion,
  type OCPP2_request_types,
} from '@citrineos/types';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
}

export class ClearChargingProfileEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.ClearChargingProfile,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.SmartCharging,
    bodySchema: ocpp2Schema('ClearChargingProfileRequestSchema'),
  };

  private readonly _ocppSender: IOcppSender;

  constructor({ logger, ocppSender }: Dependencies) {
    super(logger);
    this._ocppSender = ocppSender;
  }

  async handle(
    identifiers: string[],
    request: OCPP2_request_types.ClearChargingProfileRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const responses: IMessageConfirmation[] = [];

    for (const ocppConnectionName of identifiers) {
      const rejection = this._reject(request);
      if (rejection) {
        responses.push(rejection);
        continue;
      }

      responses.push(
        await this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: version,
          action: OCPP_CallAction.ClearChargingProfile,
          eventGroup: EventGroup.SmartCharging,
          payload: request,
          callbackUrl,
        }),
      );
    }

    return responses;
  }

  private _reject(
    request: OCPP2_request_types.ClearChargingProfileRequest,
  ): IMessageConfirmation | undefined {
    const criteria = request.chargingProfileCriteria;

    if (!request.chargingProfileId) {
      if (!criteria) {
        return {
          success: false,
          payload: 'Either chargingProfileId or chargingProfileCriteria must be provided',
        };
      }
      if (!criteria.chargingProfilePurpose && !criteria.stackLevel && !criteria.evseId) {
        return {
          success: false,
          payload:
            'At least one of chargingProfilePurpose, stackLevel, or evseId must be provided when chargingProfileId is not provided.',
        };
      }
    } else if (criteria) {
      return {
        success: false,
        payload: 'chargingProfileCriteria is not needed when chargingProfileId is provided.',
      };
    }

    if (
      criteria?.chargingProfilePurpose ===
      ChargingProfilePurposeEnum.ChargingStationExternalConstraints
    ) {
      return {
        success: false,
        payload:
          'The CSMS SHALL NOT set chargingProfilePurpose to ChargingStationExternalConstraints.',
      };
    }

    return undefined;
  }
}
