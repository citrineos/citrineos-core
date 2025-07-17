// Copyright 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import { Authorization, ILocationRepository } from '@citrineos/data';
import {
  AuthorizationStatusEnumType,
  IAuthorizationDto,
  IAuthorizer,
  IMessageContext,
  RealTimeAuthEnumType,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';
import { auth } from '@directus/sdk';

export class RealTimeAuthorizer implements IAuthorizer {
  private _locationRepository: ILocationRepository;
  private readonly _logger: Logger<ILogObj>;

  constructor(locationRepository: ILocationRepository, logger?: Logger<ILogObj>) {
    this._locationRepository = locationRepository;
    this._logger = logger
      ? logger.getSubLogger({ name: this.constructor.name })
      : new Logger<ILogObj>({ name: this.constructor.name });
  }

  async authorize(
    authorization: Authorization,
    context: IMessageContext,
  ): Promise<AuthorizationStatusEnumType> {
    if (!authorization.realTimeAuthUrl) {
      this._logger.debug(`No Realtime Auth URL from authorization ${authorization.id}`);
      return authorization.status;
    } else if (
      !authorization.realTimeAuth ||
      authorization.realTimeAuth === RealTimeAuthEnumType.Allowed
    ) {
      this._logger.debug(`Realtime Auth whitelisted for authorization ${authorization.id}`);
      return authorization.status;
    } else if (authorization.status !== AuthorizationStatusEnumType.Accepted) {
      this._logger.debug(
        `Skipping Realtime Auth for authorization ${authorization.id} with status ${authorization.status}`,
      );
      return authorization.status;
    }

    let result: AuthorizationStatusEnumType = AuthorizationStatusEnumType.Invalid;
    try {
      const chargingStation = await this._locationRepository.readChargingStationByStationId(
        context.tenantId,
        context.stationId,
      );

      const payload = {
        idToken: authorization.idToken,
        idTokenType: authorization.idTokenType,
        locationId: chargingStation?.locationId,
        stationId: context.stationId,
      };

      const response = await fetch(authorization.realTimeAuthUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseJson = await response.json();
      if (responseJson.data) {
        switch (responseJson.data.allowed) {
          case 'ALLOWED':
            result = AuthorizationStatusEnumType.Accepted;
            break;
          case 'BLOCKED':
            result = AuthorizationStatusEnumType.Blocked;
            break;
          case 'EXPIRED':
            result = AuthorizationStatusEnumType.Expired;
            break;
          case 'NO_CREDIT':
            result = AuthorizationStatusEnumType.NoCredit;
            break;
          case 'NOT_ALLOWED':
            result = AuthorizationStatusEnumType.NotAtThisLocation;
            break;
          default:
            result = AuthorizationStatusEnumType.Unknown;
        }
      } else {
        result = AuthorizationStatusEnumType.Unknown;
      }
    } catch (error) {
      this._logger.error(`Real-Time Auth failed: ${error}`);
      if (authorization.realTimeAuth === RealTimeAuthEnumType.AllowedOffline) {
        result = AuthorizationStatusEnumType.Accepted;
      }
    }

    return result;
  }
}
