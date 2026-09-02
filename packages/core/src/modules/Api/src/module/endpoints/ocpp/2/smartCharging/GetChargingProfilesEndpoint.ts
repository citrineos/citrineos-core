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
  EventGroup,
  OCPP_CallAction,
  type OCPPVersion,
  type OCPP2_request_types,
} from '@citrineos/types';
import type { IDeviceModelRepository } from '@dal/interfaces/repositories.js';
import { OCPP2_PROTOCOLS, ocpp2Schema } from '../schemas.js';

interface Dependencies extends AbstractMessageEndpointDependencies {
  ocppSender: IOcppSender;
  deviceModelRepository: IDeviceModelRepository;
}

export class GetChargingProfilesEndpoint extends AbstractMessageEndpoint {
  static readonly route: IMessageEndpointMetadata = {
    action: OCPP_CallAction.GetChargingProfiles,
    protocols: OCPP2_PROTOCOLS,
    eventGroup: EventGroup.SmartCharging,
    bodySchema: ocpp2Schema('GetChargingProfilesRequestSchema'),
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
    request: OCPP2_request_types.GetChargingProfilesRequest,
    callbackUrl: string | undefined,
    tenantId: number = DEFAULT_TENANT_ID,
    version: OCPPVersion,
  ): Promise<IMessageConfirmation[]> {
    const chargingProfile = request.chargingProfile;

    if (chargingProfile.chargingProfileId) {
      if (
        chargingProfile.chargingProfilePurpose ||
        chargingProfile.stackLevel !== undefined ||
        chargingProfile.chargingLimitSource
      ) {
        return identifiers.map(() => ({
          success: false,
          payload:
            'chargingProfilePurpose, stackLevel, and chargingLimitSource are not needed when chargingProfileId is provided.',
        }));
      }
    } else if (
      !chargingProfile.chargingProfilePurpose &&
      chargingProfile.stackLevel === undefined &&
      !chargingProfile.chargingLimitSource
    ) {
      return identifiers.map(() => ({
        success: false,
        payload:
          'At least one of chargingProfilePurpose, stackLevel, or chargingLimitSource must be provided when chargingProfileId is not provided.',
      }));
    }

    if (chargingProfile.chargingProfileId && chargingProfile.chargingProfileId.length > 1) {
      const chargingProfilesEntries =
        await this._deviceModelRepository.findVariableCharacteristicsByVariableNameAndVariableInstance(
          tenantId,
          'Entries',
          'ChargingProfiles',
        );
      if (
        chargingProfilesEntries?.maxLimit &&
        chargingProfile.chargingProfileId.length > chargingProfilesEntries.maxLimit
      ) {
        return identifiers.map(() => ({
          success: false,
          payload: `The max length of chargingProfileId is ${chargingProfilesEntries.maxLimit}.`,
        }));
      }
    }

    return Promise.all(
      identifiers.map((ocppConnectionName) =>
        this._ocppSender.sendCall({
          ocppConnectionName,
          tenantId,
          protocol: version,
          action: OCPP_CallAction.GetChargingProfiles,
          eventGroup: EventGroup.SmartCharging,
          payload: request,
          callbackUrl,
        }),
      ),
    );
  }
}
