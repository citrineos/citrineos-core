// Copyright 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache 2.0
import { Authorization, ILocationRepository } from '@citrineos/data';
import {
  AuthorizationStatusType,
  IAuthorizer,
  IMessageContext,
  AuthorizationWhitelistType,
} from '@citrineos/base';
import { ILogObj, Logger } from 'tslog';

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
  ): Promise<AuthorizationStatusType> {
    if (!authorization.realTimeAuthUrl) {
      this._logger.debug(`No Realtime Auth URL from authorization ${authorization.id}`);
      return authorization.status;
    } else if (
      !authorization.realTimeAuth ||
      authorization.realTimeAuth === AuthorizationWhitelistType.Allowed
    ) {
      this._logger.debug(`Realtime Auth whitelisted for authorization ${authorization.id}`);
      return authorization.status;
    } else if (authorization.status !== AuthorizationStatusType.Accepted) {
      this._logger.debug(
        `Skipping Realtime Auth for authorization ${authorization.id} with status ${authorization.status}`,
      );
      return authorization.status;
    }

    let result: AuthorizationStatusType = AuthorizationStatusType.Invalid;
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
            result = AuthorizationStatusType.Accepted;
            break;
          case 'BLOCKED':
            result = AuthorizationStatusType.Blocked;
            break;
          case 'EXPIRED':
            result = AuthorizationStatusType.Expired;
            break;
          case 'NO_CREDIT':
            result = AuthorizationStatusType.NoCredit;
            break;
          case 'NOT_ALLOWED':
            result = AuthorizationStatusType.NotAtThisLocation;
            break;
          default:
            result = AuthorizationStatusType.Unknown;
        }
      } else {
        result = AuthorizationStatusType.Unknown;
      }
    } catch (error) {
      this._logger.error(`Real-Time Auth failed: ${error}`);
      if (authorization.realTimeAuth === AuthorizationWhitelistType.AllowedOffline) {
        result = AuthorizationStatusType.Accepted;
      }
    }

    return result;
  }
}
